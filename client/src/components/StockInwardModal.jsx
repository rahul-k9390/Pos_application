import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle, 
  X, 
  PackagePlus, 
  Building2, 
  Calendar,
  FileSpreadsheet
} from 'lucide-react';

export default function StockInwardModal({
  isOpen,
  onClose,
  products = [],
  onInwardSuccess,
  currency = '₹'
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick Supplier Add toggle
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [newSupForm, setNewSupForm] = useState({ name: '', phone: '', gstin: '', address: '' });

  // Inward Items list
  const [inwardItems, setInwardItems] = useState([
    { product_id: '', product_name: '', cost_price: '', quantity: '1', unit: 'pcs', hsn_code: '' }
  ]);

  // Fetch Suppliers on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/suppliers')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setSuppliers(data);
        })
        .catch(err => console.error('Error fetching suppliers:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle item product selection
  const handleSelectProduct = (index, prodId) => {
    const found = products.find(p => p.id === Number(prodId));
    setInwardItems(prev => {
      const copy = [...prev];
      if (found) {
        copy[index] = {
          ...copy[index],
          product_id: found.id,
          product_name: found.name,
          cost_price: found.cost_price || '',
          unit: found.unit || 'pcs',
          hsn_code: found.hsn_code || ''
        };
      } else {
        copy[index] = { ...copy[index], product_id: '', product_name: '' };
      }
      return copy;
    });
  };

  const handleUpdateItem = (index, field, value) => {
    setInwardItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItemRow = () => {
    setInwardItems(prev => [
      ...prev,
      { product_id: '', product_name: '', cost_price: '', quantity: '1', unit: 'pcs', hsn_code: '' }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (inwardItems.length <= 1) return;
    setInwardItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculate total inward cost
  const totalInwardAmount = inwardItems.reduce((sum, item) => {
    const cost = parseFloat(item.cost_price) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return sum + (cost * qty);
  }, 0);

  // Submit Inward Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Determine supplier
    let finalSupName = supplierName.trim();
    let finalSupId = null;

    if (isNewSupplier) {
      if (!newSupForm.name.trim()) {
        setErrorMsg('Please enter new supplier name.');
        return;
      }
      try {
        const supRes = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSupForm)
        });
        const supData = await supRes.json();
        if (supRes.ok) {
          finalSupId = supData.id;
          finalSupName = supData.name;
        }
      } catch {
        finalSupName = newSupForm.name.trim();
      }
    } else if (selectedSupplierId) {
      const found = suppliers.find(s => s.id === Number(selectedSupplierId));
      if (found) {
        finalSupId = found.id;
        finalSupName = found.name;
      }
    } else {
      finalSupName = 'General Wholesaler';
    }

    // Validate items
    const validItems = inwardItems.filter(i => (i.product_id || i.product_name) && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please select at least one valid product to inward.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: invoiceNumber.trim() || undefined,
          supplier_id: finalSupId,
          supplier_name: finalSupName,
          items: validItems,
          total_amount: totalInwardAmount,
          payment_mode: paymentMode,
          invoice_date: invoiceDate,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record stock inward');
      }

      onInwardSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error recording purchase inward');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 760 }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="brand-icon-wrapper" style={{ background: '#059669', width: 36, height: 36 }}>
              <Truck size={20} />
            </div>
            <div>
              <h3 className="modal-title">Stock Inward / Purchase Entry</h3>
              <p className="text-xs text-muted">Record incoming stock from distributor & auto-update inventory</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="alert-box alert-danger text-sm p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Supplier & Invoice Meta Grid */}
          <div className="form-row-2">
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="field-label font-semibold flex items-center gap-1">
                  <Building2 size={14} className="text-primary" />
                  <span>Supplier / Wholesaler *</span>
                </label>
                <button
                  type="button"
                  className="btn-text text-primary text-xs font-semibold"
                  onClick={() => setIsNewSupplier(!isNewSupplier)}
                >
                  {isNewSupplier ? '← Select Existing' : '+ Add New Supplier'}
                </button>
              </div>

              {isNewSupplier ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Distributor / Agency Name"
                    value={newSupForm.name}
                    onChange={(e) => setNewSupForm({ ...newSupForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="GSTIN (Optional)"
                      value={newSupForm.gstin}
                      onChange={(e) => setNewSupForm({ ...newSupForm, gstin: e.target.value })}
                    />
                    <input
                      type="tel"
                      className="form-input text-xs"
                      placeholder="Phone (Optional)"
                      value={newSupForm.phone}
                      onChange={(e) => setNewSupForm({ ...newSupForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <select
                  className="form-input font-semibold"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  <option value="">-- General / Walk-in Distributor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="field-label font-semibold">Wholesaler Bill / Invoice #</label>
              <input
                type="text"
                className="form-input mono"
                placeholder="e.g. INV-98421"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label font-semibold flex items-center gap-1">
                <Calendar size={14} className="text-primary" />
                <span>Bill Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="field-label font-semibold">Payment Mode to Supplier</label>
              <select
                className="form-input font-semibold"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="CASH">💵 Cash Paid</option>
                <option value="BANK_TRANSFER">🏦 Bank Transfer / NEFT</option>
                <option value="UPI">📱 UPI / QR</option>
                <option value="CREDIT">⏳ Credit / Supplier Due</option>
                <option value="CHEQUE">📝 Cheque</option>
              </select>
            </div>
          </div>

          {/* Inward Items Table */}
          <div className="form-group">
            <div className="flex justify-between items-center mb-2">
              <label className="field-label font-semibold flex items-center gap-1">
                <PackagePlus size={15} className="text-primary" />
                <span>Products to Inward & Restock</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItemRow}
              >
                <Plus size={14} />
                <span>Add Product Row</span>
              </button>
            </div>

            <div className="table-responsive-card border-card rounded-lg p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table className="pos-table" style={{ fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product Name</th>
                    <th style={{ width: '16%' }}>HSN Code</th>
                    <th style={{ width: '16%' }}>Cost Price ({currency})</th>
                    <th style={{ width: '14%' }} className="text-center">Qty Inward</th>
                    <th style={{ width: '14%' }} className="text-right">Total Cost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {inwardItems.map((item, idx) => {
                    const rowCost = (parseFloat(item.cost_price) || 0) * (parseFloat(item.quantity) || 0);

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            value={item.product_id}
                            onChange={(e) => handleSelectProduct(idx, e.target.value)}
                            required
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Current Stock: {p.stock_qty} {p.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input mono"
                            style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                            placeholder="HSN"
                            value={item.hsn_code}
                            onChange={(e) => handleUpdateItem(idx, 'hsn_code', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input mono"
                            style={{ padding: '4px 6px', fontSize: '0.8rem', textAlign: 'right' }}
                            placeholder="0.00"
                            value={item.cost_price}
                            onChange={(e) => handleUpdateItem(idx, 'cost_price', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            className="form-input mono text-center"
                            style={{ padding: '4px 6px', fontSize: '0.8rem' }}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td className="text-right mono font-bold text-emerald">
                          {currency}{rowCost.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn-text text-danger"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={inwardItems.length <= 1}
                            title="Remove line"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & Action Footer */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-surface border-subtle">
            <div>
              <span className="text-xs text-muted block">Total Inward Purchase Value:</span>
              <span className="text-xl font-bold mono text-emerald">{currency}{totalInwardAmount.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || totalInwardAmount <= 0}
              >
                <CheckCircle size={16} />
                <span>{isSubmitting ? 'Inwarding Stock...' : 'Save Inward & Restock'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
