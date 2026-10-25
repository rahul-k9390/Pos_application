import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';

export default function PinModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setErrorMsg('');
    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
        setPin('');
      } else {
        setErrorMsg(data.error || 'Incorrect Admin PIN. Default is 1234.');
      }
    } catch (err) {
      setErrorMsg('Error verifying PIN: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 380, textAlign: 'center' }}
      >
        <div className="modal-header border-0 pb-0 justify-end">
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 pt-0">
          <div 
            className="brand-icon-wrapper mx-auto mb-3" 
            style={{ width: 56, height: 56, margin: '0 auto 12px' }}
          >
            <KeyRound size={28} />
          </div>

          <h3 className="modal-title mb-1">Enter Owner / Admin PIN</h3>
          <p className="text-xs text-muted mb-4">
            Unlock wholesale cost prices, profit margins & store settings
          </p>

          {errorMsg && (
            <div className="alert-box alert-danger text-xs p-2 rounded mb-3 flex items-center justify-center gap-1.5">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <input
                type="password"
                maxLength="6"
                pattern="[0-9]*"
                inputMode="numeric"
                className="form-input text-center font-bold mono text-2xl tracking-widest"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                required
                style={{ letterSpacing: '8px', fontSize: '1.5rem', textAlign: 'center' }}
              />
              <span className="text-xs text-muted mt-1 block">Default PIN: 1234</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isVerifying || !pin}
              >
                {isVerifying ? 'Checking...' : 'Unlock Owner Mode'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
