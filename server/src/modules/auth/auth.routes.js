const express = require('express');
const { login, logout, getMe, register } = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { loginSchema, registerSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
