const UserModel = require('../models/user.model');
const DoctorModel = require('../models/doctor.model');
const PatientModel = require('../models/patient.model');
const { hashPassword, comparePassword } = require('../utils/hash.util');
const { generateToken } = require('../utils/jwt.util');

const AuthService = {
  async registerDoctor({ email, password, name, specialization }) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) throw new Error('Email already registered');

    const hashedPassword = await hashPassword(password);
    const userId = await UserModel.create({ email, password: hashedPassword, role: 'doctor', name });
    
    await DoctorModel.create({ user_id: userId, specialization: specialization || '' });
    
    return { id: userId, email, role: 'doctor', name };
  },

  async login(email, password, expectedRole) {
    const user = await UserModel.findByEmail(email);
    if (!user || user.role !== expectedRole) {
      throw new Error('Invalid email, password, or role');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({ id: user.id, role: user.role });
    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      token
    };
  }
};

module.exports = AuthService;
