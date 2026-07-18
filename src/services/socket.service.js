/**
 * Socket.io broadcast helper — enhanced with room support.
 * Allows any controller or service to emit events without importing io directly.
 * 
 * Usage:
 *   emit('patient:created', { id, name })           → broadcasts to ALL connected clients
 *   emitToRoom('session:42', 'exo:state', payload)  → broadcasts to session room only
 */

const emit = (event, data = {}) => {
  if (global.io) {
    global.io.emit(event, data);
    console.log(`[Socket] Broadcast: ${event}`);
  }
};

const emitToRoom = (room, event, data = {}) => {
  if (global.io) {
    global.io.to(room).emit(event, data);
    console.log(`[Socket] Room(${room}): ${event}`);
  }
};

module.exports = { emit, emitToRoom };
