const SessionModel = require('../models/session.model');
const SessionExerciseModel = require('../models/sessionExercise.model');
const ExoskeletonService = require('../services/exoskeleton.service');
const AuditLogModel = require('../models/auditLog.model');
const { emit } = require('../services/socket.service');

const SessionController = {
  /**
   * POST /api/sessions — Doctor/Admin creates a session for a patient
   */
  async createSessionForPatient(req, res) {
    try {
      const { patient_id, program_id, total_duration_seconds = 0 } = req.body;
      if (!patient_id || !program_id) {
        return res.status(400).json({ success: false, message: 'patient_id and program_id are required' });
      }

      const { id: session_id } = await SessionModel.create({ patient_id, program_id, status: 'pending' });

      // Initialize exoskeleton session tracking automatically
      await ExoskeletonService.initSession(session_id, total_duration_seconds);

      emit('session:created', { session_id, patient_id, program_id, status: 'pending' });

      await AuditLogModel.create({
        user_id: req.user.id,
        user_name: req.user.name || 'Doctor',
        action: 'CREATE',
        entity: 'Session',
        entity_id: String(session_id),
        payload: { patient_id, program_id },
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Session created. Use /api/sessions/:id/exo/start to begin.',
        data: { session_id }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/sessions/log — Legacy: Patient/Doctor logs a completed session
   */
  async logSession(req, res) {
    try {
      const patient_id = req.user.role === 'patient' ? req.user.id : req.body.patient_id;
      const { program_id, duration, status, exercises } = req.body;

      const { id: session_id } = await SessionModel.create({ patient_id, program_id, duration, status: status || 'completed' });

      if (exercises && Array.isArray(exercises)) {
        for (const ex of exercises) {
          await SessionExerciseModel.create({
            session_id,
            program_exercise_id: ex.program_exercise_id,
            completed_sets: ex.completed_sets,
            completed_reps: ex.completed_reps
          });
        }
      }

      emit('session:created', { session_id, patient_id, program_id, status });
      res.status(201).json({ success: true, message: 'Session logged successfully', data: { session_id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/sessions — All sessions (filtered by doctor's patients)
   */
  async getAllSessions(req, res) {
    try {
      const { page = 1, limit = 20, status, patient_id } = req.query;
      const filter = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        patient_id: patient_id ? parseInt(patient_id) : undefined,
        // Doctors only see their own patients' sessions
        doctor_id: req.user.role === 'doctor' ? req.user.id : undefined
      };
      const result = await SessionModel.findAll(filter);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/sessions/:id — Session detail with exo state
   */
  async getSessionById(req, res) {
    try {
      const session = await SessionModel.findById(req.params.id);
      if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/sessions/patient/:patientId — Patient's sessions
   */
  async getPatientSessions(req, res) {
    try {
      const patient_id = req.user.role === 'patient' ? req.user.id : req.params.patientId;
      const sessions = await SessionModel.findByPatient(patient_id);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * PATCH /api/sessions/:id/status — Manually update session status
   */
  async updateSessionStatus(req, res) {
    try {
      const { status } = req.body;
      await SessionModel.update(req.params.id, { status });
      emit('session:updated', { id: req.params.id, status });
      res.status(200).json({ success: true, message: 'Session status updated' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = SessionController;
