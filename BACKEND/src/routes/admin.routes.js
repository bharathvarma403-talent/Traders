const { Router } = require('express');
const ctrl = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { upload } = require('../middleware/upload');

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize(['ADMIN']));

router.get('/users', ctrl.getUsers);
router.post('/products', upload.single('image'), ctrl.createProduct);
router.put('/products/:id', upload.single('image'), ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

module.exports = router;
