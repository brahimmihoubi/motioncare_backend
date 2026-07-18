const ExoskeletonService = require('../services/exoskeleton.service');
const SessionModel = require('../models/session.model');
const AuditLogModel = require('../models/auditLog.model');
const { emit } = require('../services/socket.service');

const ExoskeletonController = {
  /**
   * POST /api/sessions/:id/exo/init
   * Initialize exoskeleton tracking for an existing session
   */
  async initSession(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      const { total_duration_seconds = 0 } = req.body;
      await ExoskeletonService.initSession(session_id, total_duration_seconds);
      res.status(200).json({ success: true, message: 'Exoskeleton session initialized' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/sessions/:id/exo/state
   * Get current live exoskeleton state
   */
  async getState(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      const state = await ExoskeletonService.getState(session_id);
      if (!state) {
        return res.status(404).json({ success: false, message: 'Exoskeleton session not found. Call /init first.' });
      }
      res.status(200).json({ success: true, data: state });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/start
   * Start (or restart) — always begins a 5-second countdown per SRS
   */
  async start(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      await ExoskeletonService.start(session_id);

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'START',
        entity: 'ExoskeletonSession',
        entity_id: String(session_id),
        ip: req.ip
      });

      res.status(200).json({ success: true, message: 'Session countdown started (5 seconds)' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/pause
   */
  async pause(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      await ExoskeletonService.pause(session_id);

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'PAUSE',
        entity: 'ExoskeletonSession',
        entity_id: String(session_id),
        ip: req.ip
      });

      res.status(200).json({ success: true, message: 'Session paused' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/resume
   * Per SRS: resume always starts a new 5-second countdown
   */
  async resume(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      await ExoskeletonService.resume(session_id);

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'RESUME',
        entity: 'ExoskeletonSession',
        entity_id: String(session_id),
        ip: req.ip
      });

      res.status(200).json({ success: true, message: 'Session resuming with 5-second countdown' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/stop
   */
  async stop(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      await ExoskeletonService.stop(session_id);

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'STOP',
        entity: 'ExoskeletonSession',
        entity_id: String(session_id),
        ip: req.ip
      });

      res.status(200).json({ success: true, message: 'Session stopped' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/emergency-stop
   * Highest priority — stops everything immediately
   */
  async emergencyStop(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      await ExoskeletonService.emergencyStop(session_id);

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'EMERGENCY_STOP',
        entity: 'ExoskeletonSession',
        entity_id: String(session_id),
        payload: { reason: req.body.reason || 'Manual emergency stop' },
        ip: req.ip
      });

      emit('exo:emergency', { session_id, triggered_by: req.user.id });

      res.status(200).json({ success: true, message: 'EMERGENCY STOP activated' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/:id/exo/exercise
   * Update current exercise being run on the exoskeleton
   */
  async setExercise(req, res) {
    try {
      const session_id = parseInt(req.params.id);
      const { exercise_id } = req.body;
      if (!exercise_id) return res.status(400).json({ success: false, message: 'exercise_id required' });

      await ExoskeletonService.setCurrentExercise(session_id, exercise_id);
      res.status(200).json({ success: true, message: 'Current exercise updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = ExoskeletonController;
