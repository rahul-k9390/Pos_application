import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Printer, 
  Eye, 
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Download,
  CalendarDays,
  RotateCcw
} from 'lucide-react';

export default function ReportsDashboard({
  dashboardStats,
  onRefreshStats,
  onViewOrder,
  onOpenManualSaleModal,
  onOpenReturnModal,
  currency = '₹',
  settings = {}
}) {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [activeReportTab, setActiveReportTab] = useState('monthly'); // 'monthly' or 'today'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [monthlyData, setMonthlyData] = useState(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Helper to format 'YYYY-MM' to 'Month YYYY' (e.g., 'October 2026')
  const formatMonthName = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  // Fetch Monthly Sales Report
  const fetchMonthlyReport = useCallback(async (month) => {
    setIsLoadingMonthly(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${encodeURIComponent(month)}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data);
      }
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthlyReport(selectedMonth);
  }, [selectedMonth, fetchMonthlyReport]);

  // Overall Live Stats
  const stats = dashboardStats || {};
  const today = stats.today || {};
  const inventory = stats.inventory || {};
  const khata = stats.khata || {};
  const todayBills = today.bills_count || 0;
  const todaySales = today.total_sales || 0;
  const todayAvgBill = todayBills > 0 ? (todaySales / todayBills).toFixed(2) : 0;

  // Monthly stats extracted from monthlyData
  const mSummary = monthlyData?.summary || {};
  const mPaymentBreakdown = monthlyData?.paymentBreakdown || [];
  const mDailyBreakdown = monthlyData?.dailyBreakdown || [];
  const mOrders = monthlyData?.orders || [];
  const mProductSales = monthlyData?.productSales || [];
  const availableMonths = monthlyData?.availableMonths || [currentMonthStr];

  const mTotalBills = mSummary.bills_count || 0;
  const mTotalSales = mSummary.total_sales || 0;
  const mAvgBill = mTotalBills > 0 ? (mTotalSales / mTotalBills).toFixed(2) : '0.00';

  // ---------------- EXPORT MULTI-SHEET EXCEL ----------------
  const handleExportExcel = () => {
    if (!monthlyData) return;

    const storeName = settings.store_name || 'Kirana & Retail POS';
    const monthLabel = formatMonthName(selectedMonth);

    // 1. Create New Workbook
    const wb = XLSX.utils.book_new();

    // ---------------- SHEET 1: MONTHLY SUMMARY ----------------
    const totalPayAll = mPaymentBreakdown.reduce((s, p) => s + (p.total || 0), 0) || 1;

    const summaryRows = [
      ['========================================================================'],
      [`${storeName.toUpperCase()} - MONTHLY SALES REPORT`],
      ['========================================================================'],
      ['Store Address:', settings.store_address || 'N/A'],
      ['Store GSTIN:', settings.gstin || 'N/A'],
      ['Store Phone:', settings.store_phone || 'N/A'],
      ['Report Month:', monthLabel],
      ['Generated On:', new Date().toLocaleString()],
      [],
      ['--- MONTHLY KEY PERFORMANCE INDICATORS (KPIs) ---'],
      ['Metric', 'Value'],
      ['Total Sales Revenue', `${currency} ${Number(mTotalSales).toFixed(2)}`],
      ['Total Invoices Billed', mTotalBills],
      ['Average Ticket Size', `${currency} ${mAvgBill}`],
      ['Total Tax Collected', `${currency} ${Number(mSummary.total_tax || 0).toFixed(2)}`],
      ['Total Discounts Given', `${currency} ${Number(mSummary.total_discount || 0).toFixed(2)}`],
      [],
      ['--- PAYMENT MODES BREAKDOWN ---'],
      ['Payment Mode', 'Bills Count', 'Total Amount (₹)', 'Share (%)'],
      ...mPaymentBreakdown.map(p => [
        p.payment_mode,
        p.count,
        Number(p.total).toFixed(2),
        `${Math.round((p.total / totalPayAll) * 100)}%`
      ]),
      [],
      ['--- DAY-BY-DAY SALES BREAKDOWN ---'],
      ['Date', 'Bills Count', 'Daily Sales Total (₹)'],
      ...mDailyBreakdown.map(d => [
        d.sale_date,
        d.bills_count,
        Number(d.daily_total).toFixed(2)
      ])
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 28 },
      { wch: 22 },
      { wch: 20 },
      { wch: 15 }
    ];

    // ---------------- SHEET 2: ALL INVOICES ----------------
    const invoiceHeaders = [
      'Invoice #',
      'Date & Time',
      'Customer Name',
      'Payment Mode',
      'Payment Status',
      'Subtotal (₹)',
      'Discount (₹)',
      'Tax (₹)',
      'Total Amount (₹)',
      'Cashier'
    ];

    const invoiceRows = mOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString(),
      o.customer_name || 'Walk-in Customer',
      o.payment_mode,
      o.payment_status,
      Number(o.subtotal || 0).toFixed(2),
      Number(o.discount_amount || 0).toFixed(2),
      Number(o.tax_amount || 0).toFixed(2),
      Number(o.total_amount || 0).toFixed(2),
      o.cashier || 'Admin'
    ]);

    const wsInvoices = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
    wsInvoices['!cols'] = [
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 }
    ];

    // ---------------- SHEET 3: PRODUCT SALES BREAKDOWN ----------------
    const productHeaders = [
      'Product Name',
      'Barcode',
      'Quantity Sold',
      'Unit',
      'Total Sales Revenue (₹)'
    ];

    const productRows = mProductSales.map(p => [
      p.product_name,
      p.barcode || 'N/A',
      p.total_qty,
      p.unit || 'pcs',
      Number(p.total_sales || 0).toFixed(2)
    ]);

    const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
    wsProducts['!cols'] = [
      { wch: 34 },
      { wch: 18 },
      { wch: 15 },
      { wch: 10 },
      { wch: 24 }
    ];

    // Append sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Summary');
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'All Invoices');
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Product Sales');

    // Trigger download
    const filename = `Sales_Report_${selectedMonth}.xlsx`;
    XLSX.writeFile(wb, filename);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3500);
  };

  // Print Daily Z-Report
  const handlePrintDailyReport = () => {
    window.print();
  };

  return (
    <div className="reports-page-wrapper">
      {/* Header Bar */}
      <div className="section-header-bar">
        <div>
          <h2>Sales Analytics & Monthly Excel Reports</h2>
          <p className="text-muted">Monthly sales performance, multi-sheet Excel export, and daily register</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month Selector Dropdown */}
          <div className="month-picker-wrap">
            <CalendarDays size={18} className="text-primary" />
            <select
              className="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Select Month for Report"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Export Excel Button */}
          <button 
            className="btn-excel" 
            onClick={handleExportExcel} 
            disabled={isLoadingMonthly}
            title="Download Full Multi-Sheet Excel Report"
          >
            {exportSuccess ? <CheckCircle size={18} /> : <FileSpreadsheet size={18} />}
            <span>{exportSuccess ? 'Downloaded!' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* Record Manual Sale Button */}
          <button 
            className="btn btn-primary"
            onClick={onOpenManualSaleModal}
            title="Directly enter offline or backdated sales record"
          >
            <FileText size={18} />
            <span>+ Record Manual Sale</span>
          </button>

          <button className="btn btn-secondary" onClick={() => { onRefreshStats(); fetchMonthlyReport(selectedMonth); }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Report View Mode Tabs */}
      <div className="reports-tab-nav">
        <button
          className={`reports-tab-btn ${activeReportTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('monthly')}
        >
          <BarChart3 size={18} />
          <span>Monthly Report ({formatMonthName(selectedMonth)})</span>
        </button>
        <button
          className={`reports-tab-btn ${activeReportTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('today')}
        >
          <Calendar size={18} />
          <span>Today's Register (Z-Report)</span>
        </button>
        {activeReportTab === 'today' && (
          <button className="btn btn-primary btn-sm ml-auto" onClick={handlePrintDailyReport}>
            <Printer size={16} />
            <span>Print Z-Report</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: MONTHLY SALES & EXCEL REPORT                           */}
      {/* ============================================================== */}
      {activeReportTab === 'monthly' && (
        <div className="monthly-report-view">
          {/* Monthly 4 Main KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card border-emerald">
              <div className="kpi-header">
                <span className="kpi-title">{formatMonthName(selectedMonth)} Revenue</span>
                <span className="badge badge-success">Monthly Total</span>
              </div>
              <div className="kpi-value mono text-emerald">{currency}{mTotalSales.toLocaleString()}</div>
              <span className="kpi-subtitle">Total sales revenue collected in this month</span>
            </div>

            <div className="kpi-card border-primary">
              <div className="kpi-header">
                <span className="kpi-title">Invoices Billed</span>
                <span className="badge badge-primary">{mTotalBills} Bills</span>
              </div>
              <div className="kpi-value mono">{mTotalBills}</div>
              <span className="kpi-subtitle">Average Ticket Size: {currency}{mAvgBill}</span>
            </div>

            <div className="kpi-card border-amber">
              <div className="kpi-header">
                <span className="kpi-title">Total Tax Collected</span>
                <span className="badge badge-warning">GST / Tax</span>
              </div>
              <div className="kpi-value mono text-amber">{currency}{(mSummary.total_tax || 0).toLocaleString()}</div>
              <span className="kpi-subtitle">Calculated on itemized sales</span>
            </div>

            <div className="kpi-card border-cyan">
              <div className="kpi-header">
                <span className="kpi-title">Discounts Given</span>
                <span className="badge badge-neutral">Customer Savings</span>
              </div>
              <div className="kpi-value mono text-cyan">
                {currency}{(mSummary.total_discount || 0).toLocaleString()}
              </div>
              <span className="kpi-subtitle">
                Total discount savings given to customers
              </span>
            </div>
          </div>

          {/* Grid: Payment Breakdown & Day-by-Day Sales Breakdown */}
          <div className="analytics-two-col-grid mt-6">
            {/* Payment Modes Breakdown Card */}
            <div className="card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" />
                <span>Payment Modes Breakdown ({formatMonthName(selectedMonth)})</span>
              </h3>

              <div className="payment-modes-list space-y-4">
                {mPaymentBreakdown.length === 0 ? (
                  <p className="text-muted text-center py-4">No payment records for this month</p>
                ) : (
                  mPaymentBreakdown.map((pm) => {
                    const totalAll = mPaymentBreakdown.reduce((s, p) => s + p.total, 0) || 1;
                    const percentage = Math.round((pm.total / totalAll) * 100);

                    return (
                      <div key={pm.payment_mode} className="pay-breakdown-row">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{pm.payment_mode} ({pm.count} bills)</span>
                          <span className="mono font-bold">{currency}{pm.total.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-bar-fill ${
                              pm.payment_mode === 'CASH' ? 'bg-emerald' :
                              pm.payment_mode === 'UPI' ? 'bg-cyan' :
                              pm.payment_mode === 'DUE' ? 'bg-amber' : 'bg-primary'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Day by Day Sales Breakdown */}
            <div className="card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <CalendarDays size={20} className="text-emerald" />
                <span>Day-by-Day Sales ({formatMonthName(selectedMonth)})</span>
              </h3>

              <div className="table-responsive-card" style={{ maxHeight: 280, overflowY: 'auto' }}>
                <table className="pos-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-center">Bills</th>
                      <th className="text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mDailyBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center py-4 text-muted">No daily records for this month</td>
                      </tr>
                    ) : (
                      mDailyBreakdown.map((day) => (
                        <tr key={day.sale_date}>
                          <td className="font-semibold">
                            {new Date(day.sale_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </td>
                          <td className="text-center mono">{day.bills_count}</td>
                          <td className="text-right mono font-bold text-emerald">
                            {currency}{day.daily_total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Selling Products in this Month */}
          <div className="card mt-6 p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald" />
              <span>Top Selling Products ({formatMonthName(selectedMonth)})</span>
            </h3>

            <div className="table-responsive-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product Name</th>
                    <th>Barcode</th>
                    <th className="text-center">Qty Sold</th>
                    <th className="text-right">Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {mProductSales.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No product sales in this month</td>
                    </tr>
                  ) : (
                    mProductSales.slice(0, 8).map((p, idx) => (
                      <tr key={idx}>
                        <td><span className="rank-badge font-bold mono">#{idx + 1}</span></td>
                        <td className="font-semibold">{p.product_name}</td>
                        <td className="mono text-muted text-sm">{p.barcode || 'N/A'}</td>
                        <td className="text-center mono font-bold">{p.total_qty} {p.unit || 'pcs'}</td>
                        <td className="text-right mono font-bold text-emerald">{currency}{Number(p.total_sales).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Invoices in this Month */}
          <div className="card mt-6 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                <span>Invoices & Bills in {formatMonthName(selectedMonth)} ({mOrders.length})</span>
              </h3>
              <button 
                className="btn-excel btn-sm" 
                onClick={handleExportExcel}
                title="Download this list into Excel"
              >
                <Download size={14} />
                <span>Export to Excel</span>
              </button>
            </div>

            <div className="table-responsive-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Payment Mode</th>
                    <th className="text-right">Subtotal</th>
                    <th className="text-right">Tax</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-6 text-muted">
                        No orders found for {formatMonthName(selectedMonth)}.
                      </td>
                    </tr>
                  ) : (
                    mOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <span className="mono font-bold text-primary">{order.order_number}</span>
                        </td>
                        <td className="text-sm text-muted">
                          {new Date(order.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>{order.customer_name || 'Walk-in'}</td>
                        <td>
                          <span className="badge badge-neutral">{order.payment_mode}</span>
                        </td>
                        <td className="text-right mono text-muted">
                          {currency}{order.subtotal}
                        </td>
                        <td className="text-right mono text-muted">
                          {currency}{order.tax_amount}
                        </td>
                        <td className="text-right mono font-bold text-emerald">
                          {currency}{order.total_amount}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${
                            order.payment_status === 'RETURNED' ? 'badge-danger' : 
                            order.payment_status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => onViewOrder(order.id)}
                              title="View and reprint invoice"
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                            {order.payment_status !== 'RETURNED' && onOpenReturnModal && (
                              <button
                                className="btn btn-outline btn-sm text-danger border-rose"
                                onClick={() => onOpenReturnModal(order)}
                                title="Return items / Cancel invoice"
                              >
                                <RotateCcw size={14} />
                                <span>Return</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TODAY'S LIVE REGISTER (Z-REPORT)                        */}
      {/* ============================================================== */}
      {activeReportTab === 'today' && (
        <div className="today-register-view">
          {/* 4 Main KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card border-emerald">
              <div className="kpi-header">
                <span className="kpi-title">Today's Sales Revenue</span>
                <span className="badge badge-success">Live Today</span>
              </div>
              <div className="kpi-value mono text-emerald">{currency}{todaySales.toLocaleString()}</div>
              <span className="kpi-subtitle">Collected across all payment modes</span>
            </div>

            <div className="kpi-card border-primary">
              <div className="kpi-header">
                <span className="kpi-title">Invoices Billed Today</span>
                <span className="badge badge-primary">{todayBills} Bills</span>
              </div>
              <div className="kpi-value mono">{todayBills}</div>
              <span className="kpi-subtitle">Avg Ticket Size: {currency}{todayAvgBill}</span>
            </div>

            <div className="kpi-card border-amber">
              <div className="kpi-header">
                <span className="kpi-title">Market Udhar (Pending)</span>
                <span className="badge badge-warning">Credit Due</span>
              </div>
              <div className="kpi-value mono text-amber">{currency}{(khata.total_outstanding || 0).toLocaleString()}</div>
              <span className="kpi-subtitle">Across {khata.total_customers || 0} registered customers</span>
            </div>

            <div className="kpi-card border-cyan">
              <div className="kpi-header">
                <span className="kpi-title">Inventory Health</span>
                <span className="badge badge-neutral">{inventory.total_items || 0} Products</span>
              </div>
              <div className="kpi-value mono text-cyan">
                {inventory.low_stock_count > 0 ? `${inventory.low_stock_count} Low` : 'All Stocked'}
              </div>
              <span className="kpi-subtitle">
                {inventory.out_of_stock_count || 0} items completely out of stock
              </span>
            </div>
          </div>

          {/* Grid: Payment Breakdown & Top Selling Products */}
          <div className="analytics-two-col-grid mt-6">
            {/* Payment Breakdown Card */}
            <div className="card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" />
                <span>Today's Payment Modes</span>
              </h3>

              <div className="payment-modes-list space-y-4">
                {(stats.paymentBreakdown || []).length === 0 ? (
                  <p className="text-muted text-center py-4">No payment records yet today</p>
                ) : (
                  (stats.paymentBreakdown || []).map((pm) => {
                    const totalAll = (stats.paymentBreakdown || []).reduce((s, p) => s + p.total, 0) || 1;
                    const percentage = Math.round((pm.total / totalAll) * 100);

                    return (
                      <div key={pm.payment_mode} className="pay-breakdown-row">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{pm.payment_mode} ({pm.count} bills)</span>
                          <span className="mono font-bold">{currency}{pm.total.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-bar-fill ${
                              pm.payment_mode === 'CASH' ? 'bg-emerald' :
                              pm.payment_mode === 'UPI' ? 'bg-cyan' :
                              pm.payment_mode === 'DUE' ? 'bg-amber' : 'bg-primary'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Top Selling Products Card */}
            <div className="card p-5">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald" />
                <span>Overall Top Selling Products</span>
              </h3>

              <div className="top-products-list space-y-3">
                {(stats.topProducts || []).length === 0 ? (
                  <p className="text-muted text-center py-4">No sales items yet</p>
                ) : (
                  (stats.topProducts || []).map((p, idx) => (
                    <div key={idx} className="top-product-item flex items-center justify-between p-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-3">
                        <span className="rank-badge font-bold mono">#{idx + 1}</span>
                        <div>
                          <h4 className="text-sm font-semibold">{p.product_name}</h4>
                          <span className="text-xs text-muted mono">Barcode: {p.barcode || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold mono text-sm">{currency}{p.total_amount}</span>
                        <span className="text-xs text-muted mono">{p.total_qty} units sold</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card mt-6 p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary" />
              <span>Recent Invoices & Bills</span>
            </h3>

            <div className="table-responsive-card">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Payment Mode</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentOrders || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-muted">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    (stats.recentOrders || []).map(order => (
                      <tr key={order.id}>
                        <td>
                          <span className="mono font-bold text-primary">{order.order_number}</span>
                        </td>
                        <td className="text-sm text-muted">
                          {new Date(order.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>{order.customer_name || 'Walk-in'}</td>
                        <td>
                          <span className="badge badge-neutral">{order.payment_mode}</span>
                        </td>
                        <td className="text-right mono font-bold text-emerald">
                          {currency}{order.total_amount}
                        </td>
                        <td className="text-center">
                          <span className={`badge ${
                            order.payment_status === 'RETURNED' ? 'badge-danger' : 
                            order.payment_status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => onViewOrder(order.id)}
                              title="View and reprint invoice"
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                            {order.payment_status !== 'RETURNED' && onOpenReturnModal && (
                              <button
                                className="btn btn-outline btn-sm text-danger border-rose"
                                onClick={() => onOpenReturnModal(order)}
                                title="Return items / Cancel invoice"
                              >
                                <RotateCcw size={14} />
                                <span>Return</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
