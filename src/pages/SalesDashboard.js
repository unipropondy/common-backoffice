import { useState, useEffect } from "react";
import "./SalesDashboard.css";
import { BASE_URL } from "../config/api";
import {
  FaDollarSign, FaCalendarDay, FaCalendarWeek, FaCalendarAlt,
  FaShoppingCart, FaUtensils, FaBicycle, FaStore,
  FaCalculator, FaMedal, FaTags, FaCreditCard,
  FaChartBar, FaTrendingUp, FaArrowUp, FaArrowDown,
  FaMoneyBillWave, FaMobileAlt, FaUniversity
} from "react-icons/fa";

// ── Demo / Placeholder Data ─────────────────────────────────────────────
const DEMO_DATA = {
  totalSales: 1248750.50,
  todaySales: 28430.00,
  todayTrend: +12.4,
  weeklySales: 198200.00,
  weeklyTrend: +5.2,
  monthlySales: 842600.00,
  monthlyTrend: -2.1,
  totalOrders: 8642,
  dineInOrders: 4210,
  takeawayOrders: 2880,
  deliveryOrders: 1552,
  avgOrderValue: 144.5,
  bestSellingItems: [
    { rank: 1, name: 'Chicken Briyani', qty: 1842, revenue: 276300 },
    { rank: 2, name: 'Mutton Curry',    qty: 1204, revenue: 180600 },
    { rank: 3, name: 'Naan Bread',      qty: 2180, revenue: 87200 },
    { rank: 4, name: 'Fish & Chips',    qty: 986,  revenue: 148000 },
    { rank: 5, name: 'Mango Lassi',     qty: 1650, revenue: 57750 },
  ],
  topCategories: [
    { name: 'Main Course',  pct: 42, color: 'var(--primary)' },
    { name: 'Beverages',    pct: 22, color: '#3B82F6' },
    { name: 'Starters',     pct: 18, color: '#8B5CF6' },
    { name: 'Desserts',     pct: 10, color: '#10B981' },
    { name: 'Breads',       pct: 8,  color: '#F59E0B' },
  ],
  paymentSummary: [
    { method: 'Cash',   amount: 498000, pct: 40, icon: FaMoneyBillWave, color: '#22C55E' },
    { method: 'Card',   amount: 373200, pct: 30, icon: FaCreditCard,    color: '#3B82F6' },
    { method: 'UPI',    amount: 249600, pct: 20, icon: FaMobileAlt,     color: '#8B5CF6' },
    { method: 'Bank',   amount: 124800, pct: 10, icon: FaUniversity,    color: '#F59E0B' },
  ],
  hourlySales: [
    { hour: '08', sales: 2400 },
    { hour: '09', sales: 5800 },
    { hour: '10', sales: 4200 },
    { hour: '11', sales: 7100 },
    { hour: '12', sales: 12400 },
    { hour: '13', sales: 15200 },
    { hour: '14', sales: 11800 },
    { hour: '15', sales: 8600 },
    { hour: '16', sales: 6400 },
    { hour: '17', sales: 9200 },
    { hour: '18', sales: 13800 },
    { hour: '19', sales: 16200 },
    { hour: '20', sales: 18400 },
    { hour: '21', sales: 14600 },
    { hour: '22', sales: 8200 },
  ],
  dailyTrend: [
    { day: 'Mon', sales: 38200 },
    { day: 'Tue', sales: 42600 },
    { day: 'Wed', sales: 31800 },
    { day: 'Thu', sales: 48200 },
    { day: 'Fri', sales: 62400 },
    { day: 'Sat', sales: 78600 },
    { day: 'Sun', sales: 68800 },
  ],
};

// ── Format currency ─────────────────────────────────────────────────────
const fmt = (n) => n >= 1000000
  ? `$${(n / 1000000).toFixed(2)}M`
  : n >= 1000
    ? `$${(n / 1000).toFixed(1)}K`
    : `$${Number(n).toFixed(2)}`;

