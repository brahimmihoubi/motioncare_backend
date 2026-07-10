const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');
const ProgramModel = require('../models/program.model');

const AdminController = {
  async getAllDoctors(req, res) {
    try {
      const doctors = await UserModel.findAllByRole('doctor');
      res.status(200).json({ success: true, data: doctors });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAllPatients(req, res) {
    try {
      const patients = await UserModel.findAllByRole('patient');
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
  }
};

module.exports = AdminController;
