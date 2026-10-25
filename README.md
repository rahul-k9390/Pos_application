# Kirana & Retail POS System (Point of Sale) 🛒⚡

A modern, fast, full-stack Point of Sale (POS) and inventory management system designed for **Retail, Kirana, Supermarkets, and General Stores**.

Built with **React + Vite** on the frontend, **Node.js + Express** on the backend, and **SQLite (`better-sqlite3`)** for fast, reliable, persistent local storage.

---

## 🚀 Quick Start

### 1. Run Everything with One Command
To start both the Backend API server (`port 5000`) and the Frontend Client (`port 3000`):

```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠 Other Run Scripts

- **Run Backend Only**: `npm run server` (runs on `http://localhost:5000`)
- **Run Frontend Only**: `npm run client` (runs on `http://localhost:3000`)
- **Build for Production**: `cd client && npm run build`

---

## 🌟 Key Features

### 1. ⚡ Superfast POS Billing Register (`F1`)
- **Barcode Gun Ready**: Auto-focused barcode input. Scan with any standard USB/Bluetooth barcode scanner gun or type and press `Enter` for instant cart addition.
- **Category Filter Pills**: Filter items instantly by *Grains & Pulses, Oils & Ghee, Dairy & Breakfast, Snacks, Beverages, Spices, Personal Care*.
- **Live Cart Stepper**: Adjust quantities, remove items, or clear cart with single-click actions.
- **Discount & GST Tax Calculations**: Apply percentage (%) or flat amount (₹) discounts with real-time tax breakdowns.
- **Customer Savings Banner**: Highlights total customer savings calculated against MRP.
- **Park / Hold Bills (`F6`)**: Park an ongoing bill when a customer steps aside to pick another item, and resume it anytime.

### 2. 💳 Multi-Mode Payment & Dynamic UPI QR Code
- 💵 **Cash Payment**: Automatic change-due calculator with quick cash tender buttons (Exact, +₹100, +₹500, +₹1000).
- 📱 **Dynamic UPI QR Code**: Live UPI QR generated on screen using store UPI ID (`upi://pay?pa=...&am=...`) ready for instant scanning via PhonePe, Google Pay, Paytm, or BHIM.
- 💳 **Card / POS Terminal**: For card swipe & tap payments.
- 📖 **Udhar / Khata Book**: Bill directly on credit for registered customers with automatic balance updates.

### 3. 🖨️ Thermal Receipt Printing (80mm & 58mm POS)
- Realistic thermal receipt format with store branding, GSTIN, FSSAI license, invoice number, itemized rates, savings banner, and verification QR code.
- Uses native browser `@media print` for high-resolution thermal paper output.

### 4. 📦 Product Inventory & Barcode Generator (`F2`)
- Add, edit, and delete products with cost price, selling price, and MRP.
- **Real-Time Profit Margin**: Auto-calculates gross profit in ₹ and margin percentage.
- **Low Stock Alerts**: Visual badges and filtering for items nearing reorder levels.
- **Print Barcode Labels**: Generate printable barcode sticker labels for loose goods (sugar, grains, dry fruits).

### 5. 👥 Customer Accounts & Khata Book (`F3`)
- Maintain customer database with phone numbers, loyalty points, and purchase history.
- **Market Udhar Tracker**: View all pending credit accounts with quick settlement ("Receive Payment") modal.

### 6. 📊 Sales Analytics & Day-End Register / Z-Report (`F4`)
- Real-time KPIs: Today's revenue, total bills, average order value (AOV), and total tax collected.
- Payment mode distribution bars (Cash vs UPI vs Card vs Due).
- Top 6 best-selling products leaderboard.
- One-click **Print Daily Z-Report** for store closing.

### 7. ⚙️ Store Profile & Settings
- Configure store name, tagline, address, phone number, GSTIN, and FSSAI number.
- Configure UPI Payee ID and Display Name for QR payments.
- Toggle between **Dark Mode** and **Light Mode**.
- Audio cues toggle (retail scanner beep & success chime).

---

## ⌨️ Keyboard Hotkeys Reference

| Key | Action |
| :--- | :--- |
| **`F1`** | Switch to POS Billing Register |
| **`F2`** | Switch to Products & Inventory Stock |
| **`F3`** | Switch to Customer Khata Book |
| **`F4`** | Switch to Sales Reports & Analytics |
| **`F6`** | Park / Hold Active Bill |
| **`Enter`** | Proceed to Pay & Bill / Confirm Payment |
| **`Esc`** | Close Open Modal / Cancel |

---

## 📂 Project Architecture

```
Pos_application/
├── server/
│   ├── db.js             # SQLite database setup (WAL mode, schemas, foreign keys)
│   ├── pos.sqlite        # SQLite persistent database file
│   ├── seedData.js       # Indian Kirana grocery catalog & sample data
│   └── server.js         # Express REST API endpoints
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App navbar, clock, held count & toggles
│   │   │   ├── POSBilling.jsx       # Main billing screen with barcode scanner
│   │   │   ├── CheckoutModal.jsx    # Cash, UPI QR, Card & Khata checkout
│   │   │   ├── ReceiptModal.jsx     # 80mm thermal receipt preview & print
│   │   │   ├── HeldCartsModal.jsx   # Parked bills recall & discard
│   │   │   ├── InventoryManager.jsx # Product stock, margin & barcode stickers
│   │   │   ├── CustomerKhata.jsx    # Customer ledger & Udhar due collection
│   │   │   ├── ReportsDashboard.jsx # Sales KPIs, payment breakdown & Z-report
│   │   │   └── StoreSettings.jsx    # Store details, GSTIN, UPI & printer settings
│   │   ├── utils/
│   │   │   └── audio.js             # Web Audio API scanner beeps & chimes
│   │   ├── App.jsx                  # Root state orchestration & hotkeys
│   │   ├── App.css                  # UI styling, layouts & thermal paper styles
│   │   └── index.css                # CSS variables design system (Dark/Light)
│   ├── vite.config.js               # Vite config with /api proxy
│   └── package.json                 # Frontend dependencies (lucide, qrcode, etc.)
├── package.json                     # Root scripts (npm run dev, concurrently)
└── README.md                        # Documentation & setup guide
```
