const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/stats', roleMiddleware(['doctor']), DashboardController.getDashboardStats);

module.exports = router;
