const ExerciseModel = require('../models/exercise.model');

const ExerciseController = {
  async getAllExercises(req, res) {
    try {
      const exercises = await ExerciseModel.findAll();
      res.status(200).json({ success: true, data: exercises });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getExerciseById(req, res) {
    try {
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ success: false, message: 'Exercise not found' });
      res.status(200).json({ success: true, data: exercise });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  async createExercise(req, res) {
    try {
      const { name, description, image_url } = req.body;
      const id = await ExerciseModel.create({ name, description, image_url });
      res.status(201).json({ success: true, message: 'Exercise created', data: { id, name } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = ExerciseController;
