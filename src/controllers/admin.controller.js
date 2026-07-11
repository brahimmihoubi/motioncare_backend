const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const ProgramModel = require('../models/program.model');
const PatientModel = require('../models/patient.model');
const ExerciseModel = require('../models/exercise.model');
const DoctorModel = require('../models/doctor.model');
const { hashPassword } = require('../utils/hash.util');
const { emit } = require('../services/socket.service');

const AdminController = {
  async getAllDoctors(req, res) {
    try {
      const doctors = await UserModel.findAllByRole('doctor');
      // Enrich with specialization from doctors table
      const enriched = await Promise.all(
        doctors.map(async (d) => {
          const detail = await DoctorModel.findById(d.id);
          return { ...d, specialization: detail?.specialization || '' };
        })
      );
      res.status(200).json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- Doctors CRUD ---
  async createDoctor(req, res) {
    try {
      const { email, password, name, specialization } = req.body;
      if (!email || !name) throw new Error('Name and email are required');
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) throw new Error('Email already registered');
      const hashedPassword = await hashPassword(password || 'password123');
      const userId = await UserModel.create({ email, password: hashedPassword, role: 'doctor', name });
      await DoctorModel.create({ user_id: userId, specialization: specialization || '' });
      emit('doctor:created', { userId, name, email, specialization });
      res.status(201).json({ success: true, message: 'Doctor created' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async updateDoctor(req, res) {
    try {
      const { name, specialization } = req.body;
      await DoctorModel.update(req.params.id, { name, specialization });
      emit('doctor:updated', { id: req.params.id, name, specialization });
      res.status(200).json({ success: true, message: 'Doctor updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async deleteDoctor(req, res) {
    try {
      await DoctorModel.delete(req.params.id);
      emit('doctor:deleted', { id: req.params.id });
      res.status(200).json({ success: true, message: 'Doctor deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAllPatients(req, res) {
    try {
      const patients = await PatientModel.findAll();
      res.status(200).json({ success: true, data: patients });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getGlobalStats(req, res) {
    try {
      const doctors = await UserModel.findAllByRole('doctor');
      const patients = await UserModel.findAllByRole('patient');
      const sessionStats = await SessionModel.getGlobalStats();

      let totalSessions = 0;
      let completedSessions = 0;
      let missedSessions = 0;
      
      sessionStats.forEach(stat => {
        totalSessions += parseInt(stat.count);
        if (stat.status === 'completed') completedSessions += parseInt(stat.count);
        if (stat.status === 'missed') missedSessions += parseInt(stat.count);
      });
      
      const complianceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          totalDoctors: doctors.length,
          totalPatients: patients.length,
          totalSessions,
          completedSessions,
          missedSessions,
          complianceRate: parseFloat(complianceRate.toFixed(2))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getRecentSessions(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const sessions = await SessionModel.getGlobalRecentSessions(limit);
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getWeeklyStats(req, res) {
    try {
      const stats = await SessionModel.getGlobalWeeklyStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAllPrograms(req, res) {
    try {
      const programs = await ProgramModel.findAll();
      res.status(200).json({ success: true, data: programs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- Patients CRUD ---
  async createPatient(req, res) {
    try {
      const { email, password, name, age, notes, doctor_id } = req.body;
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) throw new Error('Email already registered');
      const hashedPassword = await hashPassword(password);
      const userId = await UserModel.create({ email, password: hashedPassword, role: 'patient', name });
      // Assign to provided doctor_id or null
      await PatientModel.create({ user_id: userId, doctor_id: doctor_id || null, age: age || 0, notes: notes || '' });
      emit('patient:created', { userId, name, email });
      res.status(201).json({ success: true, message: 'Patient created' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async updatePatient(req, res) {
    try {
      const { name, age, notes, doctor_id } = req.body;
      await PatientModel.update(req.params.id, { name, age, notes, doctor_id });
      emit('patient:updated', { id: req.params.id, name });
      res.status(200).json({ success: true, message: 'Patient updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async deletePatient(req, res) {
    try {
      await PatientModel.delete(req.params.id);
      emit('patient:deleted', { id: req.params.id });
      res.status(200).json({ success: true, message: 'Patient deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- Programs CRUD ---
  async createProgram(req, res) {
    try {
      const { patient_id, doctor_id, name, exercises } = req.body;
      const programId = await ProgramModel.create({ patient_id, doctor_id, name });
      if (exercises && exercises.length > 0) {
        await ProgramModel.updateExercises(programId, exercises);
      }
      emit('program:created', { programId, name, patient_id, doctor_id });
      res.status(201).json({ success: true, message: 'Program created' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async updateProgram(req, res) {
    try {
      const { name, active, exercises } = req.body;
      await ProgramModel.updateProgram(req.params.id, { name, active });
      if (exercises) {
        await ProgramModel.updateExercises(req.params.id, exercises);
      }
      emit('program:updated', { id: req.params.id, name, active });
      res.status(200).json({ success: true, message: 'Program updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async deleteProgram(req, res) {
    try {
      await ProgramModel.delete(req.params.id);
      emit('program:deleted', { id: req.params.id });
      res.status(200).json({ success: true, message: 'Program deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- Exercises CRUD ---
  async createExercise(req, res) {
    try {
      const { name, description, image_url } = req.body;
      await ExerciseModel.create({ name, description, image_url });
      emit('exercise:created', { name });
      res.status(201).json({ success: true, message: 'Exercise created' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async updateExercise(req, res) {
    try {
      const { name, description, image_url } = req.body;
      await ExerciseModel.update(req.params.id, { name, description, image_url });
      emit('exercise:updated', { id: req.params.id, name });
      res.status(200).json({ success: true, message: 'Exercise updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async deleteExercise(req, res) {
    try {
      await ExerciseModel.delete(req.params.id);
      emit('exercise:deleted', { id: req.params.id });
      res.status(200).json({ success: true, message: 'Exercise deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // --- Sessions CRUD ---
  async createSession(req, res) {
    try {
      const { patient_id, program_id, duration, status } = req.body;
      await SessionModel.create({ patient_id, program_id, duration, status: status || 'completed' });
      emit('session:created', { patient_id, program_id, status });
      res.status(201).json({ success: true, message: 'Session created' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async updateSession(req, res) {
    try {
      const { status, duration } = req.body;
      await SessionModel.update(req.params.id, { status, duration });
      emit('session:updated', { id: req.params.id, status });
      res.status(200).json({ success: true, message: 'Session updated' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
  async deleteSession(req, res) {
    try {
      await SessionModel.delete(req.params.id);
      emit('session:deleted', { id: req.params.id });
      res.status(200).json({ success: true, message: 'Session deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = AdminController;
