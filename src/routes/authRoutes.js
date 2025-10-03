const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Show login & register pages
router.get('/login', authController.getLogin);
router.get('/register', authController.getRegister);

// Handle login & register forms
router.post('/login', authController.postLogin);
router.post('/register', authController.postRegister);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
