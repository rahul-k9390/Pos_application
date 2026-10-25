const express = require('express');
const cors = require('cors');
const db = require('./db');
const seedInitialData = require('./seedData');

// Run initial seed if products table is empty
seedInitialData();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------- SETTINGS ----------------
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    const updateMany = db.transaction((settingsObj) => {
      for (const [key, val] of Object.entries(settingsObj)) {
        upsert.run(key, String(val));
      }
    });
    updateMany(req.body);
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CATEGORIES ----------------
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON p.category_id = c.id 
      GROUP BY c.id 
      ORDER BY c.name ASC
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const info = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)')
      .run(name, icon || 'ShoppingBag', color || '#4f46e5');
    res.json({ id: info.lastInsertRowid, name, icon, color });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------- PRODUCTS ----------------
app.get('/api/products', (req, res) => {
  try {
    const { search, category, barcode, low_stock } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (barcode) {
      query += ` AND p.barcode = ?`;
      params.push(barcode.trim());
    } else if (search) {
      query += ` AND (p.name LIKE ? OR p.barcode LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category) {
      query += ` AND p.category_id = ?`;
      params.push(category);
    }

    if (low_stock === 'true') {
      query += ` AND p.stock_qty <= p.min_stock_alert`;
    }

    query += ` ORDER BY p.name ASC`;
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const {
      barcode,
      name,
      category_id,
      cost_price,
      selling_price,
      mrp,
      stock_qty,
      min_stock_alert,
      unit,
      tax_percent,
      hsn_code,
      image_url
    } = req.body;

    // Auto-generate 12-digit barcode if blank
    const finalBarcode = barcode && barcode.trim() !== '' 
      ? barcode.trim() 
      : '890' + Math.floor(1000000000 + Math.random() * 9000000000);

    const stmt = db.prepare(`
      INSERT INTO products (
        barcode, name, category_id, cost_price, selling_price, mrp,
        stock_qty, min_stock_alert, unit, tax_percent, hsn_code, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      finalBarcode,
      name,
      category_id || null,
      parseFloat(cost_price) || 0,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || parseFloat(selling_price) || 0,
      parseFloat(stock_qty) || 0,
      parseFloat(min_stock_alert) || 5,
      unit || 'pcs',
      parseFloat(tax_percent) || 0,
      hsn_code || '',
      image_url || null
    );

    const newProduct = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      barcode,
      name,
      category_id,
      cost_price,
      selling_price,
      mrp,
      stock_qty,
      min_stock_alert,
      unit,
      tax_percent,
      hsn_code,
      image_url
    } = req.body;

    const stmt = db.prepare(`
      UPDATE products SET
        barcode = ?,
        name = ?,
        category_id = ?,
        cost_price = ?,
        selling_price = ?,
        mrp = ?,
        stock_qty = ?,
        min_stock_alert = ?,
        unit = ?,
        tax_percent = ?,
        hsn_code = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      barcode,
      name,
      category_id || null,
      parseFloat(cost_price) || 0,
      parseFloat(selling_price) || 0,
      parseFloat(mrp) || 0,
      parseFloat(stock_qty) || 0,
      parseFloat(min_stock_alert) || 5,
      unit || 'pcs',
      parseFloat(tax_percent) || 0,
      hsn_code || '',
      image_url || null,
      id
    );

    const updated = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(id);

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CUSTOMERS & KHATA ----------------
app.get('/api/customers', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id) as total_spent
      FROM customers c
    `;
    const params = [];

    if (search) {
      query += ` WHERE c.name LIKE ? OR c.phone LIKE ?`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY c.name ASC`;
    const customers = db.prepare(query).all(...params);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, email, address, outstanding_balance, loyalty_points)
      VALUES (?, ?, ?, ?, 0, 0)
    `);
    const info = stmt.run(name, phone || null, email || null, address || null);
    const newCust = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newCust);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Settle customer due (Khata payment)
app.post('/api/customers/:id/pay-due', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_mode, note } = req.body;
    const payAmount = parseFloat(amount);

    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const newBalance = Math.max(0, customer.outstanding_balance - payAmount);

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE customers SET outstanding_balance = ? WHERE id = ?
      `).run(newBalance, id);

      db.prepare(`
        INSERT INTO customer_transactions (customer_id, type, amount, payment_mode, note)
        VALUES (?, 'PAYMENT_RECEIVED', ?, ?, ?)
      `).run(id, payAmount, payment_mode || 'CASH', note || 'Khata Due Settlement');
    });

    transaction();

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json({ success: true, customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ORDERS & BILLING ----------------
app.get('/api/orders', (req, res) => {
  try {
    const { limit = 50, date, payment_mode } = req.query;
    let query = `SELECT * FROM orders WHERE 1=1`;
    const params = [];

    if (date) {
      query += ` AND DATE(created_at) = DATE(?)`;
      params.push(date);
    }
    if (payment_mode) {
      query += ` AND payment_mode = ?`;
      params.push(payment_mode);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Order (Checkout)
app.post('/api/orders', (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      items,
      subtotal,
      discount_amount,
      discount_type,
      tax_amount,
      total_amount,
      payment_mode,
      cash_tendered,
      change_due,
      notes,
      cashier
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    // Generate Order Number: INV-YYYYMMDD-XXXX or use custom provided order_number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = db.prepare(`
      SELECT count(*) as count FROM orders WHERE DATE(created_at) = DATE('now')
    `).get().count;
    const finalOrderNumber = (req.body.order_number && req.body.order_number.trim()) || `INV-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;
    const createdAt = (req.body.created_at && req.body.created_at.trim()) || new Date().toISOString();

    const executeOrder = db.transaction(() => {
      // 1. Insert Order
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          order_number, customer_id, customer_name, subtotal, discount_amount, discount_type,
          tax_amount, total_amount, payment_mode, payment_status, cash_tendered, change_due, notes, cashier, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const paymentStatus = payment_mode === 'DUE' ? 'PENDING' : 'COMPLETED';

      const orderResult = orderStmt.run(
        finalOrderNumber,
        customer_id || null,
        customer_name || 'Walk-in Customer',
        parseFloat(subtotal) || 0,
        parseFloat(discount_amount) || 0,
        discount_type || 'amount',
        parseFloat(tax_amount) || 0,
        parseFloat(total_amount) || 0,
        payment_mode || 'CASH',
        paymentStatus,
        parseFloat(cash_tendered) || 0,
        parseFloat(change_due) || 0,
        notes || '',
        cashier || 'Cashier 1',
        createdAt
      );

      const orderId = orderResult.lastInsertRowid;

      // 2. Insert Order Items & Deduct Stock
      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_name, barcode, hsn_code, unit_price, mrp, quantity, unit, discount, tax_percent, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stockStmt = db.prepare(`
        UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?
      `);

      for (const item of items) {
        const prodId = item.is_custom ? null : (item.id || item.product_id || null);

        itemStmt.run(
          orderId,
          prodId,
          item.name || item.product_name,
          item.barcode || '',
          item.hsn_code || '',
          parseFloat(item.selling_price || item.unit_price) || 0,
          parseFloat(item.mrp) || parseFloat(item.selling_price || item.unit_price) || 0,
          parseFloat(item.quantity) || 1,
          item.unit || 'pcs',
          parseFloat(item.discount) || 0,
          parseFloat(item.tax_percent) || 0,
          parseFloat(item.total_price) || (parseFloat(item.selling_price || item.unit_price || 0) * parseFloat(item.quantity || 1))
        );

        if (prodId && !item.is_custom) {
          stockStmt.run(parseFloat(item.quantity) || 1, prodId);
        }
      }

      // 3. If DUE / Udhar, add to customer outstanding balance & transaction history
      if (customer_id) {
        if (payment_mode === 'DUE') {
          db.prepare(`
            UPDATE customers 
            SET outstanding_balance = outstanding_balance + ? 
            WHERE id = ?
          `).run(parseFloat(total_amount), customer_id);

          db.prepare(`
            INSERT INTO customer_transactions (customer_id, order_id, type, amount, payment_mode, note)
            VALUES (?, ?, 'PURCHASE_DUE', ?, 'DUE', ?)
          `).run(customer_id, orderId, parseFloat(total_amount), `Bill #${orderNumber}`);
        }

        // Award loyalty points: 1 point for every ₹100 spent (if not unpaid due)
        if (payment_mode !== 'DUE') {
          const pointsEarned = Math.floor(parseFloat(total_amount) / 100);
          if (pointsEarned > 0) {
            db.prepare(`
              UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?
            `).run(pointsEarned, customer_id);
          }
        }
      }

      return orderId;
    });

    const newOrderId = executeOrder();
    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrderId);

    res.status(201).json({ ...createdOrder, items: orderItems });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HELD CARTS (PARKED BILLS) ----------------
app.get('/api/held-carts', (req, res) => {
  try {
    const carts = db.prepare('SELECT * FROM held_carts ORDER BY created_at DESC').all();
    const parsed = carts.map(c => ({
      ...c,
      cart_data: JSON.parse(c.cart_data)
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/held-carts', (req, res) => {
  try {
    const { cart_name, customer_id, cart_data } = req.body;
    const stmt = db.prepare(`
      INSERT INTO held_carts (cart_name, customer_id, cart_data)
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(
      cart_name || `Held Cart #${Date.now().toString().slice(-4)}`,
      customer_id || null,
      JSON.stringify(cart_data)
    );
    res.status(201).json({ id: info.lastInsertRowid, success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/held-carts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM held_carts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- BILL RETURN & REFUND (WAPSI) ----------------
app.post('/api/orders/:id/return', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, return_amount } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment_status === 'RETURNED' || order.payment_status === 'CANCELLED') {
      return res.status(400).json({ error: 'This invoice has already been returned/cancelled' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

    const executeReturn = db.transaction(() => {
      // 1. Restock items back to inventory if they are inventory products
      const restockStmt = db.prepare(`
        UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?
      `);
      for (const item of items) {
        if (item.product_id) {
          restockStmt.run(parseFloat(item.quantity) || 1, item.product_id);
        }
      }

      // 2. If order was on DUE/Udhar and customer exists, reduce customer due balance
      const refundVal = parseFloat(return_amount) || parseFloat(order.total_amount) || 0;
      if (order.customer_id && order.payment_mode === 'DUE') {
        db.prepare(`
          UPDATE customers 
          SET outstanding_balance = MAX(0, outstanding_balance - ?)
          WHERE id = ?
        `).run(refundVal, order.customer_id);

        db.prepare(`
          INSERT INTO customer_transactions (customer_id, order_id, type, amount, payment_mode, note)
          VALUES (?, ?, 'REFUND_REVERSED', ?, 'CASH', ?)
        `).run(order.customer_id, order.id, refundVal, `Return on Bill #${order.order_number}: ${reason || 'Goods returned'}`);
      }

      // 3. Update order status
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'RETURNED', 
            refund_amount = ?, 
            return_reason = ? 
        WHERE id = ?
      `).run(refundVal, reason || 'Customer Item Return', id);
    });

    executeReturn();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const updatedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    res.json({ 
      success: true, 
      message: 'Bill returned successfully and stock restored to inventory', 
      order: { ...updatedOrder, items: updatedItems } 
    });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SUPPLIERS & STOCK INWARD PURCHASES ----------------
app.get('/api/suppliers', (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM purchases WHERE supplier_id = s.id) as purchase_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE supplier_id = s.id) as total_purchased
      FROM suppliers s
      ORDER BY s.name ASC
    `).all();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { name, phone, gstin, email, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Supplier name is required' });

    const stmt = db.prepare(`
      INSERT INTO suppliers (name, phone, gstin, email, address)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), phone || '', gstin || '', email || '', address || '');
    const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchases', (req, res) => {
  try {
    const purchases = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as item_count
      FROM purchases p
      ORDER BY p.invoice_date DESC
    `).all();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const {
      invoice_number,
      supplier_id,
      supplier_name,
      items, // [{ product_id, product_name, cost_price, quantity, unit, hsn_code }]
      total_amount,
      payment_mode,
      invoice_date,
      notes
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Purchase must have at least one item' });
    }

    const finalInvoiceNumber = invoice_number || `PUR-${Date.now().toString().slice(-6)}`;
    const finalInvoiceDate = invoice_date || new Date().toISOString();

    const executePurchase = db.transaction(() => {
      // 1. Insert Purchase
      const purchaseStmt = db.prepare(`
        INSERT INTO purchases (invoice_number, supplier_id, supplier_name, total_amount, payment_mode, invoice_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const pResult = purchaseStmt.run(
        finalInvoiceNumber,
        supplier_id || null,
        supplier_name || 'General Wholesaler',
        parseFloat(total_amount) || 0,
        payment_mode || 'CASH',
        finalInvoiceDate,
        notes || ''
      );
      const purchaseId = pResult.lastInsertRowid;

      // 2. Insert Items & Inward Stock
      const itemStmt = db.prepare(`
        INSERT INTO purchase_items (purchase_id, product_id, product_name, hsn_code, cost_price, quantity, unit, total_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStockStmt = db.prepare(`
        UPDATE products 
        SET stock_qty = stock_qty + ?, 
            cost_price = ?,
            hsn_code = CASE WHEN ? != '' THEN ? ELSE hsn_code END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of items) {
        const prodId = item.product_id || item.id;
        const cost = parseFloat(item.cost_price) || 0;
        const qty = parseFloat(item.quantity) || 1;
        const total = cost * qty;
        const hsn = (item.hsn_code && item.hsn_code.trim()) || '';

        itemStmt.run(
          purchaseId,
          prodId || null,
          item.product_name || item.name,
          hsn,
          cost,
          qty,
          item.unit || 'pcs',
          total
        );

        if (prodId) {
          updateStockStmt.run(qty, cost, hsn, hsn, prodId);
        }
      }

      return purchaseId;
    });

    const purchaseId = executePurchase();
    const createdPurchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    const purchaseItems = db.prepare('SELECT * FROM purchase_items WHERE purchase_id = ?').all(purchaseId);

    res.status(201).json({ success: true, purchase: { ...createdPurchase, items: purchaseItems } });
  } catch (err) {
    console.error('Purchase entry error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- AUTH / ADMIN PIN VERIFICATION ----------------
app.post('/api/auth/verify-pin', (req, res) => {
  try {
    const { pin } = req.body;
    const adminPinRow = db.prepare("SELECT value FROM settings WHERE key = 'admin_pin'").get();
    const actualPin = adminPinRow ? adminPinRow.value : '1234';

    if (String(pin).trim() === String(actualPin).trim()) {
      return res.json({ success: true, message: 'PIN verified' });
    } else {
      return res.status(401).json({ success: false, error: 'Incorrect Admin PIN' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DASHBOARD & ANALYTICS ----------------
app.get('/api/dashboard/stats', (req, res) => {
  try {
    // Today's Sales
    const todayStats = db.prepare(`
      SELECT 
        COALESCE(COUNT(*), 0) as bills_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discount
      FROM orders 
      WHERE DATE(created_at) = DATE('now')
    `).get();

    // All Time / Overall Stats
    const totalStats = db.prepare(`
      SELECT 
        COALESCE(COUNT(*), 0) as total_bills,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders
    `).get();

    // Product Count & Low Stock Alert
    const inventoryStats = db.prepare(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN stock_qty <= min_stock_alert THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_qty = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
    `).get();

    // Customer Outstanding Balance (Total Khata / Udhar)
    const khataStats = db.prepare(`
      SELECT 
        COUNT(id) as total_customers,
        COALESCE(SUM(outstanding_balance), 0) as total_outstanding
      FROM customers
    `).get();

    // Payment Mode Breakdown (Today & All time)
    const paymentBreakdown = db.prepare(`
      SELECT 
        payment_mode, 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      GROUP BY payment_mode
    `).all();

    // Top Selling Products
    const topProducts = db.prepare(`
      SELECT 
        oi.product_name, 
        p.barcode,
        SUM(oi.quantity) as total_qty, 
        SUM(oi.total_price) as total_amount
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY oi.product_name
      ORDER BY total_qty DESC
      LIMIT 6
    `).all();

    // Recent 5 Orders
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, total_amount, payment_mode, payment_status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    // Low stock items list
    const lowStockItems = db.prepare(`
      SELECT id, name, barcode, stock_qty, min_stock_alert, unit, selling_price
      FROM products
      WHERE stock_qty <= min_stock_alert
      ORDER BY stock_qty ASC
      LIMIT 8
    `).all();

    res.json({
      today: todayStats,
      overall: totalStats,
      inventory: inventoryStats,
      khata: khataStats,
      paymentBreakdown,
      topProducts,
      recentOrders,
      lowStockItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- MONTHLY SALES REPORT ----------------
app.get('/api/reports/monthly', (req, res) => {
  try {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const targetMonth = (req.query.month && req.query.month.trim()) || currentMonthStr;

    // 1. Monthly Summary
    const summary = db.prepare(`
      SELECT 
        COALESCE(COUNT(*), 0) as bills_count,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discount,
        COALESCE(SUM(subtotal), 0) as total_subtotal
      FROM orders 
      WHERE substr(created_at, 1, 7) = ?
    `).get(targetMonth);

    // 2. Monthly Payment Mode Breakdown
    const paymentBreakdown = db.prepare(`
      SELECT 
        payment_mode, 
        COUNT(*) as count, 
        COALESCE(SUM(total_amount), 0) as total
      FROM orders 
      WHERE substr(created_at, 1, 7) = ?
      GROUP BY payment_mode
      ORDER BY total DESC
    `).all(targetMonth);

    // 3. Day by Day sales breakdown in this month
    const dailyBreakdown = db.prepare(`
      SELECT 
        substr(created_at, 1, 10) as sale_date,
        COUNT(*) as bills_count,
        COALESCE(SUM(total_amount), 0) as daily_total
      FROM orders
      WHERE substr(created_at, 1, 7) = ?
      GROUP BY substr(created_at, 1, 10)
      ORDER BY sale_date DESC
    `).all(targetMonth);

    // 4. Invoices / Orders in this month
    const orders = db.prepare(`
      SELECT 
        id, order_number, customer_id, customer_name, 
        subtotal, discount_amount, discount_type, tax_amount, 
        total_amount, payment_mode, payment_status, cashier, created_at
      FROM orders
      WHERE substr(created_at, 1, 7) = ?
      ORDER BY created_at DESC
    `).all(targetMonth);

    // 5. Product Sales breakdown in this month
    const productSales = db.prepare(`
      SELECT 
        oi.product_name,
        oi.barcode,
        oi.unit,
        SUM(oi.quantity) as total_qty,
        SUM(oi.total_price) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE substr(o.created_at, 1, 7) = ?
      GROUP BY oi.product_name, oi.barcode, oi.unit
      ORDER BY total_sales DESC
    `).all(targetMonth);

    // 6. Available months list
    const distinctMonths = db.prepare(`
      SELECT DISTINCT substr(created_at, 1, 7) as month_val
      FROM orders
      WHERE created_at IS NOT NULL
      ORDER BY month_val DESC
    `).all().map(r => r.month_val).filter(Boolean);

    const availableMonths = Array.from(new Set([currentMonthStr, targetMonth, ...distinctMonths])).sort().reverse();

    res.json({
      selectedMonth: targetMonth,
      summary,
      paymentBreakdown,
      dailyBreakdown,
      orders,
      productSales,
      availableMonths
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`POS API Server running smoothly on http://localhost:${PORT}`);
});
