const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/session.controller');
const exoskeletonRouter = require('./exoskeleton.route');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Doctor/Admin: create a session for a patient
router.post('/', roleMiddleware(['doctor', 'admin']), SessionController.createSessionForPatient);

// Patient logs their own session (legacy — kept for compatibility)
router.post('/log', roleMiddleware(['patient', 'doctor', 'admin']), SessionController.logSession);

// Get sessions
router.get('/', roleMiddleware(['doctor', 'admin']), SessionController.getAllSessions);
router.get('/patient/:patientId', roleMiddleware(['doctor', 'admin']), SessionController.getPatientSessions);
router.get('/:id', roleMiddleware(['doctor', 'admin']), SessionController.getSessionById);

// Session status update
router.patch('/:id/status', roleMiddleware(['doctor', 'admin']), SessionController.updateSessionStatus);

// Exoskeleton control sub-router (nested under session ID)
router.use('/:id/exo', exoskeletonRouter);

module.exports = router;
