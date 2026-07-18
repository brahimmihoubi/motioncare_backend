const express = require('express');
const router = express.Router({ mergeParams: true });
const ExoskeletonController = require('../controllers/exoskeleton.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'doctor']));

// All routes are scoped under /api/sessions/:id/exo
router.post('/init', ExoskeletonController.initSession);
router.get('/state', ExoskeletonController.getState);
router.post('/start', ExoskeletonController.start);
router.post('/pause', ExoskeletonController.pause);
router.post('/resume', ExoskeletonController.resume);
router.post('/stop', ExoskeletonController.stop);
router.post('/emergency-stop', ExoskeletonController.emergencyStop);
router.post('/exercise', ExoskeletonController.setExercise);

module.exports = router;
