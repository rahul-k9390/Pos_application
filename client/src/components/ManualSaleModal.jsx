import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  User, 
  FileText, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';

export default function ManualSaleModal({
  isOpen,
  onClose,
  onSaveManualSale,
  customers = [],
  currency = '₹',
  soundEnabled
}) {
  // Current local datetime string for input value (YYYY-MM-DDTHH:mm)
  const getNowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [saleDateTime, setSaleDateTime] = useState(getNowLocal);
  const [customerType, setCustomerType] = useState('walkin'); // 'walkin' or 'registered'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [itemDescription, setItemDescription] = useState('Manual Counter Sale');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH', 'UPI', 'CARD', 'DUE'
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid sale amount greater than 0.');
      return;
    }

    let customerId = null;
    let customerName = 'Walk-in Customer';

    if (customerType === 'registered') {
      if (!selectedCustomerId) {
        setErrorMsg('Please select a registered customer.');
        return;
      }
      const found = customers.find(c => c.id === Number(selectedCustomerId));
      if (found) {
        customerId = found.id;
        customerName = found.name;
      }
    } else if (walkinName.trim()) {
      customerName = walkinName.trim();
    }

    if (paymentMode === 'DUE' && !customerId) {
      setErrorMsg('Udhar / Due payment mode requires selecting a registered customer!');
      return;
    }

    // Convert local datetime to ISO string
    let orderCreatedAt = new Date().toISOString();
    try {
      if (saleDateTime) {
        orderCreatedAt = new Date(saleDateTime).toISOString();
      }
    } catch {
      orderCreatedAt = new Date().toISOString();
    }

    const payload = {
      order_number: customInvoiceNumber.trim() || undefined,
      customer_id: customerId,
      customer_name: customerName,
      created_at: orderCreatedAt,
      items: [
        {
          id: null,
          is_custom: true,
          product_name: itemDescription.trim() || 'Manual Sale',
          selling_price: parsedAmount,
          unit_price: parsedAmount,
          mrp: parsedAmount,
          quantity: 1,
          unit: 'sale',
          discount: 0,
          tax_percent: 0,
          total_price: parsedAmount
        }
      ],
      subtotal: parsedAmount,
      discount_amount: 0,
      discount_type: 'amount',
      tax_amount: 0,
      total_amount: parsedAmount,
      payment_mode: paymentMode,
      cash_tendered: parsedAmount,
      change_due: 0,
      notes: notes.trim() || 'Manual offline sale entry',
      cashier: 'Admin (Manual Entry)'
    };

    try {
      setIsSubmitting(true);
      await onSaveManualSale(payload);
      
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      playSuccessChime(soundEnabled);
      
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save manual sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 540 }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="brand-icon-wrapper" style={{ width: 32, height: 32 }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 className="modal-title">Record Manual Sale Entry</h3>
              <p className="text-xs text-muted">Enter manual, backdated, or offline sales directly into database</p>
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

          {/* Date & Time Picker */}
          <div className="form-group">
            <label className="field-label flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar size={15} className="text-primary" />
                <span>Sale Date & Time *</span>
              </span>
              <span className="text-xs text-muted">(Change for past / backdated sale)</span>
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={saleDateTime}
              onChange={(e) => setSaleDateTime(e.target.value)}
              required
            />
          </div>

          {/* Amount & Description Row */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label font-semibold">
                Sale Total Amount ({currency}) *
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix font-bold">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input font-bold mono text-lg"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="field-label font-semibold">
                Payment Mode *
              </label>
              <select
                className="form-input font-semibold"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="CASH">💵 Cash</option>
                <option value="UPI">📱 UPI QR / Online</option>
                <option value="CARD">💳 Card / Swipe</option>
                <option value="DUE">📖 Udhar (Khata Book)</option>
              </select>
            </div>
          </div>

          {/* Item Description */}
          <div className="form-group">
            <label className="field-label font-semibold flex items-center gap-1">
              <Tag size={14} className="text-primary" />
              <span>Bill / Item Description</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Monthly Grocery Ration, Counter Cash, Mixed Items"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
          </div>

          {/* Customer Selection */}
          <div className="form-group">
            <label className="field-label font-semibold flex items-center gap-1">
              <User size={14} className="text-primary" />
              <span>Customer</span>
            </label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  checked={customerType === 'walkin'}
                  onChange={() => setCustomerType('walkin')}
                />
                <span>Walk-in Customer</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  checked={customerType === 'registered'}
                  onChange={() => setCustomerType('registered')}
                />
                <span>Registered Khata Customer</span>
              </label>
            </div>

            {customerType === 'walkin' ? (
              <input
                type="text"
                className="form-input"
                placeholder="Walk-in Customer Name (Optional)"
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
              />
            ) : (
              <select
                className="form-input font-semibold"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                <option value="">-- Select Registered Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || 'No phone'}) - Current Due: {currency}{c.outstanding_balance}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional Bill # and Reference Note */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label text-xs">
                Custom Invoice # (Optional)
              </label>
              <input
                type="text"
                className="form-input mono text-sm"
                placeholder="Auto (INV-...)"
                value={customInvoiceNumber}
                onChange={(e) => setCustomInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="field-label text-xs">
                Register Note / Reference (Optional)
              </label>
              <input
                type="text"
                className="form-input text-sm"
                placeholder="e.g. Diary page 14"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer pt-3 flex justify-end gap-3">
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
              disabled={isSubmitting}
              style={{ minWidth: 150 }}
            >
              <CheckCircle size={17} />
              <span>{isSubmitting ? 'Saving Sale...' : 'Save Manual Sale'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
