const db = require('./db');

function seedInitialData() {
  const productCount = db.prepare('SELECT count(*) as count FROM products').get().count;
  if (productCount > 0) {
    console.log('Database already contains products. Skipping seed.');
    return;
  }

  console.log('Seeding initial categories, products, customers, and orders...');

  // Seed Categories
  const categories = [
    { name: 'Grains, Flour & Pulses', icon: 'Wheat', color: '#f59e0b' },
    { name: 'Oils & Ghee', icon: 'Droplets', color: '#eab308' },
    { name: 'Dairy & Breakfast', icon: 'Milk', color: '#06b6d4' },
    { name: 'Snacks & Biscuits', icon: 'Cookie', color: '#ec4899' },
    { name: 'Beverages & Tea', icon: 'Coffee', color: '#8b5cf6' },
    { name: 'Spices, Salt & Sugar', icon: 'Sparkles', color: '#ef4444' },
    { name: 'Personal & Home Care', icon: 'Sparkles', color: '#10b981' }
  ];

  const insertCategory = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)');
  const catMap = {};
  for (const cat of categories) {
    const res = insertCategory.run(cat.name, cat.icon, cat.color);
    catMap[cat.name] = res.lastInsertRowid;
  }

  // Seed Products
  const products = [
    // Grains, Flour & Pulses
    {
      barcode: '8901262010114',
      name: 'Aashirvaad Shudh Chakki Atta 5kg',
      category: 'Grains, Flour & Pulses',
      cost_price: 210,
      mrp: 260,
      selling_price: 245,
      stock_qty: 35,
      min_stock_alert: 5,
      unit: 'pack',
      tax_percent: 0
    },
    {
      barcode: '8901725181121',
      name: 'India Gate Basmati Rice Feast Rozzana 1kg',
      category: 'Grains, Flour & Pulses',
      cost_price: 75,
      mrp: 110,
      selling_price: 95,
      stock_qty: 48,
      min_stock_alert: 10,
      unit: 'pack',
      tax_percent: 0
    },
    {
      barcode: '8904004400122',
      name: 'Tata Sampann Toor Dal (Unpolished) 1kg',
      category: 'Grains, Flour & Pulses',
      cost_price: 135,
      mrp: 185,
      selling_price: 168,
      stock_qty: 24,
      min_stock_alert: 6,
      unit: 'pack',
      tax_percent: 0
    },
    {
      barcode: '8904004400238',
      name: 'Tata Sampann Moong Dal Chana 500g',
      category: 'Grains, Flour & Pulses',
      cost_price: 60,
      mrp: 85,
      selling_price: 78,
      stock_qty: 4, // low stock test
      min_stock_alert: 5,
      unit: 'pack',
      tax_percent: 0
    },

    // Oils & Ghee
    {
      barcode: '8901499009180',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      category: 'Oils & Ghee',
      cost_price: 112,
      mrp: 145,
      selling_price: 132,
      stock_qty: 60,
      min_stock_alert: 10,
      unit: 'pouch',
      tax_percent: 5
    },
    {
      barcode: '8901262030013',
      name: 'Amul Pure Cow Ghee Tin 1L',
      category: 'Oils & Ghee',
      cost_price: 540,
      mrp: 670,
      selling_price: 625,
      stock_qty: 18,
      min_stock_alert: 4,
      unit: 'tin',
      tax_percent: 5
    },
    {
      barcode: '8901499009401',
      name: 'Fortune Kachi Ghani Mustard Oil 1L',
      category: 'Oils & Ghee',
      cost_price: 125,
      mrp: 165,
      selling_price: 148,
      stock_qty: 3, // low stock test
      min_stock_alert: 5,
      unit: 'bottle',
      tax_percent: 5
    },

    // Dairy & Breakfast
    {
      barcode: '8901262010015',
      name: 'Amul Butter Pasteurised 500g',
      category: 'Dairy & Breakfast',
      cost_price: 235,
      mrp: 275,
      selling_price: 265,
      stock_qty: 42,
      min_stock_alert: 8,
      unit: 'pack',
      tax_percent: 12
    },
    {
      barcode: '8901262020021',
      name: 'Amul Taaza Homogenised Toned Milk 1L',
      category: 'Dairy & Breakfast',
      cost_price: 62,
      mrp: 74,
      selling_price: 72,
      stock_qty: 25,
      min_stock_alert: 5,
      unit: 'tetrapack',
      tax_percent: 0
    },
    {
      barcode: '8901058852331',
      name: 'Kellogg\'s Corn Flakes Original 475g',
      category: 'Dairy & Breakfast',
      cost_price: 155,
      mrp: 215,
      selling_price: 195,
      stock_qty: 15,
      min_stock_alert: 4,
      unit: 'box',
      tax_percent: 12
    },

    // Snacks & Biscuits
    {
      barcode: '8901063012631',
      name: 'Parle-G Gold Gluco Biscuits 1kg',
      category: 'Snacks & Biscuits',
      cost_price: 92,
      mrp: 120,
      selling_price: 110,
      stock_qty: 55,
      min_stock_alert: 12,
      unit: 'pack',
      tax_percent: 18
    },
    {
      barcode: '8901030823341',
      name: 'Britannia Good Day Butter Cookies 600g Party Pack',
      category: 'Snacks & Biscuits',
      cost_price: 105,
      mrp: 145,
      selling_price: 130,
      stock_qty: 30,
      min_stock_alert: 8,
      unit: 'pack',
      tax_percent: 18
    },
    {
      barcode: '8901058863412',
      name: 'Maggi 2-Minute Masala Instant Noodles 420g (Pack of 6)',
      category: 'Snacks & Biscuits',
      cost_price: 76,
      mrp: 96,
      selling_price: 90,
      stock_qty: 80,
      min_stock_alert: 15,
      unit: 'pack',
      tax_percent: 12
    },
    {
      barcode: '8901491101905',
      name: 'Lay\'s India\'s Magic Masala Potato Chips 50g',
      category: 'Snacks & Biscuits',
      cost_price: 16,
      mrp: 20,
      selling_price: 20,
      stock_qty: 110,
      min_stock_alert: 20,
      unit: 'packet',
      tax_percent: 12
    },
    {
      barcode: '8901491001403',
      name: 'Kurkure Masala Munch 82g',
      category: 'Snacks & Biscuits',
      cost_price: 16,
      mrp: 20,
      selling_price: 20,
      stock_qty: 65,
      min_stock_alert: 15,
      unit: 'packet',
      tax_percent: 12
    },

    // Beverages & Tea
    {
      barcode: '8901030012443',
      name: 'Tata Tea Gold Leaf Tea 500g',
      category: 'Beverages & Tea',
      cost_price: 260,
      mrp: 340,
      selling_price: 310,
      stock_qty: 28,
      min_stock_alert: 5,
      unit: 'pack',
      tax_percent: 5
    },
    {
      barcode: '8901058891002',
      name: 'Nescafe Classic Instant Coffee Jar 100g',
      category: 'Beverages & Tea',
      cost_price: 255,
      mrp: 330,
      selling_price: 305,
      stock_qty: 22,
      min_stock_alert: 5,
      unit: 'jar',
      tax_percent: 18
    },
    {
      barcode: '8901764012211',
      name: 'Coca Cola Soft Drink 750ml Bottle',
      category: 'Beverages & Tea',
      cost_price: 32,
      mrp: 40,
      selling_price: 40,
      stock_qty: 45,
      min_stock_alert: 10,
      unit: 'bottle',
      tax_percent: 28
    },

    // Spices, Salt & Sugar
    {
      barcode: '8904004400016',
      name: 'Tata Salt Vacuum Evaporated Iodised Salt 1kg',
      category: 'Spices, Salt & Sugar',
      cost_price: 21,
      mrp: 28,
      selling_price: 26,
      stock_qty: 140,
      min_stock_alert: 25,
      unit: 'pouch',
      tax_percent: 0
    },
    {
      barcode: '8901234002341',
      name: 'Madhur Pure & Hygienic Sugar 1kg',
      category: 'Spices, Salt & Sugar',
      cost_price: 42,
      mrp: 58,
      selling_price: 52,
      stock_qty: 90,
      min_stock_alert: 15,
      unit: 'pack',
      tax_percent: 0
    },
    {
      barcode: '8901725189004',
      name: 'Everest Turmeric Powder (Haldi) 200g',
      category: 'Spices, Salt & Sugar',
      cost_price: 48,
      mrp: 68,
      selling_price: 62,
      stock_qty: 38,
      min_stock_alert: 6,
      unit: 'box',
      tax_percent: 5
    },
    {
      barcode: '8901725189011',
      name: 'Everest Garam Masala Powder 100g',
      category: 'Spices, Salt & Sugar',
      cost_price: 64,
      mrp: 88,
      selling_price: 80,
      stock_qty: 32,
      min_stock_alert: 5,
      unit: 'box',
      tax_percent: 5
    },

    // Personal & Home Care
    {
      barcode: '8901030894211',
      name: 'Dettol Original Germ Protection Bathing Soap (Pack of 4x125g)',
      category: 'Personal & Home Care',
      cost_price: 180,
      mrp: 240,
      selling_price: 215,
      stock_qty: 24,
      min_stock_alert: 5,
      unit: 'pack',
      tax_percent: 18
    },
    {
      barcode: '8901030022312',
      name: 'Surf Excel Quick Wash Detergent Powder 1kg',
      category: 'Personal & Home Care',
      cost_price: 118,
      mrp: 155,
      selling_price: 140,
      stock_qty: 50,
      min_stock_alert: 10,
      unit: 'pack',
      tax_percent: 18
    },
    {
      barcode: '8901030043126',
      name: 'Vim Dishwash Bar 300g with Tub',
      category: 'Personal & Home Care',
      cost_price: 28,
      mrp: 38,
      selling_price: 34,
      stock_qty: 70,
      min_stock_alert: 15,
      unit: 'bar',
      tax_percent: 18
    },
    {
      barcode: '8901314010521',
      name: 'Colgate Strong Teeth Dental Cream 200g',
      category: 'Personal & Home Care',
      cost_price: 95,
      mrp: 130,
      selling_price: 118,
      stock_qty: 40,
      min_stock_alert: 8,
      unit: 'tube',
      tax_percent: 18
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      barcode, name, category_id, cost_price, selling_price, mrp, stock_qty, min_stock_alert, unit, tax_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertedProducts = [];
  for (const p of products) {
    const catId = catMap[p.category] || null;
    const res = insertProduct.run(
      p.barcode,
      p.name,
      catId,
      p.cost_price,
      p.selling_price,
      p.mrp,
      p.stock_qty,
      p.min_stock_alert,
      p.unit,
      p.tax_percent
    );
    insertedProducts.push({ id: res.lastInsertRowid, ...p });
  }

  // Seed Customers
  const customers = [
    { name: 'Ramesh Sharma', phone: '9820112233', email: 'ramesh.sharma@gmail.com', address: 'Flat 302, Gokul Apts', outstanding_balance: 450, loyalty_points: 120 },
    { name: 'Sunita Verma', phone: '9819223344', email: 'sunita.v@yahoo.com', address: 'House 14, Main Bazaar', outstanding_balance: 0, loyalty_points: 340 },
    { name: 'Amit Patel', phone: '9892334455', email: 'amit.patel@outlook.com', address: 'B-12, Green Park Society', outstanding_balance: 1250, loyalty_points: 85 },
    { name: 'Pooja Gupta', phone: '9769445566', email: 'pooja.g@gmail.com', address: 'Flat 501, Sunrise Heights', outstanding_balance: 0, loyalty_points: 210 },
    { name: 'Mohan Lal (Cash)', phone: '9900000000', email: '', address: 'Counter Customer', outstanding_balance: 0, loyalty_points: 0 }
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, outstanding_balance, loyalty_points)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertedCusts = [];
  for (const c of customers) {
    const res = insertCustomer.run(c.name, c.phone, c.email, c.address, c.outstanding_balance, c.loyalty_points);
    insertedCusts.push({ id: res.lastInsertRowid, ...c });
  }

  // Seed some past sample orders (so reports and dashboard look populated right away)
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, customer_name, subtotal, discount_amount, discount_type,
      tax_amount, total_amount, payment_mode, payment_status, cash_tendered, change_due, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      order_id, product_id, product_name, barcode, unit_price, mrp, quantity, unit, discount, tax_percent, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleBills = [
    {
      custIdx: 0,
      mode: 'UPI',
      daysAgo: 2,
      items: [
        { prod: insertedProducts[0], qty: 1 }, // Atta
        { prod: insertedProducts[18], qty: 2 }, // Tata Salt
        { prod: insertedProducts[7], qty: 1 }  // Butter
      ]
    },
    {
      custIdx: 1,
      mode: 'CASH',
      daysAgo: 1,
      items: [
        { prod: insertedProducts[4], qty: 2 }, // Oil
        { prod: insertedProducts[12], qty: 3 }, // Maggi
        { prod: insertedProducts[15], qty: 1 }  // Tea
      ]
    },
    {
      custIdx: 2,
      mode: 'DUE',
      daysAgo: 0,
      items: [
        { prod: insertedProducts[5], qty: 1 }, // Ghee
        { prod: insertedProducts[19], qty: 2 }, // Sugar
        { prod: insertedProducts[23], qty: 1 }  // Surf Excel
      ]
    },
    {
      custIdx: 3,
      mode: 'CARD',
      daysAgo: 0,
      items: [
        { prod: insertedProducts[1], qty: 2 }, // Rice
        { prod: insertedProducts[10], qty: 2 }, // Parle-G
        { prod: insertedProducts[16], qty: 1 }  // Nescafe
      ]
    }
  ];

  let billNum = 1001;
  for (const b of sampleBills) {
    const cust = insertedCusts[b.custIdx];
    let subtotal = 0;
    let taxTotal = 0;

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - b.daysAgo);
    orderDate.setHours(11 + billNum % 6, (billNum * 17) % 60, 0);

    for (const item of b.items) {
      const lineTotal = item.prod.selling_price * item.qty;
      subtotal += lineTotal;
      taxTotal += (lineTotal * (item.prod.tax_percent || 0)) / 100;
    }

    const total = Math.round(subtotal + taxTotal);
    const orderNum = `INV-${orderDate.getFullYear()}-${billNum++}`;

    const orderRes = insertOrder.run(
      orderNum,
      cust.id,
      cust.name,
      subtotal,
      0,
      'amount',
      taxTotal,
      total,
      b.mode,
      b.mode === 'DUE' ? 'PARTIAL' : 'COMPLETED',
      b.mode === 'CASH' ? total + 100 : total,
      b.mode === 'CASH' ? 100 : 0,
      'Initial sample bill',
      orderDate.toISOString()
    );

    for (const item of b.items) {
      insertOrderItem.run(
        orderRes.lastInsertRowid,
        item.prod.id,
        item.prod.name,
        item.prod.barcode,
        item.prod.selling_price,
        item.prod.mrp,
        item.qty,
        item.prod.unit,
        0,
        item.prod.tax_percent,
        item.prod.selling_price * item.qty
      );
    }
  }

  console.log('Seed completed successfully!');
}

module.exports = seedInitialData;
