import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import POSBilling from './components/POSBilling';
import CheckoutModal from './components/CheckoutModal';
import ReceiptModal from './components/ReceiptModal';
import HeldCartsModal from './components/HeldCartsModal';
import InventoryManager from './components/InventoryManager';
import CustomerKhata from './components/CustomerKhata';
import ReportsDashboard from './components/ReportsDashboard';
import StoreSettings from './components/StoreSettings';
import ManualSaleModal from './components/ManualSaleModal';
import PinModal from './components/PinModal';
import ReturnBillModal from './components/ReturnBillModal';
import StockInwardModal from './components/StockInwardModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('billing');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pos_theme');
    if (!saved || saved === 'dark') {
      localStorage.setItem('pos_theme', 'light');
      return 'light';
    }
    return saved;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('pos_sound') !== 'false');

  // Role Mode: 'cashier' (Margins hidden) vs 'owner' (Full access)
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('pos_user_role') || 'cashier');

  // Master Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [heldCarts, setHeldCarts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Active Billing State
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Modals State
  const [checkoutData, setCheckoutData] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [isManualSaleModalOpen, setIsManualSaleModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [returnOrderTarget, setReturnOrderTarget] = useState(null);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', email: '', address: '' });

  // Apply Theme to Document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pos_theme', theme);
  }, [theme]);

  // Save Sound Preference
  useEffect(() => {
    localStorage.setItem('pos_sound', soundEnabled);
  }, [soundEnabled]);

  // Fetch Initial Data
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const fetchHeldCarts = useCallback(async () => {
    try {
      const res = await fetch('/api/held-carts');
      if (res.ok) setHeldCarts(await res.json());
    } catch (err) {
      console.error('Error fetching held carts:', err);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) setDashboardStats(await res.json());
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
    fetchSettings();
    fetchHeldCarts();
    fetchDashboardStats();
  }, [fetchProducts, fetchCategories, fetchCustomers, fetchSettings, fetchHeldCarts, fetchDashboardStats]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input (except function keys)
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('billing');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('customers');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F6' && activeTab === 'billing' && cart.length > 0) {
        e.preventDefault();
        handleHoldCart({ cart, selectedCustomer });
      } else if (e.key === 'Escape') {
        if (checkoutData) setCheckoutData(null);
        if (isHeldCartsOpen) setIsHeldCartsOpen(false);
        if (isNewCustModalOpen) setIsNewCustModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, cart, selectedCustomer, checkoutData, isHeldCartsOpen, isNewCustModalOpen]);

  // Handle Hold / Park Cart
  const handleHoldCart = async (cartPayload) => {
    try {
      const custName = selectedCustomer ? selectedCustomer.name : 'Walk-in';
      const cartName = `Bill - ${custName} (${cart.length} items)`;

      const res = await fetch('/api/held-carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_name: cartName,
          customer_id: selectedCustomer ? selectedCustomer.id : null,
          cart_data: cartPayload
        })
      });

      if (res.ok) {
        setCart([]);
        setSelectedCustomer(null);
        await fetchHeldCarts();
      }
    } catch (err) {
      alert('Error parking bill: ' + err.message);
    }
  };

  // Resume Parked Cart
  const handleResumeCart = async (heldItem) => {
    const data = heldItem.cart_data;
    if (data && data.cart) {
      setCart(data.cart);
      if (data.selectedCustomer) {
        setSelectedCustomer(data.selectedCustomer);
      }
      // Remove from server
      await fetch(`/api/held-carts/${heldItem.id}`, { method: 'DELETE' });
      await fetchHeldCarts();
      setIsHeldCartsOpen(false);
      setActiveTab('billing');
    }
  };

  // Delete Held Cart
  const handleDeleteHeldCart = async (id) => {
    if (window.confirm('Delete this parked bill?')) {
      await fetch(`/api/held-carts/${id}`, { method: 'DELETE' });
      await fetchHeldCarts();
    }
  };

  // Complete Sale (Checkout confirmation)
  const handleCompleteSale = async (orderPayload) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to process order');
    }

    const createdOrder = await res.json();
    setCompletedOrder(createdOrder);
    setCheckoutData(null);
    setCart([]);
    setSelectedCustomer(null);

    // Refresh products for updated stock and customers for updated khata/points
    fetchProducts();
    fetchCustomers();
    fetchDashboardStats();
  };

  // Save Manual Sale Entry
  const handleSaveManualSale = async (payload) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save manual sale');
    }

    const createdOrder = await res.json();
    setCompletedOrder(createdOrder);

    fetchProducts();
    fetchCustomers();
    fetchDashboardStats();
    return createdOrder;
  };

  // View historical order receipt
  const handleViewOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const order = await res.json();
        setCompletedOrder(order);
      }
    } catch (err) {
      alert('Error fetching invoice details: ' + err.message);
    }
  };

  // Role Security Handlers
  const handleUnlockOwnerSuccess = () => {
    setUserRole('owner');
    sessionStorage.setItem('pos_user_role', 'owner');
  };

  const handleLockCashier = () => {
    setUserRole('cashier');
    sessionStorage.setItem('pos_user_role', 'cashier');
  };

  // Bill Return & Inward Handlers
  const handleReturnSuccess = (returnedOrder) => {
    fetchProducts();
    fetchCustomers();
    fetchDashboardStats();
    setCompletedOrder(returnedOrder);
  };

  const handleInwardSuccess = () => {
    fetchProducts();
    fetchDashboardStats();
  };

  // Product Operations
  const handleAddProduct = async (productData) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (res.ok) {
      fetchProducts();
      fetchDashboardStats();
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (res.ok) {
      fetchProducts();
      fetchDashboardStats();
    }
  };

  const handleDeleteProduct = async (id) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProducts();
      fetchDashboardStats();
    }
  };

  // Customer Operations
  const handleAddCustomer = async (custData) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(custData)
    });
    if (res.ok) {
      const newCust = await res.json();
      await fetchCustomers();
      setSelectedCustomer(newCust);
      return newCust;
    }
  };

  const handleSettleDue = async (customerId, paymentData) => {
    const res = await fetch(`/api/customers/${customerId}/pay-due`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (res.ok) {
      fetchCustomers();
      fetchDashboardStats();
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) {
      setSettings(newSettings);
    }
  };

  const lowStockCount = products.filter(p => p.stock_qty <= p.min_stock_alert).length;
  const currency = settings.currency_symbol || '₹';

  return (
    <div className="pos-app-root">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        heldCartsCount={heldCarts.length}
        lowStockCount={lowStockCount}
        settings={settings}
        theme={theme}
        setTheme={setTheme}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenHeldCarts={() => setIsHeldCartsOpen(true)}
        userRole={userRole}
        onUnlockOwner={() => setIsPinModalOpen(true)}
        onLockCashier={handleLockCashier}
      />

      {/* Main Tab Screens */}
      <main className="pos-main-container">
        {activeTab === 'billing' && (
          <POSBilling
            products={products}
            categories={categories}
            customers={customers}
            cart={cart}
            setCart={setCart}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            onOpenCheckout={(data) => setCheckoutData(data)}
            onHoldCart={handleHoldCart}
            onOpenNewCustomerModal={() => setIsNewCustModalOpen(true)}
            onOpenManualSaleModal={() => setIsManualSaleModalOpen(true)}
            soundEnabled={soundEnabled}
            currency={currency}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenInwardModal={() => setIsInwardModalOpen(true)}
            userRole={userRole}
            onUnlockOwner={() => setIsPinModalOpen(true)}
            currency={currency}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerKhata
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onSettleDue={handleSettleDue}
            currency={currency}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsDashboard
            dashboardStats={dashboardStats}
            onRefreshStats={fetchDashboardStats}
            onViewOrder={handleViewOrder}
            onOpenManualSaleModal={() => setIsManualSaleModalOpen(true)}
            onOpenReturnModal={(order) => setReturnOrderTarget(order)}
            currency={currency}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <StoreSettings
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* ---------------- CHECKOUT MODAL ---------------- */}
      {checkoutData && (
        <CheckoutModal
          orderData={checkoutData}
          onClose={() => setCheckoutData(null)}
          onCompleteSale={handleCompleteSale}
          settings={settings}
          currency={currency}
          soundEnabled={soundEnabled}
        />
      )}

      {/* ---------------- THERMAL RECEIPT MODAL ---------------- */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          settings={settings}
          currency={currency}
          onClose={() => setCompletedOrder(null)}
          onNewSale={() => {
            setCompletedOrder(null);
            setActiveTab('billing');
          }}
          onOpenReturnModal={(order) => setReturnOrderTarget(order)}
        />
      )}

      {/* ---------------- HELD / PARKED CARTS MODAL ---------------- */}
      {isHeldCartsOpen && (
        <HeldCartsModal
          heldCarts={heldCarts}
          onClose={() => setIsHeldCartsOpen(false)}
          onResumeCart={handleResumeCart}
          onDeleteHeldCart={handleDeleteHeldCart}
          currency={currency}
        />
      )}

      {/* ---------------- QUICK NEW CUSTOMER MODAL ---------------- */}
      {isNewCustModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewCustModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Quick Customer Registration</h3>
              <button className="btn-close-modal" onClick={() => setIsNewCustModalOpen(false)}>×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCustForm.name.trim()) return;
              await handleAddCustomer(newCustForm);
              setNewCustForm({ name: '', phone: '', email: '', address: '' });
              setIsNewCustModalOpen(false);
            }} className="p-4 space-y-4">
              <div className="form-group">
                <label className="field-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Rajesh Sharma"
                  value={newCustForm.name}
                  onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="field-label">Mobile Number</label>
                <input
                  type="tel"
                  className="input mono"
                  placeholder="e.g. 9820123456"
                  value={newCustForm.phone}
                  onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                />
              </div>
              <div className="modal-footer pt-3">
                <button type="button" className="btn btn-outline" onClick={() => setIsNewCustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save & Select</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MANUAL SALE ENTRY MODAL ---------------- */}
      <ManualSaleModal
        isOpen={isManualSaleModalOpen}
        onClose={() => setIsManualSaleModalOpen(false)}
        onSaveManualSale={handleSaveManualSale}
        customers={customers}
        currency={currency}
        soundEnabled={soundEnabled}
      />

      {/* ---------------- OWNER PIN SECURITY MODAL ---------------- */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleUnlockOwnerSuccess}
      />

      {/* ---------------- BILL RETURN & CANCEL MODAL ---------------- */}
      <ReturnBillModal
        isOpen={!!returnOrderTarget}
        order={returnOrderTarget}
        onClose={() => setReturnOrderTarget(null)}
        onReturnSuccess={handleReturnSuccess}
        currency={currency}
      />

      {/* ---------------- STOCK INWARD PURCHASE MODAL ---------------- */}
      <StockInwardModal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        products={products}
        onInwardSuccess={handleInwardSuccess}
        currency={currency}
      />
    </div>
  );
}