// ── KPI Sales Card ──────────────────────────────────────────────────────
function SalesKPICard({ icon: Icon, label, value, trend, color, sub, index }) {
  const isPositive = trend >= 0;
  return (
    <div className="sd-kpi-card animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="sd-kpi-icon" style={{ background: `${color}18`, color }}>
        <Icon />
      </div>
      <div className="sd-kpi-body">
        <p className="sd-kpi-label">{label}</p>
        <h3 className="sd-kpi-value">{value}</h3>
        {sub && <p className="sd-kpi-sub">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`sd-kpi-trend ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// ── CSS Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, title }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="sd-chart-card">
      <h3 className="sd-chart-title">{title}</h3>
      <div className="sd-bar-chart">
        {data.map((item, i) => (
          <div key={i} className="sd-bar-col">
            <div className="sd-bar-wrap">
              <div
                className="sd-bar"
                style={{ height: `${Math.max((item[valueKey] / max) * 100, 4)}%` }}
                title={`${item[labelKey]}: ${fmt(item[valueKey])}`}
              />
            </div>
            <span className="sd-bar-label">{item[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line Trend Chart (CSS approximation) ────────────────────────────────
function TrendChart({ data, valueKey, labelKey, title }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  const min = Math.min(...data.map(d => d[valueKey]));
  const range = max - min || 1;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d[valueKey] - min) / range) * 80 - 10,
  }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const area = `0,100 ${polyline} 100,100`;

  return (
    <div className="sd-chart-card">
      <h3 className="sd-chart-title">{title}</h3>
      <div className="sd-trend-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sd-svg">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#trendGrad)" />
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--primary)" />
          ))}
        </svg>
        <div className="sd-trend-labels">
          {data.map((d, i) => (
            <span key={i} className="sd-trend-label">{d[labelKey]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Sales Dashboard ─────────────────────────────────────────────────
export default function SalesDashboard() {
  const [data] = useState(DEMO_DATA);
  const [period, setPeriod] = useState('today');

  const kpiCards = [
    { icon: FaDollarSign,    label: 'Total Sales',          value: fmt(data.totalSales),    color: '#F97316' },
    { icon: FaCalendarDay,   label: "Today's Sales",        value: fmt(data.todaySales),    trend: data.todayTrend,   color: '#3B82F6' },
    { icon: FaCalendarWeek,  label: 'Weekly Sales',         value: fmt(data.weeklySales),   trend: data.weeklyTrend,  color: '#8B5CF6' },
    { icon: FaCalendarAlt,   label: 'Monthly Sales',        value: fmt(data.monthlySales),  trend: data.monthlyTrend, color: '#10B981' },
    { icon: FaShoppingCart,  label: 'Total Orders',         value: data.totalOrders.toLocaleString(), color: '#F59E0B' },
    { icon: FaUtensils,      label: 'Dine-In Orders',       value: data.dineInOrders.toLocaleString(), sub: `${Math.round(data.dineInOrders / data.totalOrders * 100)}% of total`, color: '#EF4444' },
    { icon: FaStore,         label: 'Takeaway Orders',      value: data.takeawayOrders.toLocaleString(), sub: `${Math.round(data.takeawayOrders / data.totalOrders * 100)}% of total`, color: '#06B6D4' },
    { icon: FaBicycle,       label: 'Delivery Orders',      value: data.deliveryOrders.toLocaleString(), sub: `${Math.round(data.deliveryOrders / data.totalOrders * 100)}% of total`, color: '#84CC16' },
    { icon: FaCalculator,    label: 'Avg. Order Value',     value: `$${data.avgOrderValue}`, color: '#F97316' },
  ];

  return (
    <div className="sd-page">

      {/* ── Header ── */}
      <div className="sd-header">
        <div>
          <h1 className="sd-title"><FaChartBar /> Sales Dashboard</h1>
          <p className="sd-subtitle">Real-time insights into your POS performance</p>
        </div>
        <div className="sd-period-tabs">
          {['today', 'week', 'month', 'year'].map(p => (
            <button
              key={p}
              className={`sd-period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="sd-kpi-grid">
        {kpiCards.map((c, i) => (
          <SalesKPICard key={c.label} {...c} index={i} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="sd-charts-row">
        <TrendChart
          data={data.dailyTrend}
          valueKey="sales"
          labelKey="day"
          title="📉 Weekly Sales Trend"
        />
        <BarChart
          data={data.hourlySales}
          valueKey="sales"
          labelKey="hour"
          title="📈 Hourly Sales (Today)"
        />
      </div>

      {/* ── Bottom Row ── */}
      <div className="sd-bottom-row">

        {/* Best Selling Items */}
        <div className="sd-widget">
          <h3 className="sd-widget-title"><FaMedal /> Best Selling Items</h3>
          <div className="sd-best-list">
            {data.bestSellingItems.map(item => (
              <div key={item.rank} className="sd-best-item">
                <span className={`sd-rank rank-${item.rank}`}>{item.rank}</span>
                <div className="sd-best-body">
                  <p className="sd-best-name">{item.name}</p>
                  <div className="sd-best-bar-wrap">
                    <div
                      className="sd-best-bar"
                      style={{ width: `${(item.qty / data.bestSellingItems[0].qty) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="sd-best-stats">
                  <span className="sd-best-qty">{item.qty.toLocaleString()} sold</span>
                  <span className="sd-best-rev">{fmt(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="sd-widget">
          <h3 className="sd-widget-title"><FaTags /> Top Categories</h3>
          <div className="sd-categories">
            {data.topCategories.map(cat => (
              <div key={cat.name} className="sd-cat-row">
                <span className="sd-cat-name">{cat.name}</span>
                <div className="sd-cat-bar-wrap">
                  <div className="sd-cat-bar" style={{ width: `${cat.pct}%`, background: cat.color }} />
                </div>
                <span className="sd-cat-pct">{cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="sd-widget">
          <h3 className="sd-widget-title"><FaCreditCard /> Payment Methods</h3>
          <div className="sd-payment-list">
            {data.paymentSummary.map(pay => (
              <div key={pay.method} className="sd-pay-row">
                <div className="sd-pay-icon" style={{ background: `${pay.color}18`, color: pay.color }}>
                  <pay.icon />
                </div>
                <div className="sd-pay-body">
                  <div className="sd-pay-header">
                    <span className="sd-pay-method">{pay.method}</span>
                    <span className="sd-pay-pct" style={{ color: pay.color }}>{pay.pct}%</span>
                  </div>
                  <div className="sd-pay-bar-wrap">
                    <div className="sd-pay-bar" style={{ width: `${pay.pct}%`, background: pay.color }} />
                  </div>
                  <span className="sd-pay-amount">{fmt(pay.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
