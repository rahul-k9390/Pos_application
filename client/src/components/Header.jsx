import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  PauseCircle, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Store,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  heldCartsCount = 0,
  lowStockCount = 0,
  settings = {},
  theme,
  setTheme,
  soundEnabled,
  setSoundEnabled,
  onOpenHeldCarts,
  userRole = 'cashier',
  onUnlockOwner,
  onLockCashier
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const tabs = [
    { id: 'billing', label: 'POS Billing', icon: ShoppingCart, hotkey: 'F1' },
    { id: 'inventory', label: 'Products & Stock', icon: Package, hotkey: 'F2' },
    { id: 'customers', label: 'Customers & Khata', icon: Users, hotkey: 'F3' },
    { id: 'reports', label: 'Sales & Reports', icon: BarChart3, hotkey: 'F4' },
    { id: 'settings', label: 'Store Settings', icon: Settings, hotkey: 'F9' },
  ];

  const handleTabClick = (tabId) => {
    if (tabId === 'settings' && userRole === 'cashier') {
      if (onUnlockOwner) {
        onUnlockOwner();
      } else {
        setActiveTab(tabId);
      }
      return;
    }
    setActiveTab(tabId);
  };

  return (
    <header className="header-bar">
      <div className="header-left">
        <div className="store-brand" onClick={() => setActiveTab('billing')}>
          <div className="brand-icon-wrapper">
            <Store className="brand-icon" size={24} />
          </div>
          <div className="brand-details">
            <h1 className="brand-title">{settings.store_name || 'Kirana Super Mart'}</h1>
            <span className="brand-subtitle">{settings.store_tagline || 'Superfast Retail Billing'}</span>
          </div>
        </div>

        <nav className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                <kbd>{tab.hotkey}</kbd>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="header-right">
        {/* Role Toggle Button (Cashier Mode vs Owner Mode) */}
        {userRole === 'owner' ? (
          <button 
            className="alert-pill owner-pill" 
            onClick={onLockCashier}
            title="Owner Mode Active (Margins & Settings Unlocked). Click to Lock Cashier Mode"
            style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
          >
            <ShieldCheck size={16} className="text-emerald" />
            <span className="font-bold">👑 Owner Mode</span>
          </button>
        ) : (
          <button 
            className="alert-pill cashier-pill" 
            onClick={onUnlockOwner}
            title="Cashier Mode (Wholesale margins locked). Click to enter 4-digit Owner PIN"
            style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}
          >
            <Lock size={16} className="text-amber" />
            <span className="font-bold">🔒 Cashier Mode</span>
          </button>
        )}

        {/* Held Carts Notification */}
        {heldCartsCount > 0 && (
          <button 
            className="alert-pill held-pill" 
            onClick={onOpenHeldCarts}
            title="View Parked / Held Bills"
          >
            <PauseCircle size={16} />
            <span>{heldCartsCount} Parked</span>
          </button>
        )}

        {/* Low Stock Notification */}
        {lowStockCount > 0 && (
          <button 
            className="alert-pill stock-pill" 
            onClick={() => setActiveTab('inventory')}
            title="View Low Stock Items"
          >
            <AlertTriangle size={16} />
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}

        {/* Live Clock */}
        <div className="clock-badge">
          <span className="clock-time mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="clock-date">
            {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
          </span>
        </div>

        {/* Action Toggles */}
        <div className="header-actions">
          {/* Sound Toggle */}
          <button
            className="btn-icon-subtle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Scanner sound ON' : 'Scanner sound MUTED'}
          >
            {soundEnabled ? <Volume2 size={18} className="text-emerald" /> : <VolumeX size={18} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            className="btn-icon-subtle"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Display"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
