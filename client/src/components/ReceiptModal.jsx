import React, { useRef } from 'react';
import { Printer, X, Check, ShoppingBag, ArrowRight, RotateCcw, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function ReceiptModal({
  order,
  settings = {},
  onClose,
  onNewSale,
  onOpenReturnModal,
  currency = '₹'
}) {
  const receiptRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = settings.store_name || 'Apex Kirana Super Mart';
  const storeTagline = settings.store_tagline || 'Daily Groceries & Essentials';
  const storeAddress = settings.store_address || 'Shop #4, Commercial Hub, Main Road';
  const storePhone = settings.store_phone || '+91 98765 43210';
  const storeGstin = settings.store_gstin || '27AABCS1429B1Z8';
  const storeFssai = settings.store_fssai || '11521018000452';
  const receiptFooter = settings.receipt_footer || 'Thank you for your visit! Goods once sold can be exchanged within 3 days.';

  const formattedDate = order.created_at 
    ? new Date(order.created_at).toLocaleString() 
    : new Date().toLocaleString();

  const isReturned = order.payment_status === 'RETURNED' || order.payment_status === 'CANCELLED';

  return (
    <div className="modal-backdrop receipt-modal-backdrop" onClick={onClose}>
      <div className="modal-content receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Actions */}
        <div className="receipt-actions-top no-print">
          <div className="success-badge-top">
            {isReturned ? (
              <>
                <RotateCcw size={18} className="text-danger" />
                <span className="text-danger font-bold">Bill Returned / Refunded</span>
              </>
            ) : (
              <>
                <Check size={18} className="text-emerald" />
                <span>Tax Invoice Preview</span>
              </>
            )}
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ---------------- THERMAL RECEIPT CONTAINER ---------------- */}
        <div className="receipt-paper-wrapper">
          <div ref={receiptRef} className="receipt-paper receipt-printable">
            {/* Store Header */}
            <div className="receipt-header text-center">
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }} className="mono">
                *** RETAIL GST TAX INVOICE ***
              </div>
              <h2 className="receipt-store-name">{storeName}</h2>
              <div className="receipt-store-sub">{storeTagline}</div>
              <div className="receipt-store-address">{storeAddress}</div>
              <div className="receipt-store-contact">Ph: {storePhone}</div>
              {storeGstin && <div className="receipt-gstin mono">GSTIN: {storeGstin}</div>}
              {storeFssai && <div className="receipt-fssai mono">FSSAI: {storeFssai}</div>}
            </div>

            {isReturned && (
              <div style={{ border: '2px dashed #ef4444', padding: '6px', margin: '8px 0', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }} className="mono">
                *** BILL RETURNED & RESTOCKED ***
                {order.return_reason && <div style={{ fontSize: '0.75rem' }}>Reason: {order.return_reason}</div>}
              </div>
            )}

            <div className="receipt-divider-dashed"></div>

            {/* Bill Info */}
            <div className="receipt-meta mono">
              <div className="receipt-meta-row">
                <span>INVOICE: <strong>{order.order_number}</strong></span>
                <span>{order.payment_mode}</span>
              </div>
              <div className="receipt-meta-row">
                <span>DATE: {formattedDate}</span>
              </div>
              <div className="receipt-meta-row">
                <span>CASHIER: {order.cashier || 'Admin'}</span>
              </div>
              {order.customer_name && (
                <div className="receipt-meta-row">
                  <span>CUSTOMER: {order.customer_name}</span>
                </div>
              )}
            </div>

            <div className="receipt-divider-solid"></div>

            {/* Items Table with HSN Code Column */}
            <table className="receipt-items-table mono">
              <thead>
                <tr>
                  <th className="text-left">ITEM</th>
                  <th className="text-center">HSN</th>
                  <th className="text-center">QTY</th>
                  <th className="text-right">PRICE</th>
                  <th className="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="item-name-cell">
                      {item.product_name || item.name}
                    </td>
                    <td className="text-center" style={{ fontSize: '0.75rem' }}>
                      {item.hsn_code || '—'}
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{item.unit_price || item.selling_price}</td>
                    <td className="text-right">{(item.total_price || (item.selling_price * item.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-divider-solid"></div>

            {/* Calculation Summary */}
            <div className="receipt-totals mono">
              <div className="receipt-total-row">
                <span>Subtotal:</span>
                <span>{currency}{order.subtotal ? order.subtotal.toFixed(2) : order.total_amount.toFixed(2)}</span>
              </div>

              {order.discount_amount > 0 && (
                <div className="receipt-total-row">
                  <span>Discount:</span>
                  <span>- {currency}{order.discount_amount.toFixed(2)}</span>
                </div>
              )}

              {order.tax_amount > 0 && (
                <div className="receipt-total-row">
                  <span>Estimated GST:</span>
                  <span>+ {currency}{order.tax_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="receipt-divider-dashed"></div>

              <div className="receipt-grand-total">
                <span>GRAND TOTAL:</span>
                <span className="grand-val">{currency}{order.total_amount}</span>
              </div>

              {order.payment_mode === 'CASH' && order.cash_tendered > 0 && (
                <>
                  <div className="receipt-total-row">
                    <span>Cash Tendered:</span>
                    <span>{currency}{order.cash_tendered}</span>
                  </div>
                  <div className="receipt-total-row">
                    <span>Change Due:</span>
                    <span>{currency}{order.change_due ? order.change_due.toFixed(2) : '0.00'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Savings Banner */}
            {order.total_savings > 0 && (
              <div className="receipt-savings-banner text-center mono">
                *** YOU SAVED {currency}{order.total_savings.toFixed(2)} ***
              </div>
            )}

            <div className="receipt-divider-dashed"></div>

            {/* QR Code / Barcode for digital bill verify */}
            <div className="receipt-qr-center text-center">
              <QRCodeSVG
                value={`https://verify.bill?inv=${order.order_number}&amt=${order.total_amount}`}
                size={80}
                level="L"
              />
              <div className="receipt-barcode-text mono">{order.order_number}</div>
            </div>

            {/* Footer Message */}
            <div className="receipt-footer-msg text-center">
              <p>{receiptFooter}</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="receipt-bottom-actions no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          
          {/* Return / Cancel Bill Action */}
          {!isReturned && onOpenReturnModal && (
            <button 
              className="btn btn-outline text-danger border-rose"
              onClick={() => onOpenReturnModal(order)}
              title="Return items from this bill"
            >
              <RotateCcw size={16} />
              <span>Return / Cancel Bill</span>
            </button>
          )}

          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Print Thermal (80mm)</span>
          </button>

          {onNewSale && (
            <button className="btn btn-success" onClick={onNewSale}>
              <span>New Sale</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
