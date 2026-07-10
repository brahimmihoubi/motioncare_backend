const express = require('express');
const router = express.Router();
const ProgramController = require('../controllers/program.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Doctor and Admin routes
router.post('/', roleMiddleware(['doctor', 'admin']), ProgramController.createProgram);
router.get('/my', roleMiddleware(['doctor']), ProgramController.getMyPrograms);
router.get('/patient/:patientId', roleMiddleware(['doctor']), ProgramController.getProgramsByPatient);

// Patient / General routes
router.get('/active', ProgramController.getActiveProgram);
router.get('/active/:patientId', roleMiddleware(['doctor']), ProgramController.getActiveProgram);

// Single program by ID
router.get('/:id', roleMiddleware(['doctor']), ProgramController.getProgramById);

// Update a program (name, active status, and exercises)
router.put('/:id', roleMiddleware(['doctor']), ProgramController.updateProgram);

module.exports = router;
