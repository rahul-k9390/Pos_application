import React from 'react';
import { X, Play, Trash2, Clock, ShoppingCart } from 'lucide-react';

export default function HeldCartsModal({
  heldCarts = [],
  onClose,
  onResumeCart,
  onDeleteHeldCart,
  currency = '₹'
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3 className="modal-title">Parked / Held Bills ({heldCarts.length})</h3>
            <span className="modal-subtitle">Resume parked bills to continue checkout</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body p-4">
          {heldCarts.length === 0 ? (
            <div className="empty-state text-center py-8">
              <ShoppingCart size={48} className="text-dim mb-2" />
              <h4>No Held Bills</h4>
              <p className="text-muted">You have no parked bills on hold.</p>
            </div>
          ) : (
            <div className="held-carts-list">
              {heldCarts.map((item) => {
                const cartData = item.cart_data || {};
                const cartItems = cartData.cart || [];
                const totalAmt = cartData.grandTotal || 0;
                const customerName = cartData.selectedCustomer ? cartData.selectedCustomer.name : 'Walk-in';

                return (
                  <div key={item.id} className="held-cart-card">
                    <div className="held-cart-top">
                      <div className="held-cart-title">
                        <strong>{item.cart_name || `Bill #${item.id}`}</strong>
                        <span className="held-time mono">
                          <Clock size={12} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="held-amount mono">{currency}{totalAmt}</span>
                    </div>

                    <div className="held-cart-details">
                      <span>Customer: <strong>{customerName}</strong></span>
                      <span>Items: <strong>{cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} pcs</strong></span>
                    </div>

                    <div className="held-cart-actions">
                      <button
                        className="btn btn-outline btn-sm text-danger"
                        onClick={() => onDeleteHeldCart(item.id)}
                        title="Discard held bill"
                      >
                        <Trash2 size={14} />
                        <span>Discard</span>
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onResumeCart(item)}
                      >
                        <Play size={14} />
                        <span>Resume Checkout</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
