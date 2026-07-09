const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/session.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Patient logs a session
router.post('/', roleMiddleware(['patient']), SessionController.logSession);

// Patient gets their own sessions
router.get('/', roleMiddleware(['patient']), SessionController.getPatientSessions);

// Doctor views a patient's sessions
router.get('/patient/:patientId', roleMiddleware(['doctor']), SessionController.getPatientSessions);

module.exports = router;
