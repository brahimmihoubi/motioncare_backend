const ExerciseRequestModel = require('../models/exerciseRequest.model');
const NotificationModel = require('../models/notification.model');
const AuditLogModel = require('../models/auditLog.model');
const UserModel = require('../models/user.model');
const { emit } = require('../services/socket.service');

const VALID_STATUSES = ['pending', 'under_review', 'accepted', 'rejected', 'delivered'];

const ExerciseRequestController = {
  /**
   * Doctor: Submit a new exercise request
   * POST /api/exercise-requests
   */
  async create(req, res) {
    try {
      const doctor_id = req.user.id;
      const { patient_id, exercise_id, notes } = req.body;

      if (!patient_id || !exercise_id) {
        return res.status(400).json({ success: false, message: 'patient_id and exercise_id are required' });
      }

      const id = await ExerciseRequestModel.create({ doctor_id, patient_id, exercise_id, notes });

      // Notify all admin users
      const admins = await UserModel.findAllByRole('admin');
      for (const admin of admins) {
        await NotificationModel.create({
          user_id: admin.id,
          title: 'New Exercise Request',
          body: `A doctor has submitted a new exercise request for a patient.`,
          type: 'info'
        });
      }

      emit('exercise_request:created', { id, doctor_id, patient_id, exercise_id });

      await AuditLogModel.create({
        user_id: doctor_id,
        user_name: req.user.name || 'Doctor',
        action: 'CREATE',
        entity: 'ExerciseRequest',
        entity_id: String(id),
        payload: { patient_id, exercise_id, notes },
        ip: req.ip
      });

      res.status(201).json({ success: true, message: 'Exercise request submitted', data: { id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Doctor: Get my exercise requests
   * GET /api/exercise-requests/my
   */
  async getMyRequests(req, res) {
    try {
      const requests = await ExerciseRequestModel.findByDoctor(req.user.id);
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Admin: Get all exercise requests (with pagination + filtering)
   * GET /api/exercise-requests
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, status, doctor_id } = req.query;
      const result = await ExerciseRequestModel.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        doctor_id: doctor_id ? parseInt(doctor_id) : undefined
      });
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Admin: Get one request
   * GET /api/exercise-requests/:id
   */
  async getById(req, res) {
    try {
      const request = await ExerciseRequestModel.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

      // Auto-transition to "under_review" when admin opens it
      if (request.status === 'pending' && req.user.role === 'admin') {
        await ExerciseRequestModel.updateStatus(req.params.id, 'under_review', null);
        request.status = 'under_review';
        emit('exercise_request:updated', { id: req.params.id, status: 'under_review' });
      }

      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Admin: Update exercise request status (accept/reject/deliver)
   * PATCH /api/exercise-requests/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { status, admin_notes } = req.body;

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }

      const request = await ExerciseRequestModel.findById(req.params.id);
      if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

      await ExerciseRequestModel.updateStatus(req.params.id, status, admin_notes);

      // Notify the doctor
      const statusMessages = {
        accepted: 'Your exercise request has been accepted.',
        rejected: 'Your exercise request has been rejected.',
        delivered: 'Your exercise request has been delivered.',
        under_review: 'Your exercise request is under review.'
      };

      if (statusMessages[status]) {
        await NotificationModel.create({
          user_id: request.doctor_id,
          title: `Exercise Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          body: statusMessages[status] + (admin_notes ? ` Note: ${admin_notes}` : ''),
          type: status === 'rejected' ? 'error' : status === 'accepted' ? 'success' : 'info'
        });
      }

      emit('exercise_request:updated', { id: req.params.id, status, admin_notes });

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Admin',
        action: 'UPDATE_STATUS',
        entity: 'ExerciseRequest',
        entity_id: String(req.params.id),
        payload: { status, admin_notes },
        ip: req.ip
      });

      res.status(200).json({ success: true, message: `Request ${status}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = ExerciseRequestController;
