const { Router } = require('express');
const ctrl = require('../controllers/nova.controller');

const router = Router();

router.post('/', ctrl.askNova);

module.exports = router;
