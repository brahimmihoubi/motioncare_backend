const express = require('express');
const router = express.Router();
const ExerciseRequestController = require('../controllers/exerciseRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Doctor routes
router.post('/', roleMiddleware(['doctor']), ExerciseRequestController.create);
router.get('/my', roleMiddleware(['doctor']), ExerciseRequestController.getMyRequests);

// Admin routes
router.get('/', roleMiddleware(['admin']), ExerciseRequestController.getAll);
router.get('/:id', roleMiddleware(['admin', 'doctor']), ExerciseRequestController.getById);
router.patch('/:id/status', roleMiddleware(['admin']), ExerciseRequestController.updateStatus);

module.exports = router;
