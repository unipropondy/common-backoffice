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
  "#6366f1", // Indigo
  "#84cc16", // Lime
  "#d97706", // Ochre
  "#0284c7", // Light Blue
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
  availablePaymodes = [],
  paymodeData = null,
  paymodeDateWise = [],
}) {
  const [internalViewType, setInternalViewType] = useState(null);

  const isTransaction = reportKey === "Transaction";
  const isPaymode = reportKey === "Paymode";
  const isAnalysis = reportKey === "Analysis";

  // Effective chart type
  const activeType =
    internalViewType ||
    chartType ||
    (isTransaction || isPaymode || isAnalysis ? "donut" : "bar");

  const handleTypeChange = (newType) => {
    setInternalViewType(newType);
    if (onChartTypeChange) {
      onChartTypeChange(newType);
    }
  };

  // 1. Process data for Multi-series / Donut / Bar / Line
  const { chartItems, totalValue, isCountMetric, dynamicModes, dateWiseSeries } = useMemo(() => {
    const cleanRows = (Array.isArray(data) ? data : []).filter(
      (r) =>
        r &&
        !r.isTotalRow &&
        !r.isGrandTotal &&
        !r.isCategoryHeader &&
        !r.isDishGroupHeader &&
        !r.isSpacer &&
        r.Date !== "Grand Total:" &&
        r.Date !== "TOTAL"
    );

    // Dynamic Paymodes list resolution
    const detectedModes =
      availablePaymodes && availablePaymodes.length > 0
        ? availablePaymodes
        : (isPaymode && cleanRows.length > 0)
        ? Object.keys(cleanRows[0]).filter(
            (k) =>
              k !== "Date" &&
              k !== "Total" &&
              k !== "SortDate" &&
              !k.startsWith("is")
          )
        : paymodeData
        ? Object.keys(paymodeData).filter(
            (k) =>
              k !== "Date" &&
              k !== "Total" &&
              k !== "SortDate" &&
              !k.startsWith("is")
          )
        : [];

    // Date-wise multi-series data source
    const rawDateWise =
      isPaymode
        ? cleanRows
        : isAnalysis && paymodeDateWise && paymodeDateWise.length > 0
        ? paymodeDateWise
        : cleanRows;

    const dateWise = rawDateWise.map((r) => {
      const rowDate = r.Date || r.InvoiceDate || "-";
      const modeAmounts = {};
      detectedModes.forEach((pm) => {
        modeAmounts[pm] = parseFloat(r[pm] || 0) || 0;
      });
      return {
        date: rowDate,
        total: parseFloat(r.Total || 0) || Object.values(modeAmounts).reduce((a, b) => a + b, 0),
        modes: modeAmounts,
      };
    });

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
      return { chartItems: items, totalValue: total, isCountMetric: false, dynamicModes: [], dateWiseSeries: [] };
    }

    if (isPaymode || (isAnalysis && detectedModes.length > 0)) {
      // Aggregate totals for each Paymode dynamically
      const items = detectedModes
        .map((pm, idx) => {
          let val = 0;
          if (isPaymode) {
            val = cleanRows.reduce(
              (sum, r) => sum + (parseFloat(r[pm]) || 0),
              0
            );
          } else if (isAnalysis) {
            if (paymodeData && paymodeData[pm] !== undefined) {
              val = parseFloat(paymodeData[pm]) || 0;
            } else {
              val = rawDateWise.reduce(
                (sum, r) => sum + (parseFloat(r[pm]) || 0),
                0
              );
            }
          }
          return {
            label: pm,
            value: Number(val.toFixed(2)),
            color: PALETTE[idx % PALETTE.length],
          };
        })
        .filter((it) => it.value > 0);

      const total = items.reduce((sum, it) => sum + it.value, 0);
      return {
        chartItems: items,
        totalValue: total,
        isCountMetric: false,
        dynamicModes: detectedModes,
        dateWiseSeries: dateWise,
      };
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
        r.CategoryName ||
        r.Group ||
        `#${idx + 1}`;
      const val =
        parseFloat(
          isQtyBased
            ? r.Qty || r.Quantity || r.TotalQty || 0
            : r.Amount ||
              r.SalesAmount ||
              r.TotalAmount ||
              r.NetSales ||
              r.Total ||
              0
        ) || 0;
      return {
        label: String(label).trim(),
        value: Number(val.toFixed(2)),
        color: PALETTE[idx % PALETTE.length],
      };
    });

    const total = items.reduce((sum, it) => sum + it.value, 0);
    return {
      chartItems: items,
      totalValue: total,
      isCountMetric: isQtyBased,
      dynamicModes: [],
      dateWiseSeries: [],
    };
  }, [data, reportKey, isTransaction, isPaymode, isAnalysis, availablePaymodes, paymodeData, paymodeDateWise]);

  // Max value for single series
  const maxValue = useMemo(() => {
    if (!chartItems || chartItems.length === 0) return 0;
    return Math.max(...chartItems.map((it) => it.value), 0);
  }, [chartItems]);

  // Max value for multi-series date-wise
  const maxDateWiseTotal = useMemo(() => {
    if (!dateWiseSeries || dateWiseSeries.length === 0) return 0;
    return Math.max(...dateWiseSeries.map((d) => d.total), 1);
  }, [dateWiseSeries]);

  // Render Dynamic Donut Chart
  const renderDonut = () => {
    if (chartItems.length === 0 || totalValue === 0) {
      return (
        <div className="sales-chart-empty">No data available for chart</div>
      );
    }

    const size = 260;
    const center = size / 2;
    const radius = 100;
    const innerRadius = 60;

    let accumulatedAngle = -Math.PI / 2;

    const slices = chartItems.map((item, idx) => {
      const fraction = totalValue > 0 ? item.value / totalValue : 0;
      const angle = fraction * 2 * Math.PI;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const x3 = center + innerRadius * Math.cos(endAngle);
      const y3 = center + innerRadius * Math.sin(endAngle);
      const x4 = center + innerRadius * Math.cos(startAngle);
      const y4 = center + innerRadius * Math.sin(startAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const pathData =
        chartItems.length === 1
          ? `M ${center - radius}, ${center} A ${radius} ${radius} 0 1 0 ${
              center + radius
            } ${center} A ${radius} ${radius} 0 1 0 ${
              center - radius
            } ${center} M ${center - innerRadius}, ${center} A ${innerRadius} ${innerRadius} 0 1 1 ${
              center + innerRadius
            } ${center} A ${innerRadius} ${innerRadius} 0 1 1 ${
              center - innerRadius
            } ${center}`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

      const pct = (fraction * 100).toFixed(1);
      return {
        ...item,
        pathData,
        pct,
        color: item.color || PALETTE[idx % PALETTE.length],
      };
    });

    return (
      <div className="sales-donut-container">
        <div className="sales-donut-svg-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice, i) => (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth="2"
                className="sales-donut-slice"
              >
                <title>{`${slice.label}: ${formatCurrency(slice.value)} (${slice.pct}%)`}</title>
              </path>
            ))}
          </svg>
          <div className="sales-donut-center-badge">
            <span className="sales-donut-center-title">Total</span>
            <span className="sales-donut-center-value">
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

  // Render Bar Chart (Supports multi-series grouped by date for Paymode/Analysis)
  const renderBars = () => {
    if ((isPaymode || isAnalysis) && dateWiseSeries.length > 0 && dynamicModes.length > 0) {
      // Grouped Multi-Paymode Bar Chart by Date
      return (
        <div className="sales-chart-multi-wrap">
          <div className="sales-chart-scroll-wrap">
            <div className="sales-bar-container">
              {dateWiseSeries.map((item, idx) => {
                return (
                  <div key={idx} className="sales-bar-col" style={{ minWidth: `${Math.max(dynamicModes.length * 18, 70)}px` }}>
                    <div className="sales-bar-fill-wrap" style={{ display: "flex", alignItems: "flex-end", gap: "2px" }}>
                      {dynamicModes.map((pm, pmIdx) => {
                        const amt = item.modes[pm] || 0;
                        const heightPct = Math.max((amt / maxDateWiseTotal) * 100, amt > 0 ? 3 : 0);
                        const pmColor = PALETTE[pmIdx % PALETTE.length];
                        return (
                          <div
                            key={pmIdx}
                            style={{
                              width: "12px",
                              height: `${heightPct}%`,
                              backgroundColor: pmColor,
                              borderRadius: "2px 2px 0 0",
                              transition: "height 0.3s ease",
                              position: "relative",
                            }}
                            title={`Date: ${item.date} | ${pm}: ${formatCurrency(amt)}`}
                          />
                        );
                      })}
                    </div>
                    <span className="sales-bar-label" title={item.date}>
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Dynamic Legend */}
          <div className="sales-multi-legend" style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px", justifyContent: "center" }}>
            {dynamicModes.map((pm, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: PALETTE[i % PALETTE.length], marginRight: "5px" }} />
                {pm}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default Single Series Bar Chart
    return (
      <div className="sales-chart-scroll-wrap">
        <div className="sales-bar-container">
          {chartItems.map((item, idx) => {
            const heightPct = Math.max((item.value / maxValue) * 100, 3);
            return (
              <div key={idx} className="sales-bar-col">
                <div className="sales-bar-fill-wrap">
                  <div className="sales-bar-tooltip">
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

  // Render SVG Line Chart (Multi-line for Paymode/Analysis date-wise, single-line otherwise)
  const renderLine = () => {
    if ((isPaymode || isAnalysis) && dateWiseSeries.length > 1 && dynamicModes.length > 0) {
      const width = 1000;
      const height = 240;
      const paddingX = 40;
      const paddingY = 30;
      const innerWidth = width - paddingX * 2;
      const innerHeight = height - paddingY * 2;

      // Lines per paymode
      const lines = dynamicModes.map((pm, pmIdx) => {
        const color = PALETTE[pmIdx % PALETTE.length];
        const points = dateWiseSeries.map((d, i) => {
          const amt = d.modes[pm] || 0;
          const x = paddingX + (i / (dateWiseSeries.length - 1)) * innerWidth;
          const y = height - paddingY - (maxDateWiseTotal > 0 ? (amt / maxDateWiseTotal) * innerHeight : 0);
          return { x, y, amt, date: d.date, pm };
        });
        const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
        return { pm, color, points, polyline };
      });

      return (
        <div className="sales-chart-multi-wrap">
          <div className="sales-chart-scroll-wrap">
            <div className="sales-line-svg-wrap" style={{ minWidth: `${Math.max(dateWiseSeries.length * 60, 600)}px` }}>
              <svg viewBox={`0 0 ${width} ${height}`} className="sales-line-svg" preserveAspectRatio="none">
                <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1.5" />

                {lines.map((line, li) => (
                  <polyline
                    key={li}
                    points={line.polyline}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {lines.map((line) =>
                  line.points.map((p, pi) => (
                    <circle
                      key={`${line.pm}-${pi}`}
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#ffffff"
                      stroke={line.color}
                      strokeWidth="2"
                    >
                      <title>{`Date: ${p.date} | ${line.pm}: ${formatCurrency(p.amt)}`}</title>
                    </circle>
                  ))
                )}
              </svg>
            </div>
          </div>
          {/* Legend */}
          <div className="sales-multi-legend" style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px", justifyContent: "center" }}>
            {dynamicModes.map((pm, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: PALETTE[i % PALETTE.length], marginRight: "5px" }} />
                {pm}
              </div>
            ))}
          </div>
        </div>
      );
    }

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
        <div
          className="sales-line-svg-wrap"
          style={{ minWidth: `${Math.max(chartItems.length * 48, 600)}px` }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="sales-line-svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineSalesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff7f27" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ff7f27" stopOpacity="0.02" />
              </linearGradient>
            </defs>
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

            <polygon points={areaPoints} fill="url(#lineSalesGrad)" />

            <polyline
              points={polyline}
              fill="none"
              stroke="#ff7f27"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#ff7f27"
                  strokeWidth="2.5"
                >
                  <title>{`${p.label}: ${
                    isCountMetric
                      ? `${p.value.toLocaleString()} Qty`
                      : formatCurrency(p.value)
                  }`}</title>
                </circle>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="sales-report-chart-card">
      <div className="sales-chart-card-header">
        <div>
          <h4 className="sales-chart-heading">
            {reportTitle || "Report Performance Visual"}
          </h4>
          <span className="sales-chart-sub">
            {fromDate && toDate
              ? `${fromDate} to ${toDate}`
              : "Visual breakdown of current records"}
          </span>
        </div>

        {/* Chart View Switcher */}
        <div className="sales-chart-type-tabs">
          <button
            type="button"
            className={`sales-chart-tab-btn ${
              activeType === "donut" ? "active" : ""
            }`}
            onClick={() => handleTypeChange("donut")}
            title="Donut Breakdown"
          >
            <FaChartPie /> Donut
          </button>
          <button
            type="button"
            className={`sales-chart-tab-btn ${
              activeType === "bar" ? "active" : ""
            }`}
            onClick={() => handleTypeChange("bar")}
            title="Bar Chart"
          >
            <FaChartBar /> Bar
          </button>
          <button
            type="button"
            className={`sales-chart-tab-btn ${
              activeType === "line" ? "active" : ""
            }`}
            onClick={() => handleTypeChange("line")}
            title="Line Trend"
          >
            <FaChartLine /> Line
          </button>
        </div>
      </div>

      <div className="sales-chart-body">
        {activeType === "donut" && renderDonut()}
        {activeType === "bar" && renderBars()}
        {activeType === "line" && renderLine()}
      </div>
    </div>
  );
}
