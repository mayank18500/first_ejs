const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Show all products
router.get('/', productController.getAllProducts);

// Show single product detail
router.get('/:id', productController.getProductById);

module.exports = router;
