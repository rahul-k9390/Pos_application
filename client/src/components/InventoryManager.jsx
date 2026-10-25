import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Barcode, 
  AlertTriangle, 
  Printer, 
  Check, 
  X,
  TrendingUp,
  Tag,
  Truck,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function InventoryManager({
  products = [],
  categories = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenInwardModal,
  userRole = 'cashier',
  onUnlockOwner,
  currency = '₹'
}) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    hsn_code: '',
    category_id: '',
    cost_price: '',
    mrp: '',
    selling_price: '',
    stock_qty: '',
    min_stock_alert: '5',
    unit: 'pcs',
    tax_percent: '0'
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000), // prefill random EAN-13 style
      hsn_code: '2106',
      category_id: categories.length > 0 ? categories[0].id : '',
      cost_price: '',
      mrp: '',
      selling_price: '',
      stock_qty: '10',
      min_stock_alert: '5',
      unit: 'pack',
      tax_percent: '5'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      hsn_code: p.hsn_code || '',
      category_id: p.category_id || '',
      cost_price: p.cost_price,
      mrp: p.mrp,
      selling_price: p.selling_price,
      stock_qty: p.stock_qty,
      min_stock_alert: p.min_stock_alert,
      unit: p.unit || 'pcs',
      tax_percent: p.tax_percent || '0'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.selling_price) {
      alert('Please fill product name and selling price.');
      return;
    }

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, formData);
    } else {
      await onAddProduct(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (p) => {
    if (userRole !== 'owner') {
      alert('Deleting products requires Owner Mode! Please unlock with Owner PIN.');
      if (onUnlockOwner) onUnlockOwner();
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${p.name}"?`)) {
      onDeleteProduct(p.id);
    }
  };

  // Filtered Products
  const filtered = products.filter(p => {
    const matchesCat = selectedCat === 'ALL' || p.category_id === Number(selectedCat);
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)) || (p.hsn_code && p.hsn_code.includes(q));
    const matchesLowStock = !showLowStockOnly || (p.stock_qty <= p.min_stock_alert);
    return matchesCat && matchesSearch && matchesLowStock;
  });

  // Calculate profit margin in form
  const cost = parseFloat(formData.cost_price) || 0;
  const selling = parseFloat(formData.selling_price) || 0;
  const profit = selling - cost;
  const profitMargin = selling > 0 ? ((profit / selling) * 100).toFixed(1) : 0;

  return (
    <div className="inventory-page-wrapper">
      {/* Top Header & Actions */}
      <div className="section-header-bar">
        <div>
          <h2>Product Inventory & Stock Inward</h2>
          <p className="text-muted">Manage retail catalog, GST HSN codes, wholesale stock inward, and pricing</p>
        </div>
        <div className="flex gap-2">
          {/* Stock Inward Button */}
          <button 
            className="btn btn-secondary" 
            onClick={onOpenInwardModal}
            title="Inward incoming stock from distributor"
          >
            <Truck size={18} />
            <span>+ Stock Inward (Wholesaler)</span>
          </button>

          <button id="btn-add-product" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Role Protection Banner */}
      {userRole === 'cashier' ? (
        <div className="alert-box alert-warning text-xs p-3 rounded-lg mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber flex-shrink-0" />
            <span>
              <strong>Cashier Mode Active:</strong> Wholesale cost prices and profit margins are locked and hidden.
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onUnlockOwner}
          >
            Unlock Owner Mode (Enter PIN)
          </button>
        </div>
      ) : (
        <div className="alert-box alert-success text-xs p-2.5 rounded-lg mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald flex-shrink-0" />
            <span>
              <strong>Owner Mode Unlocked:</strong> Viewing all wholesale cost prices, margins, and purchase details.
            </span>
          </div>
          <span className="badge badge-success">Admin Verified</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="inventory-filters-card">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by product name, barcode, HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select cat-select"
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
        >
          <option value="ALL">All Categories ({products.length})</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          className={`filter-pill-btn ${showLowStockOnly ? 'active text-amber' : ''}`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <AlertTriangle size={16} />
          <span>Low Stock Only ({products.filter(p => p.stock_qty <= p.min_stock_alert).length})</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-responsive-card">
        <table className="pos-table">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Product Name</th>
              <th className="text-center">HSN Code</th>
              <th>Category</th>
              {userRole === 'owner' && <th className="text-right">Cost Price</th>}
              <th className="text-right">MRP</th>
              <th className="text-right">Selling Price</th>
              {userRole === 'owner' && <th className="text-right">Profit Margin</th>}
              <th className="text-center">Stock</th>
              <th className="text-center">GST %</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'owner' ? 11 : 9} className="text-center py-8 text-muted">
                  No products found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const isLow = p.stock_qty <= p.min_stock_alert;
                const isOut = p.stock_qty <= 0;
                const pProfit = p.selling_price - (p.cost_price || 0);
                const pMargin = p.selling_price > 0 ? ((pProfit / p.selling_price) * 100).toFixed(0) : 0;

                return (
                  <tr key={p.id}>
                    <td>
                      <span className="mono font-semibold barcode-cell">{p.barcode || '—'}</span>
                    </td>
                    <td>
                      <strong className="product-cell-name">{p.name}</strong>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-neutral mono text-xs font-semibold">
                        {p.hsn_code || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.category_name || 'General'}</span>
                    </td>
                    {userRole === 'owner' && (
                      <td className="text-right mono text-dim">{currency}{p.cost_price}</td>
                    )}
                    <td className="text-right mono line-through text-dim">{currency}{p.mrp}</td>
                    <td className="text-right mono font-bold text-emerald">{currency}{p.selling_price}</td>
                    {userRole === 'owner' && (
                      <td className="text-right mono text-xs font-bold text-emerald">
                        +{currency}{pProfit.toFixed(1)} ({pMargin}%)
                      </td>
                    )}
                    <td className="text-center">
                      <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </td>
                    <td className="text-center mono">{p.tax_percent}%</td>
                    <td className="text-right actions-cell">
                      <button
                        className="btn-icon-subtle"
                        title="Print Barcode Sticker"
                        onClick={() => setBarcodeLabelProduct(p)}
                      >
                        <Barcode size={16} />
                      </button>
                      <button
                        className="btn-icon-subtle"
                        title="Edit Product"
                        onClick={() => openEditModal(p)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon-subtle text-danger"
                        title="Delete Product"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- ADD / EDIT PRODUCT MODAL ---------------- */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Product Details' : 'Add New Retail Product'}
              </h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
              <div className="form-group">
                <label className="field-label">Product Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. India Gate Basmati Rice 1kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label">Barcode (Scan or Auto) *</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="input mono"
                      placeholder="e.g. 8901234567890"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setFormData({
                        ...formData,
                        barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000)
                      })}
                      title="Generate new barcode"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="field-label">Category</label>
                  <select
                    className="select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="form-row-3">
                <div className="form-group">
                  <label className="field-label">
                    Cost Price ({currency}) {userRole === 'cashier' ? '(Protected)' : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input mono"
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    disabled={userRole === 'cashier'}
                    title={userRole === 'cashier' ? 'Unlock Owner Mode to edit cost price' : ''}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">MRP ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input mono"
                    placeholder="0"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Selling Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input mono font-bold text-emerald"
                    placeholder="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>
              </div>

              {/* Profit calculation banner */}
              {userRole === 'owner' && selling > 0 && cost > 0 && (
                <div className="profit-preview-banner">
                  <TrendingUp size={16} />
                  <span>
                    Gross Profit: <strong>{currency}{profit.toFixed(2)}</strong> ({profitMargin}% margin)
                  </span>
                </div>
              )}

              {/* Stock and Unit */}
              <div className="form-row-3">
                <div className="form-group">
                  <label className="field-label">Current Stock Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input mono"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Min Alert Level</label>
                  <input
                    type="number"
                    className="input mono"
                    value={formData.min_stock_alert}
                    onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Unit Type</label>
                  <select
                    className="select"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="pack">pack</option>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="gm">gm</option>
                    <option value="litre">litre</option>
                    <option value="pouch">pouch</option>
                    <option value="box">box</option>
                    <option value="bottle">bottle</option>
                    <option value="tin">tin</option>
                  </select>
                </div>
              </div>

              {/* HSN Code & GST Tax */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label font-semibold">GST HSN Code</label>
                  <input
                    type="text"
                    className="input mono font-semibold"
                    placeholder="e.g. 1101, 1006, 1902"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                  />
                  <span className="text-xs text-muted block mt-1">4 or 6-digit GST code for invoice</span>
                </div>

                <div className="form-group">
                  <label className="field-label font-semibold">GST Tax Rate</label>
                  <select
                    className="select"
                    value={formData.tax_percent}
                    onChange={(e) => setFormData({ ...formData, tax_percent: e.target.value })}
                  >
                    <option value="0">0% (Exempted / Food grains)</option>
                    <option value="5">5% (Edible oils, tea, spices)</option>
                    <option value="12">12% (Processed foods, ghee)</option>
                    <option value="18">18% (Personal care, soaps)</option>
                    <option value="28">28% (Luxury / Aerated)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer pt-3">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- BARCODE LABEL STICKER MODAL ---------------- */}
      {barcodeLabelProduct && (
        <div className="modal-backdrop" onClick={() => setBarcodeLabelProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Print Barcode Sticker Label</h3>
              <button className="btn-close-modal" onClick={() => setBarcodeLabelProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="barcode-sticker-card mb-4" id="printable-barcode-sticker">
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 'bold' }}>
                  {barcodeLabelProduct.name}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <QRCodeSVG 
                    value={barcodeLabelProduct.barcode} 
                    size={90} 
                    level="M" 
                  />
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '2px' }}>
                  {barcodeLabelProduct.barcode}
                </div>
                {barcodeLabelProduct.hsn_code && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    HSN: {barcodeLabelProduct.hsn_code}
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '1.2rem', fontWeight: '900' }}>
                  MRP: {currency}{barcodeLabelProduct.mrp || barcodeLabelProduct.selling_price}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button className="btn btn-outline" onClick={() => setBarcodeLabelProduct(null)}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={16} />
                  <span>Print Barcode Sticker</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
