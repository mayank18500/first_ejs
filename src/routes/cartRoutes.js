const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { ensureAuthenticated } = require('../middlewares/authMiddleware'); // protect routes

// Show cart
router.get('/', ensureAuthenticated, cartController.viewCart);

// Add to cart
router.post('/add/:productId', ensureAuthenticated, cartController.addToCart);

// Remove from cart
router.post('/remove/:productId', ensureAuthenticated, cartController.removeFromCart);

module.exports = router;
