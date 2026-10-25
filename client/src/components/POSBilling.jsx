import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  UserPlus, 
  PauseCircle, 
  CreditCard, 
  Percent, 
  CheckCircle, 
  AlertCircle,
  Tag,
  Sparkles,
  ShoppingBag,
  FileText,
  PlusCircle,
  X
} from 'lucide-react';
import { playBeep } from '../utils/audio';

export default function POSBilling({
  products = [],
  categories = [],
  customers = [],
  cart,
  setCart,
  selectedCustomer,
  setSelectedCustomer,
  onOpenCheckout,
  onHoldCart,
  onOpenNewCustomerModal,
  onOpenManualSaleModal,
  soundEnabled,
  currency = '₹'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
  const [discountVal, setDiscountVal] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFlash, setBarcodeFlash] = useState(false);
  const barcodeInputRef = useRef(null);

  // Manual / Loose Item Quick Form Modal state
  const [isManualItemModalOpen, setIsManualItemModalOpen] = useState(false);
  const [manualItemForm, setManualItemForm] = useState({
    name: '',
    price: '',
    qty: '1',
    unit: 'pcs',
    tax: '0'
  });

  // Auto-focus barcode input on load & click
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category_id === Number(selectedCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Handle direct barcode scanner submission (Enter key)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Search exact barcode match first, then name
    const found = products.find(p => p.barcode === code) || 
                  products.find(p => p.name.toLowerCase().includes(code.toLowerCase()));

    if (found) {
      addToCart(found);
      setBarcodeFlash(true);
      setTimeout(() => setBarcodeFlash(false), 500);
      setBarcodeInput('');
    } else {
      if (window.confirm(`Item with barcode/name "${code}" not found. Would you like to add it as a Manual / Custom item?`)) {
        setManualItemForm(prev => ({ ...prev, name: code, price: '' }));
        setIsManualItemModalOpen(true);
      }
      setBarcodeInput('');
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    playBeep(soundEnabled);
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.selling_price }
            : item
        );
      } else {
        return [
          ...prevCart, 
          {
            ...product,
            quantity: 1,
            unit_price: product.selling_price,
            total_price: product.selling_price
          }
        ];
      }
    });
  };

  // Add custom manual item directly to cart
  const handleAddManualItem = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(manualItemForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    const qtyNum = Math.max(0.1, parseFloat(manualItemForm.qty) || 1);
    const manualProduct = {
      id: `custom_${Date.now()}`,
      name: manualItemForm.name.trim() || 'Custom Item',
      barcode: '',
      selling_price: priceNum,
      unit_price: priceNum,
      mrp: priceNum,
      quantity: qtyNum,
      unit: manualItemForm.unit || 'pcs',
      tax_percent: parseFloat(manualItemForm.tax) || 0,
      total_price: priceNum * qtyNum,
      is_custom: true
    };

    playBeep(soundEnabled);
    setCart(prev => [...prev, manualProduct]);
    setManualItemForm({ name: '', price: '', qty: '1', unit: 'pcs', tax: '0' });
    setIsManualItemModalOpen(false);
  };

  // Update item quantity
  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 
              ? { ...item, quantity: newQty, total_price: newQty * item.selling_price }
              : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Set quantity directly
  const setQuantityDirect = (productId, value) => {
    const qty = Math.max(0.1, parseFloat(value) || 1);
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: qty, total_price: qty * item.selling_price }
          : item
      )
    );
  };

  // Update item rate/price directly in the cart
  const updateItemPrice = (productId, newPrice) => {
    const price = Math.max(0, parseFloat(newPrice) || 0);
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, selling_price: price, unit_price: price, total_price: price * item.quantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the current bill?')) {
      setCart([]);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  
  // Savings from MRP
  const mrpTotal = cart.reduce((sum, item) => sum + ((item.mrp || item.selling_price) * item.quantity), 0);
  const mrpSavings = Math.max(0, mrpTotal - subtotal);

  // Calculate Discount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * (parseFloat(discountVal) || 0)) / 100;
  } else {
    discountAmount = Math.min(subtotal, parseFloat(discountVal) || 0);
  }

  // Calculate GST Tax
  const taxAmount = cart.reduce((sum, item) => {
    const itemSub = item.selling_price * item.quantity;
    const rate = item.tax_percent || 0;
    return sum + ((itemSub * rate) / 100);
  }, 0);

  const grandTotal = Math.max(0, Math.round(subtotal - discountAmount + taxAmount));
  const totalSavings = mrpSavings + discountAmount;

  return (
    <div className="pos-layout">
      {/* ---------------- LEFT PANEL: CATALOG & SCANNER ---------------- */}
      <section className="catalog-panel">
        {/* Top Scanner, Search & Quick Manual Actions */}
        <div className="catalog-header-bar">
          <form 
            onSubmit={handleBarcodeSubmit} 
            className={`barcode-input-wrapper ${barcodeFlash ? 'flash-success' : ''}`}
          >
            <Barcode className="barcode-icon" size={20} />
            <input
              ref={barcodeInputRef}
              type="text"
              id="barcode-scanner-input"
              className="barcode-input"
              placeholder="Scan Barcode / Enter (F2)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
            />
            <span className="scanner-badge">GUN READY</span>
          </form>

          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              id="search-products-input"
              className="search-input"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {/* Quick Manual / Custom Item Button */}
          <button
            type="button"
            className="btn-manual-quick"
            onClick={() => setIsManualItemModalOpen(true)}
            title="Add unlisted or loose item with custom price"
          >
            <Plus size={16} />
            <span>+ Manual Item</span>
          </button>

          {/* Direct Manual Sale / Past Bill Logging */}
          <button
            type="button"
            className="btn-manual-sale"
            onClick={onOpenManualSaleModal}
            title="Directly enter offline or past sales record"
          >
            <FileText size={16} />
            <span>Record Past Sale</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills-bar">
          <button
            className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Items ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-pill ${selectedCategory === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategory(String(cat.id))}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="products-grid-scroll">
          {filteredProducts.length === 0 ? (
            <div className="no-products-state">
              <ShoppingBag size={48} className="text-dim mb-3" />
              <h3>No products found</h3>
              <p>Try a different keyword or add it manually using the button above</p>
              <button 
                className="btn btn-primary btn-sm mt-3"
                onClick={() => {
                  setManualItemForm(prev => ({ ...prev, name: searchQuery }));
                  setIsManualItemModalOpen(true);
                }}
              >
                + Add "{searchQuery || 'Custom Item'}" as Manual Item
              </button>
            </div>
          ) : (
            <div className="product-cards-grid">
              {filteredProducts.map(p => {
                const isLowStock = p.stock_qty <= p.min_stock_alert;
                const savings = p.mrp > p.selling_price ? (p.mrp - p.selling_price) : 0;

                return (
                  <div
                    key={p.id}
                    className="product-grid-card"
                    onClick={() => addToCart(p)}
                  >
                    {savings > 0 && (
                      <span className="savings-badge">
                        SAVE {currency}{savings}
                      </span>
                    )}

                    <div className="card-top">
                      <span className="product-category-tag">{p.category_name || 'General'}</span>
                      <span className={`stock-indicator ${isLowStock ? 'stock-low' : 'stock-ok'}`}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </div>

                    <h4 className="product-name" title={p.name}>{p.name}</h4>
                    <span className="product-barcode mono">{p.barcode}</span>

                    <div className="card-bottom">
                      <div className="price-block">
                        <span className="selling-price mono">{currency}{p.selling_price}</span>
                        {p.mrp > p.selling_price && (
                          <span className="mrp-price mono">{currency}{p.mrp}</span>
                        )}
                      </div>
                      <button className="add-quick-btn" title="Add to Bill">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- RIGHT PANEL: CART & REGISTER ---------------- */}
      <aside className="register-panel">
        {/* Customer Header */}
        <div className="register-customer-bar">
          <div className="customer-select-block">
            <User size={18} className="customer-icon" />
            <select
              id="customer-select"
              className="customer-dropdown"
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedCustomer(null);
                } else {
                  const cust = customers.find(c => c.id === Number(val));
                  setSelectedCustomer(cust || null);
                }
              }}
            >
              <option value="">Walk-in Customer (Counter)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No phone'}) - Due: {currency}{c.outstanding_balance}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-add-customer"
            onClick={onOpenNewCustomerModal}
            title="Register New Customer"
          >
            <UserPlus size={16} />
          </button>
        </div>

        {/* Selected Customer Info Ribbon */}
        {selectedCustomer && (
          <div className="customer-info-ribbon">
            <span>Customer: <strong>{selectedCustomer.name}</strong></span>
            {selectedCustomer.outstanding_balance > 0 ? (
              <span className="badge badge-danger">
                Khata Due: {currency}{selectedCustomer.outstanding_balance}
              </span>
            ) : (
              <span className="badge badge-success">Khata Clear</span>
            )}
            <span className="badge badge-primary">
              ⭐ {selectedCustomer.loyalty_points || 0} pts
            </span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={54} className="text-dim mb-2" />
              <h4>Cart is Empty</h4>
              <p>Scan a barcode, click items, or click <strong>+ Manual Item</strong></p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <div className="item-main-info">
                    <div className="flex items-center gap-1.5">
                      <span className="item-title">{item.name}</span>
                      {item.is_custom && (
                        <span className="badge badge-warning" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                          Manual
                        </span>
                      )}
                    </div>
                    {/* Inline Editable Rate */}
                    <div className="item-sub-meta mono flex items-center gap-1 mt-1">
                      <span>Rate: {currency}</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="inline-rate-input mono"
                        value={item.selling_price}
                        onChange={(e) => updateItemPrice(item.id, e.target.value)}
                        title="Click to manually edit selling rate"
                      />
                      <span>/ {item.unit || 'pcs'}</span>
                      {item.tax_percent > 0 && ` (GST ${item.tax_percent}%)`}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="item-qty-stepper">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      className="qty-number mono"
                      value={item.quantity}
                      min="0.1"
                      step="any"
                      onChange={(e) => setQuantityDirect(item.id, e.target.value)}
                    />
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="item-line-total mono font-bold">
                    {currency}{(item.selling_price * item.quantity).toFixed(2)}
                  </div>

                  {/* Delete Item */}
                  <button
                    className="item-delete-btn"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Calculation & Totals Footer */}
        <div className="register-footer">
          {/* Discount Bar */}
          <div className="discount-input-row">
            <span className="discount-label">
              <Tag size={15} /> Discount:
            </span>
            <div className="discount-controls">
              <div className="discount-type-tabs">
                <button
                  className={`disc-tab ${discountType === 'percentage' ? 'active' : ''}`}
                  onClick={() => setDiscountType('percentage')}
                >
                  %
                </button>
                <button
                  className={`disc-tab ${discountType === 'amount' ? 'active' : ''}`}
                  onClick={() => setDiscountType('amount')}
                >
                  {currency}
                </button>
              </div>
              <input
                type="number"
                min="0"
                className="disc-input mono"
                placeholder="0"
                value={discountVal || ''}
                onChange={(e) => setDiscountVal(e.target.value)}
              />
            </div>
          </div>

          {/* Breakdown Lines */}
          <div className="totals-breakdown">
            <div className="total-line">
              <span>Subtotal ({cart.reduce((c, i) => c + Number(i.quantity || 1), 0)} items):</span>
              <span className="mono">{currency}{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="total-line discount-line">
                <span>Discount applied:</span>
                <span className="mono">- {currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="total-line">
                <span>Estimated GST Tax:</span>
                <span className="mono">+ {currency}{taxAmount.toFixed(2)}</span>
              </div>
            )}

            {totalSavings > 0 && (
              <div className="total-savings-banner">
                <Sparkles size={15} />
                <span>Customer Saves: <strong>{currency}{totalSavings.toFixed(2)}</strong></span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="grand-total-display">
            <div className="grand-total-label">Payable Amount</div>
            <div className="grand-total-amount mono">
              {currency}{grandTotal}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="register-actions-grid">
            <button
              className="btn btn-secondary"
              onClick={() => onHoldCart({ cart, selectedCustomer, subtotal, discountAmount, discountType, grandTotal })}
              disabled={cart.length === 0}
              title="Park bill to serve next customer"
            >
              <PauseCircle size={16} />
              <span>Hold (F6)</span>
            </button>

            <button
              className="btn btn-outline"
              onClick={clearCart}
              disabled={cart.length === 0}
              title="Clear Cart (Esc)"
            >
              Clear
            </button>

            <button
              id="btn-checkout"
              className="btn btn-success btn-checkout-action"
              disabled={cart.length === 0}
              onClick={() => onOpenCheckout({
                items: cart,
                customer: selectedCustomer,
                subtotal,
                discount_amount: discountAmount,
                discount_type: discountType,
                tax_amount: taxAmount,
                total_amount: grandTotal,
                total_savings: totalSavings
              })}
            >
              <CreditCard size={18} />
              <span>Pay & Bill (Enter)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- QUICK MANUAL / CUSTOM ITEM MODAL ---------------- */}
      {isManualItemModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsManualItemModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 440 }}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <PlusCircle size={20} className="text-primary" />
                <h3 className="modal-title">Add Manual / Loose Item</h3>
              </div>
              <button 
                className="btn-close-modal" 
                onClick={() => setIsManualItemModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddManualItem} className="p-5 space-y-4">
              <div className="form-group">
                <label className="field-label font-semibold">Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Loose Rice, Vegetables, Milk, Service"
                  value={manualItemForm.name}
                  onChange={(e) => setManualItemForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label font-semibold">Rate / Price ({currency}) *</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input font-bold mono"
                      placeholder="0.00"
                      value={manualItemForm.price}
                      onChange={(e) => setManualItemForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label font-semibold">Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className="form-input mono"
                    value={manualItemForm.qty}
                    onChange={(e) => setManualItemForm(prev => ({ ...prev, qty: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label font-semibold">Unit</label>
                  <select
                    className="form-input"
                    value={manualItemForm.unit}
                    onChange={(e) => setManualItemForm(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gm">Gram (gm)</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="pkt">Packet (pkt)</option>
                    <option value="box">Box (box)</option>
                    <option value="meter">Meter (m)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label font-semibold">GST Tax %</label>
                  <select
                    className="form-input"
                    value={manualItemForm.tax}
                    onChange={(e) => setManualItemForm(prev => ({ ...prev, tax: e.target.value }))}
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsManualItemModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Plus size={16} />
                  <span>Add to Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
