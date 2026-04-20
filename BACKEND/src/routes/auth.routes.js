const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/authenticate');
const {
  registerSchema,
  loginEmailSchema,
  loginPhoneSchema,
  googleSchema,
  refreshSchema,
} = require('../schemas');

const router = Router();

// All auth routes get the rate limiter
router.use(authLimiter);

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginEmailSchema), ctrl.loginEmail);
router.post('/login-phone', validate(loginPhoneSchema), ctrl.loginPhone);
router.post('/google', validate(googleSchema), ctrl.googleLogin);
router.post('/refresh', validate(refreshSchema), ctrl.refresh);
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
