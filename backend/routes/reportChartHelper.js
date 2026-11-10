/**
 * Helper to generate shared chart specification for backend report exports (PDF / Excel)
 */

function getSharedReportChartSpec(cleanRows = [], reportKey = "", reportTitle = "", fromDate = "", availablePaymodes = []) {
  const isTransaction = reportKey === "Transaction";
  const isPaymode = reportKey === "Paymode";
  const isAnalysis = reportKey === "Analysis";
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

  // ✅ Dynamic Paymode Collection Report
  if (isPaymode) {
    const paymodeCols = (availablePaymodes && availablePaymodes.length > 0)
      ? availablePaymodes
      : Object.keys(cleanRows[0] || {}).filter(k => k !== 'Date' && k !== 'Total' && k !== 'SortDate' && !k.startsWith('is'));

    const items = paymodeCols.map(pm => {
      const val = cleanRows.reduce((sum, r) => sum + (parseFloat(r[pm]) || 0), 0);
      return {
        label: pm,
        value: Number(val.toFixed(2)),
      };
    }).filter(it => it.value > 0);

    return {
      defaultType: "donut",
      chartHeading: reportTitle || "Payment Collection Breakdown",
      items,
      paymodeCols,
    };
  }

  // ✅ Dynamic Sales Performance Report (Analysis) Paymode Breakdown
  if (isAnalysis) {
    const paymodeCols = (availablePaymodes && availablePaymodes.length > 0)
      ? availablePaymodes
      : Object.keys(cleanRows[0] || {}).filter(k => k !== 'Date' && k !== 'CategoryName' && k !== 'Bills' && k !== 'Pax' && k !== 'Sub Total' && k !== 'Discount' && k !== 'SVC' && k !== 'GST' && k !== 'Net Total' && k !== 'Avg/Bill' && k !== 'Avg/Pax' && k !== 'Total' && k !== 'SortDate' && !k.startsWith('is'));

    if (paymodeCols.length > 0) {
      const items = paymodeCols.map(pm => {
        const val = cleanRows.reduce((sum, r) => sum + (parseFloat(r[pm]) || 0), 0);
        return {
          label: pm,
          value: Number(val.toFixed(2)),
        };
      }).filter(it => it.value > 0);

      if (items.length > 0) {
        return {
          defaultType: "donut",
          chartHeading: `${reportTitle || "Sales Performance"} - Payment Breakdown`,
          items,
          paymodeCols,
        };
      }
    }
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

