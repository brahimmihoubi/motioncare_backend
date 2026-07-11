const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/doctors', AdminController.getAllDoctors);
router.post('/doctors', AdminController.createDoctor);
router.put('/doctors/:id', AdminController.updateDoctor);
router.delete('/doctors/:id', AdminController.deleteDoctor);
router.get('/stats', AdminController.getGlobalStats);
router.get('/weekly-stats', AdminController.getWeeklyStats);

// Patients
router.get('/patients', AdminController.getAllPatients);
router.post('/patients', AdminController.createPatient);
router.put('/patients/:id', AdminController.updatePatient);
router.delete('/patients/:id', AdminController.deletePatient);

// Programs
router.get('/programs', AdminController.getAllPrograms);
router.post('/programs', AdminController.createProgram);
router.put('/programs/:id', AdminController.updateProgram);
router.delete('/programs/:id', AdminController.deleteProgram);

// Exercises
router.post('/exercises', AdminController.createExercise);
router.put('/exercises/:id', AdminController.updateExercise);
router.delete('/exercises/:id', AdminController.deleteExercise);

// Sessions
router.get('/sessions', AdminController.getRecentSessions);
router.post('/sessions', AdminController.createSession);
router.put('/sessions/:id', AdminController.updateSession);
router.delete('/sessions/:id', AdminController.deleteSession);

module.exports = router;
