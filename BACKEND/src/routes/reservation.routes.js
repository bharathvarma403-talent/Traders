const { Router } = require('express');
const ctrl = require('../controllers/reservation.controller');
const { authenticate } = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = Router();

// All reservation routes require authentication
router.use(authenticate);

router.post('/', ctrl.createReservation);
router.get('/', ctrl.getReservations);
router.patch('/:id/status', authorize(['ADMIN']), ctrl.updateStatus);

module.exports = router;
