const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/doctors', AdminController.getAllDoctors);
router.get('/patients', AdminController.getAllPatients);
router.get('/stats', AdminController.getGlobalStats);
router.get('/sessions', AdminController.getRecentSessions);
router.get('/weekly-stats', AdminController.getWeeklyStats);
router.get('/programs', AdminController.getAllPrograms);

module.exports = router;
