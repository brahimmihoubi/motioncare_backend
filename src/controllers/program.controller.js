const ProgramModel = require('../models/program.model');

const ProgramController = {
  async createProgram(req, res) {
    try {
      const { patient_id, name, exercises } = req.body;
      const doctor_id = req.user.role === 'admin' ? req.body.doctor_id : req.user.id;
      
      const { id: program_id } = await ProgramModel.create({ patient_id, doctor_id, name });
      
      // Add exercises
      if (exercises && Array.isArray(exercises)) {
        for (const ex of exercises) {
          await ProgramModel.addExercise({
            program_id,
            exercise_id: ex.exercise_id,
            repetitions: ex.repetitions,
            sets: ex.sets,
            rest_between_reps: ex.rest_between_reps,
            rest_between_sets: ex.rest_between_sets,
            duration: ex.duration,
            notes: ex.notes
          });
        }
      }
      
      res.status(201).json({ success: true, message: 'Program created successfully', data: { program_id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getProgramsByPatient(req, res) {
    try {
      const patient_id = req.params.patientId;
      const programs = await ProgramModel.findByPatient(patient_id);
      res.status(200).json({ success: true, data: programs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  async getActiveProgram(req, res) {
    try {
      // Typically the patient requests their own active program
      const patient_id = req.user.role === 'patient' ? req.user.id : req.params.patientId;
      const program = await ProgramModel.findActiveByPatient(patient_id);
      if (!program) return res.status(404).json({ success: false, message: 'No active program found' });
      res.status(200).json({ success: true, data: program });
    } catch (error) {
       res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = ProgramController;
