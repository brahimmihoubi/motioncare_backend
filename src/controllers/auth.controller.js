const AuthService = require('../services/auth.service');

const AuthController = {
  async registerDoctor(req, res) {
    try {
      const user = await AuthService.registerDoctor(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password, 'admin');
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async loginDoctor(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password, 'doctor');
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async loginPatient(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password, 'patient');
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
      }
      const tokens = await AuthService.refreshAccessToken(refreshToken);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  },

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = AuthController;
