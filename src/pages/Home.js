import { useEffect, useState } from "react";
import "./Home.css";
import { BASE_URL } from "../config/api";
import { useNavigate } from "react-router-dom";
import {
  FaUtensils, FaTags, FaLayerGroup, FaClipboardList,
  FaChartLine, FaCheckCircle
} from "react-icons/fa";

// ── Enterprise KPI Card ──────────────────────────────────────────────────
function KPICard({ title, total, active, inactive, icon: Icon, onClick, color, index }) {
  return (
    <div
      className="ent-kpi-card animate-fade-up"
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms`, '--card-accent': color }}
    >
      <div className="ent-kpi-header">
        <h3 className="ent-kpi-title">{title}</h3>
        <div className="ent-kpi-icon-wrap" style={{ color: color }}>
          {Icon && <Icon />}
        </div>
      </div>

      <div className="ent-kpi-body">
        <div className="ent-kpi-value-wrap">
          <span className="ent-kpi-value">{total ?? '—'}</span>
          <span className="ent-kpi-unit">Total</span>
        </div>
      </div>

      <div className="ent-kpi-footer">
        <div className="ent-stat-pill success">
          <FaCheckCircle className="ent-stat-icon" />
          <span>{active ?? 0} Active</span>
        </div>
        <div className="ent-stat-pill neutral">
          <span>{inactive ?? 0} Inactive</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/dashboard`)
      .then(res => res.json())
      .then(res => { setData(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpiCards = [
    { title: "Kitchen Master", total: data?.kitchen_total, active: data?.kitchen_active, inactive: data?.kitchen_inactive, icon: FaUtensils, color: '#F97316', onClick: () => navigate('/Contact') },
    { title: "Category Master", total: data?.category_total, active: data?.category_active, inactive: data?.category_inactive, icon: FaTags, color: '#3B82F6', onClick: () => navigate('/About') },
    { title: "Dish Group Master", total: data?.dishgroup_total, active: data?.dishgroup_active, inactive: data?.dishgroup_inactive, icon: FaLayerGroup, color: '#8B5CF6', onClick: () => navigate('/DishGroup') },
    { title: "Dish Master", total: data?.dish_total, active: data?.dish_active, inactive: data?.dish_inactive, icon: FaClipboardList, color: '#10B981', onClick: () => navigate('/Dish') },
  ];

  return (
    <div className="ent-dashboard">

      {/* ── Compact Enterprise Header ── */}
      {/* <div className="ent-header">
        <div className="ent-header-left">
          <h1 className="ent-page-title">Dashboard Overview</h1>
          <div className="ent-breadcrumbs">
            <span>Home</span> <span className="ent-separator">/</span> <span className="ent-current">Dashboard</span>
            <span className="ent-separator">•</span> <span className="ent-date">{dateStr}</span>
          </div>
        </div> */}
      {/* <div className="ent-header-right">
          <button className="btn-outline ent-action-btn" onClick={() => navigate('/SalesDashboard')}>
            <FaChartLine /> View Sales Dashboard
          </button>
        </div> */}
      {/* </div> */}

      {/* ── KPI Cards ── */}
      <section className="ent-section">
        {loading ? (
          <div className="ent-loading-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="ent-kpi-skeleton" />)}
          </div>
        ) : (
          <div className="ent-kpi-grid">
            {kpiCards.map((card, i) => (
              <KPICard key={card.title} {...card} index={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}