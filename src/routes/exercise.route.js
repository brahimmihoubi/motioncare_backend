const express = require('express');
const router = express.Router();
const ExerciseController = require('../controllers/exercise.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', ExerciseController.getAllExercises);
router.get('/:id', ExerciseController.getExerciseById);

// Only admin can create exercises
router.post('/', roleMiddleware(['admin']), ExerciseController.createExercise);

module.exports = router;
