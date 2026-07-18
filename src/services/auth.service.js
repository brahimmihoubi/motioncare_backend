const UserModel = require('../models/user.model');
const DoctorModel = require('../models/doctor.model');
const RefreshTokenModel = require('../models/refreshToken.model');
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

    // Access token (short-lived: 15m)
    const accessToken = generateToken({ id: user.id, role: user.role }, '15m');
    // Refresh token (long-lived: 30d, stored in DB)
    const refreshToken = await RefreshTokenModel.create(user.id, 30);

    return {
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      token: accessToken,         // keep backward-compatible field name
      accessToken,
      refreshToken
    };
  },

  async refreshAccessToken(refreshToken) {
    const stored = await RefreshTokenModel.findByToken(refreshToken);
    if (!stored) throw new Error('Invalid or expired refresh token');

    // Look up the user to get their real role
    const user = await UserModel.findById(stored.user_id);
    if (!user) throw new Error('User not found');

    // Revoke old token and issue new pair (rotation)
    await RefreshTokenModel.revoke(refreshToken);
    const newAccessToken = generateToken({ id: user.id, role: user.role }, '15m');
    const newRefreshToken = await RefreshTokenModel.create(user.id, 30);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken) {
    if (refreshToken) {
      await RefreshTokenModel.revoke(refreshToken);
    }
  }
};

module.exports = AuthService;
