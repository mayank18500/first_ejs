const pool = require('../../config/db');

// View cart
exports.viewCart = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const result = await pool.query(`
      SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `, [userId]);

    res.render('cart/cart', { title: 'Your Cart', cartItems: result.rows });
  } catch (err) {
    console.error(err.message);
    req.flash('error_msg', 'Could not load cart.');
    res.status(500).redirect('/products');
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  const userId = req.session.user.id;
  const productId = req.params.productId;
  // Default quantity of 1 when adding from product detail page
  const quantity = parseInt(req.body.quantity || 1, 10); 

  try {
    // Check if product already in cart
    const check = await pool.query(
      'SELECT * FROM cart WHERE user_id=$1 AND product_id=$2',
      [userId, productId]
    );

    if (check.rows.length > 0) {
      // Increase quantity by the amount specified (default 1)
      await pool.query(
        'UPDATE cart SET quantity = quantity + $3 WHERE user_id=$1 AND product_id=$2',
        [userId, productId, quantity]
      );
      req.flash('success_msg', 'Product quantity updated in cart.');
    } else {
      // Insert new cart item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [userId, productId, quantity]
      );
      req.flash('success_msg', 'Product added to cart.');
    }

    res.redirect('/cart');
  } catch (err) {
    console.error(err.message);
    req.flash('error_msg', 'Failed to add product to cart.');
    res.status(500).redirect('/products');
  }
};

// NEW LOGIC: Update cart item quantity
exports.updateCartQuantity = async (req, res) => {
    const userId = req.session.user.id;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity, 10);

    if (isNaN(quantity) || quantity < 0) {
        req.flash('error_msg', 'Invalid quantity.');
        return res.redirect('/cart');
    }

    try {
        if (quantity === 0) {
            // Remove the item if quantity is set to 0
            await pool.query(
                'DELETE FROM cart WHERE user_id=$1 AND product_id=$2',
                [userId, productId]
            );
            req.flash('success_msg', 'Product removed from cart.');
        } else {
            // Update the quantity
            await pool.query(
                'UPDATE cart SET quantity = $3 WHERE user_id=$1 AND product_id=$2',
                [userId, productId, quantity]
            );
            req.flash('success_msg', 'Cart quantity updated.');
        }
        res.redirect('/cart');
    } catch (err) {
        console.error(err.message);
        req.flash('error_msg', 'Failed to update cart quantity.');
        res.status(500).redirect('/cart');
    }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    await pool.query(
      'DELETE FROM cart WHERE user_id=$1 AND product_id=$2',
      [userId, productId]
    );
    req.flash('success_msg', 'Product removed from cart.');
    res.redirect('/cart');
  } catch (err) {
    console.error(err.message);
    req.flash('error_msg', 'Failed to remove product from cart.');
    res.status(500).redirect('/cart');
  }
};