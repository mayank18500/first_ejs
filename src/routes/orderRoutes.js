const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware');

// Checkout page
router.get('/checkout', ensureAuthenticated, orderController.getCheckout);

// Place order
router.post('/place-order', ensureAuthenticated, orderController.placeOrder);

// Order history
router.get('/history', ensureAuthenticated, orderController.orderHistory);

module.exports = router;