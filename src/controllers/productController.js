const pool = require('../../config/db');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.render('products/index', { title: 'Products', products: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM products WHERE product_id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Product not found');
    res.render('products/details', { title: result.rows[0].name, product: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
