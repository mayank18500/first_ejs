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
    req.flash('error_msg', 'Could not load checkout page.');
    res.status(500).redirect('/cart');
  }
};

// Place order - CRITICAL: Using a transaction for atomicity
exports.placeOrder = async (req, res) => {
  const userId = req.session.user.id;
  // Get a dedicated client for the transaction
  const client = await pool.connect(); 

  try {
    // 1. Start the transaction
    await client.query('BEGIN'); 

    const cartItemsResult = await client.query(`
      SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
    `, [userId]);

    if (cartItemsResult.rows.length === 0) {
      // Rollback and exit if cart is empty
      await client.query('ROLLBACK');
      req.flash('error_msg', 'Your cart is empty. Nothing to order.');
      return res.redirect('/cart');
    }

    // Calculate total amount
    let totalAmount = 0;
    cartItemsResult.rows.forEach(item => totalAmount += item.price * item.quantity);

    // 2. Insert into orders table
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id',
      [userId, totalAmount, 'pending']
    );

    const orderId = orderResult.rows[0].order_id;

    // 3. Insert order items
    for (const item of cartItemsResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // 4. Clear user's cart
    await client.query('DELETE FROM cart WHERE user_id=$1', [userId]);

    // 5. Commit the transaction if all steps succeeded
    await client.query('COMMIT'); 
    req.flash('success_msg', `Order #${orderId} placed successfully!`);
    res.redirect('/orders/history');
  } catch (err) {
    // 6. Rollback the transaction on any error
    await client.query('ROLLBACK'); 
    console.error('Transaction Error:', err.message);
    req.flash('error_msg', 'Order placement failed due to a server error. Please try again.');
    res.status(500).redirect('/cart');
  } finally {
    // 7. Always release the client back to the pool
    client.release(); 
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
    req.flash('error_msg', 'Could not retrieve order history.');
    res.status(500).redirect('/');
  }
};