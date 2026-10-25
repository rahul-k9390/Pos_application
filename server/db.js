const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'pos.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnIfNotExists(table, column, definition) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = columns.some(c => c.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (err) {
    console.warn(`Migration notice for ${table}.${column}:`, err.message);
  }
}

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'ShoppingBag',
      color TEXT DEFAULT '#4f46e5'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER,
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL,
      mrp REAL NOT NULL,
      stock_qty REAL NOT NULL DEFAULT 0,
      min_stock_alert REAL NOT NULL DEFAULT 5,
      unit TEXT DEFAULT 'pcs',
      tax_percent REAL DEFAULT 0,
      hsn_code TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      outstanding_balance REAL DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'amount', -- 'percentage' or 'amount'
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_mode TEXT NOT NULL, -- 'CASH', 'UPI', 'CARD', 'SPLIT', 'DUE'
      payment_status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'PARTIAL', 'PENDING', 'RETURNED', 'CANCELLED'
      refund_amount REAL DEFAULT 0,
      return_reason TEXT,
      cash_tendered REAL DEFAULT 0,
      change_due REAL DEFAULT 0,
      notes TEXT,
      cashier TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      barcode TEXT,
      hsn_code TEXT,
      unit_price REAL NOT NULL,
      mrp REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'pcs',
      discount REAL DEFAULT 0,
      tax_percent REAL DEFAULT 0,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customer_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_id INTEGER,
      type TEXT NOT NULL, -- 'PURCHASE_DUE', 'PAYMENT_RECEIVED', 'REFUND_REVERSED'
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS held_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_name TEXT,
      customer_id INTEGER,
      cart_data TEXT NOT NULL, -- JSON string of cart items & discounts
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      gstin TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT,
      supplier_id INTEGER,
      supplier_name TEXT,
      total_amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'CASH',
      invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      hsn_code TEXT,
      cost_price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'pcs',
      total_cost REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Run dynamic column additions for existing databases
  addColumnIfNotExists('products', 'hsn_code', 'TEXT');
  addColumnIfNotExists('order_items', 'hsn_code', 'TEXT');
  addColumnIfNotExists('orders', 'refund_amount', 'REAL DEFAULT 0');
  addColumnIfNotExists('orders', 'return_reason', 'TEXT');

  // Default Settings Seed
  const defaultSettings = [
    ['store_name', 'Kirana Super Mart'],
    ['store_tagline', 'Fresh Groceries & Daily Needs'],
    ['store_address', 'Shop #4, Metro Commercial Hub, Station Road'],
    ['store_phone', '+91 98765 43210'],
    ['store_email', 'store@kiranamart.com'],
    ['store_gstin', '27AABCS1429B1Z8'],
    ['store_fssai', '11521018000452'],
    ['store_upi_id', '9876543210@upi'],
    ['store_upi_name', 'Kirana Super Mart'],
    ['receipt_footer', 'Thank you for your visit! Goods once sold can be exchanged within 3 days.'],
    ['currency_symbol', '₹'],
    ['paper_width', '80mm'], // 80mm or 58mm
    ['enable_sound', 'true'],
    ['admin_pin', '1234'] // Default Owner/Admin Security PIN
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  for (const [key, val] of defaultSettings) {
    insertSetting.run(key, val);
  }
}

initDatabase();

module.exports = db;
