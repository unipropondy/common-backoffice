import React, { useMemo, useState } from "react";
import "./SalesReportChart.css";
import { FaChartBar, FaChartLine, FaChartPie } from "react-icons/fa";

const PALETTE = [
  "#ff7f27", // Primary Orange
  "#2563eb", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#64748b", // Slate
  "#14b8a6", // Teal
  "#e11d48", // Rose
];

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function SalesReportChart({
  reportKey,
  reportTitle,
  data = [],
  fromDate,
  toDate,
  chartType,
  onChartTypeChange,
}) {
  const [internalViewType, setInternalViewType] = useState(null);

  const isTransaction = reportKey === "Transaction";
  const isPaymode = reportKey === "Paymode";

  // Effective chart type
  const activeType =
    internalViewType ||
    chartType ||
    (isTransaction || isPaymode ? "donut" : "bar");

  const handleTypeChange = (newType) => {
    setInternalViewType(newType);
    if (onChartTypeChange) {
      onChartTypeChange(newType);
    }
  };

  // Process data based on reportKey
  const { chartItems, totalValue, isCountMetric } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { chartItems: [], totalValue: 0, isCountMetric: false };
    }

    const cleanRows = data.filter(
      (r) =>
        r &&
        !r.isTotalRow &&
        !r.isGrandTotal &&
        !r.isCategoryHeader &&
        !r.isDishGroupHeader &&
        !r.isSpacer
    );

    if (isTransaction) {
      const totalCashIn = cleanRows.reduce(
        (sum, r) => sum + (parseFloat(r.CashIn || r.Cash_In) || 0),
        0
      );
      const totalCashOut = cleanRows.reduce(
        (sum, r) => sum + (parseFloat(r.CashOut || r.Cash_Out) || 0),
        0
      );
      const total = totalCashIn + totalCashOut;
      const items = [];
      if (totalCashIn > 0) {
        items.push({
          label: "Cash In",
          value: totalCashIn,
          color: "#10b981",
        });
      }
      if (totalCashOut > 0) {
        items.push({
          label: "Cash Out",
          value: totalCashOut,
          color: "#ef4444",
        });
      }
      return { chartItems: items, totalValue: total, isCountMetric: false };
    }

    if (isPaymode) {
      const modes = [
        { label: "Cash", keys: ["Cash", "cash"] },
        { label: "NETS", keys: ["Nets", "NETS", "nets"] },
        { label: "PayNow", keys: ["PayNow", "Paynow", "paynow"] },
        { label: "UPI", keys: ["UPI", "Upi", "upi"] },
        { label: "Member", keys: ["Member", "member"] },
        { label: "Credit Card", keys: ["Credit", "credit", "CreditCard"] },
        { label: "Online", keys: ["Online", "online"] },
        {
          label: "YeahPay PayNow",
          keys: ["YeahPay_PayNow", "Yeahpay_Paynow", "YeahPayPayNow"],
        },
        {
          label: "YeahPay Card",
          keys: ["YeahPay_Card", "Yeahpay_Card", "YeahPayCard"],
        },
      ];

      // Check if data is already grouped by mode column (rows have PaymentMode and Amount)
      const hasPaymentModeCol = cleanRows.some(
        (r) => r.PaymentMode || r.Paymentmode || r.Paymode
      );

      let items = [];
      if (hasPaymentModeCol) {
        const modeMap = {};
        cleanRows.forEach((r) => {
          const mode =
            r.PaymentMode || r.Paymentmode || r.Paymode || "Other";
          const amt =
            parseFloat(r.Amount || r.TotalAmount || r.NetSales || r.Total || 0) ||
            0;
          modeMap[mode] = (modeMap[mode] || 0) + amt;
        });
        items = Object.keys(modeMap)
          .map((label, idx) => ({
            label,
            value: Number(modeMap[label].toFixed(2)),
            color: PALETTE[idx % PALETTE.length],
          }))
          .filter((it) => it.value > 0);
      } else {
        items = modes
          .map((m, idx) => {
            const val = cleanRows.reduce((sum, r) => {
              let v = 0;
              for (const k of m.keys) {
                if (r[k] !== undefined && r[k] !== null) {
                  v = parseFloat(r[k]) || 0;
                  break;
                }
              }
              return sum + v;
            }, 0);
            return {
              label: m.label,
              value: Number(val.toFixed(2)),
              color: PALETTE[idx % PALETTE.length],
            };
          })
          .filter((it) => it.value > 0);
      }

      const total = items.reduce((sum, it) => sum + it.value, 0);
      return { chartItems: items, totalValue: total, isCountMetric: false };
    }

    // General Reports (Hourly, Daywise, Group, Itemwise, TopNItems, etc.)
    const isQtyBased =
      reportKey === "Qty" ||
      reportKey === "QtyGroup" ||
      reportKey === "QtyDetail";

    const items = cleanRows.map((r, idx) => {
      const label =
        r.Item ||
        r.DishName ||
        r.Dishname ||
        r.Dish ||
        r.Hour ||
        r.Time ||
        r.Date ||
        r.InvoiceDate ||
        r.BillDate ||
        r.Month ||
        r.CategoryName ||
        r.Category ||
        r.DishGroupName ||
        r.DishGroup ||
        r.Group ||
        r.BusinessType ||
        r.MealPeriod ||
        r.Description ||
        `#${idx + 1}`;

      const rawVal = isQtyBased
        ? r.Qty || r.Sold || r.Quantity || r.Amount || 0
        : r.Amount ||
          r.SalesAmount ||
          r.NetSales ||
          r.TotalAmount ||
          r.NetTotal ||
          r.TotalSales ||
          r.SubTotal ||
          r.Total ||
          r.Qty ||
          0;

      const value = parseFloat(rawVal) || 0;
      return {
        label: String(label).trim(),
        value: Number(value.toFixed(2)),
        color: PALETTE[idx % PALETTE.length],
      };
    });

    const total = items.reduce((sum, it) => sum + it.value, 0);
    return {
      chartItems: items,
      totalValue: total,
      isCountMetric: isQtyBased,
    };
  }, [data, reportKey, isTransaction, isPaymode]);

  if (!chartItems || chartItems.length === 0) {
    return (
      <div className="sales-chart-card">
        <div className="sales-chart-header">
          <div className="sales-chart-title-area">
            <h3 className="sales-chart-title">{reportTitle || "Sales Visual Overview"}</h3>
            {fromDate && toDate && (
              <span className="sales-chart-period">
                Period: {fromDate} ~ {toDate}
              </span>
            )}
          </div>
        </div>
        <div className="sales-chart-empty">
          <span>📊 No visual chart data available for the selected criteria</span>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartItems.map((d) => d.value), 1);

  // SVG calculations for Donut Chart
  const renderDonut = () => {
    const size = 200;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPct = 0;
    const slices = chartItems.map((item) => {
      const pct = totalValue > 0 ? item.value / totalValue : 0;
      const strokeDashoffset = circumference * (1 - pct);
      const rotation = accumulatedPct * 360 - 90;
      accumulatedPct += pct;

      return {
        ...item,
        pct: Number((pct * 100).toFixed(1)),
        strokeDashoffset,
        strokeDasharray: circumference,
        rotation,
      };
    });

    return (
      <div className="sales-chart-donut-layout">
        <div className="sales-chart-donut-visual">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice, i) => (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                transform={`rotate(${slice.rotation} ${size / 2} ${size / 2})`}
                style={{
                  transition: "stroke-dashoffset 0.5s ease",
                }}
              />
            ))}
          </svg>
          <div className="sales-chart-donut-center">
            <span className="sales-chart-donut-center-label">Total</span>
            <span className="sales-chart-donut-center-val">
              {isCountMetric ? totalValue.toLocaleString() : formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        <div className="sales-chart-legend">
          {slices.map((slice, i) => (
            <div key={i} className="sales-chart-legend-item">
              <span className="sales-chart-legend-key">
                <span
                  className="sales-chart-color-dot"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <div className="sales-chart-legend-stats">
                <span className="sales-chart-legend-amt">
                  {isCountMetric
                    ? slice.value.toLocaleString()
                    : formatCurrency(slice.value)}
                </span>
                <span className="sales-chart-legend-pct">{slice.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Bar Chart
  const renderBars = () => {
    return (
      <div className="sales-chart-scroll-wrap">
        <div className="sales-bar-container">
          {chartItems.map((item, idx) => {
            const heightPct = Math.max((item.value / maxValue) * 100, 3);
            return (
              <div key={idx} className="sales-bar-col">
                <div className="sales-bar-fill-wrap">
                  <div
                    className="sales-bar-tooltip"
                  >
                    <div>{item.label}</div>
                    <div>
                      {isCountMetric
                        ? `${item.value.toLocaleString()} Qty`
                        : formatCurrency(item.value)}
                    </div>
                  </div>
                  <div
                    className="sales-bar-fill"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: item.color || "#ff7f27",
                    }}
                  />
                </div>
                <span className="sales-bar-label" title={item.label}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render SVG Line Chart
  const renderLine = () => {
    if (chartItems.length < 2) {
      return renderBars();
    }

    const width = 1000;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;

    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;

    const points = chartItems.map((d, i) => {
      const x = paddingX + (i / (chartItems.length - 1)) * innerWidth;
      const y =
        height -
        paddingY -
        (maxValue > 0 ? (d.value / maxValue) * innerHeight : 0);
      return { ...d, x, y };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
    const areaPoints = `${paddingX},${height - paddingY} ${polyline} ${
      paddingX + innerWidth
    },${height - paddingY}`;

    return (
      <div className="sales-chart-scroll-wrap">
        <div className="sales-line-svg-wrap" style={{ minWidth: `${Math.max(chartItems.length * 48, 600)}px` }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="sales-line-svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineSalesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7f27" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ff7f27" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Horizontal guideline */}
            <line
              x1={paddingX}
              y1={paddingY}
              x2={width - paddingX}
              y2={paddingY}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <line
              x1={paddingX}
              y1={height - paddingY}
              x2={width - paddingX}
              y2={height - paddingY}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />

            {/* Shaded Area */}
            <polygon points={areaPoints} fill="url(#lineSalesGrad)" />

            {/* Line stroke */}
            <polyline
              points={polyline}
              fill="none"
              stroke="#ff7f27"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Circles and values */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#ff7f27"
                  strokeWidth="2.5"
                />
              </g>
            ))}
          </svg>
          <div className="sales-line-labels-x">
            {chartItems.map((item, idx) => (
              <span
                key={idx}
                className="sales-line-x-label"
                style={{ width: `${100 / chartItems.length}%` }}
                title={item.label}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sales-chart-card">
      <div className="sales-chart-header">
        <div className="sales-chart-title-area">
          <h3 className="sales-chart-title">
            <FaChartBar style={{ color: "#ff7f27" }} />
            {reportTitle || "Sales Performance Overview"}
          </h3>
          {fromDate && toDate && (
            <span className="sales-chart-period">
              Period: {fromDate} ~ {toDate}
            </span>
          )}
        </div>

        <div className="sales-chart-controls">
          <div className="sales-chart-kpi-summary">
            <span className="sales-chart-kpi-label">
              {isCountMetric ? "Total Count" : "Total Sales"}:
            </span>
            <span className="sales-chart-kpi-val">
              {isCountMetric
                ? totalValue.toLocaleString()
                : formatCurrency(totalValue)}
            </span>
          </div>

          <div className="sales-chart-type-toggle">
            <button
              type="button"
              className={`sales-chart-toggle-btn ${
                activeType === "bar" ? "active" : ""
              }`}
              onClick={() => handleTypeChange("bar")}
              title="Bar Chart"
            >
              <FaChartBar /> Bar
            </button>
            <button
              type="button"
              className={`sales-chart-toggle-btn ${
                activeType === "line" ? "active" : ""
              }`}
              onClick={() => handleTypeChange("line")}
              title="Line Chart"
            >
              <FaChartLine /> Line
            </button>
            {(isPaymode || isTransaction) && (
              <button
                type="button"
                className={`sales-chart-toggle-btn ${
                  activeType === "donut" ? "active" : ""
                }`}
                onClick={() => handleTypeChange("donut")}
                title="Donut Chart"
              >
                <FaChartPie /> Donut
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sales-chart-body">
        {activeType === "donut"
          ? renderDonut()
          : activeType === "line"
          ? renderLine()
          : renderBars()}
      </div>
    </div>
  );
}

