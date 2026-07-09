const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Doctor Auth
router.post('/doctor/register', AuthController.registerDoctor);
router.post('/doctor/login', AuthController.loginDoctor);

// Admin Auth
router.post('/admin/login', AuthController.loginAdmin);

// Patient Auth
router.post('/patient/login', AuthController.loginPatient);

module.exports = router;
