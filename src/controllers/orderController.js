const pool = require('../../config/db');

// Show checkout page
exports.getCheckout = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const result = await pool.query(`
      SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `, [userId]);

    let grandTotal = 0;
    result.rows.forEach(item => grandTotal += item.price * item.quantity);

    res.render('orders/checkout', { title: 'Checkout', cartItems: result.rows, grandTotal });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Place order
exports.placeOrder = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const cartItemsResult = await pool.query(`
      SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `, [userId]);

    if (cartItemsResult.rows.length === 0) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }

    // Calculate total amount
    let totalAmount = 0;
    cartItemsResult.rows.forEach(item => totalAmount += item.price * item.quantity);

    // Insert into orders
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id',
      [userId, totalAmount, 'pending']
    );

    const orderId = orderResult.rows[0].order_id;

    // Insert order items
    for (const item of cartItemsResult.rows) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Clear user's cart
    await pool.query('DELETE FROM cart WHERE user_id=$1', [userId]);

    req.flash('success_msg', 'Order placed successfully!');
    res.redirect('/orders/history');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Order history
exports.orderHistory = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );

    res.render('orders/order-history', { title: 'Your Orders', orders: ordersResult.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
