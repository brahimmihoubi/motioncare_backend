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

    // Make io globally accessible so controllers can emit events
    global.io = io;

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} with WebSocket support`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();