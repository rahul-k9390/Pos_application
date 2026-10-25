import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  X, 
  CheckCircle, 
  BookOpen, 
  History 
} from 'lucide-react';

export default function CustomerKhata({
  customers = [],
  onAddCustomer,
  onSettleDue,
  currency = '₹'
}) {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustForPayment, setSelectedCustForPayment] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('CASH');
  const [payNote, setPayNote] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    await onAddCustomer(formData);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setIsAddModalOpen(false);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustForPayment || !payAmount) return;

    await onSettleDue(selectedCustForPayment.id, {
      amount: parseFloat(payAmount),
      payment_mode: payMode,
      note: payNote || 'Khata Due Settlement'
    });

    setSelectedCustForPayment(null);
    setPayAmount('');
    setPayNote('');
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.outstanding_balance || 0), 0);
  const totalCustomersWithDue = customers.filter(c => c.outstanding_balance > 0).length;

  return (
    <div className="khata-page-wrapper">
      {/* Top Header */}
      <div className="section-header-bar">
        <div>
          <h2>Customers & Khata Book (उधार खाता)</h2>
          <p className="text-muted">Track customer accounts, pending credit balances, and loyalty points</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Khata Summary Cards */}
      <div className="khata-summary-cards">
        <div className="summary-stat-card border-danger">
          <div className="stat-icon-wrap bg-danger-subtle">
            <BookOpen size={24} className="text-danger" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Market Udhar (Pending Due)</span>
            <h3 className="stat-value mono text-danger">{currency}{totalOutstanding.toLocaleString()}</h3>
            <span className="stat-sub">{totalCustomersWithDue} customer(s) have pending balance</span>
          </div>
        </div>

        <div className="summary-stat-card border-primary">
          <div className="stat-icon-wrap bg-primary-subtle">
            <Users size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Registered Customers</span>
            <h3 className="stat-value mono">{customers.length}</h3>
            <span className="stat-sub">Repeat retail shoppers</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="inventory-filters-card">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Search customer by name or mobile number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customer List Table */}
      <div className="table-responsive-card">
        <table className="pos-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Address</th>
              <th className="text-center">Bills Count</th>
              <th className="text-center">Loyalty Points</th>
              <th className="text-right">Khata Due (Udhar)</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-muted">
                  No customers found. Click "Add New Customer" to register one.
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                const hasDue = c.outstanding_balance > 0;

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="customer-name-cell">
                        <strong>{c.name}</strong>
                        {c.email && <span className="text-dim text-xs">{c.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="mono text-muted flex items-center gap-1">
                        <Phone size={13} /> {c.phone || 'No phone'}
                      </span>
                    </td>
                    <td>
                      <span className="text-dim text-sm">{c.address || '—'}</span>
                    </td>
                    <td className="text-center mono">{c.order_count || 0}</td>
                    <td className="text-center">
                      <span className="badge badge-primary">
                        ⭐ {c.loyalty_points || 0} pts
                      </span>
                    </td>
                    <td className="text-right mono font-bold">
                      {hasDue ? (
                        <span className="text-danger font-bold text-base">
                          {currency}{c.outstanding_balance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-emerald text-sm">₹0 (Clear)</span>
                      )}
                    </td>
                    <td className="text-right">
                      {hasDue && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setSelectedCustForPayment(c);
                            setPayAmount(String(c.outstanding_balance));
                          }}
                        >
                          <CreditCard size={14} />
                          <span>Receive Payment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- ADD CUSTOMER MODAL ---------------- */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Register New Customer</h3>
              <button className="btn-close-modal" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
              <div className="form-group">
                <label className="field-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Mobile Number</label>
                <input
                  type="tel"
                  className="input mono"
                  placeholder="e.g. 9820123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="field-label">Address / Landmark</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Flat 301, Shivam Heights"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="modal-footer pt-4">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- SETTLE DUE PAYMENT MODAL ---------------- */}
      {selectedCustForPayment && (
        <div className="modal-backdrop" onClick={() => setSelectedCustForPayment(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">Receive Khata Due Payment</h3>
              <button className="btn-close-modal" onClick={() => setSelectedCustForPayment(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-4 space-y-4">
              <div className="settle-customer-card">
                <p>Receiving payment from <strong>{selectedCustForPayment.name}</strong></p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted">Total Pending Due:</span>
                  <span className="text-danger font-bold mono text-lg">
                    {currency}{selectedCustForPayment.outstanding_balance}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">Amount Received ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedCustForPayment.outstanding_balance}
                  className="input mono font-bold text-lg text-emerald"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="field-label">Payment Mode</label>
                <select
                  className="select"
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Card / Debit</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">Payment Note / Receipt No.</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Settle partial payment via Cash"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>

              <div className="modal-footer pt-4">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedCustForPayment(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Confirm Payment Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
