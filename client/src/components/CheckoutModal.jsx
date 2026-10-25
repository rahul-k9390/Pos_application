import React, { useState, useEffect } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  BookOpen, 
  Split, 
  CheckCircle, 
  Printer, 
  AlertTriangle 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../utils/audio';

export default function CheckoutModal({
  orderData,
  onClose,
  onCompleteSale,
  settings = {},
  currency = '₹',
  soundEnabled
}) {
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH', 'UPI', 'CARD', 'DUE', 'SPLIT'
  const [cashTendered, setCashTendered] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = orderData.total_amount || 0;

  // Default cash tendered to total
  useEffect(() => {
    if (paymentMode === 'CASH') {
      setCashTendered(String(total));
    }
  }, [paymentMode, total]);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  // Dynamic UPI string
  const upiId = settings.store_upi_id || '9876543210@upi';
  const upiName = settings.store_upi_name || 'Kirana Mart';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=Invoice Payment`;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (submitting) return;

    if (paymentMode === 'DUE' && !orderData.customer) {
      alert('Cannot create Udhar / Khata bill without a registered customer! Please select or add a customer first.');
      return;
    }

    if (paymentMode === 'CASH' && tenderedNum < total) {
      if (!window.confirm(`Cash tendered (${currency}${tenderedNum}) is less than total bill (${currency}${total}). Proceed anyway?`)) {
        return;
      }
    }

    setSubmitting(true);

    try {
      // Trigger pleasant success chime
      playSuccessChime(soundEnabled);

      // Trigger festive confetti celebration
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}

      await onCompleteSale({
        ...orderData,
        customer_id: orderData.customer ? orderData.customer.id : null,
        customer_name: orderData.customer ? orderData.customer.name : 'Walk-in Customer',
        payment_mode: paymentMode,
        cash_tendered: paymentMode === 'CASH' ? tenderedNum : total,
        change_due: paymentMode === 'CASH' ? changeDue : 0,
        notes
      });
    } catch (err) {
      alert('Error finalizing bill: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-title">Payment & Checkout</h3>
            <span className="modal-subtitle">
              Customer: <strong>{orderData.customer ? orderData.customer.name : 'Walk-in (Counter)'}</strong>
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Total Banner */}
        <div className="checkout-total-banner">
          <span className="banner-label">TOTAL PAYABLE AMOUNT</span>
          <h2 className="banner-amount mono">{currency}{total}</h2>
          {orderData.total_savings > 0 && (
            <span className="banner-savings">
              🎉 Savings applied: {currency}{orderData.total_savings.toFixed(2)}
            </span>
          )}
        </div>

        {/* Payment Mode Selector Tabs */}
        <div className="payment-modes-grid">
          <button
            type="button"
            className={`pay-mode-btn ${paymentMode === 'CASH' ? 'active' : ''}`}
            onClick={() => setPaymentMode('CASH')}
          >
            <Banknote size={20} />
            <span>Cash</span>
          </button>

          <button
            type="button"
            className={`pay-mode-btn ${paymentMode === 'UPI' ? 'active' : ''}`}
            onClick={() => setPaymentMode('UPI')}
          >
            <QrCode size={20} />
            <span>UPI / QR</span>
          </button>

          <button
            type="button"
            className={`pay-mode-btn ${paymentMode === 'CARD' ? 'active' : ''}`}
            onClick={() => setPaymentMode('CARD')}
          >
            <CreditCard size={20} />
            <span>Card / POS</span>
          </button>

          <button
            type="button"
            className={`pay-mode-btn ${paymentMode === 'DUE' ? 'active' : ''}`}
            onClick={() => setPaymentMode('DUE')}
          >
            <BookOpen size={20} />
            <span>Udhar / Khata</span>
          </button>
        </div>

        {/* Payment Details Section */}
        <div className="payment-body-section">
          {/* CASH MODE */}
          {paymentMode === 'CASH' && (
            <div className="cash-tender-block">
              <label className="field-label">Cash Received from Customer:</label>
              <div className="tender-input-wrap">
                <span className="currency-prefix mono">{currency}</span>
                <input
                  type="number"
                  className="input tender-input mono"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Cash Suggestions */}
              <div className="quick-tender-pills">
                <button 
                  type="button" 
                  className="tender-pill"
                  onClick={() => setCashTendered(String(total))}
                >
                  Exact ({currency}{total})
                </button>
                {[100, 200, 500, 1000, 2000].map(amt => {
                  if (amt >= total) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        className="tender-pill"
                        onClick={() => setCashTendered(String(amt))}
                      >
                        {currency}{amt}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Change Calculation */}
              <div className="change-due-box">
                <span className="change-label">Return Change to Customer:</span>
                <span className="change-amount mono">{currency}{changeDue.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* UPI MODE */}
          {paymentMode === 'UPI' && (
            <div className="upi-qr-block">
              <div className="upi-qr-card">
                <QRCodeSVG
                  value={upiUrl}
                  size={180}
                  level="M"
                  includeMargin={true}
                  className="upi-qr-svg"
                />
                <div className="upi-details">
                  <span className="upi-id-badge mono">{upiId}</span>
                  <p className="upi-guide">
                    Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </p>
                  <span className="upi-amt-tag mono">Amount: {currency}{total}</span>
                </div>
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {paymentMode === 'CARD' && (
            <div className="card-payment-guide">
              <CreditCard size={40} className="text-primary mb-2" />
              <h4>Card Swipe / Tap</h4>
              <p>Swipe or tap customer credit/debit card on your POS terminal for {currency}{total}.</p>
            </div>
          )}

          {/* UDHAR / KHATA MODE */}
          {paymentMode === 'DUE' && (
            <div className="khata-due-block">
              {orderData.customer ? (
                <div className="khata-customer-preview">
                  <BookOpen size={32} className="text-amber mb-2" />
                  <h4>Add to Khata (Credit Bill)</h4>
                  <p>Customer: <strong>{orderData.customer.name}</strong> ({orderData.customer.phone})</p>
                  <div className="khata-calculation">
                    <div>Previous Due: <span className="mono">{currency}{orderData.customer.outstanding_balance || 0}</span></div>
                    <div>+ This Bill: <span className="mono">{currency}{total}</span></div>
                    <hr />
                    <div className="new-due-highlight">
                      New Outstanding: <span className="mono">{currency}{(orderData.customer.outstanding_balance || 0) + total}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="khata-no-customer-warning">
                  <AlertTriangle size={36} className="text-danger mb-2" />
                  <h4>Customer Not Selected</h4>
                  <p>Udhar / Khata requires a customer account to track ledger balance. Please select or register a customer first.</p>
                </div>
              )}
            </div>
          )}

          {/* Optional Bill Note */}
          <div className="notes-row mt-3">
            <input
              type="text"
              className="input text-sm"
              placeholder="Add optional bill note or reference number..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success btn-lg btn-confirm-checkout"
            onClick={handleSubmit}
            disabled={submitting || (paymentMode === 'DUE' && !orderData.customer)}
          >
            <Printer size={18} />
            <span>{submitting ? 'Processing Bill...' : 'Complete & Print Invoice (Enter)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
