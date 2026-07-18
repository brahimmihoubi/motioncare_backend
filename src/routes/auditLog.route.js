const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/auditLog.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/', AuditLogController.getAll);

module.exports = router;
