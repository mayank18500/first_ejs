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
    res.status(500).send('Server Error');
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    // Check if product already in cart
    const check = await pool.query(
      'SELECT * FROM cart WHERE user_id=$1 AND product_id=$2',
      [userId, productId]
    );

    if (check.rows.length > 0) {
      // Increase quantity
      await pool.query(
        'UPDATE cart SET quantity = quantity + 1 WHERE user_id=$1 AND product_id=$2',
        [userId, productId]
      );
    } else {
      // Insert new cart item
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, 1)',
        [userId, productId]
      );
    }

    res.redirect('/cart');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
    res.redirect('/cart');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
