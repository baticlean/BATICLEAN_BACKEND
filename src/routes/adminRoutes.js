const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { updateQuoteRequestStatusSchema, adminQuerySchema } = require('../validators/adminValidator');
const { USER_ROLES } = require('../constants/enums');

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.TEAM));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/quote-requests', validate(adminQuerySchema), adminController.getQuoteRequests);
router.patch(
  '/quote-requests/:id/status',
  validate(updateQuoteRequestStatusSchema),
  adminController.updateQuoteRequestStatus
);
router.post('/quote-requests/:id/convert-project', adminController.convertToProject);

module.exports = router;
