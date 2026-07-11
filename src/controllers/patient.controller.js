const PatientModel = require('../models/patient.model');
const UserModel = require('../models/user.model');
const { hashPassword } = require('../utils/hash.util');
const { emit } = require('../services/socket.service');

const PatientController = {
  async registerPatient(req, res) {
    try {
      const doctorId = req.user.id;
      const { email, password, name, age, notes } = req.body;
      
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) throw new Error('Email already registered for a patient');

      const hashedPassword = await hashPassword(password);
      
      const userId = await UserModel.create({ email, password: hashedPassword, role: 'patient', name });
      
      await PatientModel.create({ user_id: userId, doctor_id: doctorId, age: age || 0, notes: notes || '' });
      emit('patient:created', { userId, doctorId, email, name });
      res.status(201).json({ success: true, message: 'Patient registered successfully', data: { id: userId, email, name } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getPatientsByDoctor(req, res) {
    try {
      const doctorId = req.user.id;
      const patients = await PatientModel.findByDoctor(doctorId);
      res.status(200).json({ success: true, data: patients });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getPatientById(req, res) {
    try {
      const patient = await PatientModel.findById(req.params.id);
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
      res.status(200).json({ success: true, data: patient });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = PatientController;
