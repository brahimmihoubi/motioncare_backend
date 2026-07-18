/**
 * ExoskeletonService
 * ------------------
 * Core state machine for exoskeleton session control.
 * Acts as a facade between WebSocket/REST controllers and the hardware layer.
 * MQTT transport is isolated here — swap the stub for a real broker adapter without
 * touching any other part of the system.
 *
 * Session States (SRS §Real-Time):
 *   pending → countdown (5s) → running → paused ↔ running
 *   running → stopped
 *   running/paused → completed
 *   any → emergency_stop (highest priority)
 *   emergency_stop → countdown (restart always begins a new 5-second countdown)
 */

const ExoskeletonSessionModel = require('../models/exoskeletonSession.model');
const SessionModel = require('../models/session.model');
const { emit, emitToRoom } = require('./socket.service');

// In-memory countdown timers per session
const countdownTimers = {};
const runningTimers = {};

// ── MQTT Stub ─────────────────────────────────────────────────────────────────
// Replace this object's methods with a real mqtt client (e.g. `mqtt` npm pkg)
// when hardware is available. All other code remains unchanged.
const mqttTransport = {
  publish(topic, payload) {
    console.log(`[MQTT STUB] Topic: ${topic} | Payload:`, JSON.stringify(payload));
    // e.g. mqttClient.publish(topic, JSON.stringify(payload));
  },
  subscribe(topic, handler) {
    console.log(`[MQTT STUB] Subscribed to: ${topic}`);
    // e.g. mqttClient.on('message', (t, msg) => { if (t === topic) handler(msg); });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broadcast session state update to all subscribers (WebSocket room + MQTT)
 */
async function broadcastState(session_id) {
  const exoSession = await ExoskeletonSessionModel.findBySessionId(session_id);
  if (!exoSession) return;

  const payload = {
    session_id,
    state: exoSession.state,
    motor_state: exoSession.motor_state,
    current_exercise_id: exoSession.current_exercise_id,
    exercise_name: exoSession.exercise_name,
    elapsed_seconds: exoSession.elapsed_seconds,
    countdown_remaining: exoSession.countdown_remaining,
    error_code: exoSession.error_code,
    updated_at: exoSession.updated_at
  };

  // Emit to all dashboard/mobile clients subscribed to this session room
  emitToRoom(`session:${session_id}`, 'exo:state_update', payload);

  // Also broadcast globally so dashboards without room membership receive it
  emit('exo:state_update', payload);

  // Publish to MQTT topic for hardware consumption
  mqttTransport.publish(`motioncare/sessions/${session_id}/state`, payload);
}

/**
 * Clear any running timers for a session
 */
function clearTimers(session_id) {
  if (countdownTimers[session_id]) {
    clearInterval(countdownTimers[session_id].timer);
    delete countdownTimers[session_id];
  }
  if (runningTimers[session_id]) {
    clearInterval(runningTimers[session_id]);
    delete runningTimers[session_id];
  }
}

const ExoskeletonService = {
  /**
   * Initialize exoskeleton tracking for a session (called when session is created)
   */
  async initSession(session_id, total_duration_seconds = 0) {
    await ExoskeletonSessionModel.create({ session_id, total_duration_seconds });
    await broadcastState(session_id);
  },

  /**
   * Start or restart a session — always initiates a 5-second countdown per SRS
   */
  async start(session_id) {
    const exoSession = await ExoskeletonSessionModel.findBySessionId(session_id);
    if (!exoSession) throw new Error('Exoskeleton session not found');

    // Emergency stop cannot be overridden by start — only restart can
    // Restart clears the emergency state and begins a fresh countdown
    clearTimers(session_id);

    await ExoskeletonSessionModel.updateState(session_id, {
      state: 'countdown',
      motor_state: 'idle',
      countdown_remaining: 5
    });
    await broadcastState(session_id);
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, { command: 'start_countdown' });

    // Run countdown from 5 → 0
    let remaining = 5;
    countdownTimers[session_id] = {
      timer: setInterval(async () => {
        remaining -= 1;
        await ExoskeletonSessionModel.updateState(session_id, { countdown_remaining: remaining });
        await broadcastState(session_id);

        if (remaining <= 0) {
          clearInterval(countdownTimers[session_id].timer);
          delete countdownTimers[session_id];

          // Transition to running
          await ExoskeletonSessionModel.updateState(session_id, {
            state: 'running',
            motor_state: 'active',
            countdown_remaining: 0
          });
          await SessionModel.update(session_id, { status: 'running' });
          await broadcastState(session_id);
          mqttTransport.publish(`motioncare/sessions/${session_id}/command`, { command: 'start' });

          // Begin elapsed time tracking
          ExoskeletonService._startElapsedTimer(session_id);
        }
      }, 1000)
    };
  },

  /**
   * Track elapsed seconds during a running session
   */
  _startElapsedTimer(session_id) {
    let elapsed = 0;
    runningTimers[session_id] = setInterval(async () => {
      // Check current state — stop tracking if not running
      const exoSession = await ExoskeletonSessionModel.findBySessionId(session_id);
      if (!exoSession || exoSession.state !== 'running') {
        clearInterval(runningTimers[session_id]);
        delete runningTimers[session_id];
        return;
      }

      elapsed += 1;
      await ExoskeletonSessionModel.updateState(session_id, { elapsed_seconds: elapsed });

      // Auto-complete if total duration reached
      if (exoSession.total_duration_seconds > 0 && elapsed >= exoSession.total_duration_seconds) {
        clearInterval(runningTimers[session_id]);
        delete runningTimers[session_id];
        await ExoskeletonService.complete(session_id);
        return;
      }

      // Broadcast every second
      await broadcastState(session_id);
    }, 1000);
  },

  /**
   * Pause a running session
   */
  async pause(session_id) {
    const exoSession = await ExoskeletonSessionModel.findBySessionId(session_id);
    if (!exoSession) throw new Error('Exoskeleton session not found');
    if (exoSession.state !== 'running') throw new Error(`Cannot pause from state: ${exoSession.state}`);

    clearTimers(session_id);
    await ExoskeletonSessionModel.updateState(session_id, { state: 'paused', motor_state: 'paused' });
    await SessionModel.update(session_id, { status: 'paused' });
    await broadcastState(session_id);
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, { command: 'pause' });
  },

  /**
   * Resume a paused session — SRS: restart always starts a new 5-second countdown
   */
  async resume(session_id) {
    const exoSession = await ExoskeletonSessionModel.findBySessionId(session_id);
    if (!exoSession) throw new Error('Exoskeleton session not found');
    if (exoSession.state !== 'paused') throw new Error(`Cannot resume from state: ${exoSession.state}`);

    // Resume = new countdown (per SRS: "Restart always starts a new 5-second countdown")
    return ExoskeletonService.start(session_id);
  },

  /**
   * Stop a session (manual stop, not complete)
   */
  async stop(session_id) {
    clearTimers(session_id);
    await ExoskeletonSessionModel.updateState(session_id, { state: 'stopped', motor_state: 'idle' });
    await SessionModel.update(session_id, { status: 'stopped' });
    await broadcastState(session_id);
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, { command: 'stop' });
  },

  /**
   * Complete a session (auto or manual)
   */
  async complete(session_id) {
    clearTimers(session_id);
    await ExoskeletonSessionModel.updateState(session_id, { state: 'completed', motor_state: 'idle' });
    await SessionModel.update(session_id, { status: 'completed' });
    await broadcastState(session_id);
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, { command: 'complete' });
  },

  /**
   * Emergency Stop — highest priority, overrides any state
   */
  async emergencyStop(session_id) {
    clearTimers(session_id); // Immediately clear all timers — no delay
    await ExoskeletonSessionModel.updateState(session_id, {
      state: 'emergency_stop',
      motor_state: 'emergency_stop',
      error_code: 'EMERGENCY_STOP'
    });
    await SessionModel.update(session_id, { status: 'emergency_stop' });
    await broadcastState(session_id);

    // MQTT emergency command published first, before anything else
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, {
      command: 'emergency_stop',
      priority: 'CRITICAL',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Update the current exercise being performed
   */
  async setCurrentExercise(session_id, exercise_id) {
    await ExoskeletonSessionModel.updateState(session_id, { current_exercise_id: exercise_id });
    await broadcastState(session_id);
    mqttTransport.publish(`motioncare/sessions/${session_id}/command`, {
      command: 'set_exercise',
      exercise_id
    });
  },

  /**
   * Get current live state
   */
  async getState(session_id) {
    return await ExoskeletonSessionModel.findBySessionId(session_id);
  }
};

module.exports = ExoskeletonService;
