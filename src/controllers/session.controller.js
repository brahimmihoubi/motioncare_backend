const SessionModel = require('../models/session.model');
const SessionExerciseModel = require('../models/sessionExercise.model');
const { emit } = require('../services/socket.service');

const SessionController = {
  async logSession(req, res) {
    try {
      const patient_id = req.user.id;
      const { program_id, duration, status, exercises } = req.body;
      
      const { id: session_id } = await SessionModel.create({ patient_id, program_id, duration, status });
      
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

  async getPatientSessions(req, res) {
    try {
      const patient_id = req.user.role === 'patient' ? req.user.id : req.params.patientId;
      const sessions = await SessionModel.findByPatient(patient_id);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = SessionController;
