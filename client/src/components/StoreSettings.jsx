import React, { useState, useEffect } from 'react';
import { Settings, Save, Store, QrCode, Printer, CheckCircle, Shield } from 'lucide-react';

export default function StoreSettings({
  settings = {},
  onSaveSettings
}) {
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="settings-page-wrapper">
      <div className="section-header-bar">
        <div>
          <h2>Store Profile & Receipt Settings</h2>
          <p className="text-muted">Configure store identity, GSTIN, UPI QR payments, and thermal receipt formats</p>
        </div>
        <button id="btn-save-settings" className="btn btn-primary btn-lg" onClick={handleSubmit}>
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="success-banner-pill mb-4">
          <CheckCircle size={18} />
          <span>Settings saved and updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form-grid">
        {/* Card 1: Store Identity */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <span>Store Identity & Receipt Header</span>
          </h3>

          <div className="form-group">
            <label className="field-label">Store / Business Name *</label>
            <input
              type="text"
              required
              className="input font-semibold"
              value={formData.store_name || ''}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Tagline / Subtitle</label>
            <input
              type="text"
              className="input"
              value={formData.store_tagline || ''}
              onChange={(e) => setFormData({ ...formData, store_tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Full Address (Printed on Receipts)</label>
            <textarea
              className="input"
              rows="2"
              value={formData.store_address || ''}
              onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label">Phone / WhatsApp Contact</label>
              <input
                type="text"
                className="input mono"
                value={formData.store_phone || ''}
                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="field-label">Store Email</label>
              <input
                type="email"
                className="input"
                value={formData.store_email || ''}
                onChange={(e) => setFormData({ ...formData, store_email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Legal & Tax Registration */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2">
            <Shield size={20} className="text-emerald" />
            <span>Tax & Legal Registrations</span>
          </h3>

          <div className="form-group">
            <label className="field-label">GSTIN Number (15 Digits)</label>
            <input
              type="text"
              className="input mono uppercase"
              placeholder="e.g. 27AABCS1429B1Z8"
              value={formData.store_gstin || ''}
              onChange={(e) => setFormData({ ...formData, store_gstin: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">FSSAI License Number (Food & Grocery)</label>
            <input
              type="text"
              className="input mono"
              placeholder="e.g. 11521018000452"
              value={formData.store_fssai || ''}
              onChange={(e) => setFormData({ ...formData, store_fssai: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Receipt Footer Note</label>
            <input
              type="text"
              className="input"
              value={formData.receipt_footer || ''}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
            />
          </div>
        </div>

        {/* Card 3: UPI QR Payments */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2">
            <QrCode size={20} className="text-cyan" />
            <span>UPI QR Code Configuration</span>
          </h3>

          <p className="text-xs text-muted">
            The POS automatically generates dynamic UPI QR codes with exact bill amounts for instant customer payments via Google Pay, PhonePe, Paytm, etc.
          </p>

          <div className="form-group">
            <label className="field-label">Store UPI ID (VPA) *</label>
            <input
              type="text"
              className="input mono"
              placeholder="e.g. 9876543210@upi or store@icici"
              value={formData.store_upi_id || ''}
              onChange={(e) => setFormData({ ...formData, store_upi_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">UPI Payee Display Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Kirana Super Mart"
              value={formData.store_upi_name || ''}
              onChange={(e) => setFormData({ ...formData, store_upi_name: e.target.value })}
            />
          </div>
        </div>

        {/* Card 4: Hardware & Display */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2">
            <Printer size={20} className="text-amber" />
            <span>Hardware & Thermal Printer</span>
          </h3>

          <div className="form-row-2">
            <div className="form-group">
              <label className="field-label">Thermal Paper Size</label>
              <select
                className="select"
                value={formData.paper_width || '80mm'}
                onChange={(e) => setFormData({ ...formData, paper_width: e.target.value })}
              >
                <option value="80mm">Standard 80mm (3-inch POS printer)</option>
                <option value="58mm">Compact 58mm (2-inch POS printer)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label">Currency Symbol</label>
              <select
                className="select"
                value={formData.currency_symbol || '₹'}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
              >
                <option value="₹">₹ (Indian Rupee - INR)</option>
                <option value="Rs.">Rs. (Rupees)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-3">
            <label className="field-label flex items-center gap-1.5 font-semibold">
              <Shield size={16} className="text-emerald" />
              <span>Owner Admin Security PIN *</span>
            </label>
            <input
              type="password"
              maxLength="6"
              className="input mono font-bold"
              placeholder="1234"
              value={formData.admin_pin || '1234'}
              onChange={(e) => setFormData({ ...formData, admin_pin: e.target.value })}
              style={{ maxWidth: 220 }}
            />
            <span className="text-xs text-muted block mt-1">
              Protects wholesale cost prices, profit margins, and settings from staff. Default is 1234.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
