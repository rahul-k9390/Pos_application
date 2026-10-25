import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, X, Package, DollarSign } from 'lucide-react';

export default function ReturnBillModal({
  isOpen,
  order,
  onClose,
  onReturnSuccess,
  currency = '₹'
}) {
  const [reason, setReason] = useState('Customer Changed Mind');
  const [customReason, setCustomReason] = useState('');
  const [returnAmount, setReturnAmount] = useState(order ? order.total_amount : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const items = order.items || [];

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalReason = reason === 'Other' ? (customReason.trim() || 'Other reason') : reason;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          return_amount: parseFloat(returnAmount) || order.total_amount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }

      onReturnSuccess(data.order);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error processing bill return');
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
            <div className="brand-icon-wrapper" style={{ background: '#ef4444', width: 34, height: 34 }}>
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="modal-title">Return & Cancel Bill (Saman Wapsi)</h3>
              <p className="text-xs text-muted">Invoice: <strong className="mono">{order.order_number}</strong></p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirmReturn} className="p-5 space-y-4">
          {errorMsg && (
            <div className="alert-box alert-danger text-sm p-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Bill Summary Banner */}
          <div className="card p-3 bg-surface border-subtle">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-muted">Customer:</span>
              <span className="font-semibold">{order.customer_name || 'Walk-in Customer'}</span>
            </div>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-muted">Payment Mode:</span>
              <span className="badge badge-neutral">{order.payment_mode}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Bill Amount:</span>
              <span className="font-bold mono text-emerald text-base">{currency}{order.total_amount}</span>
            </div>
          </div>

          {/* Items to Restock list */}
          <div className="form-group">
            <label className="field-label font-semibold flex items-center gap-1.5">
              <Package size={15} className="text-primary" />
              <span>Items Being Restocked to Inventory ({items.length})</span>
            </label>
            <div 
              className="table-responsive-card p-2 border-card rounded-lg" 
              style={{ maxHeight: 150, overflowY: 'auto' }}
            >
              <table className="pos-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold">{it.product_name}</td>
                      <td className="text-center mono text-emerald font-bold">+{it.quantity} {it.unit || 'pcs'}</td>
                      <td className="text-right mono">{currency}{it.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return Reason */}
          <div className="form-group">
            <label className="field-label font-semibold">Reason for Return / Cancellation *</label>
            <select
              className="form-input font-semibold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Customer Changed Mind">Customer Changed Mind (Grahak ne mana kiya)</option>
              <option value="Item Damaged / Expired">Item Damaged / Expired (Kharab / Date Nikla)</option>
              <option value="Wrong Item Billed">Wrong Item Billed (Galti se galat item jud gaya)</option>
              <option value="Price Dispute">Price Dispute (Rate me matbhed)</option>
              <option value="Other">Other Reason (Any reason)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          {/* Automatic Inventory & Ledger Warning Box */}
          <div className="alert-box alert-warning text-xs p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 text-amber mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">Automated Actions on Return:</strong>
              <p>1. Har item ki quantity inventory stock mein wapas jod di jayegi.</p>
              {order.payment_mode === 'DUE' && (
                <p>2. Customer ke Khata se Udhar due amount automatically cancel ho jayegi.</p>
              )}
              <p>3. Yeh invoice report mein "RETURNED" mark ho jayega.</p>
            </div>
          </div>

          <div className="modal-footer pt-3 flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
              style={{ background: '#dc2626' }}
            >
              <RotateCcw size={16} />
              <span>{isSubmitting ? 'Processing Return...' : 'Confirm Return & Restock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
