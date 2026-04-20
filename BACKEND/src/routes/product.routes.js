const { Router } = require('express');
const ctrl = require('../controllers/product.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = Router();

router.get('/', ctrl.getProducts);
router.patch('/:id/stock', authenticate, authorize(['ADMIN']), ctrl.updateStock);

module.exports = router;
