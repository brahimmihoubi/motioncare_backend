const SessionModel = require('../models/session.model');
const PatientModel = require('../models/patient.model');

const DashboardController = {
  async getDashboardStats(req, res) {
    try {
      const doctor_id = req.user.id;
      
      // Get all patients for this doctor
      const patients = await PatientModel.findByDoctor(doctor_id);
      
      // Get session stats for this doctor
      const sessionStats = await SessionModel.getStatsByDoctor(doctor_id);
      
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

module.exports = DashboardController;
