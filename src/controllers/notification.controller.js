const NotificationModel = require('../models/notification.model');
const { emit } = require('../services/socket.service');

const NotificationController = {
  /**
   * GET /api/notifications — Get current user's notifications
   */
  async getMyNotifications(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await NotificationModel.findByUser(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const count = await NotificationModel.getUnreadCount(req.user.id);
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   */
  async markRead(req, res) {
    try {
      await NotificationModel.markRead(req.params.id, req.user.id);
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/notifications/mark-all-read
   */
  async markAllRead(req, res) {
    try {
      await NotificationModel.markAllRead(req.user.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = NotificationController;
