require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database
    await initDB();

    // Wrap Express app in an HTTP server
    const httpServer = http.createServer(app);

    // Attach Socket.io with CORS open for dashboard + mobile
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Make io globally accessible so controllers and services can emit events
    global.io = io;

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      // ── Session Room Subscriptions ─────────────────────────────────────────
      // Dashboard/mobile clients subscribe to a specific session's real-time feed
      socket.on('join_session', (session_id) => {
        const room = `session:${session_id}`;
        socket.join(room);
        console.log(`[Socket] ${socket.id} joined room: ${room}`);
        socket.emit('joined_session', { session_id });
      });

      socket.on('leave_session', (session_id) => {
        const room = `session:${session_id}`;
        socket.leave(room);
        console.log(`[Socket] ${socket.id} left room: ${room}`);
      });
      // ──────────────────────────────────────────────────────────────────────

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 MotionCare Backend running on port ${PORT}`);
      console.log(`   WebSocket: ws://localhost:${PORT}`);
      console.log(`   REST API:  http://localhost:${PORT}/api`);
      console.log(`   Swagger:   http://localhost:${PORT}/api-docs\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();