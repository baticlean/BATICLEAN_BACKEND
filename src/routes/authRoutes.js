const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validateMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiterMiddleware');
const { loginSchema, registerAdminSchema, refreshTokenSchema } = require('../validators/authValidator');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/register-admin', authLimiter, validate(registerAdminSchema), authController.registerAdmin);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
