/**
 * Socket.io broadcast helper.
 * Allows any controller to emit events without importing io directly.
 * Usage: emit('patient:created', { id, name })
 */
const emit = (event, data = {}) => {
  if (global.io) {
    global.io.emit(event, data);
    console.log(`[Socket] Emitted: ${event}`);
  }
};

module.exports = { emit };
