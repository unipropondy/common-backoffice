/**
 * Helper to generate shared chart specification for backend report exports (PDF / Excel)
 */

function getSharedReportChartSpec(cleanRows = [], reportKey = "", reportTitle = "", fromDate = "") {
  const isTransaction = reportKey === "Transaction";
  const isPaymode = reportKey === "Paymode";
  const isHourly = reportKey === "Hourly";
  const isQtyBased =
    reportKey === "Qty" ||
    reportKey === "QtyGroup" ||
    reportKey === "QtyDetail";

  if (isTransaction) {
    const totalCashIn = cleanRows.reduce(
      (sum, r) => sum + (parseFloat(r.CashIn || r.Cash_In) || 0),
      0
    );
    const totalCashOut = cleanRows.reduce(
      (sum, r) => sum + (parseFloat(r.CashOut || r.Cash_Out) || 0),
      0
    );
    const items = [];
    if (totalCashIn > 0) {
      items.push({
        label: "Cash In",
        value: Number(totalCashIn.toFixed(2)),
      });
    }
    if (totalCashOut > 0) {
      items.push({
        label: "Cash Out",
        value: Number(totalCashOut.toFixed(2)),
      });
    }
    return {
      defaultType: "donut",
      chartHeading: reportTitle || "Transaction Cash Overview",
      items,
    };
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

    const hasPaymentModeCol = cleanRows.some(
      (r) => r.PaymentMode || r.Paymentmode || r.Paymode
    );

    let items = [];
    if (hasPaymentModeCol) {
      const modeMap = {};
      cleanRows.forEach((r) => {
        const mode = r.PaymentMode || r.Paymentmode || r.Paymode || "Other";
        const amt =
          parseFloat(r.Amount || r.TotalAmount || r.NetSales || r.Total || 0) || 0;
        modeMap[mode] = (modeMap[mode] || 0) + amt;
      });
      items = Object.keys(modeMap)
        .map((label) => ({
          label,
          value: Number(modeMap[label].toFixed(2)),
        }))
        .filter((it) => it.value > 0);
    } else {
      items = modes
        .map((m) => {
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
          };
        })
        .filter((it) => it.value > 0);
    }

    return {
      defaultType: "donut",
      chartHeading: reportTitle || "Payment Collection Breakdown",
      items,
    };
  }

  // Hourly Report
  if (isHourly) {
    const items = cleanRows.map((r, idx) => {
      const label = r.Hour || r.Time || (r.HourStr ? `${r.HourStr}:00` : `#${idx + 1}`);
      const dateLabel = r.Date || r.InvoiceDate || fromDate || "";
      const val =
        parseFloat(
          r.Sales ||
            r.Amount ||
            r.SalesAmount ||
            r.NetSales ||
            r.TotalAmount ||
            r.NetTotal ||
            r.TotalSales ||
            0
        ) || 0;
      return {
        label: String(label).trim(),
        dateLabel: String(dateLabel).trim(),
        value: Number(val.toFixed(2)),
      };
    });

    return {
      defaultType: "line",
      chartHeading: `${reportTitle || "Hourly Sales"} Trend`,
      items,
    };
  }

  // General Reports
  const items = cleanRows.map((r, idx) => {
    const label =
      r.Item ||
      r.DishName ||
      r.Dishname ||
      r.Dish ||
      r.Date ||
      r.InvoiceDate ||
      r.BillDate ||
      r.CategoryName ||
      r.Category ||
      r.DishGroupName ||
      r.DishGroup ||
      r.Group ||
      r.Month ||
      r.Period ||
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
        r.LineAmount ||
        r.SubTotal ||
        r.Total ||
        r.Qty ||
        0;

    const val = parseFloat(rawVal) || 0;
    const dateLabel = r.Date || r.InvoiceDate || "";

    return {
      label: String(label).trim(),
      dateLabel: String(dateLabel).trim(),
      value: Number(val.toFixed(2)),
    };
  });

  return {
    defaultType: "bar",
    chartHeading: `${reportTitle || "Sales"} Overview`,
    items,
  };
}

module.exports = {
  getSharedReportChartSpec,
};

