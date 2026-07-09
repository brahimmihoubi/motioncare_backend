const UserModel = require('../models/user.model');
const SessionModel = require('../models/session.model');

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
        totalSessions += stat.count;
        if (stat.status === 'completed') completedSessions += stat.count;
        if (stat.status === 'missed') missedSessions += stat.count;
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
          complianceRate: complianceRate.toFixed(2) + '%'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = AdminController;
