const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patient.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Doctor registers a new patient
router.post('/', roleMiddleware(['doctor']), PatientController.registerPatient);

// Only doctors can see list of their patients
router.get('/', roleMiddleware(['doctor']), PatientController.getPatientsByDoctor);

// Doctor or the patient themselves can view
router.get('/:id', PatientController.getPatientById);

module.exports = router;
