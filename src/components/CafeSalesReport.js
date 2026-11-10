import { BASE_URL } from "../config/config";
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import "./CafeSalesReport.css";
import SalesReportChart from "./SalesReportChart";

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : (process.env.REACT_APP_API_URL || BASE_URL);
const REPORT_BASE = `${API_BASE}/api/reports`;

const getCompactHeaderLabel = (colName, currentReport = "") => {
  if (!colName) return '';
  const labelMap = {
    InvoiceDate: 'DATE',
    OrderDateTime: 'DATE',
    OrderDate: 'DATE',
    Date: 'DATE',
    Year: 'YEAR',
    Month: 'MONTH',
    MealPeriod: 'PERIOD',
    'Meal Period': 'PERIOD',
    MealPeriodName: 'PERIOD',
    BillNumber: 'BILL NO',
    BillNo: 'BILL NO',
    'No of Bills': 'BILLS',
    Bills: 'BILLS',
    Pax: 'PAX',
    TotalPax: 'PAX',
    OrderId: 'ORDER ID',
    'Order Number': 'ORDER NO',
    DishCode: 'CODE',
    DishName: 'DISH NAME',
    Dishname: 'DISH NAME',
    CategoryName: 'CATEGORY',
    Category: 'CATEGORY',
    DishGroupName: 'ITEM / DISH GROUP',
    DishGroupname: 'ITEM / DISH GROUP',
    DishGroup: 'ITEM / DISH GROUP',
    'Item / Dish Group Name': 'ITEM / DISH GROUP',
    SalesAmount: 'SALES AMOUNT',
    'Sales Amount': 'SALES AMOUNT',
    Quantity: 'QTY',
    Qty: 'QTY',
    Sold: 'QTY',
    Item: 'ITEM',
    SubTotal: 'SUB TOT',
    AvgBill: 'AVG BILL',
    SalesPct: 'SALES %',
    TotalSales: 'TOTAL',
    Type: 'TYPE',
    NetTotal: 'TOTAL',
    PaymentMode: 'PAY MODE',
    NetAmount: 'NET AMOUNT',
    OrderNo: 'ORDER NO',
    Discount: 'DISC',
    ServiceCharge: 'SVC',
    TotalTax: 'GST',
    Tips: 'TIPS',
    GstType: 'GST TYPE',
    TaxableAmount: 'TAXABLE',
    'Taxable Amount': 'TAXABLE',
    Taxable: 'TAXABLE',
    RoundOff: 'RND OFF',
    gst: 'GST',
    'Sub Total': 'SUB TOT',
    Subtotal: 'SUB TOT',
    ItemAmount: 'ITEM AMT',
    Amount: 'AMT',
    Amt: 'AMT',
    TotalDetailLineAmount: 'AMT',
    DishPrice: 'DISH PRICE',
    QtySold: 'QTY SOLD',
    LineAmount: 'AMOUNT',
    ItemDisc: 'ITEM DISC',
    ItemDiscount: 'ITEM DISC',
    BillDisc: 'BILL DISC',
    BillDiscount: 'BILL DISC',
    ItemSales: 'GROSS',
    ContributionPct: 'CONT %',
    TotalDiscount: 'DISC',
    'Service Charge': 'SVC',
    'Total Tax': 'GST 9%',
    TaxTotal: 'GST 9%',
    Tax: 'GST 9%',
    GST: 'GST 9%',
    'GST 9%': 'GST 9%',
    TaxableAmount: 'TAXABLE',
    Taxable: 'TAXABLE',
    'Net Total': 'TOTAL',
    TotalAmount: 'TOTAL',
    TotalSales: 'TOTAL SALES',
    'Total Sales': 'TOTAL SALES',
    'Round Off': 'RND OFF',
    Rounding: 'RND OFF',
    TotalRevenue: 'TOTAL',
    FOC: 'FOC',
    NetSales: 'NET SALES',
    'Total Collection': 'TOTAL COLL',
    TransactionMode: 'MODE',
    TerminalCode: 'TERMINAL',
    GstType: 'GST TYPE',
    Remarks: 'REMARKS',
    Description: 'REMARKS',
    Cash: 'CASH',
    Nets: 'NETS',
    Paynow: 'PAYNOW',
    PayNow: 'PAYNOW',
    UPI: 'UPI',
    Member: 'MEMBER',
    Credit: 'CREDIT',
    Online: 'ONLINE',
    Yeahpay_Paynow: 'YPAYNOW',
    YeahPay_PayNow: 'YPAYNOW',
    Yeahpay_Card: 'YCARD',
    YeahPay_Card: 'YCARD',
    Others: 'OTHERS',
    Cheque: 'CHEQUE',
    Visa: 'VISA',
    Master: 'MASTER',
    Amex: 'AMEX',
    Diners: 'DINERS',
    JCB: 'JCB',
    Total: 'TOTAL',
    BillCount: 'BILL COUNT',
    'Bill Count': 'BILL COUNT',
    Nektar: 'NEKTAR',
    ItemDiscount: 'ITEM DISC',
    BillDiscount: 'BILL DISC',
    DiscountId: 'DISC ID',
    Discountid: 'DISC ID',
    InvoiceNo: 'INV NO',
    No: 'NO',
    Rank: 'RANK',
    SalesAmount: 'SALES AMOUNT',
    QtySold: 'QTY SOLD',
    OrderNo: 'ORDER NO',
    CancelledAmount: 'CANCLED AMT',
    CancelReason: 'REASON',
    CancelledBy: 'CANCELED BY',
    CancelDate: 'DATE',
    CancelTime: 'TIME',
    VoidQty: 'VOID QTY',
    VoidAmount: 'VOID AMT',
    'Qty Sold': 'QTY',
    'Sales Amount': 'AMT',
    'Contribution %': 'CONT %',
    'Void Qty': 'VOID QTY',
    'Void Amount': 'VOID AMT',
    CashIn: 'CASH IN',
    CashOut: 'CASH OUT',
    TransactionNo: 'TRANS NO',
    TransactionType: 'TYPE',
    PaymentMode: 'PAY MODE',
    Reason: 'REASON'
  };
  const clean = colName.trim();
  if (currentReport === "Analysis" && (clean === "CategoryName" || clean === "Category")) {
    return "CATEGORY NAME";
  }
  if (currentReport === "QtyDetail" && (clean === "DishGroup" || clean === "DishGroupName" || clean === "DishGroupname" || clean === "Item / Dish Group Name")) {
    return "DISH";
  }
  if (clean === "Avg/Bill" || clean === "AvgBill") {
    return "AVG/BILL";
  }
  if (clean === "Avg/Pax" || clean === "AvgPax") {
    return "AVG/PAX";
  }
  return labelMap[clean] || labelMap[colName] || clean.toUpperCase();
};

const getColumnAlignment = (colName) => {
  if (!colName) return 'left';
  const c = colName.toLowerCase().replace(/[\s_\-\.]/g, '');

  // Date & Time columns → Center aligned
  if (c === 'date' || c === 'invoicedate' || c === 'orderdate' || c === 'orderdatetime' || c === 'canceldate' || c === 'year' || c === 'month' || c === 'hour' || c === 'time' || c === 'canceltime' || c === 'fromdate' || c === 'todate') {
    return 'center';
  }

  // Numeric / Quantity / Financial / Count columns → Right aligned
  if (
    c === 'qty' || c === 'quantity' || c === 'qtysold' || c === 'sold' ||
    c === 'amount' || c === 'amt' || c === 'salesamount' || c === 'nettotal' || c === 'subtotal' || c === 'netamount' || c === 'totalamount' || c === 'lineamount' || c === 'itemamount' || c === 'totalrevenue' ||
    c === 'voidqty' || c === 'voidamount' || c === 'vqty' || c === 'vamt' ||
    c === 'pax' || c === 'totalpax' || c === 'bills' || c === 'noofbills' || c === 'totalbills' || c === 'billcount' || c === 'discount' || c === 'servicecharge' || c === 'totaltax' || c === 'tax' || c === 'gst' || c === 'roundoff' || c === 'rounding' || c === 'rndoff' || c === 'tips' || c === 'foc' || c === 'netsales' || c === 'itemsales' || c === 'itemdisc' || c === 'billdisc' || c === 'contributionpct' || c === 'salespct' || c === 'contribution%' ||
    c === 'cash' || c === 'nets' || c === 'paynow' || c === 'upi' || c === 'member' || c === 'credit' || c === 'online' || c === 'yeahpaypaynow' || c === 'yeahpaycard' || c === 'others' ||
    c === 'avgbill' || c === 'avgpax' || c === 'avg/bill' || c === 'avg/pax' ||
    c === 'sales' || c === 'rnd' || c === 'digital' || c === 'dishprice' || c === 'rank' || c === 'cancelledamount' || c === 'subtot' || c === 'disc' || c === 'svc' || c === 'taxableamount' || c === 'totaldiscount' || c === 'totalitemdisc' || c === 'totalbilldisc' || c === 'itemdiscount' || c === 'billdiscount' ||
    c === 'cashin' || c === 'cashout'
  ) {
    return 'right';
  }

  // Text/Letter columns (Order ID, Bill Number, Customer Name, Payment Mode, Outlet, Meal Period, Category, Item Name, etc.) → Left aligned
  return 'left';
};

const getIsTextCol = (c) => {
  if (!c) return false;
  const lower = c.toLowerCase().replace(/[\s_\-\.]/g, '');  // strip spaces, underscores, hyphens AND dots
  if (lower === 'discountid' || lower === 'orderid' || lower === 'oderid' || lower === 'billno' || lower === 'billnumber' || lower === 'orderno' || lower === 'orderdatetime' || lower === 'hour' || lower === 'date' || lower === 'time' || lower === 'ordertime' || lower === 'canceltime' || lower === 'invoicedate' || lower === 'canceldate' || lower === 'orderdate') {
    return true;
  }
  const numericKeywords = [
    'noofbills', 'billcount', 'totalbills', 'qty', 'amount', 'total', 'subtotal', 'nettotal', 'discount',
    'servicecharge', 'tax', 'bills', 'pax', 'sales', 'foc', 'tips', 'rnd', 'roundoff',
    'cash', 'cards', 'cheque', 'ledger', 'nektar', 'voucher', 'ent', 'collection',
    'svc', 'disc', 'itemamount', 'totalamount', 'discountamount', 'lineamount',
    'price', 'rate', 'percentage', 'openingstock', 'closingstock', 'pqty', 'prqty', 'sqty', 'srqty',
    // paymode collection columns
    'nets', 'paynow', 'upi', 'member', 'credit', 'online', 'yeahpay', 'others', 'master', 'visa',
    // S.Chrg (service charge shorthand — dot stripped → 'schrg')
    'schrg', 'chrg', 'gst', 'sold', 'digital'
  ];
  return !numericKeywords.some(keyword => lower.includes(keyword));
};

const getIsCountCol = (c) => {
  if (!c) return false;
  const lower = c.toLowerCase().replace(/[\s_\-]/g, '');
  if (lower.includes('discount') || lower.includes('disc')) return false;
  return (
    lower.includes('bills') ||
    lower.includes('qty') ||
    lower.includes('pax') ||
    lower === 'sold' ||
    lower === 'rank' ||
    lower === 'no' ||
    lower.includes('count') ||
    lower.includes('transactions')
  );
};

const formatNumber = (val, isCount = false) => {
  if (val === null || val === undefined || val === '') return '';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return isCount
    ? Math.round(num).toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validateDateNotFuture = (val) => {
  const maxDate = getTodayStr();
  if (val && val > maxDate) {
    return maxDate;
  }
  return val;
};

const STORAGE_KEY = "unipro_sales_report_state";

const loadSavedState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const CafeSalesReport = ({
  salesData = [],
  columns: initialColumns = ["Hour", "Qty", "Amount"],
  sidebarOpen = false
}) => {
  const savedState = useRef(loadSavedState()).current;
  const today = getTodayStr();
  const [fromDate, setFromDateState] = useState(savedState?.fromDate || today);
  const [toDate, setToDateState] = useState(savedState?.toDate || today);

  const setFromDate = (val) => setFromDateState(validateDateNotFuture(val));
  const setToDate = (val) => setToDateState(validateDateNotFuture(val));
  const [columns, setColumns] = useState(initialColumns);
  const [orderSales, setOrderSales] = useState(savedState?.orderSales || "");
  const [dayEnd, setDayEnd] = useState(savedState?.dayEnd || "");
  const [bySales, setBySales] = useState(savedState?.bySales || "");
  const [byItem, setByItem] = useState(savedState?.byItem || "");
  const [systemDate, setSystemDate] = useState(savedState?.systemDate || false);
  const prevDatesRef = useRef({ from: savedState?.fromDate || today, to: savedState?.toDate || today });

  const handleSystemDateChange = (checked) => {
    setSystemDate(checked);
    if (checked) {
      prevDatesRef.current = { from: fromDate, to: toDate };
      const curToday = getTodayStr();
      setFromDate(curToday);
      setToDate(curToday);
    } else {
      if (prevDatesRef.current.from && prevDatesRef.current.to) {
        setFromDate(prevDatesRef.current.from);
        setToDate(prevDatesRef.current.to);
      }
    }
  };

  const handleOrderSalesChange = (val) => {
    setOrderSales(val);
    if (!val) {
      if (systemDate) {
        setSystemDate(false);
        if (prevDatesRef.current.from && prevDatesRef.current.to) {
          setFromDate(prevDatesRef.current.from);
          setToDate(prevDatesRef.current.to);
        }
      }
    }
  };

  const [topNLimit, setTopNLimit] = useState(savedState?.topNLimit || "10"); // Top 10 by default
  const [showChart, setShowChart] = useState(savedState?.showChart || false);
  const [activeShowChart, setActiveShowChart] = useState(savedState?.activeShowChart || false);
  const [selectedChartType, setSelectedChartType] = useState(savedState?.selectedChartType || null); // 'bar' | 'line' | null
  const [appliedFilters, setAppliedFilters] = useState(savedState?.appliedFilters || {
    fromDate: savedState?.fromDate || today,
    toDate: savedState?.toDate || today,
    orderSales: savedState?.orderSales || "",
    dayEnd: savedState?.dayEnd || "",
    bySales: savedState?.bySales || "",
    byItem: savedState?.byItem || "",
    category: savedState?.category || "",
    dishGroup: savedState?.dishGroup || "",
    topNLimit: savedState?.topNLimit || "10"
  });
  const [postDate, setPostDate] = useState(false);
  const [category, setCategory] = useState(savedState?.category || "");
  const [dishGroup, setDishGroup] = useState(savedState?.dishGroup || "");
  const [outputType, setOutputType] = useState("Screen");
  const [isSearched, setIsSearched] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [localData, setLocalData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [performanceData, setPerformanceData] = useState(null);
  const [paymodeData, setPaymodeData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const abortControllerRef = useRef(null);
  const [sortColumn, setSortColumn] = useState("SalesAmount");
  const [sortDirection, setSortDirection] = useState("desc");
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef(null);
  const hasAutoLoadedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setDownloadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keep topNSort in sync for backward compatibility
  const topNSort = `${sortColumn}${sortDirection === "asc" ? "Asc" : "Desc"}`;
  const setTopNSort = (val) => {
    if (typeof val === 'function') {
      const next = val(topNSort);
      if (next.endsWith("Asc")) {
        setSortColumn(next.replace("Asc", ""));
        setSortDirection("asc");
      } else if (next.endsWith("Desc")) {
        setSortColumn(next.replace("Desc", ""));
        setSortDirection("desc");
      }
    } else if (typeof val === 'string') {
      if (val.endsWith("Asc")) {
        setSortColumn(val.replace("Asc", ""));
        setSortDirection("asc");
      } else if (val.endsWith("Desc")) {
        setSortColumn(val.replace("Desc", ""));
        setSortDirection("desc");
      }
    }
  };

  const [categoryList, setCategoryList] = useState([]);
  const [dishGroupList, setDishGroupList] = useState([]);
  const [showCategoryLOV, setShowCategoryLOV] = useState(false);
  const [showDishGroupLOV, setShowDishGroupLOV] = useState(false);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${REPORT_BASE}/company-info`);
      const data = await response.json();
      setCompanyInfo(data);
    } catch (error) {
      console.error("Error fetching company info:", error);
    }
  };

  React.useEffect(() => {
    fetchCompanyInfo();
    fetchCategories();
  }, []);

  // ✅ NEW: Auto-clear conflicting selections when byItem changes
  useEffect(() => {
    if (byItem !== "") {
      setOrderSales("");
      setDayEnd("");
      setBySales("");
    }
  }, [byItem]);

  // ✅ NEW: Auto-clear conflicting selections when orderSales changes
  useEffect(() => {
    if (orderSales !== "") {
      setByItem("");
      setBySales("");
      setDayEnd("");
    }
  }, [orderSales]);

  // ✅ NEW: Auto-clear conflicting selections when dayEnd changes
  useEffect(() => {
    if (dayEnd !== "") {
      setOrderSales("");
      setByItem("");
      setBySales("");
    }
  }, [dayEnd]);

  // ✅ NEW: Auto-clear when bySales changes
  useEffect(() => {
    if (bySales !== "") {
      setOrderSales("");
      setByItem("");
      setDayEnd("");
    }
  }, [bySales]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${REPORT_BASE}/categories`);
      const data = await response.json();
      console.log("Categories API Response:", data);

      if (Array.isArray(data)) {
        setCategoryList(data);
      } else if (data.data && Array.isArray(data.data)) {
        setCategoryList(data.data);
      } else {
        setCategoryList([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategoryList([]);
    }
  };

  const fetchDishGroups = async (categoryId = null) => {
    console.trace("fetchDishGroups called with:", categoryId);

    try {
      let url = `${REPORT_BASE}/dishgroups`;
      if (categoryId && categoryId !== "" && categoryId !== "undefined") {
        url += `?categoryId=${categoryId}`;
        console.log("Fetching FILTERED dish groups for category:", categoryId);
      } else {
        console.log("Fetching ALL dish groups");
      }
      console.log("URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setDishGroupList(data);
        console.log("DishGroupList updated, count:", data.length);
      }
    } catch (error) {
      console.error("Error fetching dish groups:", error);
    }
  };

  useEffect(() => {
    console.log("=== dishGroupList CHANGED ===");
    console.log("New dishGroupList:", dishGroupList);
    console.log("Length:", dishGroupList.length);
  }, [dishGroupList]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchDishGroups(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const getReportUrl = (formatType = "pdf") => {
    let url = "";

    // Read applied filters to ensure exact synchronization
    const reqFrom = appliedFilters.fromDate || fromDate;
    const reqTo = appliedFilters.toDate || toDate;
    const reqDayEnd = appliedFilters.dayEnd || dayEnd;
    const reqByItem = appliedFilters.byItem || byItem;
    const reqBySales = appliedFilters.bySales || bySales;
    const reqOrderSales = appliedFilters.orderSales || orderSales;
    const reqCategory = appliedFilters.category !== undefined ? appliedFilters.category : category;
    const reqDishGroup = appliedFilters.dishGroup !== undefined ? appliedFilters.dishGroup : dishGroup;

    // ✅ Guest Meal Report - ADD THIS FIRST
    if (reqDayEnd === "GuestMeal") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&reportType=GuestMeal`;
    }

    // ✅ GST Report
    else if (reqDayEnd === "GST") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=GST`;
    }

    // ✅ Paymode Report
    else if (reqDayEnd === "Paymode") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=Paymode`;
    }

    // ✅ Terminal Report
    else if (reqDayEnd === "Terminal") {
      url = `${REPORT_BASE}/terminal-html?fromDate=${reqFrom}&toDate=${reqTo}`;
    }

    // ✅ Transaction Report
    else if (reqDayEnd === "Transaction") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=Transaction`;
    }

    // ✅ Table Change Report
    else if (reqDayEnd === "TableChange") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=TableChange`;
    }
    else if (reqDayEnd === "RefundSummary") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=RefundSummary`;
    }
    else if (reqDayEnd === "DiscountSummary") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=DiscountSummary`;
    }
    else if (reqDayEnd === "DiscountDetail") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=DiscountDetail`;
    }
    else if (reqDayEnd === "TopNItems") {
      const activeTopN = appliedFilters.topNLimit || topNLimit || "10";
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=TopNItems&topN=${activeTopN}&sortBy=${topNSort}`;
    }

    // ✅ ADD CANCEL ORDER REPORT HERE
    else if (reqDayEnd === "Cancellation") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=Cancellation`;
    }

    // ✅ MONTH Report (By Item)
    else if (reqByItem === "Month") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=Month`;
      if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
      if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
    }

    // ✅ QTY Report (By Item)
    else if (reqByItem === "QtyGroup") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=QtyGroup`;
    }
    else if (reqByItem === "QtyDetail") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=QtyDetail`;
    }
    else if (reqByItem === "Qty") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=Qty`;
      if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
      if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
    }

    // ✅ Category Sales Report (By Item)
    else if (reqByItem === "Category") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=Category`;
      if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
      if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
    }

    // ✅ Dish Group Sales Report (By Item)
    else if (reqByItem === "DishGroup") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=DishGroup`;
      if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
      if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
    }

    // ✅ Dish Sales Report (By Item)
    else if (reqByItem === "Dish") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&byItem=Dish`;
      if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
      if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
    }

    // ✅ Summary Report (By Sales)
    else if (reqBySales === "Summary") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&bySales=Summary`;
    }

    // ✅ Business Type Report
    else if (reqBySales === "BusinessType") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&bySales=BusinessType`;
    }

    // ✅ Meal Period Report
    else if (reqBySales === "MealPeriod") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&bySales=MealPeriod`;
    }

    // ✅ Sales Analysis Report
    else if (reqBySales === "Analysis") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&bySales=Analysis`;
    }

    // ✅ Journal Report (By Sales)
    else if (reqBySales === "Journal") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&bySales=Journal`;
    }

    // ✅ Order Sales Reports
    else if (reqDayEnd === "Hourly" || reqOrderSales === "Hourly") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&dayEnd=Hourly&orderSales=Hourly`;
    }
    // ✅ Order Sales Reports
    else if (reqOrderSales === "Daywise" || reqOrderSales === "Itemwise" || reqOrderSales === "Group" || reqOrderSales === "GroupDetail") {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}&orderSales=${reqOrderSales}`;
      if (reqOrderSales === "Itemwise") {
        if (reqCategory) url += `&category=${encodeURIComponent(reqCategory)}`;
        if (reqDishGroup) url += `&dishGroup=${encodeURIComponent(reqDishGroup)}`;
      }
    }

    // ✅ Default
    if (!url) {
      url = `${REPORT_BASE}/download-pdf?fromDate=${reqFrom}&toDate=${reqTo}`;
    }

    if (activeShowChart) {
      url += `${url.includes('?') ? '&' : '?'}showChart=true`;
      if (selectedChartType) {
        url += `&chartType=${encodeURIComponent(selectedChartType)}`;
      }
    }

    if (sortColumn) {
      url += `${url.includes('?') ? '&' : '?'}sortColumn=${encodeURIComponent(sortColumn)}&sortDirection=${encodeURIComponent(sortDirection)}`;
    }

    if (formatType === "html") {
      url += `${url.includes('?') ? '&' : '?'}format=html`;
    }

    return url;
  };

  const handlePrint = async () => {
    try {
      const pdfUrl = getReportUrl("pdf");
      
      // Fetch the generated PDF as a Blob to ensure reliable native PDF print preview
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch report PDF (status ${response.status})`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      let printFrame = document.getElementById("report-pdf-print-frame");
      if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "report-pdf-print-frame";
        printFrame.style.position = "fixed";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "0";
        document.body.appendChild(printFrame);
      }

      printFrame.onload = () => {
        try {
          setTimeout(() => {
            if (printFrame.contentWindow) {
              printFrame.contentWindow.focus();
              printFrame.contentWindow.print();
            }
          }, 300);
        } catch (e) {
          console.error("Iframe print error, falling back to window:", e);
          const win = window.open(blobUrl, "_blank");
          if (win) {
            win.onload = () => win.print();
          }
        }
      };

      printFrame.src = blobUrl;
    } catch (err) {
      console.error("Print error:", err);
      // Direct window fallback
      const directUrl = getReportUrl("pdf");
      window.open(directUrl, "_blank");
    }
  };

  const handleDownload = async () => {
    try {
      const url = getReportUrl("pdf");
      window.open(url, '_blank');
    } catch (err) {
      console.error("Download error:", err);
      alert("Error opening report: " + err.message);
    }
  };

  const handleFind = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date");
      return;
    }

    const noSelectionMade = !orderSales && !dayEnd && !bySales && !byItem;
    if (noSelectionMade) {
      alert("Please select a report type (Day end reports / Sales reports / Item reports)");
      return;
    }

    // Abort previous in-flight request if user clicks Find again
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearched(true);
    setIsLoading(true);
    setErrorMessage("");
    setActiveShowChart(showChart);
    const filtersToSave = {
      fromDate,
      toDate,
      orderSales,
      dayEnd,
      bySales,
      byItem,
      category,
      dishGroup,
      topNLimit,
      showChart,
      activeShowChart: showChart,
      selectedChartType,
      systemDate
    };
    setAppliedFilters(filtersToSave);

    // Requirement 2: Persist selected report & filters in sessionStorage so refresh retains the exact report
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (e) {
      console.warn("Could not save report state to sessionStorage", e);
    }

    let url = `${REPORT_BASE}/salesreport?fromDate=${fromDate}&toDate=${toDate}`;

    // ✅ Guest Meal Report - ADD THIS FIRST
    if (dayEnd === "GuestMeal") {
      url += `&reportType=GuestMeal`;
      console.log("✅ Guest Meal Report Selected");
    }
    // ✅ IMPORTANT: Check byItem FIRST (Month, QtyDetail, Qty & QtyGroup)
    else if (byItem === "Month") {
      url += `&byItem=Month`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Month Report Selected");
    }
    else if (byItem === "QtyDetail") {
      url += `&byItem=QtyDetail`;
      console.log("✅ Monthly Sales Detail (QtyDetail) Selected");
    }
    else if (byItem === "QtyGroup") {
      url += `&byItem=QtyGroup`;
      console.log("✅ Quantity Sales Detail (QtyGroup) Selected");
    }
    else if (byItem === "Qty") {
      url += `&byItem=Qty`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Qty (Month) Report Selected");
    }
    // ✅ Category Sales
    else if (byItem === "Category") {
      url += `&byItem=Category`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Category Sales Report Selected");
    }

    // ✅ Dish Group Sales
    else if (byItem === "DishGroup") {
      url += `&byItem=DishGroup`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Dish Group Sales Report Selected");
    }

    // ✅ Dish Sales
    // ✅ Dish Sales
    else if (byItem === "Dish") {
      url += `&byItem=Dish`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Dish Sales Report Selected with category:", category, "dishGroup:", dishGroup);
    }
    // Then bySales
    else if (bySales === "Summary") {
      url += `&bySales=Summary`;
      console.log("✅ Summary Report Selected");
    }
    else if (bySales === "BusinessType") {
      url += `&bySales=BusinessType`;
      console.log("✅ Business Type Report Selected");
    }
    else if (bySales === "MealPeriod") {
      url += `&bySales=MealPeriod`;
      console.log("✅ Meal Period Report Selected");
    }
    else if (bySales === "Analysis") {
      url += `&bySales=Analysis`;
      console.log("✅ Sales Analysis Report Selected");
    }
    else if (bySales === "Journal") {
      url += `&bySales=Journal`;
      console.log("✅ Sales Journal Report Selected");
    }
    // Then dayEnd
    else if (dayEnd === "Paymode") {
      url += `&dayEnd=Paymode`;
      console.log("✅ Paymode Report Selected");
    }
    else if (dayEnd === "Terminal") {
      url += `&dayEnd=Terminal`;
      console.log("✅ Terminal Report Selected");
    }
    else if (dayEnd === "Transaction") {
      url += `&dayEnd=Transaction`;
      console.log("✅ Transaction Report Selected");
    }
    else if (dayEnd === "TableChange") {
      url += `&dayEnd=TableChange`;
      console.log("✅ Table Change Report Selected");
    }
    else if (dayEnd === "RefundSummary") {
      url += `&dayEnd=RefundSummary`;
      console.log("✅ Refund Summary Report Selected");
    }
    else if (dayEnd === "DiscountSummary") {
      url += `&dayEnd=DiscountSummary`;
      console.log("✅ Discount Summary Report Selected");
    }
    else if (dayEnd === "DiscountDetail") {
      url += `&dayEnd=DiscountDetail`;
      console.log("✅ Discount Sales Detail Report Selected");
    }
    else if (dayEnd === "TopNItems") {
      url += `&dayEnd=TopNItems&topN=${topNLimit || "10"}`;
      console.log("✅ Top N Items Report Selected, limit:", topNLimit || "10");
    }

    else if (dayEnd === "Cancellation") {
      url += `&dayEnd=Cancellation`;
      console.log("✅ Cancel Order List Report Selected");
    }
    else if (dayEnd === "GST") {
      url += `&dayEnd=GST`;
      console.log("✅ GST Report Selected");
    }
    // Finally orderSales
    else if (dayEnd === "Hourly" || orderSales === "Hourly") {
      url += `&dayEnd=Hourly&orderSales=Hourly`;
      console.log("✅ Hourly Report Selected");
    }
    else if (orderSales === "Daywise") {
      url += `&orderSales=Daywise`;
      console.log("✅ Daywise Report Selected");
    }
    else if (orderSales === "Itemwise") {
      url += `&orderSales=Itemwise`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (dishGroup) url += `&dishGroup=${encodeURIComponent(dishGroup)}`;
      console.log("✅ Itemwise Report Selected");
    }
    else if (orderSales === "Group") {
      url += `&orderSales=Group`;
      console.log("✅ Group Report Selected");
    }
    else if (orderSales === "GroupDetail") {
      url += `&orderSales=GroupDetail`;
      console.log("✅ Group Detail Report Selected");
    }

    console.log("Final URL:", url);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();

      if (data && data.error) {
        throw new Error(data.error);
      }

      console.log("API Response:", data);

      let rawData = [];

      if (Array.isArray(data)) {
        rawData = data;          // GST API
        setSummaryData(null);
      } else if (Array.isArray(data.sales)) {
        rawData = data.sales;    // Other reports
        setSummaryData(null);
      } else {
        setSummaryData(null);
      }
      console.log("GST Raw Data:", data);
      console.log("GST Raw Data Length:", rawData.length);
      console.log("DayEnd Value:", dayEnd);
      let forcedColumns = [];
      let forcedData = [];

      if (rawData.length === 0) {
        setLocalData([]);
        setColumns([]);
        setGrandTotal(0);
    setPerformanceData(null);
        setSummaryData(null);
        return;
      }

      // ✅ Guest Meal Report - ADD THIS
      if (dayEnd === "GuestMeal") {
        console.log("Processing Guest Meal Report");
        forcedColumns = ['InvoiceDate', 'BillNumber', 'ItemAmount', 'Discount', 'ServiceCharge', 'TotalTax', 'TotalAmount', 'Description'];
        forcedData = rawData.map(row => ({
          InvoiceDate: row.InvoiceDate || '-',
          BillNumber: row.BillNumber || '-',
          ItemAmount: Number(row.ItemAmount || 0).toFixed(2),
          Discount: Number(row.Discount || row.discountAmount || 0).toFixed(2),
          ServiceCharge: Number(row.ServiceCharge || 0).toFixed(2),
          TotalTax: Number(row.TotalTax || 0).toFixed(2),
          TotalAmount: Number(row.TotalAmount || 0).toFixed(2),
          Description: row.Description || '-',
          isTotalRow: row.isTotalRow || false
        }));
      }
      // ✅ MONTHWISE SALES REPORT - must run before the generic Year/Month fallback
      else if (byItem === "Month") {
        console.log("Processing Monthly Sales Summary report");

        const monthRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.Date !== 'Grand Total:' && row.Date !== 'TOTAL');

        forcedColumns = ['Date', 'DishGroup', 'DishPrice'];
        forcedData = monthRows.map(row => ({
          Date: row.Date || '-',
          DishGroup: row.DishGroupName || row.DishGroup || '-',
          DishPrice: Number(row.DishPrice || 0).toFixed(2),
          isTotalRow: false
        }));

        forcedData.push({
          Date: 'Grand Total:',
          DishGroup: '-',
          DishPrice: '',
          isTotalRow: true,
          isGrandTotal: true
        });
      }
      else if (byItem === "QtyDetail") {
        console.log("Processing Monthly Sales Detail (QtyDetail) report");

        const detailRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.Date !== 'Grand Total:' && row.Date !== 'TOTAL');

        forcedColumns = ['Date', 'DishGroup', 'DishName'];
        forcedData = detailRows.map(row => ({
          Date: row.Date || '-',
          DishGroup: row.DishGroup || row.DishGroupName || '-',
          DishName: row.DishName || '-',
          isTotalRow: false
        }));

        forcedData.push({
          Date: 'Grand Total:',
          DishGroup: '-',
          DishName: '-',
          isTotalRow: true,
          isGrandTotal: true
        });
      }
      else if (byItem === "QtyGroup") {
        console.log("Processing Quantity Sales Detail (QtyGroup) report");

        const detailRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.DishName !== 'Grand Total:' && row.DishName !== 'TOTAL');
        let totalQtySold = 0;

        forcedColumns = ['DishName', 'QtySold'];
        forcedData = detailRows.map(row => {
          const qty = parseInt(row.QtySold || row.Qty || row.Quantity || 0) || 0;
          totalQtySold += qty;
          return {
            DishName: row.DishName || row.Dishname || '-',
            QtySold: qty,
            isTotalRow: false
          };
        });

        forcedData.push({
          DishName: 'Grand Total:',
          QtySold: totalQtySold,
          isTotalRow: true,
          isGrandTotal: true
        });
      }
      else if (byItem === "Qty") {
        console.log("Processing Quantity Sales Summary report");

        const qtyRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.DishGroupName !== 'Grand Total:' && row.DishGroupName !== 'TOTAL');
        let totalQtySold = 0;

        forcedColumns = ['DishGroupName', 'QtySold'];
        forcedData = qtyRows.map(row => {
          const qty = parseInt(row.QtySold || row.qtySold || row.Qty || row.qty || 0) || 0;
          totalQtySold += qty;
          return {
            DishGroupName: row.DishGroupName || row.DishGroup || '-',
            QtySold: qty,
            isTotalRow: false
          };
        });

        forcedData.push({
          DishGroupName: 'Grand Total:',
          QtySold: totalQtySold,
          isTotalRow: true,
          isGrandTotal: true
        });
      }

      // ✅ QTY/MONTH Report - Check for Year and Month columns
      else if (rawData[0] && rawData[0].hasOwnProperty('Year') && rawData[0].hasOwnProperty('Month')) {
        console.log("✅ Processing Month/Qty Report");
        forcedColumns = ['Year', 'Month', 'DishName', 'DishGroupName', 'Amount'];
        forcedData = rawData;
      }

      else if (dayEnd === "Cancellation") {
        console.log("Processing Cancel Order List Report");
        let sumCancelledAmount = 0;
        let sumVoidQty = 0;
        let sumVoidAmount = 0;

        const rows = rawData
          .filter(row => !row.isTotalRow && row.CancelDate !== 'Grand Total:' && row.Date !== 'Grand Total:')
          .map(row => {
            const amt = Number(row.CancelledAmount || 0);
            const voidQty = Number(row.VoidQty || 0);
            const voidAmt = Number(row.VoidAmount || amt || 0);

            sumCancelledAmount += amt;
            sumVoidQty += voidQty;
            sumVoidAmount += voidAmt;

            return {
              CancelDate: row.CancelDate || '-',
              CancelTime: row.CancelTime || '-',
              OrderNo: row.OrderNumber || row.OrderNo || '-',
              BillNumber: row.BillNumber || '-',
              CancelledAmount: amt,
              VoidQty: voidQty,
              VoidAmount: voidAmt,
              CancelReason: row.CancelReason || '-',
              CancelledBy: row.CancelledBy || 'System',
              SettledCount: row.SettledCount,
              isTotalRow: false
            };
          });

        // Add Grand Total row
        rows.push({
          CancelDate: 'Grand Total:',
          CancelTime: '',
          OrderNo: '',
          BillNumber: '',
          CancelledAmount: sumCancelledAmount,
          VoidQty: sumVoidQty,
          VoidAmount: sumVoidAmount,
          CancelReason: '',
          CancelledBy: '',
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['CancelDate', 'CancelTime', 'BillNumber', 'CancelledAmount', 'VoidQty', 'VoidAmount', 'CancelReason', 'CancelledBy'];
        forcedData = rows;
      }

      else if (dayEnd === "CancellationDetail") {
        console.log("Processing Cancelled / Void Items Report");
        let sumVoidQty = 0;
        let sumVoidAmount = 0;

        const rows = rawData
          .filter(row => !row.isTotalRow && row.CancelDate !== 'Grand Total:' && row.Date !== 'Grand Total:')
          .map(row => {
            const vQty = Number(row.VoidQty || 0);
            const vAmt = Number(row.VoidAmount || 0);
            sumVoidQty += vQty;
            sumVoidAmount += vAmt;

            return {
              CancelDate: row.CancelDate || '-',
              CancelTime: row.CancelTime || '-',
              BillNumber: row.BillNumber || '-',
              OrderNo: row.OrderNo || row.OrderNumber || '-',
              CategoryName: row.CategoryName || '-',
              DishGroupName: row.DishGroupName || '-',
              DishName: row.DishName || '-',
              VoidQty: vQty,
              VoidAmount: vAmt,
              CancelReason: row.CancelReason || row.Remarks || '-',
              isTotalRow: false
            };
          });

        rows.push({
          CancelDate: 'Grand Total:',
          CancelTime: '',
          BillNumber: '',
          OrderNo: '',
          CategoryName: '',
          DishGroupName: '',
          DishName: '',
          VoidQty: sumVoidQty,
          VoidAmount: sumVoidAmount,
          CancelReason: '',
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['CancelDate', 'CancelTime', 'BillNumber', 'OrderNo', 'CategoryName', 'DishGroupName', 'DishName', 'VoidQty', 'VoidAmount', 'CancelReason'];
        forcedData = rows;
      }

      // ✅ Top N Items Report
      else if (dayEnd === "TopNItems") {
        console.log("Processing Top N Items Report");
        forcedColumns = ['Rank', 'DishName', 'QtySold', 'SalesAmount', 'SalesPct'];
        const isAll = (topNLimit === "all" || topNLimit === "All");
        const limitCount = isAll ? rawData.length : (parseInt(topNLimit || "10", 10) || 10);
        const slicedRaw = isAll ? rawData : rawData.slice(0, limitCount);
        const totalSalesAmount = slicedRaw.reduce((sum, r) => sum + (parseFloat(r.SalesAmount || 0) || 0), 0);
        forcedData = slicedRaw.map((row, idx) => {
          const itemSalesAmt = parseFloat(row.SalesAmount || 0) || 0;
          const rawPct = parseFloat(String(row.SalesPct ?? '').replace('%', ''));
          const pctVal = !isNaN(rawPct)
            ? rawPct
            : (totalSalesAmount > 0 ? (itemSalesAmt / totalSalesAmount) * 100 : 0);
          return {
            Rank: Number(row.Rank || (idx + 1)),
            DishName: row.DishName || '',
            QtySold: Number(row.QtySold || 0).toFixed(0),
            SalesAmount: itemSalesAmt.toFixed(2),
            SalesPct: pctVal.toFixed(2) + '%'
          };
        });
      }

      else if (dayEnd === "GST") {
        console.log("Processing GST Report");
        let sumBills = 0;
        let sumTaxable = 0;
        let sumTax = 0;
        let sumTotal = 0;

        // Filter out any existing grand total rows from backend
        const detailRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.Date !== 'Grand Total:' && row.Date !== 'TOTAL');

        const rows = detailRows.map(row => {
          const bills = Number(row.Bills || row.TotalBills || 0);
          const taxable = Number(row.TaxableAmount || row.TotalSales || 0);
          const tax = Number(row['GST 9%'] !== undefined && row['GST 9%'] !== null ? row['GST 9%'] : (row.TotalTax !== undefined && row.TotalTax !== null ? row.TotalTax : (row.GST || 0)));
          const total = Number(row.TotalAmount || 0);

          sumBills += bills;
          sumTaxable += taxable;
          sumTax += tax;
          sumTotal += total;

          return {
            Date: row.Date || '',
            Bills: bills,
            TaxableAmount: taxable.toFixed(2),
            'GST 9%': tax.toFixed(2),
            TotalAmount: total.toFixed(2),
            isTotalRow: false
          };
        });

        // Add single Grand Total row
        rows.push({
          Date: 'Grand Total:',
          Bills: sumBills,
          TaxableAmount: sumTaxable.toFixed(2),
          'GST 9%': sumTax.toFixed(2),
          TotalAmount: sumTotal.toFixed(2),
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['Date', 'Bills', 'TaxableAmount', 'GST 9%', 'TotalAmount'];
        forcedData = rows;
      }
      // ✅ DISCOUNT SUMMARY REPORT
      else if (dayEnd === "DiscountSummary") {
        console.log("Processing Discount Summary Report");
        let sumSubTotal = 0;
        let sumDiscount = 0;
        let sumItemDiscount = 0;
        let sumBillDiscount = 0;
        let sumSVC = 0;
        let sumTax = 0;
        let sumTotalAmount = 0;

        const rows = rawData.map(row => {
          const subTotal = Number(row.SubTotal ?? row.subTotal ?? 0);
          const discount = Number(row.Discount ?? row.discount ?? row.Disc ?? row.disc ?? 0);
          const itemDiscount = Number(row.ItemDiscount ?? row.itemDiscount ?? row.ItemDisc ?? row.itemDisc ?? 0);
          const billDiscount = Number(row.BillDiscount ?? row.billDiscount ?? row.BillDisc ?? row.billDisc ?? 0);
          const svc = Number(row.ServiceCharge ?? row.serviceCharge ?? row.SVC ?? row.svc ?? 0);
          const tax = Number(row.TotalTax ?? row.totalTax ?? row.GST ?? row.gst ?? row.Tax ?? 0);
          const totalAmount = Number(row.TotalAmount ?? row.totalAmount ?? row.TOTAL ?? 0);

          sumSubTotal += subTotal;
          sumDiscount += discount;
          sumItemDiscount += itemDiscount;
          sumBillDiscount += billDiscount;
          sumSVC += svc;
          sumTax += tax;
          sumTotalAmount += totalAmount;

          return {
            InvoiceDate: row.InvoiceDate || '-',
            InvoiceNo: row.InvoiceNo || '-',
            SubTotal: subTotal,
            Discount: discount,
            ItemDiscount: itemDiscount,
            BillDiscount: billDiscount,
            ServiceCharge: svc,
            TotalTax: tax,
            TotalAmount: totalAmount,
            isTotalRow: false
          };
        });

        // Add Grand Total row
        rows.push({
          InvoiceDate: 'Grand Total:',
          InvoiceNo: '-',
          SubTotal: sumSubTotal,
          Discount: sumDiscount,
          ItemDiscount: sumItemDiscount,
          BillDiscount: sumBillDiscount,
          ServiceCharge: sumSVC,
          TotalTax: sumTax,
          TotalAmount: sumTotalAmount,
          isTotalRow: true
        });

        forcedColumns = ['InvoiceDate', 'InvoiceNo', 'SubTotal', 'Discount', 'ItemDiscount', 'BillDiscount', 'ServiceCharge', 'TotalTax', 'TotalAmount'];
        forcedData = rows;
      }
      // ✅ DISCOUNT SALES DETAIL REPORT
      else if (dayEnd === "DiscountDetail") {
        console.log("Processing Discount Detail Report");
        forcedColumns = ['DishName', 'Quantity', 'Price', 'Amount', 'SVC', 'Tax', 'Total'];

        // If backend already returned mapped hierarchical rows, use them directly
        if (rawData.some(r => r.isDateHeader || r.isOrderHeader)) {
          forcedData = rawData;
        } else {
          const detailRows = rawData.filter(r => !r.isTotalRow && !r.isGrandTotal && !r.isDateHeader && !r.isOrderHeader);

          const dateMap = new Map();
          detailRows.forEach(r => {
            const d = r.OrderDate || '-';
            if (!dateMap.has(d)) dateMap.set(d, new Map());
            const orderKey = r.OrderId || `${r.OrderNumber}_${r.InvoiceNo}`;
            const orderMap = dateMap.get(d);
            if (!orderMap.has(orderKey)) {
              orderMap.set(orderKey, {
                orderNumber: r.OrderNumber || r.InvoiceNo || '-',
                invoiceNo: r.InvoiceNo || r.OrderNumber || '-',
                discount: Number(r.OrderDiscount || 0),
                items: []
              });
            }
            orderMap.get(orderKey).items.push(r);
          });

          const mapped = [];
          let grandQty = 0;
          let grandAmount = 0;
          let grandSVC = 0;
          let grandTax = 0;
          let grandTotal = 0;

          dateMap.forEach((orders, dateStr) => {
            // Date Header Row
            mapped.push({
              DishName: dateStr,
              Quantity: '',
              Price: '',
              Amount: '',
              SVC: '',
              Tax: '',
              Total: '',
              isDateHeader: true,
              isTotalRow: false
            });

            let dayQty = 0;
            let dayAmount = 0;
            let daySVC = 0;
            let dayTax = 0;
            let dayTotal = 0;

            orders.forEach((orderData) => {
              // Order Header Row
              const orderTitle = `${orderData.orderNumber} ${orderData.invoiceNo} Discount :`;
              mapped.push({
                DishName: orderTitle,
                Quantity: '',
                Price: '',
                Amount: '',
                SVC: '',
                Tax: '',
                Total: orderData.discount.toFixed(2),
                isOrderHeader: true,
                isTotalRow: false
              });

              let orderQty = 0;
              let orderAmount = 0;
              let orderSVC = 0;
              let orderTax = 0;
              let orderTotal = 0;

              orderData.items.forEach(item => {
                const q = Number(item.Quantity || 0);
                const p = Number(item.Price || 0);
                const a = Number(item.Amount || (q * p));
                const s = Number(item.SVC || 0);
                const t = Number(item.Tax || 0);
                const tot = Number(item.Total || (a + s + t));

                orderQty += q;
                orderAmount += a;
                orderSVC += s;
                orderTax += t;
                orderTotal += tot;

                mapped.push({
                  DishName: item.DishName || '-',
                  Quantity: q,
                  Price: p,
                  Amount: a,
                  SVC: s,
                  Tax: t,
                  Total: tot,
                  isTotalRow: false
                });
              });

              // Order Total Row
              mapped.push({
                DishName: 'Order Total',
                Quantity: orderQty,
                Price: '',
                Amount: orderAmount,
                SVC: orderSVC,
                Tax: orderTax,
                Total: orderTotal,
                isOrderTotal: true,
                isTotalRow: true
              });

              dayQty += orderQty;
              dayAmount += orderAmount;
              daySVC += orderSVC;
              dayTax += orderTax;
              dayTotal += orderTotal;
            });

            // Day Total Row
            mapped.push({
              DishName: 'Day Total',
              Quantity: dayQty,
              Price: '',
              Amount: dayAmount,
              SVC: daySVC,
              Tax: dayTax,
              Total: dayTotal,
              isDayTotal: true,
              isTotalRow: true
            });

            grandQty += dayQty;
            grandAmount += dayAmount;
            grandSVC += daySVC;
            grandTax += dayTax;
            grandTotal += dayTotal;
          });

          // Grand Total Row
          mapped.push({
            DishName: 'Grand Total',
            Quantity: grandQty,
            Price: '',
            Amount: grandAmount,
            SVC: grandSVC,
            Tax: grandTax,
            Total: grandTotal,
            isGrandTotal: true,
            isTotalRow: true
          });

          forcedData = mapped;
        }
      }
      else if (dayEnd === "TableChange") {
        console.log("Processing Table Change Report");
        forcedColumns = ['OrderDate', 'OrderNumber', 'SourceTable', 'NewTable', 'TotalAmount', 'ModifyUser', 'StatusCodeName'];
        forcedData = rawData.map(row => ({
          OrderDate: row.OrderDate || '-',
          OrderNumber: row.OrderNumber || '-',
          SourceTable: row.SourceTable || '-',
          NewTable: row.NewTable || '-',
          TotalAmount: Number(row.TotalAmount || 0).toFixed(2),
          ModifyUser: row.ModifyUser || 'UNIPRO',
          StatusCodeName: row.StatusCodeName || 'Ordered',
          isTotalRow: false
        }));
      }
      // ✅ MONTHWISE SALES REPORT
      else if (byItem === "Month") {
        console.log("Processing Month wise sales report");

        const monthRows = rawData.filter(row => !row.isTotalRow && !row.isGrandTotal && row.Date !== 'Grand Total:' && row.Date !== 'TOTAL');

        forcedColumns = ['Date', 'DishGroup', 'DishPrice', 'Qty', 'Amount'];
        forcedData = monthRows.map(row => ({
          Date: row.Date || '-',
          DishName: row.DishName || '-',
          DishGroup: row.DishGroupName || row.DishGroup || '-',
          Category: row.CategoryName || row.Category || '-',
          DishPrice: Number(row.DishPrice || 0).toFixed(2),
          Qty: Number(row.Qty || 0).toFixed(0),
          Amount: Number(row.Amount || 0).toFixed(2),
          isTotalRow: false
        }));
      }
      // ✅ MEALPERIOD REPORT DISPLAY MAPPING
      else if (bySales === "MealPeriod") {
        console.log("Processing MealPeriod Report");

        let sumBills = 0;
        let sumPax = 0;
        let sumSubTotal = 0;
        let sumDiscount = 0;
        let sumSVC = 0;
        let sumGST = 0;
        let sumTotalSales = 0;

        const overallNetSales = rawData.reduce((sum, row) => sum + Number(row['Total Sales'] || row.TotalSales || row.NetTotal || 0), 0);

        const rows = rawData.map(row => {
          const bills = Number(row.Bills || 0);
          const pax = Number(row.Pax || 0);
          const subTotal = Number(row['Sub Total'] || row.SubTotal || 0);
          const discount = Number(row.Discount !== undefined && row.Discount !== null ? row.Discount : (row.DiscountAmount !== undefined && row.DiscountAmount !== null ? row.DiscountAmount : (row.Disc || row.BillDiscount || 0)));
          const svc = Number(row.SVC !== undefined && row.SVC !== null ? row.SVC : (row.ServiceCharge || 0));
          const gst = Number(row.GST !== undefined && row.GST !== null ? row.GST : (row.gst || 0));
          const totalSales = Number(row['Total Sales'] || row.TotalSales || row.NetTotal || 0);
          const avgBill = bills > 0 ? totalSales / bills : 0;
          const salesPct = overallNetSales > 0 ? (totalSales / overallNetSales) * 100 : 0;

          sumBills += bills;
          sumPax += pax;
          sumSubTotal += subTotal;
          sumDiscount += discount;
          sumSVC += svc;
          sumGST += gst;
          sumTotalSales += totalSales;

          return {
            Date: row.Date || '-',
            MealPeriod: row.MealPeriod || '-',
            Bills: bills,
            Pax: pax,
            AvgBill: Number(avgBill.toFixed(2)),
            SubTotal: subTotal,
            Discount: discount,
            SVC: svc,
            GST: gst,
            TotalSales: totalSales,
            SalesPct: salesPct.toFixed(2) + '%',
            isTotalRow: false
          };
        });

        // Add Grand Total row
        const grandAvgBill = sumBills > 0 ? sumTotalSales / sumBills : 0;
        rows.push({
          Date: 'Grand Total:',
          MealPeriod: '-',
          Bills: sumBills,
          Pax: sumPax,
          AvgBill: Number(grandAvgBill.toFixed(2)),
          SubTotal: sumSubTotal,
          Discount: sumDiscount,
          SVC: sumSVC,
          GST: sumGST,
          TotalSales: sumTotalSales,
          SalesPct: '100.00%',
          isTotalRow: true
        });

        forcedColumns = ['Date', 'MealPeriod', 'Bills', 'Pax', 'AvgBill', 'SubTotal', 'Discount', 'SVC', 'GST', 'TotalSales', 'SalesPct'];
        forcedData = rows;
      }

      // ✅ BUSINESS TYPE REPORT
      else if (bySales === "BusinessType") {
        console.log("Processing BusinessType Report");

        let sumBills = 0;
        let sumPax = 0;
        let sumSubTotal = 0;
        let sumDiscount = 0;
        let sumSVC = 0;
        let sumGST = 0;
        let sumNetTotal = 0;

        const overallNetTotal = rawData.reduce((sum, row) => sum + Number(row.NetTotal || 0), 0);

        const rows = rawData.map(row => {
          const bills = Number(row.Bills || 0);
          const pax = Number(row.Pax || 0);
          const subTotal = Number(row.SubTotal || 0);
          const discount = Number(row.Discount !== undefined && row.Discount !== null ? row.Discount : (row.DiscountAmount !== undefined && row.DiscountAmount !== null ? row.DiscountAmount : (row.Disc || row.BillDiscount || 0)));
          const svc = Number(row.ServiceCharge !== undefined && row.ServiceCharge !== null ? row.ServiceCharge : (row.SVC || 0));
          const gst = Number(row.gst !== undefined && row.gst !== null ? row.gst : (row.GST || 0));
          const netTotal = Number(row.NetTotal || 0);
          const salesPct = overallNetTotal > 0 ? (netTotal / overallNetTotal) * 100 : 0;

          sumBills += bills;
          sumPax += pax;
          sumSubTotal += subTotal;
          sumDiscount += discount;
          sumSVC += svc;
          sumGST += gst;
          sumNetTotal += netTotal;

          return {
            Date: row.Date || '-',
            Type: row.Type || '-',
            Bills: bills,
            Pax: pax,
            SubTotal: subTotal,
            Discount: discount,
            ServiceCharge: svc,
            gst: gst,
            NetTotal: netTotal,
            SalesPct: salesPct.toFixed(2) + '%',
            isTotalRow: false
          };
        });

        // Add Grand Total row
        rows.push({
          Date: 'Grand Total:',
          Type: '-',
          Bills: sumBills,
          Pax: sumPax,
          SubTotal: sumSubTotal,
          Discount: sumDiscount,
          ServiceCharge: sumSVC,
          gst: sumGST,
          NetTotal: sumNetTotal,
          SalesPct: '100.00%',
          isTotalRow: true
        });

        forcedColumns = ['Date', 'Type', 'Bills', 'Pax', 'SubTotal', 'Discount', 'ServiceCharge', 'gst', 'NetTotal', 'SalesPct'];
        forcedData = rows;
        console.log("=== SCREEN VIEW BUSINESS TYPE ROWS ===", rows);
        console.log("=== SCREEN VIEW BUSINESS TYPE COLUMNS ===", forcedColumns);
      }
      // ✅ SALES JOURNAL REPORT
      else if (bySales === "Journal") {
        console.log("Processing Sales Journal Report");
        forcedColumns = ['OrderNo', 'SubTotal', 'Discount', 'ServiceCharge', 'TotalTax', 'Tips', 'TotalPax', 'RoundOff'];
        forcedData = rawData.map(row => {
          const rawPax = row.TotalPax !== undefined && row.TotalPax !== null && row.TotalPax !== '' ? parseInt(row.TotalPax) : 0;
          return {
            OrderNo: row.OrderNo || row.BillNo || '-',
            SubTotal: Number(row.SubTotal || 0).toFixed(2),
            Discount: Number(row.Discount || 0).toFixed(2),
            ServiceCharge: Number(row.ServiceCharge || 0).toFixed(2),
            TotalTax: Number(row.TotalTax || 0).toFixed(2),
            Tips: Number(row.Tips || 0).toFixed(2),
            TotalPax: rawPax > 0 ? rawPax : 0,
            RoundOff: Number(row.RoundOff || 0).toFixed(2),
            NetAmount: Number(row.NetAmount || 0),
            isTotalRow: false
          };
        });
      }
      // ✅ SALES PERFORMANCE REPORT - Date-aggregated Analysis
      else if (bySales === "Analysis") {
        console.log("Processing Sales Performance Report");
        console.log("Raw Data Sample:", rawData.slice(0, 3));

        const detailRows = rawData.filter(r => !r.isTotalRow && !r.isGrandTotal && r.Date !== 'Grand Total:' && r.Date !== 'Grand Total');

        let totalBills = 0;
        let totalPax = 0;
        let totalSubTotal = 0;
        let totalDiscount = 0;
        let totalSVC = 0;
        let totalGST = 0;
        let totalNetTotal = 0;

        const analysisRows = detailRows.map(row => {
          const categoryName = row.CategoryName || row.Category || '-';
          const bills = Number(row['No of Bills'] || row.Bills || row.BillCount || 0);
          const pax = Number(row.Pax || 0);
          const subTotal = Number(row['Sub Total'] || row.SubTotal || 0);
          const discount = Number(row.Discount !== undefined && row.Discount !== null ? row.Discount : (row.DiscountAmount !== undefined && row.DiscountAmount !== null ? row.DiscountAmount : (row.Disc || row.BillDiscount || 0)));
          const svc = Number(row.SVC !== undefined && row.SVC !== null ? row.SVC : (row.ServiceCharge || 0));
          const gst = Number(row.GST !== undefined && row.GST !== null ? row.GST : (row.gst || 0));
          const netTotal = Number(row['Net Total'] || row.NetTotal || row.TotalSales || 0);

          totalBills += bills;
          totalPax += pax;
          totalSubTotal += subTotal;
          totalDiscount += discount;
          totalSVC += svc;
          totalGST += gst;
          totalNetTotal += netTotal;

          const avgBill = bills > 0 ? netTotal / bills : 0;
          const avgPax = pax > 0 ? netTotal / pax : 0;

          return {
            Date: row.Date || '-',
            CategoryName: categoryName,
            Category: categoryName,
            Bills: bills,
            'No of Bills': bills,
            BillCount: bills,
            Pax: pax,
            'Sub Total': subTotal,
            SubTotal: subTotal,
            Discount: discount,
            SVC: svc,
            GST: gst,
            'Net Total': netTotal,
            NetTotal: netTotal,
            'Avg/Bill': Number(avgBill.toFixed(2)),
            AvgBill: Number(avgBill.toFixed(2)),
            'Avg/Pax': avgPax,
            AvgPax: avgPax,
            isTotalRow: false
          };
        });

        // Calculate overall averages for the grand total row
        const grandAvgBill = totalBills > 0 ? totalNetTotal / totalBills : 0;
        const grandAvgPax = totalPax > 0 ? totalNetTotal / totalPax : 0;

        // Add ONLY ONE Grand Total row
        analysisRows.push({
          Date: 'Grand Total:',
          CategoryName: '',
          Category: '',
          Bills: totalBills,
          'No of Bills': totalBills,
          BillCount: totalBills,
          Pax: totalPax,
          'Sub Total': totalSubTotal,
          SubTotal: totalSubTotal,
          Discount: totalDiscount,
          SVC: totalSVC,
          GST: totalGST,
          'Net Total': totalNetTotal,
          NetTotal: totalNetTotal,
          'Avg/Bill': Number(grandAvgBill.toFixed(2)),
          AvgBill: Number(grandAvgBill.toFixed(2)),
          'Avg/Pax': grandAvgPax,
          AvgPax: grandAvgPax,
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['Date', 'CategoryName', 'Bills', 'Pax', 'Sub Total', 'Discount', 'SVC', 'GST', 'Net Total', 'Avg/Bill', 'Avg/Pax'];
        forcedData = analysisRows;
      }

      // ✅ CATEGORY SALES REPORT (With Detail Total, Bill Discount, Grand Total)
      else if (byItem === "Category") {
        console.log("Processing Category Sales Report");

        const detailRows = rawData.filter(r => !r.isTotalRow && !r.isGrandTotal && r.CategoryName !== 'Grand Total:');
        const overallUniqueBills = rawData.length > 0 ? (Number(rawData[0].OverallTotalBills || rawData[0].TotalBills) || Math.max(...detailRows.map(r => Number(r.BillCount || 0)))) : 0;

        let totalSold = 0;
        let totalItemSales = 0;
        let totalItemDisc = 0;
        let totalBillDisc = 0;
        let totalFOC = 0;
        let totalNetSales = 0;

        detailRows.forEach(row => {
          totalSold += Number(row.Sold || 0);
          totalItemSales += Number(row.ItemSales || 0);
          totalItemDisc += Number(row.ItemDisc || 0);
          totalBillDisc += Number(row.BillDisc || row.BillDiscount || 0);
          totalFOC += Number(row.FOC || row.Foc || 0);
          totalNetSales += Number(row.NetSales || 0);
        });

        const categoryRows = detailRows.map(row => {
          const billCount = Number(row.BillCount || 0);
          const sold = Number(row.Sold || 0);
          const itemSales = Number(row.ItemSales || 0);
          const itemDisc = Number(row.ItemDisc || 0);
          const billDisc = Number(row.BillDisc || row.BillDiscount || 0);
          const foc = Number(row.FOC || row.Foc || 0);
          const netSales = Number(row.NetSales || 0);
          const contributionPct = totalNetSales > 0 ? (netSales / totalNetSales) * 100 : 0;

          return {
            CategoryName: row.CategoryName || '-',
            BillCount: billCount,
            Sold: sold,
            ItemSales: itemSales,
            ItemDisc: itemDisc,
            BillDisc: billDisc,
            FOC: foc,
            NetSales: netSales,
            ContributionPct: contributionPct.toFixed(2) + '%',
            isTotalRow: false
          };
        });

        // Add ONLY ONE Grand Total row
        categoryRows.push({
          CategoryName: 'Grand Total:',
          BillCount: overallUniqueBills,
          Sold: totalSold,
          ItemSales: totalItemSales,
          ItemDisc: totalItemDisc,
          BillDisc: totalBillDisc,
          FOC: totalFOC,
          NetSales: totalNetSales,
          ContributionPct: '100.00%',
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['CategoryName', 'Sold', 'ItemSales', 'ItemDisc', 'BillDisc', 'FOC', 'NetSales', 'ContributionPct'];
        forcedData = categoryRows;
      }
      // ✅ DISH GROUP SALES REPORT (With Detail Total, Bill Discount, Grand Total)
      else if (byItem === "DishGroup") {
        console.log("Processing Dish Group Sales Report");

        let totalSold = 0;
        let totalItemSales = 0;
        let totalItemDisc = 0;
        let totalBillDisc = 0;
        let totalFOC = 0;
        let totalNetSales = 0;

        const categoryGroups = new Map();

        const actualDataRows = rawData.filter(r => !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer && !r.isTotalRow && !r.isGrandTotal);
        const overallUniqueBills = rawData.length > 0 ? (Number(rawData[0].OverallTotalBills || rawData[0].TotalBills) || Math.max(...actualDataRows.map(r => Number(r.BillCount || 0)))) : 0;

        actualDataRows.forEach(row => {
          const categoryName = row.CategoryName || 'Uncategorized';
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, []);
          }
          categoryGroups.get(categoryName).push(row);
        });

        const dishGroupRows = [];

        for (const [categoryName, items] of categoryGroups.entries()) {
          dishGroupRows.push({
            DishGroupname: categoryName,
            CategoryName: categoryName,
            BillCount: '',
            Sold: '',
            ItemSales: '',
            ItemDisc: '',
            BillDisc: '',
            FOC: '',
            NetSales: '',
            ContributionPct: '',
            isCategoryHeader: true,
            isTotalRow: false
          });

          let overallNetSalesSum = 0;
          rawData.forEach(r => {
            overallNetSalesSum += Number(r.NetSales || r.Revenue || r.ItemSales || 0);
          });

          items.forEach(row => {
            const billCount = Number(row.BillCount || 0);
            const sold = Number(row.Sold || 0);
            const itemSales = Number(row.ItemSales || 0);
            const itemDisc = Number(row.ItemDisc || 0);
            const billDisc = Number(row.BillDisc || row.BillDiscount || 0);
            const foc = Number(row.Foc || 0);
            const netSales = Number(row.Revenue || row.NetSales || itemSales || 0);
            const contributionPct = overallNetSalesSum > 0 ? (netSales / overallNetSalesSum) * 100 : 0;

            totalSold += sold;
            totalItemSales += itemSales;
            totalItemDisc += itemDisc;
            totalBillDisc += billDisc;
            totalFOC += foc;
            totalNetSales += netSales;

            dishGroupRows.push({
              DishGroupname: row.DishGroupname || row.DishGroupName || '-',
              CategoryName: categoryName,
              BillCount: billCount,
              Sold: sold,
              ItemSales: itemSales,
              ItemDisc: itemDisc,
              BillDisc: billDisc,
              FOC: foc,
              NetSales: netSales,
              ContributionPct: contributionPct.toFixed(2) + '%',
              isTotalRow: false
            });
          });

          dishGroupRows.push({
            DishGroupname: '',
            CategoryName: '',
            BillCount: '',
            Sold: '',
            ItemSales: '',
            ItemDisc: '',
            BillDisc: '',
            FOC: '',
            NetSales: '',
            ContributionPct: '',
            isSpacer: true
          });
        }

        if (dishGroupRows.length > 0 && dishGroupRows[dishGroupRows.length - 1] && dishGroupRows[dishGroupRows.length - 1].isSpacer) {
          dishGroupRows.pop();
        }

        dishGroupRows.push({
          DishGroupname: 'Grand Total:',
          CategoryName: '',
          BillCount: overallUniqueBills,
          Sold: totalSold,
          ItemSales: totalItemSales,
          ItemDisc: totalItemDisc,
          BillDisc: totalBillDisc,
          FOC: totalFOC,
          NetSales: totalNetSales,
          ContributionPct: '100.00%',
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['DishGroupname', 'Sold', 'ItemSales', 'ItemDisc', 'BillDisc', 'FOC', 'NetSales'];
        forcedData = dishGroupRows;
      }

      // ✅ DISH SALES REPORT (With Category, DishGroup, Detail Total, Bill Discount, Grand Total)
      else if (byItem === "Dish") {
        console.log("Processing Dish Sales Report");

        let totalSold = 0;
        let totalItemSales = 0;
        let totalItemDisc = 0;
        let totalBillDisc = 0;
        let totalFOC = 0;
        let totalNetSales = 0;

        const categoryGroups = new Map();

        const actualDataRows = rawData.filter(r => !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer && !r.isTotalRow && !r.isGrandTotal);
        const overallUniqueBills = rawData.length > 0 ? (Number(rawData[0].OverallTotalBills || rawData[0].TotalBills) || Math.max(...actualDataRows.map(r => Number(r.BillCount || 0)))) : 0;

        actualDataRows.forEach(row => {
          const categoryName = row.CategoryName || 'Uncategorized';
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, new Map());
          }
          const dishGroupMap = categoryGroups.get(categoryName);
          const dishGroupName = row.DishGroupName || row.DishGroupname || 'Uncategorized';
          if (!dishGroupMap.has(dishGroupName)) {
            dishGroupMap.set(dishGroupName, []);
          }
          dishGroupMap.get(dishGroupName).push(row);
        });

        const dishRows = [];

        for (const [categoryName, dishGroupMap] of categoryGroups.entries()) {
          dishRows.push({
            Dishname: categoryName,
            CategoryName: categoryName,
            BillCount: '',
            Sold: '',
            ItemSales: '',
            ItemDisc: '',
            BillDisc: '',
            FOC: '',
            NetSales: '',
            isCategoryHeader: true,
            isTotalRow: false
          });

          const dishGroupEntries = Array.from(dishGroupMap.entries());

          for (let idx = 0; idx < dishGroupEntries.length; idx++) {
            const [dishGroupName, items] = dishGroupEntries[idx];

            dishRows.push({
              Dishname: dishGroupName,
              CategoryName: categoryName,
              DishGroupname: dishGroupName,
              BillCount: '',
              Sold: '',
              ItemSales: '',
              ItemDisc: '',
              BillDisc: '',
              FOC: '',
              NetSales: '',
              isDishGroupHeader: true,
              isTotalRow: false
            });

            items.forEach(row => {
              const billCount = Number(row.BillCount || 0);
              const sold = Number(row.Sold || 0);
              const itemSales = Number(row.ItemSales || 0);
              const itemDisc = Number(row.ItemDisc || 0);
              const billDisc = Number(row.BillDisc || row.BillDiscount || 0);
              const foc = Number(row.Foc || 0);
              const netSales = Number(row.NetSales || itemSales || 0);

              totalSold += sold;
              totalItemSales += itemSales;
              totalItemDisc += itemDisc;
              totalBillDisc += billDisc;
              totalFOC += foc;
              totalNetSales += netSales;

              dishRows.push({
                Dishname: row.Dishname || row.DishName || '-',
                CategoryName: categoryName,
                DishGroupname: dishGroupName,
                BillCount: billCount,
                Sold: sold,
                ItemSales: itemSales,
                ItemDisc: itemDisc,
                BillDisc: billDisc,
                FOC: foc,
                NetSales: netSales,
                isTotalRow: false
              });
            });
          }

          if (categoryGroups.size > 1) {
            dishRows.push({
              Dishname: '',
              BillCount: '',
              Sold: '',
              ItemSales: '',
              ItemDisc: '',
              BillDisc: '',
              FOC: '',
              NetSales: '',
              isSpacer: true
            });
          }
        }

        if (dishRows.length > 0 && dishRows[dishRows.length - 1] && dishRows[dishRows.length - 1].isSpacer) {
          dishRows.pop();
        }

        dishRows.push({
          Dishname: 'Grand Total:',
          BillCount: overallUniqueBills,
          Sold: totalSold,
          ItemSales: totalItemSales,
          ItemDisc: totalItemDisc,
          BillDisc: totalBillDisc,
          FOC: totalFOC,
          NetSales: totalNetSales,
          isTotalRow: true,
          isGrandTotal: true
        });

        forcedColumns = ['Dishname', 'Sold', 'ItemSales', 'ItemDisc', 'BillDisc', 'FOC', 'NetSales'];
        forcedData = dishRows;
      }

      // ✅ PAYMODE COLLECTION REPORT - PIVOTED SUMMARY FORMAT (Like Crystal Report)
      // ✅ PAYMODE COLLECTION REPORT - PIVOTED SUMMARY FORMAT
      else if (dayEnd === "Paymode") {
        console.log("Processing Paymode Collection Report - Pivoted Format");

        // Check if data is already in pivoted format (has Cash column)
        if (rawData.length > 0 && rawData[0].hasOwnProperty('Cash')) {
          // Data is already pivoted from backend
          forcedColumns = ["Date", "Cash", "Nets", "Paynow", "UPI", "Member", "Credit", "Online", "Yeahpay_Paynow", "Yeahpay_Card"];
          forcedData = rawData.map(row => ({
            Date: row.Date || '-',
            Cash: Number(row.Cash || 0).toFixed(2),
            Nets: Number(row.Nets || 0).toFixed(2),
            Paynow: Number(row.Paynow || 0).toFixed(2),
            UPI: Number(row.UPI || 0).toFixed(2),
            Member: Number(row.Member || 0).toFixed(2),
            Credit: Number(row.Credit || 0).toFixed(2),
            Online: Number(row.Online || 0).toFixed(2),
            Yeahpay_Paynow: Number(row.Yeahpay_Paynow || 0).toFixed(2),
            Yeahpay_Card: Number(row.Yeahpay_Card || 0).toFixed(2)
          }));
        } else {
          // Fallback: If data is in old format, aggregate by date and paymode
          console.log("Converting raw data to pivoted format");

          // Group by Date and PayMode
          const datePayModeMap = new Map();

          rawData.forEach(row => {
            const date = row.Date || '-';
            const payMode = row.PayMode || row.Paymode || 'Unknown';
            const amount = Number(row.Amount || row.SysAmount || 0);

            if (!datePayModeMap.has(date)) {
              datePayModeMap.set(date, new Map());
            }
            const payModeMap = datePayModeMap.get(date);
            const currentAmount = payModeMap.get(payMode) || 0;
            payModeMap.set(payMode, currentAmount + amount);
          });

          // Convert to array format
          const pivotedData = [];
          for (const [date, payModeMap] of datePayModeMap.entries()) {
            const row = {
              Date: date,
              Cash: 0,
              Nets: 0,
              Paynow: 0,
              UPI: 0,
              Member: 0,
              Credit: 0,
              Online: 0,
              Yeahpay_Paynow: 0,
              Yeahpay_Card: 0,
              Others: 0
            };

            for (const [payMode, amount] of payModeMap.entries()) {
              const upperPayMode = payMode.toUpperCase();
              if (upperPayMode === 'CASH') row.Cash = amount;
              else if (upperPayMode === 'NETS') row.Nets = amount;
              else if (upperPayMode === 'PAYNOW') row.Paynow = amount;
              else if (upperPayMode === 'UPI' || upperPayMode === 'UPI/GPAY') row.UPI = amount;
              else if (upperPayMode === 'MEMBER') row.Member = amount;
              else if (upperPayMode === 'CREDIT') row.Credit = amount;
              else if (upperPayMode === 'ONLINE') row.Online = amount;
              else if (upperPayMode === 'YEAHPAY PAYNOW' || upperPayMode === 'YEAHPAYPAYNOW') row.Yeahpay_Paynow = amount;
              else if (upperPayMode === 'YEAHPAY CARD' || upperPayMode === 'YEAHPAYCARD') row.Yeahpay_Card = amount;
              else row.Others += amount;
            }

            pivotedData.push(row);
          }

          forcedColumns = ['Date', 'Cash', 'Nets', 'Paynow', 'UPI', 'Member', 'Credit', 'Online', 'Yeahpay_Paynow', 'Yeahpay_Card'];
          forcedData = pivotedData.map(row => ({
            Date: row.Date,
            Cash: row.Cash.toFixed(2),
            Nets: row.Nets.toFixed(2),
            Paynow: row.Paynow.toFixed(2),
            UPI: row.UPI.toFixed(2),
            Member: row.Member.toFixed(2),
            Credit: row.Credit.toFixed(2),
            Online: row.Online.toFixed(2),
            Yeahpay_Paynow: row.Yeahpay_Paynow.toFixed(2),
            Yeahpay_Card: row.Yeahpay_Card.toFixed(2)
          }));
        }

        console.log("Paymode Data Processed, rows:", forcedData.length);
        console.log("Columns:", forcedColumns);
      }
      // Sales Summary report (only when bySales === 'Summary')
      else if (bySales === 'Summary' && data.columns && (data.columns.includes('Sales') || data.columns.includes('Cash'))) {
        forcedColumns = [
          'Date',
          'Sales',
          'FOC',
          'Disc',
          'SVC',
          'gst',
          'Tips',
          'Rnd'
        ];
        forcedData = rawData.map(row => {
          const nets = parseFloat(row.Nets || row.NETS || 0);
          const paynow = parseFloat(row.PayNow || row.Paynow || 0);
          const upi = parseFloat(row.UPI || 0);
          const member = parseFloat(row.Member || 0);
          const credit = parseFloat(row.Credit || 0);
          const online = parseFloat(row.Online || 0);
          const ypaynow = parseFloat(row.YeahPay_PayNow || row.Yeahpay_Paynow || 0);
          const ycard = parseFloat(row.YeahPay_Card || row.Yeahpay_Card || 0);

          return {
            Date: row.Date || (row.InvoiceDate ? new Date(row.InvoiceDate).toLocaleDateString('en-GB') : ''),
            Sales: Number(row.Sales || row.ItemSales || 0).toFixed(2),
            FOC: Number(row.FOC || 0).toFixed(2),
            Disc: Number(row.Disc || row.Discount || 0).toFixed(2),
            SVC: Number(row.SVC || 0).toFixed(2),
            gst: Number(row.gst || row.Tax || row['Tax 9%'] || row['Tax 7%'] || 0).toFixed(2),
            Tips: Number(row.Tips || 0).toFixed(2),
            Rnd: Number(row.Rnd || 0).toFixed(2),
            Cash: Number(row.Cash || 0),
            Bills: parseInt(row.Bills || 0),
            Pax: parseInt(row.Pax || 0),
            Nets: nets,
            PayNow: paynow,
            UPI: upi,
            Member: member,
            Credit: credit,
            Online: online,
            YeahPay_PayNow: ypaynow,
            YeahPay_Card: ycard
          };
        });
      }




      // Itemwise report
      else if (orderSales === "Itemwise") {
        forcedColumns = ['Item', 'Qty', 'Amount'];
        forcedData = rawData.map(row => ({
          Item: row.Item || '-',
          Qty: Number(row.Qty || 0),
          Amount: Number(row.Amount || 0).toFixed(2)
        }));
      }
      // Hourly report
      else if (dayEnd === "Hourly" || orderSales === "Hourly" || (data.columns && data.columns.includes('Hour') && data.columns.includes('Amount'))) {
        forcedColumns = ['Date', 'Hour', 'Qty', 'Amount'];
        // Filter out separate date subtotal rows ("Total:"), populate Date with actual date, and keep single Grand Total row
        const cleanData = [];
        let grandTotalFound = false;

        rawData.forEach(row => {
          if (row.isDateTotal || row.Date === 'Total:' || row.Date === 'TOTAL') {
            return; // completely remove separate date subtotal row from screen view
          }
          if (row.isGrandTotal || row.Date === 'Grand Total:') {
            if (!grandTotalFound) {
              cleanData.push({
                ...row,
                Date: 'Grand Total:',
                Hour: row.Hour || '',
                Qty: row.Qty !== undefined ? Number(row.Qty) : 0,
                Amount: row.Amount !== undefined ? Number(row.Amount) : 0,
                isTotalRow: true,
                isGrandTotal: true
              });
              grandTotalFound = true;
            }
            return;
          }

          // Legitimate hourly data row: ensure actual transaction date (RawDate or Date) is displayed
          const actualDate = row.RawDate || row.Date || '';
          cleanData.push({
            ...row,
            Date: actualDate,
            Hour: row.Hour || '',
            Qty: row.Qty !== undefined ? Number(row.Qty) : 0,
            Amount: row.Amount !== undefined ? Number(row.Amount) : 0,
            isTotalRow: false,
            isGrandTotal: false
          });
        });

        // If no Grand Total row was provided in rawData, calculate and append it dynamically
        if (!grandTotalFound && cleanData.length > 0) {
          const totQty = cleanData.reduce((sum, r) => sum + (Number(r.Qty) || 0), 0);
          const totAmt = cleanData.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0);
          cleanData.push({
            Date: 'Grand Total:',
            Hour: '',
            Qty: totQty,
            Amount: data.grandTotal !== undefined && data.grandTotal !== null ? Number(data.grandTotal) : totAmt,
            isTotalRow: true,
            isGrandTotal: true
          });
        }

        forcedData = cleanData;
      }
      // Daywise report
      else if (data.columns && data.columns.includes('No of Bills')) {
        forcedColumns = ['Date', 'No of Bills', 'Qty', 'Amount'];
        forcedData = rawData;
      }
      else {
        // All other reports
        forcedColumns = data.columns || Object.keys(rawData[0] || {});
        forcedData = rawData;
      }

      console.log("Final Columns:", forcedColumns);
      console.log("Final Data Sample:", forcedData.slice(0, 3));

      setLocalData(forcedData);
      setColumns(forcedColumns);
      setGrandTotal(data.grandTotal || 0);
      setPerformanceData(data.performanceData || null);
      setPaymodeData(data.paymodeBreakdown || null);

    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted for previous request");
        return;
      }
      console.error("Error fetching data:", error);
      setErrorMessage(error.message || "Failed to load report data. Please check server connection.");
      setLocalData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset search state and clear data when any filter/parameter changes (except during initial auto-load of saved state)
  useEffect(() => {
    if (!hasAutoLoadedRef.current) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSearched(false);
    setIsLoading(false);
    setErrorMessage("");
    setLocalData([]);
    setPaymodeData(null);
  }, [orderSales, dayEnd, bySales, byItem, fromDate, toDate, category, dishGroup]);

  // Requirement 2: Auto-run handleFind once on mount if a report was previously selected before refresh
  useEffect(() => {
    if (!hasAutoLoadedRef.current) {
      hasAutoLoadedRef.current = true;
      if (savedState && (savedState.orderSales || savedState.dayEnd || savedState.bySales || savedState.byItem)) {
        handleFind();
      }
    }
  }, []);

  const handleClear = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Could not clear sessionStorage", e);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setOrderSales("");
    setDayEnd("");
    setBySales("");
    setByItem("");
    setSystemDate(false);
    setShowChart(false);
    setActiveShowChart(false);
    setSelectedChartType(null);
    setAppliedFilters({
      fromDate: today,
      toDate: today,
      orderSales: "",
      dayEnd: "",
      bySales: "",
      byItem: "",
      category: "",
      dishGroup: "",
      topNLimit: "10"
    });
    setTopNLimit("10");
    setPostDate(false);
    setIsSearched(false);
    setIsLoading(false);
    setErrorMessage("");
    setOutputType("Screen");
    setLocalData([]);
    setCategory("");
    setDishGroup("");
    setGrandTotal(0);
    setSummaryData(null);
    setPaymodeData(null);
  };

  let displayData = localData.length > 0 ? localData : salesData;
  const isHierarchicalGrouped = displayData.some(r => r.isCategoryHeader || r.isDishGroupHeader || r.isDateHeader || r.isOrderHeader) || (appliedFilters.dayEnd || dayEnd) === "DiscountDetail";

  if (sortColumn && displayData.length > 0 && !isHierarchicalGrouped) {
    const dataRows = displayData.filter(r => !r.isTotalRow && !r.isGrandTotal && !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer);
    const otherRows = displayData.filter(r => r.isTotalRow || r.isGrandTotal || r.isCategoryHeader || r.isDishGroupHeader || r.isSpacer);

    dataRows.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      const cleanA = typeof valA === 'string' ? valA.trim().replace(/^[$%,\s]+|[$%,\s]+$/g, '') : valA;
      const cleanB = typeof valB === 'string' ? valB.trim().replace(/^[$%,\s]+|[$%,\s]+$/g, '') : valB;

      const numA = parseFloat(cleanA);
      const numB = parseFloat(cleanB);
      const isNumA = cleanA !== '' && !isNaN(numA);
      const isNumB = cleanB !== '' && !isNaN(numB);

      let comparison = 0;
      if (isNumA && isNumB) {
        comparison = numA - numB;
      } else {
        comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    // Re-assign Rank (1, 2, 3...) if Rank column exists and not sorting by Rank
    if (dayEnd === "TopNItems" && sortColumn !== "Rank") {
      dataRows.forEach((r, idx) => {
        r.Rank = idx + 1;
      });
    }

    displayData = [...dataRows, ...otherRows];
  }
  const displayColumns = localData.length > 0 ? columns : initialColumns;
  const hasData = displayData.length > 0;

  return (
    <div className={`sales report-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="report-header">
        <h2 className="report-title">Sales Report</h2>
      </div>

      <div className="filter-section">
        <div className="filter-row">

          <div className="filter-group">
            <label className="tb-label">Day end reports</label>
            <select className={dayEnd ? "has-value" : ""} value={dayEnd} onChange={(e) => setDayEnd(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="Paymode">Payment Collection</option>
              <option value="Transaction">Transaction Summary</option>
              <option value="GST">Tax Summary</option>
              <option value="GuestMeal">Guest Summary</option>
              <option value="DiscountSummary">Discount Report</option>
              <option value="DiscountDetail">Discount Detail Report</option>
              <option value="TopNItems">Top Selling Items</option>
              <option value="RefundSummary">Refund Report</option>
              <option value="TableChange">Table Transfer</option>
              <option value="Cancellation">Cancelled Orders</option>
              <option value="Hourly">Hourly Sales</option>

            </select>
          </div>
          <div className="filter-group">
            <label className="tb-label">Sales reports</label>
            <select className={bySales ? "has-value" : ""} value={bySales} onChange={(e) => setBySales(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="Journal">Sales Journal</option>
              <option value="Summary">Sales Summary</option>
              <option value="BusinessType">Sales by Business Type</option>
              <option value="MealPeriod">Sales by Meal Period</option>
              <option value="Analysis">Sales Performance</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="tb-label">Item reports</label>
            <select className={byItem ? "has-value" : ""} value={byItem} onChange={(e) => {
              setByItem(e.target.value);
              setCategory("");
              setDishGroup("");
            }}>
              <option value="">-- Select --</option>
              <option value="Month">Monthly Sales Summary</option>
              <option value="QtyDetail">Monthly Sales Detail</option>
              <option value="Qty">Quantity Sales Summary</option>
              <option value="QtyGroup">Quantity Sales Detail</option>
              <option value="Category">Category Sales</option>
              <option value="Dish">Dish Sales</option>
              <option value="DishGroup">Disgroup Sales</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="tb-label">From Date</label>
            <input className={fromDate ? "has-value" : ""} type="date" max={getTodayStr()} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label className="tb-label">To Date</label>
            <input className={toDate ? "has-value" : ""} type="date" max={getTodayStr()} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="filter-actions">
            <button className="find-btn" onClick={handleFind} disabled={isLoading} style={isLoading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
              {isLoading ? "Loading..." : "Find"}
            </button>
            <button className="clear-btn" onClick={handleClear} disabled={isLoading}>Clear</button>
          </div>
        </div>

        {/* Secondary filters row (Category & Dish Group for item-based reports) */}
        {(orderSales === "Itemwise" ||
          byItem === "Month" ||
          byItem === "Qty" ||
          byItem === "Category" ||
          byItem === "DishGroup" ||
          byItem === "Dish") && (
            <div className="filter-row secondary-filters">
              <div className="filter-group">
                <label className="tb-label">Category</label>
                <div className="lov-input-group">
                  <input
                    className={category ? "has-value" : ""}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Select Category"
                  />
                  <button
                    type="button"
                    className="lov-btn"
                    onClick={() => {
                      fetchCategories();
                      setShowCategoryLOV(true);
                    }}
                  >
                    ...
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <label className="tb-label">Dish Group</label>
                <div className="lov-input-group">
                  <input
                    className={dishGroup ? "has-value" : ""}
                    value={dishGroup}
                    onChange={(e) => setDishGroup(e.target.value)}
                    placeholder="Select Dish Group"
                  />
                  <button
                    type="button"
                    className="lov-btn"
                    onClick={() => {
                      if (selectedCategoryId) {
                        fetchDishGroups(selectedCategoryId);
                      } else {
                        fetchDishGroups();
                      }
                      setShowDishGroupLOV(true);
                    }}
                  >
                    ...
                  </button>
                </div>
              </div>

              {/* Checkboxes beside category/dish group when secondary filters are open */}
              <div className="filter-group checkbox-filter-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end', alignItems: 'center', gap: '18px', paddingBottom: '10px' }}>
                {Boolean(orderSales) && (
                  <label className="sales-system-date-label" htmlFor="sales-report-system-date-item">
                    <input
                      id="sales-report-system-date-item"
                      className="sales-system-date-checkbox"
                      type="checkbox"
                      checked={systemDate}
                      onChange={(e) => handleSystemDateChange(e.target.checked)}
                    />
                    System Date
                  </label>
                )}
                <label className="sales-show-chart-label" htmlFor="sales-report-show-chart-item">
                  <input
                    id="sales-report-show-chart-item"
                    className="sales-show-chart-checkbox"
                    type="checkbox"
                    checked={showChart}
                    onChange={(e) => setShowChart(e.target.checked)}
                  />
                  Show Chart
                </label>
              </div>
            </div>
          )}

        {/* Top Selling Items (Top 10 / Top 20 / All) Secondary Filter Row */}
        {dayEnd === "TopNItems" && (
          <div className="filter-row secondary-filters" style={{ alignItems: 'flex-end', paddingTop: '10px', paddingBottom: '10px' }}>
            <div className="filter-group" style={{ maxWidth: '200px' }}>
              <label className="tb-label">Top Limit</label>
              <select
                className={topNLimit ? "has-value" : ""}
                value={topNLimit}
                onChange={(e) => setTopNLimit(e.target.value)}
              >
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="filter-group checkbox-filter-group" style={{ flex: '1', justifyContent: 'flex-end', alignItems: 'center', gap: '18px', paddingBottom: '6px' }}>
              <label className="sales-show-chart-label" htmlFor="sales-report-show-chart-topn">
                <input
                  id="sales-report-show-chart-topn"
                  className="sales-show-chart-checkbox"
                  type="checkbox"
                  checked={showChart}
                  onChange={(e) => setShowChart(e.target.checked)}
                />
                Show Chart
              </label>
            </div>
          </div>
        )}

        {/* Checkbox row for supported reports that do NOT have secondary filters */}
        {!(orderSales === "Itemwise" || byItem === "Month" || byItem === "Qty" || byItem === "Category" || byItem === "DishGroup" || byItem === "Dish" || dayEnd === "TopNItems") &&
         Boolean(
           dayEnd === "Hourly" || orderSales === "Hourly" || orderSales === "Daywise" || orderSales === "Group" || orderSales === "GroupDetail" ||
           dayEnd === "Paymode" ||
           bySales === "Summary" || bySales === "BusinessType" || bySales === "MealPeriod" ||
           byItem === "QtyGroup" || byItem === "QtyDetail"
         ) && (
          <div className="filter-row secondary-filters" style={{ justifyContent: 'flex-end', paddingTop: '4px', paddingBottom: '8px' }}>
            <div className="filter-group checkbox-filter-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end', alignItems: 'center', gap: '18px' }}>
              {Boolean(orderSales) && (
                <label className="sales-system-date-label" htmlFor="sales-report-system-date-general">
                  <input
                    id="sales-report-system-date-general"
                    className="sales-system-date-checkbox"
                    type="checkbox"
                    checked={systemDate}
                    onChange={(e) => handleSystemDateChange(e.target.checked)}
                  />
                  System Date
                </label>
              )}
              <label className="sales-show-chart-label" htmlFor="sales-report-show-chart-general">
                <input
                  id="sales-report-show-chart-general"
                  className="sales-show-chart-checkbox"
                  type="checkbox"
                  checked={showChart}
                  onChange={(e) => setShowChart(e.target.checked)}
                />
                Show Chart
              </label>
            </div>
          </div>
        )}
      </div>

      {isSearched && (
        <div className="report-output-section">
          <div className="professional-report-wrapper">
            {hasData ? (
              <>
                {/* Dynamic Visual Graph when Show Chart is selected AND Find was clicked */}
                {activeShowChart && (
                  <SalesReportChart
                    reportKey={appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem}
                    reportTitle={
                      ((appliedFilters.dayEnd || dayEnd) === "Hourly" || (appliedFilters.orderSales || orderSales) === "Hourly") ? "Hourly Sales" :
                      (appliedFilters.orderSales || orderSales) === "Daywise" ? "Daywise Sales" :
                      (appliedFilters.orderSales || orderSales) === "Itemwise" ? "Itemwise Sales" :
                      (appliedFilters.orderSales || orderSales) === "Group" ? "Group Sales" :
                      (appliedFilters.orderSales || orderSales) === "GroupDetail" ? "Group Sales Detail" :
                      (appliedFilters.dayEnd || dayEnd) === "Paymode" ? "Payment Collection" :
                      (appliedFilters.dayEnd || dayEnd) === "Transaction" ? "Transaction Cash" :
                      (appliedFilters.bySales || bySales) === "Summary" ? "Sales Summary" :
                      (appliedFilters.byItem || byItem) === "Month" ? "Monthly Sales Summary" :
                      (appliedFilters.byItem || byItem) === "QtyDetail" ? "Monthly Sales Detail" :
                      (appliedFilters.byItem || byItem) === "Qty" ? "Quantity Sales Summary" :
                      (appliedFilters.byItem || byItem) === "QtyGroup" ? "Quantity Sales Detail" :
                      (appliedFilters.byItem || byItem) === "Category" ? "Category Sales" :
                      (appliedFilters.byItem || byItem) === "DishGroup" ? "Disgroup Sales" :
                      (appliedFilters.byItem || byItem) === "Dish" ? "Dish Sales" :
                      (appliedFilters.dayEnd || dayEnd) === "TopNItems" ? (
                        (appliedFilters.topNLimit || topNLimit) === "all" ? "Top Selling Items (All)" : `Top ${appliedFilters.topNLimit || topNLimit || "10"} Selling Items`
                      ) :
                      (appliedFilters.dayEnd || dayEnd) === "DiscountSummary" ? "Discount Summary" :
                      (appliedFilters.dayEnd || dayEnd) === "DiscountDetail" ? "Discount Sales Detail" :
                      (appliedFilters.bySales || bySales) === "BusinessType" ? "Sales by Business Type" :
                      (appliedFilters.bySales || bySales) === "MealPeriod" ? "Sales by Meal Period" :
                      (appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem || "Sales Report")
                    }
                    data={displayData}
                    fromDate={appliedFilters.fromDate || fromDate}
                    toDate={appliedFilters.toDate || toDate}
                    chartType={selectedChartType}
                    onChartTypeChange={(newType) => setSelectedChartType(newType)}
                  />
                )}

                {/* ✅ New KPI Cards for Group Sales Dashboard */}
                {orderSales === "Group" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = dataRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalQty = dataRows.reduce((sum, r) => sum + (parseInt(r.Qty) || 0), 0);
                  const totalGroups = dataRows.length;
                  const totalBills = dataRows.reduce((sum, r) => sum + (parseInt(r.BillCount || r.Bills || r['No of Bills'] || r.NoOfBills || 0) || 0), 0);

                  let topSellingGroup = '-';
                  let topSalesAmount = 0;
                  let topQtyGroup = '-';
                  let topQtyVal = 0;

                  dataRows.forEach(r => {
                    const amt = parseFloat(r.Amount) || 0;
                    const qty = parseInt(r.Qty) || 0;
                    if (amt > topSalesAmount) {
                      topSalesAmount = amt;
                      topSellingGroup = r.Group || '-';
                    }
                    if (qty > topQtyVal) {
                      topQtyVal = qty;
                      topQtyGroup = r.Group || '-';
                    }
                  });

                  const avgSalesPerGroup = totalGroups > 0 ? totalSales / totalGroups : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Bill Count</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Groups</div>
                        <div className="analysis-kpi-value">{formatNumber(totalGroups, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Group</div>
                        <div className="analysis-kpi-value">{topSellingGroup}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Sales Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(topSalesAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Qty Group</div>
                        <div className="analysis-kpi-value">{topQtyGroup}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Sales Per Group</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgSalesPerGroup)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ KPI Cards for Group Sales Detail Dashboard */}
                {orderSales === "GroupDetail" && (() => {
                  const detailRows = localData.filter(r => !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer && !r.isTotalRow && !r.isGrandTotal && r.Date !== 'Grand Total:');
                  const totalSales = detailRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalQty = detailRows.reduce((sum, r) => sum + (parseInt(r.Qty) || 0), 0);

                  let currentCategory = '';
                  const groupMap = {};
                  const dishMap = {};

                  localData.forEach(r => {
                    if (r.isCategoryHeader) {
                      currentCategory = r.DishGroupname || r.DishName || 'Uncategorized';
                      if (!groupMap[currentCategory]) {
                        groupMap[currentCategory] = { name: currentCategory, qty: 0, amount: 0 };
                      }
                    } else if (!r.isTotalRow && !r.isGrandTotal && !r.isDishGroupHeader && !r.isSpacer && r.Date !== 'Grand Total:') {
                      const qty = parseInt(r.Qty) || 0;
                      const amt = parseFloat(r.Amount) || 0;
                      if (currentCategory) {
                        if (!groupMap[currentCategory]) groupMap[currentCategory] = { name: currentCategory, qty: 0, amount: 0 };
                        groupMap[currentCategory].qty += qty;
                        groupMap[currentCategory].amount += amt;
                      }
                      const dish = r.DishName || '-';
                      if (!dishMap[dish]) {
                        dishMap[dish] = { name: dish, qty: 0, amount: 0 };
                      }
                      dishMap[dish].qty += qty;
                      dishMap[dish].amount += amt;
                    }
                  });

                  const totalGroups = Object.keys(groupMap).length;
                  const totalUniqueDishes = Object.keys(dishMap).length;

                  let topSellingGroup = '-';
                  let topSalesAmount = 0;
                  let topQtyGroup = '-';
                  let topQtyVal = 0;

                  Object.values(groupMap).forEach(g => {
                    if (g.amount > topSalesAmount) {
                      topSalesAmount = g.amount;
                      topSellingGroup = g.name;
                    }
                    if (g.qty > topQtyVal) {
                      topQtyVal = g.qty;
                      topQtyGroup = g.name;
                    }
                  });

                  let topSellingDish = '-';
                  let topDishQty = 0;
                  Object.values(dishMap).forEach(d => {
                    if (d.qty > topDishQty) {
                      topDishQty = d.qty;
                      topSellingDish = d.name;
                    }
                  });

                  const avgSalesPerGroup = totalGroups > 0 ? totalSales / totalGroups : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Groups</div>
                        <div className="analysis-kpi-value">{formatNumber(totalGroups, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Dishes</div>
                        <div className="analysis-kpi-value">{formatNumber(totalUniqueDishes, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Group</div>
                        <div className="analysis-kpi-value">{topSellingGroup}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Group Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(topSalesAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Dish</div>
                        <div className="analysis-kpi-value">{topSellingDish} ({formatNumber(topDishQty, true)})</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Sales / Group</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgSalesPerGroup)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Transaction (Cash In & Cash Out) Dashboard */}
                {dayEnd === "Transaction" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalCashIn = dataRows.reduce((sum, r) => sum + (parseFloat(r.CashIn || 0) || 0), 0);
                  const totalCashOut = dataRows.reduce((sum, r) => sum + (parseFloat(r.CashOut || 0) || 0), 0);
                  const netCash = totalCashIn - totalCashOut;
                  const totalTransactions = dataRows.length;
                  const cashInCount = dataRows.filter(r => (parseFloat(r.CashIn || 0) || 0) > 0).length;
                  const cashOutCount = dataRows.filter(r => (parseFloat(r.CashOut || 0) || 0) > 0).length;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Cash In</div>
                        <div className="analysis-kpi-value" style={{ color: '#2e7d32' }}>$ {formatNumber(totalCashIn)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Cash Out</div>
                        <div className="analysis-kpi-value" style={{ color: '#c62828' }}>$ {formatNumber(totalCashOut)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Net Cash Balance</div>
                        <div className="analysis-kpi-value">$ {formatNumber(netCash)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Transactions</div>
                        <div className="analysis-kpi-value">{formatNumber(totalTransactions, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cash In Count</div>
                        <div className="analysis-kpi-value">{formatNumber(cashInCount, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cash Out Count</div>
                        <div className="analysis-kpi-value">{formatNumber(cashOutCount, true)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Cancellation Dashboard */}
                {dayEnd === "Cancellation" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalCancelledOrders = dataRows.length;
                  const totalCancelledAmount = dataRows.reduce((sum, r) => sum + (parseFloat(r.CancelledAmount || 0) || 0), 0);
                  const avgCancelledValue = totalCancelledOrders > 0 ? totalCancelledAmount / totalCancelledOrders : 0;

                  // Find most common cancel reason
                  const reasons = dataRows.map(r => r.CancelReason).filter(r => r && r !== '-');
                  let mostCommonReason = '-';
                  if (reasons.length > 0) {
                    const counts = {};
                    let maxCount = 0;
                    reasons.forEach(r => {
                      counts[r] = (counts[r] || 0) + 1;
                      if (counts[r] > maxCount) {
                        maxCount = counts[r];
                        mostCommonReason = r;
                      }
                    });
                  }

                  // Cancel Rate %
                  const settledCount = dataRows.length > 0 ? (parseInt(dataRows[0].SettledCount) || 0) : 0;
                  const totalOrders = totalCancelledOrders + settledCount;
                  const cancelRate = totalOrders > 0 ? (totalCancelledOrders / totalOrders) * 100 : 0;

                  // Highest Cancelled Order Value
                  const highestCancelledValue = dataRows.length > 0
                    ? Math.max(...dataRows.map(r => parseFloat(r.CancelledAmount || 0) || 0))
                    : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Cancelled Orders</div>
                        <div className="analysis-kpi-value">{formatNumber(totalCancelledOrders, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Cancelled Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalCancelledAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Average Cancelled Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgCancelledValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Most Common Cancel Reason</div>
                        <div className="analysis-kpi-value">{mostCommonReason}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cancel Rate %</div>
                        <div className="analysis-kpi-value">{cancelRate.toFixed(2)}%</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Highest Cancelled Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(highestCancelledValue)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Top N Items Dashboard */}
                {dayEnd === "TopNItems" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = dataRows.reduce((sum, r) => sum + (parseFloat(r.SalesAmount || 0) || 0), 0);
                  const totalQty = dataRows.reduce((sum, r) => sum + (parseFloat(r.QtySold || 0) || 0), 0);

                  // Find Top Selling (by Qty)
                  const sortedByQty = [...dataRows].sort((a, b) => (parseFloat(b.QtySold) || 0) - (parseFloat(a.QtySold) || 0));
                  const topSellingItem = sortedByQty[0]?.DishName || '-';
                  const topSellingQty = parseFloat(sortedByQty[0]?.QtySold || 0);

                  // Find Highest Revenue
                  const sortedByRev = [...dataRows].sort((a, b) => (parseFloat(b.SalesAmount) || 0) - (parseFloat(a.SalesAmount) || 0));
                  const highestRevenueItem = sortedByRev[0]?.DishName || '-';
                  const highestRevenueAmount = parseFloat(sortedByRev[0]?.SalesAmount || 0);

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Item</div>
                        <div className="analysis-kpi-value">{topSellingItem}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Qty</div>
                        <div className="analysis-kpi-value">{formatNumber(topSellingQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Highest Revenue Item</div>
                        <div className="analysis-kpi-value">{highestRevenueItem}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Highest Revenue Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(highestRevenueAmount)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Discount Summary Dashboard */}
                {dayEnd === "DiscountSummary" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.Discount || 0) || 0), 0);
                  const itemDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.ItemDiscount || 0) || 0), 0);
                  const billDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.BillDiscount || 0) || 0), 0);
                  const discountedBills = dataRows.filter(r => (parseFloat(r.Discount || 0) || 0) > 0).length;
                  const totalSalesValue = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.SubTotal || r.subTotal || 0) || 0), 0);
                  const discountPct = totalSalesValue > 0 ? (totalDiscount / totalSalesValue) * 100 : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Item Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(itemDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Bill Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(billDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Discounted Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(discountedBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSalesValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Discount %</div>
                        <div className="analysis-kpi-value">{discountPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Discount Sales Detail Dashboard */}
                {dayEnd === "DiscountDetail" && (() => {
                  const detailRows = localData.filter(r => !r.isDateHeader && !r.isOrderHeader && !r.isTotalRow && !r.isGrandTotal);
                  const totalSalesValue = detailRows.reduce((sum, r) => sum + (parseFloat(r.Total || 0) || 0), 0);
                  const totalQty = detailRows.reduce((sum, r) => sum + (parseFloat(r.Quantity || 0) || 0), 0);
                  const orderHeaders = localData.filter(r => r.isOrderHeader);
                  const totalDiscount = orderHeaders.reduce((sum, r) => sum + (parseFloat(r.Total || 0) || 0), 0);
                  const discountedOrders = orderHeaders.length;
                  const discountPct = (totalSalesValue + totalDiscount) > 0 ? (totalDiscount / (totalSalesValue + totalDiscount)) * 100 : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales Revenue</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSalesValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount Given</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Discounted Orders</div>
                        <div className="analysis-kpi-value">{formatNumber(discountedOrders, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Items Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Effective Discount %</div>
                        <div className="analysis-kpi-value">{discountPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Guest Meal Summary Dashboard */}
                {dayEnd === "GuestMeal" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalGuestMeals = dataRows.length;
                  const totalAmount = dataRows.reduce((sum, r) => sum + (parseFloat(r.ItemAmount || r.ItemAmt || 0) || 0), 0);
                  const totalDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.Discount || r.discountAmount || 0) || 0), 0);
                  const totalBills = dataRows.length;
                  const avgGuestMealValue = totalBills > 0 ? totalAmount / totalBills : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Guest Meals</div>
                        <div className="analysis-kpi-value">{formatNumber(totalGuestMeals, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Guest Meal Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Guest Meal Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgGuestMealValue)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for GST Dashboard */}
                {dayEnd === "GST" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.TotalAmount || r['Total Sales'] || 0) || 0), 0);
                  const totalTax = dataRows.reduce((sum, r) => sum + (parseFloat(r['GST 9%'] || r.TotalTax || r['Total Tax'] || r.GST || 0) || 0), 0);
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r.Bills || r['Total Bills'] || r.TotalBills || 0) || 0), 0);
                  const taxableSales = dataRows.reduce((sum, r) => sum + (parseFloat(r.TaxableAmount || 0) || 0), 0);

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total GST Collected</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalTax)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Taxable Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(taxableSales)}</div>
                      </div>
                    </div>
                  );
                })()}



                {/* ✅ New KPI Cards for Paymode Collection Dashboard */}
                {dayEnd === "Paymode" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);

                  let cashTotal = 0;
                  let netsTotal = 0;
                  let paynowTotal = 0;
                  let upiTotal = 0;
                  let memberTotal = 0;
                  let creditTotal = 0;
                  let onlineTotal = 0;
                  let yPaynowTotal = 0;
                  let yCardTotal = 0;
                  let othersTotal = 0;

                  dataRows.forEach(r => {
                    cashTotal += parseFloat(r.Cash) || 0;
                    netsTotal += parseFloat(r.Nets) || 0;
                    paynowTotal += parseFloat(r.Paynow || r.PayNow) || 0;
                    upiTotal += parseFloat(r.UPI || r.Upi) || 0;
                    memberTotal += parseFloat(r.Member) || 0;
                    creditTotal += parseFloat(r.Credit) || 0;
                    onlineTotal += parseFloat(r.Online) || 0;
                    yPaynowTotal += parseFloat(r.Yeahpay_Paynow || r.YeahPay_PayNow || 0) || 0;
                    yCardTotal += parseFloat(r.Yeahpay_Card || r.YeahPay_Card || 0) || 0;
                    othersTotal += parseFloat(r.Others) || 0;
                  });

                  const cashCollection = cashTotal;
                  const memberCollection = memberTotal;
                  const creditCollection = creditTotal;
                  const digitalCollection = netsTotal + paynowTotal + upiTotal + onlineTotal + yPaynowTotal + yCardTotal;
                  const totalCollection = summaryData ? summaryData.totalSales : (cashCollection + digitalCollection + memberCollection + creditCollection + othersTotal);

                  const modes = [
                    { name: 'CASH', val: cashTotal },
                    { name: 'NETS', val: netsTotal },
                    { name: 'PAYNOW', val: paynowTotal },
                    { name: 'UPI', val: upiTotal },
                    { name: 'MEMBER', val: memberTotal },
                    { name: 'CREDIT', val: creditTotal },
                    { name: 'ONLINE', val: onlineTotal },
                    { name: 'YPAYNOW', val: yPaynowTotal },
                    { name: 'YCARD', val: yCardTotal },
                    { name: 'OTHERS', val: othersTotal }
                  ];

                  let topPaymentMode = '-';
                  let maxVal = 0;
                  modes.forEach(m => {
                    if (m.val > maxVal) {
                      maxVal = m.val;
                      topPaymentMode = m.name;
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Collection</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalCollection)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cash Collection</div>
                        <div className="analysis-kpi-value">$ {formatNumber(cashCollection)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Digital Collection</div>
                        <div className="analysis-kpi-value">$ {formatNumber(digitalCollection)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Member Collection</div>
                        <div className="analysis-kpi-value">$ {formatNumber(memberCollection)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Credit Collection</div>
                        <div className="analysis-kpi-value">$ {formatNumber(creditCollection)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Payment Mode</div>
                        <div className="analysis-kpi-value">{topPaymentMode} (${formatNumber(maxVal)})</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Daywise Sales Dashboard */}
                {orderSales === "Daywise" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r.TotalBills || r.BillCount || r['No of Bills'] || r.NoOfBills || 0) || 0), 0);
                  const completedBills = dataRows.reduce((sum, r) => sum + (parseInt(r.CompletedBills || 0) || 0), 0);
                  const cancelledBills = dataRows.reduce((sum, r) => sum + (parseInt(r.CancelledBills || 0) || 0), 0);
                  const totalQty = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseFloat(r.Qty) || 0), 0);
                  const avgBillValue = completedBills > 0 ? totalSales / completedBills : (totalBills > 0 ? totalSales / totalBills : 0);

                  let bestSalesDay = '-';
                  let bestSalesAmount = 0;

                  dataRows.forEach(r => {
                    const amt = parseFloat(r.Amount) || 0;
                    if (amt > bestSalesAmount) {
                      bestSalesAmount = amt;
                      bestSalesDay = r.Date || '-';
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cancelled Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(cancelledBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Bill Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgBillValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Best Sales Day</div>
                        <div className="analysis-kpi-value">{bestSalesDay}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Best Sales Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(bestSalesAmount)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Hourly Sales Dashboard */}
                {(dayEnd === "Hourly" || orderSales === "Hourly") && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalQty = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseInt(r.Qty) || 0), 0);

                  let peakSalesHour = '-';
                  let peakSalesAmount = 0;
                  let peakQtyHour = '-';
                  let peakQtyVal = 0;

                  dataRows.forEach(r => {
                    const amt = parseFloat(r.Amount) || 0;
                    const qty = parseInt(r.Qty) || 0;
                    if (amt > peakSalesAmount) {
                      peakSalesAmount = amt;
                      peakSalesHour = r.Hour || '-';
                    }
                    if (qty > peakQtyVal) {
                      peakQtyVal = qty;
                      peakQtyHour = r.Hour || '-';
                    }
                  });

                  const numHours = dataRows.length;
                  const avgHourlySales = numHours > 0 ? totalSales / numHours : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Peak Sales Hour</div>
                        <div className="analysis-kpi-value">{peakSalesHour}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Peak Sales Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(peakSalesAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Peak Qty Hour</div>
                        <div className="analysis-kpi-value">{peakQtyHour}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Hourly Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgHourlySales)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Sales Journal Dashboard */}
                {bySales === "Journal" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.SubTotal) || 0), 0);
                  const totalDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.Discount) || 0), 0);
                  const totalGst = dataRows.reduce((sum, r) => sum + (parseFloat(r.TotalTax || r.Tax || 0) || 0), 0);
                  const totalSVC = dataRows.reduce((sum, r) => sum + (parseFloat(r.ServiceCharge || r.SVC || 0) || 0), 0);
                  const netSales = totalSales - totalDiscount + totalGst + totalSVC;
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.length;
                  const totalPax = dataRows.reduce((sum, r) => sum + (parseInt(r.TotalPax) || 0), 0);
                  const avgBillValue = totalBills > 0 ? netSales / totalBills : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Net Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(netSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total PAX</div>
                        <div className="analysis-kpi-value">{formatNumber(totalPax, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Bill Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgBillValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total GST</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalGst)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Service Charge</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSVC)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Sales Summary Dashboard */}
                {bySales === "Summary" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.Sales) || 0), 0);
                  const totalDiscount = dataRows.reduce((sum, r) => sum + (parseFloat(r.Disc || r.discount) || 0), 0);
                  const totalSVC = dataRows.reduce((sum, r) => sum + (parseFloat(r.SVC) || 0), 0);
                  const totalGst = dataRows.reduce((sum, r) => sum + (parseFloat(r.gst || r.GST) || 0), 0);
                  const totalTips = dataRows.reduce((sum, r) => sum + (parseFloat(r.Tips || r.tips) || 0), 0);
                  const totalRnd = dataRows.reduce((sum, r) => sum + (parseFloat(r.Rnd) || 0), 0);

                  const netSales = totalSales - totalDiscount + totalSVC + totalGst + totalTips + totalRnd;
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r.Bills || r.bills || r.NoOfBills || 0) || 0), 0);
                  const avgBillValue = totalBills > 0 ? netSales / totalBills : 0;

                  const cashSales = dataRows.reduce((sum, r) => sum + (parseFloat(r.Cash) || 0), 0);

                  const digitalSales = dataRows.reduce((sum, r) => {
                    const nets = parseFloat(r.Nets) || 0;
                    const paynow = parseFloat(r.PayNow || r.Paynow) || 0;
                    const upi = parseFloat(r.UPI) || 0;
                    const member = parseFloat(r.Member) || 0;
                    const credit = parseFloat(r.Credit) || 0;
                    const online = parseFloat(r.Online) || 0;
                    const ypaynow = parseFloat(r.YeahPay_PayNow || r.Yeahpay_Paynow) || 0;
                    const ycard = parseFloat(r.YeahPay_Card || r.Yeahpay_Card) || 0;
                    return sum + nets + paynow + upi + member + credit + online + ypaynow + ycard;
                  }, 0);

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Net Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(netSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Bill Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgBillValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total GST</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalGst)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Cash Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(cashSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Digital Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(digitalSales)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Sales by Business Type Dashboard - Matched with PDF Report View */}
                {bySales === "BusinessType" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const netSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.NetTotal || r['Net Total'] || 0) || 0), 0);
                  const dineInSales = dataRows.filter(r => r.Type === 'Dine In').reduce((sum, r) => sum + (parseFloat(r.SubTotal || r['Sub Total'] || 0) || 0), 0);
                  const takeAwaySales = dataRows.filter(r => r.Type === 'Take Away').reduce((sum, r) => sum + (parseFloat(r.SubTotal || r['Sub Total'] || 0) || 0), 0);
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r.Bills || 0) || 0), 0);
                  const totalPax = dataRows.reduce((sum, r) => sum + (parseInt(r.Pax || 0) || 0), 0);
                  const avgBillValue = totalBills > 0 ? netSales / totalBills : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL SALES</div>
                        <div className="analysis-kpi-value">$ {formatNumber(netSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">DINE IN SALES</div>
                        <div className="analysis-kpi-value">$ {formatNumber(dineInSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TAKE AWAY SALES</div>
                        <div className="analysis-kpi-value">$ {formatNumber(takeAwaySales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL BILLS</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL PAX</div>
                        <div className="analysis-kpi-value">{formatNumber(totalPax, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">AVG BILL VALUE</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgBillValue)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ KPI Cards for Sales by Meal Period Dashboard - Matched with Report View */}
                {bySales === "MealPeriod" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.TotalSales || r['Total Sales'] || r.TotalSales) || 0), 0);
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r.Bills || r['No of Bills'] || 0) || 0), 0);
                  const totalPax = dataRows.reduce((sum, r) => sum + (parseInt(r.Pax) || 0), 0);
                  const gstCollected = dataRows.reduce((sum, r) => sum + (parseFloat(r.GST || r.gst) || 0), 0);
                  const avgBillValue = totalBills > 0 ? totalSales / totalBills : 0;
                  const avgSpendPerPax = totalPax > 0 ? totalSales / totalPax : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Bills</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Pax</div>
                        <div className="analysis-kpi-value">{formatNumber(totalPax, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Bill Value</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgBillValue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Spend Per Pax</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgSpendPerPax)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">GST Collected</div>
                        <div className="analysis-kpi-value">$ {formatNumber(gstCollected)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Sales Performance (Analysis) Dashboard - Matching Image 1 */}
                {bySales === "Analysis" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalNetSales = dataRows.reduce((sum, r) => sum + (parseFloat(r['Net Total'] || r.NetTotal || r.TOTAL || 0) || 0), 0);
                  const totalBills = summaryData ? summaryData.totalOrders : dataRows.reduce((sum, r) => sum + (parseInt(r['No of Bills'] || r.Bills || 0) || 0), 0);
                  const totalPax = dataRows.reduce((sum, r) => sum + (parseInt(r.Pax) || 0), 0);
                  const aov = totalBills > 0 ? totalNetSales / totalBills : 0;
                  const avgPax = totalPax > 0 ? totalNetSales / totalPax : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL NET SALES</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalNetSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL BILLS</div>
                        <div className="analysis-kpi-value">{formatNumber(totalBills, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">AVG. ORDER VALUE (AOV)</div>
                        <div className="analysis-kpi-value">$ {formatNumber(aov)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">TOTAL COVERS (PAX)</div>
                        <div className="analysis-kpi-value">{totalPax > 0 ? formatNumber(totalPax, true) : '0'}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">AVG. SPEND PER GUEST</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgPax)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Itemwise Sales Dashboard */}
                {orderSales === "Itemwise" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalQty = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseInt(r.Qty) || 0), 0);
                  const totalOrders = summaryData ? summaryData.totalOrders : null;
                  const uniqueItems = new Set(dataRows.map(r => r.Item)).size;

                  // Find best seller item
                  let bestSeller = "-";
                  let maxQty = 0;
                  dataRows.forEach(r => {
                    const qty = parseInt(r.Qty) || 0;
                    if (qty > maxQty) {
                      maxQty = qty;
                      bestSeller = r.Item || "-";
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales Revenue</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      {totalOrders !== null && (
                        <div className="analysis-kpi-card">
                          <div className="analysis-kpi-title">Total Orders Count</div>
                          <div className="analysis-kpi-value">{formatNumber(totalOrders, true)}</div>
                        </div>
                      )}
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Unique Items Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(uniqueItems, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Item</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {bestSeller} ({formatNumber(maxQty, true)} Qty)
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Monthly Sales Dashboard */}
                {byItem === "Month" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalRevenue = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.Amount) || 0), 0);
                  const totalQty = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseInt(r.Qty) || 0), 0);

                  const dishTotals = {};
                  dataRows.forEach(r => {
                    const name = r.DishName || r.Dishname || '-';
                    const qty = parseInt(r.Qty) || 0;
                    const amt = parseFloat(r.Amount) || 0;
                    if (!dishTotals[name]) {
                      dishTotals[name] = { qty: 0, amt: 0 };
                    }
                    dishTotals[name].qty += qty;
                    dishTotals[name].amt += amt;
                  });

                  let topDishName = "-";
                  let topDishAmt = 0;
                  let maxQty = 0;
                  Object.keys(dishTotals).forEach(name => {
                    if (dishTotals[name].qty > maxQty) {
                      maxQty = dishTotals[name].qty;
                      topDishName = name;
                      topDishAmt = dishTotals[name].amt;
                    }
                  });

                  const avgRevenue = totalQty > 0 ? totalRevenue / totalQty : 0;

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Revenue</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalRevenue)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQty, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Dish</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topDishName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            $ {formatNumber(topDishAmt)} ({formatNumber(maxQty, true)} Sold)
                          </div>
                        </div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Avg Revenue</div>
                        <div className="analysis-kpi-value">$ {formatNumber(avgRevenue)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Qty Report Dashboard */}
                {byItem === "Qty" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalQtySold = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseInt(r.QtySold || r.qtySold || r.Qty || r.qty) || 0), 0);
                  const totalSalesAmount = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.LineAmount || r.lineAmount || r.Amount || r.amount) || 0), 0);
                  const totalDishes = dataRows.length;

                  // Find top selling dish
                  let topDishName = "-";
                  let maxQty = 0;
                  let topDishAmt = 0;
                  dataRows.forEach(r => {
                    const qty = parseInt(r.QtySold || r.qtySold || r.Qty || r.qty) || 0;
                    if (qty > maxQty) {
                      maxQty = qty;
                      topDishName = r.DishName || r.Dishname || r.Item || "-";
                      topDishAmt = parseFloat(r.LineAmount || r.lineAmount || r.Amount || r.amount) || 0;
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQtySold, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Sales Amount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalSalesAmount)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Dish</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topDishName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            $ {formatNumber(topDishAmt)} ({formatNumber(maxQty, true)} Sold)
                          </div>
                        </div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Dishes</div>
                        <div className="analysis-kpi-value">{formatNumber(totalDishes, true)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Category Sales Dashboard */}
                {byItem === "Category" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow);
                  const totalNetSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.NetSales || r.netSales) || 0), 0);
                  const totalQtySold = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseFloat(r.Sold || r.sold || r.QtySold || r.qtySold) || 0), 0);
                  const totalDiscount =  dataRows.reduce((sum, r) => sum + (parseFloat(r.ItemDisc || r.itemDisc || 0) || 0) + (parseFloat(r.BillDisc || r.billDisc || 0) || 0), 0);

                  let topCategoryName = "-";
                  let maxNetSales = 0;
                  dataRows.forEach(r => {
                    const netSales = parseFloat(r.NetSales || r.netSales) || 0;
                    if (netSales > maxNetSales) {
                      maxNetSales = netSales;
                      topCategoryName = r.CategoryName || r.Category || "-";
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Net Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalNetSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQtySold, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Category</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topCategoryName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            $ {formatNumber(maxNetSales)}
                          </div>
                        </div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Dish Group Sales Dashboard */}
                {byItem === "DishGroup" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow && !r.isCategoryHeader && !r.isSpacer);
                  const totalNetSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.NetSales || r.netSales) || 0), 0);
                  const totalQtySold = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseFloat(r.Sold || r.sold || r.QtySold || r.qtySold) || 0), 0);
                  const totalDiscount =  dataRows.reduce((sum, r) => sum + (parseFloat(r.ItemDisc || r.itemDisc || 0) || 0) + (parseFloat(r.BillDisc || r.billDisc || 0) || 0), 0);

                  let topGroupName = "-";
                  let maxNetSales = 0;
                  dataRows.forEach(r => {
                    const netSales = parseFloat(r.NetSales || r.netSales) || 0;
                    if (netSales > maxNetSales) {
                      maxNetSales = netSales;
                      topGroupName = r.DishGroupname || r.DishGroupName || r.DishGroup || "-";
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Net Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalNetSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQtySold, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Group</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topGroupName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            $ {formatNumber(maxNetSales)}
                          </div>
                        </div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Discount</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalDiscount)}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* ✅ New KPI Cards for Dish Sales Dashboard */}
                {byItem === "Dish" && (() => {
                  const dataRows = localData.filter(r => !r.isTotalRow && !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer);
                  const totalNetSales = summaryData ? summaryData.totalSales : dataRows.reduce((sum, r) => sum + (parseFloat(r.NetSales || r.netSales) || 0), 0);
                  const totalQtySold = summaryData ? summaryData.totalQty : dataRows.reduce((sum, r) => sum + (parseFloat(r.Sold || r.sold || r.QtySold || r.qtySold) || 0), 0);

                  let topSellingDishName = "-";
                  let maxQty = 0;
                  dataRows.forEach(r => {
                    const qty = parseFloat(r.Sold || r.sold || r.QtySold || r.qtySold) || 0;
                    if (qty > maxQty) {
                      maxQty = qty;
                      topSellingDishName = r.Dishname || r.DishName || r.Item || "-";
                    }
                  });

                  let topRevenueDishName = "-";
                  let maxNetSales = 0;
                  dataRows.forEach(r => {
                    const netSales = parseFloat(r.NetSales || r.netSales) || 0;
                    if (netSales > maxNetSales) {
                      maxNetSales = netSales;
                      topRevenueDishName = r.Dishname || r.DishName || r.Item || "-";
                    }
                  });

                  return (
                    <div className="analysis-kpi-container" style={{ marginBottom: '25px' }}>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Qty Sold</div>
                        <div className="analysis-kpi-value">{formatNumber(totalQtySold, true)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Total Net Sales</div>
                        <div className="analysis-kpi-value">$ {formatNumber(totalNetSales)}</div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Selling Dish</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topSellingDishName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            {formatNumber(maxQty, true)} Sold
                          </div>
                        </div>
                      </div>
                      <div className="analysis-kpi-card">
                        <div className="analysis-kpi-title">Top Revenue Dish</div>
                        <div className="analysis-kpi-value" style={{ fontSize: '15px', fontWeight: '700', color: '#ff7f27' }}>
                          {topRevenueDishName}
                          <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>
                            $ {formatNumber(maxNetSales)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}


                {/* Download Button positioned AFTER the KPI Cards */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                  <div className="download-dropdown-wrapper" ref={downloadDropdownRef}>
                    <button
                      onClick={() => setDownloadDropdownOpen(prev => !prev)}
                      className="download-btn-inside"
                      title="Download Options"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    {downloadDropdownOpen && (
                      <div className="download-dropdown-menu">
                        <button
                          type="button"
                          className="download-dropdown-item"
                          onClick={() => {
                            setDownloadDropdownOpen(false);
                            handlePrint();
                          }}
                        >
                          <span className="download-dropdown-icon print">
                            {/* Print Printer Icon */}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9"></polyline>
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                              <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                          </span>
                          Print
                        </button>
                        <button
                          type="button"
                          className="download-dropdown-item"
                          onClick={() => {
                            setDownloadDropdownOpen(false);
                            handleDownload();
                          }}
                        >
                          <span className="download-dropdown-icon pdf">
                            {/* PDF Document Icon */}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </span>
                          PDF
                        </button>
                        <button
                          type="button"
                          className="download-dropdown-item"
                          onClick={() => {
                            setDownloadDropdownOpen(false);
                            try {
                              const exportRows = [];
                              const currentReportKey = appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem;
                              const headers = displayColumns.map(col => getCompactHeaderLabel(col, currentReportKey));
                              exportRows.push(headers);

                              displayData.forEach(item => {
                                if (item.isCategoryHeader) {
                                  const catRow = new Array(displayColumns.length).fill('');
                                  catRow[0] = item.DishGroupname || item.Dishname || '';
                                  exportRows.push(catRow);
                                  return;
                                }
                                if (item.isDishGroupHeader) {
                                  const groupRow = new Array(displayColumns.length).fill('');
                                  groupRow[0] = item.Dishname || '';
                                  exportRows.push(groupRow);
                                  return;
                                }
                                if (item.isSpacer) {
                                  return;
                                }

                                const rowVals = displayColumns.map(col => {
                                  let value = item[col];
                                  if (col === 'Date' && value) {
                                    const dateObj = new Date(value);
                                    if (!isNaN(dateObj.getTime()) && typeof value === 'object') {
                                      value = dateObj.toLocaleDateString('en-GB');
                                    }
                                  }
                                  const isTextCol = getIsTextCol(col);
                                  const isCountCol = getIsCountCol(col);
                                  if (!isTextCol && (typeof value === 'number' || (value !== '' && value !== null && !isNaN(Number(value))))) {
                                    const num = parseFloat(value);
                                    return isNaN(num) ? value : (isCountCol ? Math.round(num) : Number(num.toFixed(2)));
                                  }
                                  return value !== null && value !== undefined ? value : '';
                                });
                                exportRows.push(rowVals);
                              });

                              // Grand Total row
                              const hasTotalRow = displayData.some(r => r.isTotalRow || r.isGrandTotal || r.Date === 'Grand Total:' || r.Date === 'TOTAL' || r.CancelDate === 'Grand Total:' || r.DishName === 'Grand Total' || r.DishGroupName === 'Grand Total:' || r.CategoryName === 'Grand Total:');
                              if (!hasTotalRow && bySales !== "Analysis" && dayEnd !== "Cancellation" && dayEnd !== "CancellationDetail" && dayEnd !== "DiscountDetail") {
                                const totalRow = displayColumns.map((col, idx) => {
                                  if (idx === 0) return 'Grand Total:';
                                  const isTextCol = getIsTextCol(col);
                                  if (isTextCol) return '';
                                  const isCountCol = getIsCountCol(col);
                                  const lowerCol = col.toLowerCase().replace(/[\s_-]/g, '');
                                  let totalVal = 0;
                                  if (dayEnd === 'TopNItems' || dayEnd === 'Hourly' || orderSales === 'Hourly') {
                                    totalVal = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                                  } else if (summaryData) {
                                    if (lowerCol === 'amount' || lowerCol === 'netsales' || lowerCol === 'salesamount' || lowerCol === 'lineamount' || lowerCol === 'subtotal' || lowerCol === 'nettotal' || lowerCol === 'itemsales') {
                                      totalVal = summaryData.totalSales;
                                    } else if (lowerCol === 'qty' || lowerCol === 'qtysold' || lowerCol === 'sold' || lowerCol === 'quantity') {
                                      totalVal = summaryData.totalQty;
                                    } else if (lowerCol === 'billcount' || lowerCol === 'bills' || lowerCol === 'noofbills' || lowerCol === 'noofbill') {
                                      totalVal = summaryData.totalOrders;
                                    } else {
                                      totalVal = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                                    }
                                  } else {
                                    totalVal = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                                  }
                                  return isCountCol ? Math.round(totalVal) : Number(totalVal.toFixed(2));
                                });
                                exportRows.push(totalRow);
                              }

                              if ((bySales === "Summary" || bySales === "Analysis") && paymodeData) {
                                exportRows.push([]);
                                exportRows.push(["CASH", "NETS", "PAYNOW", "UPI", "MEMBER", "CREDIT", "ONLINE", "YPAYNOW", "YCARD"]);
                                const pmRow = [
                                  parseFloat(paymodeData.Cash) || 0,
                                  parseFloat(paymodeData.Nets) || 0,
                                  parseFloat(paymodeData.PayNow || paymodeData.Paynow) || 0,
                                  parseFloat(paymodeData.UPI) || 0,
                                  parseFloat(paymodeData.Member) || 0,
                                  parseFloat(paymodeData.Credit) || 0,
                                  parseFloat(paymodeData.Online) || 0,
                                  parseFloat(paymodeData.YeahPay_PayNow || paymodeData.Yeahpay_Paynow) || 0,
                                  parseFloat(paymodeData.YeahPay_Card || paymodeData.Yeahpay_Card) || 0
                                ];
                                exportRows.push(pmRow);
                                exportRows.push(pmRow);
                              }

                              const worksheet = XLSX.utils.aoa_to_sheet(exportRows);
                              const workbook = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");

                              // If Show Chart is enabled, append a dedicated Chart Breakdown sheet for native spreadsheet chart visualization
                              if (activeShowChart) {
                                const expFrom = appliedFilters.fromDate || fromDate;
                                const expTo = appliedFilters.toDate || toDate;
                                const expDayEnd = appliedFilters.dayEnd || dayEnd;
                                const expReport = appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem || "Sales Report";
                                const isPaymodeExport = expDayEnd === "Paymode";
                                const isTransactionExport = expDayEnd === "Transaction";

                                let chartRows = [];
                                if (isTransactionExport) {
                                  const cleanData = displayData.filter(r => !r.isTotalRow && !r.isGrandTotal && !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer);
                                  const totalCashIn = cleanData.reduce((sum, r) => sum + (parseFloat(r.CashIn) || 0), 0);
                                  const totalCashOut = cleanData.reduce((sum, r) => sum + (parseFloat(r.CashOut) || 0), 0);
                                  const totalTransVal = totalCashIn + totalCashOut;
                                  chartRows = [
                                    ["Transaction Cash Overview (Donut Chart)"],
                                    [`Report: Transaction Report`],
                                    [`Period: ${expFrom} to ${expTo}`],
                                    [`Chart Type: DONUT`],
                                    [`Total Amount: $ ${totalTransVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                                    [],
                                    ["Flow", "Amount", "Share (%)"]
                                  ];
                                  if (totalCashIn > 0) {
                                    const pct = totalTransVal > 0 ? Number(((totalCashIn / totalTransVal) * 100).toFixed(1)) : 0;
                                    chartRows.push(["Cash In", totalCashIn, `${pct}%`]);
                                  }
                                  if (totalCashOut > 0) {
                                    const pct = totalTransVal > 0 ? Number(((totalCashOut / totalTransVal) * 100).toFixed(1)) : 0;
                                    chartRows.push(["Cash Out", totalCashOut, `${pct}%`]);
                                  }
                                } else if (isPaymodeExport) {
                                  const modes = [
                                    { label: "Cash", key: ["Cash"] },
                                    { label: "NETS", key: ["Nets", "NETS"] },
                                    { label: "PayNow", key: ["PayNow", "Paynow"] },
                                    { label: "UPI", key: ["UPI", "Upi"] },
                                    { label: "Member", key: ["Member"] },
                                    { label: "Credit Card", key: ["Credit"] },
                                    { label: "Online", key: ["Online"] },
                                    { label: "YeahPay PayNow", key: ["YeahPay_PayNow", "Yeahpay_Paynow"] },
                                    { label: "YeahPay Card", key: ["YeahPay_Card", "Yeahpay_Card"] }
                                  ];
                                  const cleanData = displayData.filter(r => !r.isTotalRow && !r.isGrandTotal && !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer);
                                  const paymodeItems = modes.map(m => {
                                    const val = cleanData.reduce((sum, r) => {
                                      let v = 0;
                                      for (const k of m.key) {
                                        if (r[k] !== undefined && r[k] !== null) {
                                          v = parseFloat(r[k]) || 0;
                                          break;
                                        }
                                      }
                                      return sum + v;
                                    }, 0);
                                    return {
                                      label: m.label,
                                      value: Number(val.toFixed(2))
                                    };
                                  }).filter(item => item.value > 0);

                                  const totalPaymodeVal = paymodeItems.reduce((sum, item) => sum + item.value, 0);

                                  chartRows = [
                                    ["Payment Collection Breakdown (Donut Chart)"],
                                    [`Report: Payment Collection Breakdown`],
                                    [`Period: ${expFrom} to ${expTo}`],
                                    [`Chart Type: DONUT`],
                                    [`Total Amount: $ ${totalPaymodeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
                                    [],
                                    ["Payment Method", "Amount", "Share (%)"]
                                  ];

                                  paymodeItems.forEach(item => {
                                    const pct = totalPaymodeVal > 0 ? Number(((item.value / totalPaymodeVal) * 100).toFixed(1)) : 0;
                                    chartRows.push([item.label, item.value, `${pct}%`]);
                                  });
                                } else {
                                  chartRows = [
                                    ["Sales Performance Chart Summary (Navy Theme)"],
                                    [`Report: ${expReport}`],
                                    [`Period: ${expFrom} to ${expTo}`],
                                    [`Chart Type: ${selectedChartType ? selectedChartType.toUpperCase() : 'DEFAULT'}`],
                                    [],
                                    ["Metric / Label", "Value"]
                                  ];
                                  const cleanData = displayData.filter(r => !r.isTotalRow && !r.isGrandTotal && !r.isCategoryHeader && !r.isDishGroupHeader && !r.isSpacer);
                                  cleanData.forEach(r => {
                                    const label = r.Item || r.DishName || r.Dishname || r.Hour || r.Date || r.CategoryName || r.Group || r.Paymode || r.PaymentMode || r.BillDate || 'Item';
                                    const val = parseFloat(r.Amount || r.SalesAmount || r.TotalAmount || r.NetSales || r.NetTotal || r.Qty || 0) || 0;
                                    chartRows.push([label, val]);
                                  });
                                }

                                const chartSheet = XLSX.utils.aoa_to_sheet(chartRows);
                                XLSX.utils.book_append_sheet(workbook, chartSheet, "ChartData");
                              }

                              const expReportTitle = (appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem || "sales_report").toLowerCase().replace(/\s+/g, '_');
                              const expFromDate = appliedFilters.fromDate || fromDate;
                              const expToDate = appliedFilters.toDate || toDate;
                              const fileName = `${expReportTitle}_${expFromDate}_to_${expToDate}.xlsx`;
                              XLSX.writeFile(workbook, fileName);
                            } catch (excelErr) {
                              console.error("Excel generation error:", excelErr);
                              alert("Error generating Excel file: " + excelErr.message);
                            }
                          }}
                        >
                          <span className="download-dropdown-icon excel">
                            {/* Excel Spreadsheet Icon */}
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                            </svg>
                          </span>
                          Excel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className={`report-table professional-table ${orderSales === "GroupDetail" ? "group-detail" : ""}`}>
                    <thead>
                      <tr>
                        {displayColumns.map((col, idx) => {
                          const isCurrentSorted = sortColumn === col;

                          const handleHeaderClick = () => {
                            if (isCurrentSorted) {
                              setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setSortColumn(col);
                              setSortDirection('asc');
                            }
                          };

                          let sortIndicator = null;
                          if (isCurrentSorted) {
                            sortIndicator = sortDirection === 'asc' ? ' ▲' : ' ▼';
                          }

                          let colWidth = 'auto';
                          if (orderSales === "Itemwise") {
                            if (col === 'Item') colWidth = '50%';
                            else if (col === 'Qty') colWidth = '25%';
                            else if (col === 'Amount') colWidth = '25%';
                          } else if (dayEnd === "Hourly" || orderSales === "Hourly") {
                            if (col === 'Date') colWidth = '25%';
                            else if (col === 'Hour') colWidth = '35%';
                            else if (col === 'Qty') colWidth = '20%';
                            else if (col === 'Amount') colWidth = '20%';
                          } else if (orderSales === "GroupDetail") {
                            if (col === 'Date') colWidth = '20%';
                            else if (col === 'DishName') colWidth = '45%';
                            else if (col === 'Qty') colWidth = '15%';
                            else if (col === 'Amount') colWidth = '20%';
                          } else if (dayEnd === "DiscountDetail") {
                            if (col === 'DishName') colWidth = '40%';
                            else colWidth = '10%';
                          } else if (bySales === "Analysis") {
                            if (col === 'Date') colWidth = '10%';
                            else if (col === 'CategoryName' || col === 'Category') colWidth = '14%';
                            else if (col === 'No of Bills' || col === 'Bills' || col === 'BillCount') colWidth = '8%';
                            else if (col === 'Pax') colWidth = '6%';
                            else if (col === 'Sub Total' || col === 'SubTotal') colWidth = '9%';
                            else if (col === 'Discount' || col === 'Disc') colWidth = '8%';
                            else if (col === 'SVC') colWidth = '7%';
                            else if (col === 'GST') colWidth = '9%';
                            else if (col === 'Net Total' || col === 'NetTotal') colWidth = '10%';
                            else if (col === 'Avg/Bill' || col === 'AvgBill') colWidth = '10%';
                            else if (col === 'Avg/Pax' || col === 'AvgPax') colWidth = '9%';
                          } else if (byItem === "Month") {
                            if (col === 'Date') colWidth = '30%';
                            else if (col === 'DishGroup') colWidth = '45%';
                            else if (col === 'DishPrice') colWidth = '25%';
                          } else if (byItem === "QtyDetail") {
                            if (col === 'Date') colWidth = '25%';
                            else if (col === 'DishGroup') colWidth = '35%';
                            else if (col === 'DishName') colWidth = '40%';
                          } else if (byItem === "Qty") {
                            if (col === 'DishGroupName') colWidth = '65%';
                            else if (col === 'QtySold') colWidth = '35%';
                          } else if (byItem === "QtyGroup") {
                            if (col === 'DishName') colWidth = '65%';
                            else if (col === 'QtySold') colWidth = '35%';
                          }

                          return (
                            <th
                              key={idx}
                              onClick={handleHeaderClick}
                              className={orderSales === "GroupDetail" ? "group-detail-th" : ""}
                              style={{
                                textAlign: 'center',
                                padding: '12px 14px',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                width: colWidth,
                                minWidth: (col === 'BillNumber' || col === 'BillNo' || col === 'InvoiceNo') ? '140px' : 'auto'
                              }}
                            >
                              {getCompactHeaderLabel(col, appliedFilters.orderSales || appliedFilters.dayEnd || appliedFilters.bySales || appliedFilters.byItem || orderSales || dayEnd || bySales || byItem)}
                              {sortIndicator}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.map((item, i) => {
                          if (item.isCategoryHeader) {
                            return (
                              <tr key={i} className="category-header-row">
                                <td colSpan={displayColumns.length}>
                                  {item.DishGroupname || item.DishName || item.Dishname || ''}
                                </td>
                              </tr>
                            );
                          }
                          if (item.isDateHeader) {
                            return (
                              <tr key={i} className="discount-detail-date-row">
                                <td colSpan={displayColumns.length}>
                                  {item.DishName || ''}
                                </td>
                              </tr>
                            );
                          }
                          if (item.isOrderHeader) {
                            return (
                              <tr key={i} className="discount-detail-order-row">
                                <td colSpan={displayColumns.length - 1} style={{ textAlign: 'left', fontWeight: 'bold' }}>
                                  {item.DishName || ''}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                  {item.Total || ''}
                                </td>
                              </tr>
                            );
                          }
                          if (item.isDishGroupHeader) {
                            return (
                              <tr key={i} className="dishgroup-header-row">
                                <td colSpan={displayColumns.length}>
                                  {item.Dishname || ''}
                                </td>
                              </tr>
                            );
                          }
                          if (item.isSpacer) {
                            return (
                              <tr key={i} className="spacer-row">
                                <td colSpan={displayColumns.length}>&nbsp;</td>
                              </tr>
                            );
                          }

                          const isGrandTotal = item.isGrandTotal || item.Date === 'Grand Total:' || item.Date === 'TOTAL' || item.DishName === 'Grand Total' || item.DishGroupName === 'Grand Total:';
                          const isSubTotal = (item.isTotalRow || item.isDateTotal || item.isOrderTotal || item.isDayTotal || item.DishName === 'Total:' || item.DishName === 'Order Total' || item.DishName === 'Day Total') && !isGrandTotal;
                          const isTotal = isGrandTotal || isSubTotal;
                          const rowClass = isGrandTotal ? "grand-total-row" : (isSubTotal ? "day-total-row" : "");

                          return (
                            <tr key={i} className={rowClass}>
                              {displayColumns.map((col, idx) => {
                                let value = item[col];
                                // Format Date fields
                                if (col === 'Date' && value) {
                                  const dateObj = new Date(value);
                                  if (!isNaN(dateObj.getTime()) && typeof value === 'object') {
                                    value = dateObj.toLocaleDateString('en-GB');
                                  }
                                }
                                const isTextCol = getIsTextCol(col);
                                const isCountCol = getIsCountCol(col);
                                const isNumeric = !isTextCol && (typeof value === "number" || (value !== '' && value !== null && !isNaN(Number(value))));

                                let colMinWidth = 'auto';
                                if (col === 'BillNumber' || col === 'BillNo' || col === 'InvoiceNo' || col === 'OrderNo' || col === 'OrderNumber') {
                                  colMinWidth = '120px';
                                } else if (col === 'CancelDate' || col === 'Date' || col === 'InvoiceDate' || col === 'OrderDate') {
                                  colMinWidth = '85px';
                                } else if (col === 'CancelTime' || col === 'Time') {
                                  colMinWidth = '95px';
                                }

                                let cellAlign = 'center';
                                if (orderSales === "GroupDetail") {
                                  if (col === 'Date') {
                                    cellAlign = isGrandTotal ? 'center' : 'center';
                                  } else if (col === 'DishName') {
                                    cellAlign = isSubTotal ? 'center' : 'center';
                                  } else if (col === 'Qty') {
                                    cellAlign = 'center';
                                  } else if (col === 'Amount') {
                                    cellAlign = 'center';
                                  }
                                } else if (dayEnd === "DiscountDetail") {
                                  if (col === 'DishName') {
                                    cellAlign = isTotal ? 'center' : 'left';
                                  } else {
                                    cellAlign = 'center';
                                  }
                                }

                                const isDiscountDetailCol = dayEnd === "DiscountDetail";
                                const shouldFormatAsCount = isDiscountDetailCol && col === 'Quantity' ? false : isCountCol;

                                return (
                                  <td key={idx} style={{
                                    textAlign: cellAlign,
                                    padding: (orderSales === "GroupDetail" || dayEnd === "DiscountDetail") ? '10px 14px' : '6px 4px',
                                    whiteSpace: 'nowrap',
                                    wordBreak: 'normal',
                                    wordWrap: 'normal',
                                    fontWeight: isTotal ? 'bold' : 'normal',
                                    fontSize: '13px',
                                    minWidth: colMinWidth
                                  }}>
                                    {isNumeric
                                      ? formatNumber(value, shouldFormatAsCount)
                                      : (value !== null && value !== undefined && value !== '' ? value : '')}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      {/* Render manual Grand Total row ONLY if data does not already include a total row */}
                      {(() => {
                        const hasTotalRow = displayData.some(r => r.isTotalRow || r.isGrandTotal || r.Date === 'Grand Total:' || r.Date === 'TOTAL' || r.CancelDate === 'Grand Total:' || r.DishName === 'Grand Total' || r.DishGroupName === 'Grand Total:');
                        if (hasTotalRow || bySales === "Analysis" || dayEnd === "Cancellation" || dayEnd === "CancellationDetail" || dayEnd === "DiscountDetail") return null;
                        return (
                          <tr className="grand-total-row">
                            {displayColumns.map((col, idx) => {
                              const isTextCol = getIsTextCol(col);
                              if (idx === 0) return <td key={idx} style={{ textAlign: 'center', fontWeight: 'bold' }}>Grand Total:</td>;
                              if (isTextCol) return <td key={idx} style={{ textAlign: 'center' }}></td>;
                              let total;
                              const lowerCol = col.toLowerCase().replace(/[\s_-]/g, '');
                              if (dayEnd === 'TopNItems') {
                                total = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                              } else if (summaryData) {
                                if (lowerCol === 'amount' || lowerCol === 'netsales' || lowerCol === 'salesamount' || lowerCol === 'lineamount' || lowerCol === 'subtotal' || lowerCol === 'nettotal' || lowerCol === 'itemsales') {
                                  total = summaryData.totalSales;
                                } else if (lowerCol === 'qty' || lowerCol === 'qtysold' || lowerCol === 'sold' || lowerCol === 'quantity') {
                                  total = summaryData.totalQty;
                                } else if (lowerCol === 'billcount' || lowerCol === 'bills' || lowerCol === 'noofbills' || lowerCol === 'noofbill') {
                                  total = summaryData.totalOrders;
                                } else {
                                  total = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                                }
                              } else {
                                total = displayData.reduce((sum, row) => sum + (row.isTotalRow ? 0 : (parseFloat(row[col]) || 0)), 0);
                              }
                              const isCountCol = getIsCountCol(col);
                              return <td key={idx} style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(total, isCountCol)}</td>;
                            })}
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* ✅ Payment Mode Breakdown for Sales Summary and Sales Performance Reports (Screen View) */}
                {(bySales === "Summary" || bySales === "Analysis") && (() => {
                  let totalCash = 0, totalNets = 0, totalPaynow = 0, totalUpi = 0, totalMember = 0, totalCredit = 0, totalOnline = 0, totalYPaynow = 0, totalYCard = 0;

                  if (bySales === "Analysis") {
                    if (paymodeData) {
                      totalCash = parseFloat(paymodeData.Cash) || 0;
                      totalNets = parseFloat(paymodeData.Nets) || 0;
                      totalPaynow = parseFloat(paymodeData.PayNow || paymodeData.Paynow) || 0;
                      totalUpi = parseFloat(paymodeData.UPI) || 0;
                      totalMember = parseFloat(paymodeData.Member) || 0;
                      totalCredit = parseFloat(paymodeData.Credit) || 0;
                      totalOnline = parseFloat(paymodeData.Online) || 0;
                      totalYPaynow = parseFloat(paymodeData.YeahPay_PayNow || paymodeData.Yeahpay_Paynow) || 0;
                      totalYCard = parseFloat(paymodeData.YeahPay_Card || paymodeData.Yeahpay_Card) || 0;
                    }
                  } else {
                    const dataRows = localData.filter(r => !r.isTotalRow);
                    totalCash = dataRows.reduce((sum, r) => sum + (parseFloat(r.Cash) || 0), 0);
                    totalNets = dataRows.reduce((sum, r) => sum + (parseFloat(r.Nets) || 0), 0);
                    totalPaynow = dataRows.reduce((sum, r) => sum + (parseFloat(r.PayNow || r.Paynow) || 0), 0);
                    totalUpi = dataRows.reduce((sum, r) => sum + (parseFloat(r.UPI) || 0), 0);
                    totalMember = dataRows.reduce((sum, r) => sum + (parseFloat(r.Member) || 0), 0);
                    totalCredit = dataRows.reduce((sum, r) => sum + (parseFloat(r.Credit) || 0), 0);
                    totalOnline = dataRows.reduce((sum, r) => sum + (parseFloat(r.Online) || 0), 0);
                    totalYPaynow = dataRows.reduce((sum, r) => sum + (parseFloat(r.YeahPay_PayNow || r.Yeahpay_Paynow) || 0), 0);
                    totalYCard = dataRows.reduce((sum, r) => sum + (parseFloat(r.YeahPay_Card || r.Yeahpay_Card) || 0), 0);
                  }

                  return (
                    <div style={{ marginTop: '25px' }}>
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="professional-table">
                          <thead>
                            <tr>
                              <th>CASH</th>
                              <th>NETS</th>
                              <th>PAYNOW</th>
                              <th>UPI</th>
                              <th>MEMBER</th>
                              <th>CREDIT</th>
                              <th>ONLINE</th>
                              <th>YPAYNOW</th>
                              <th>YCARD</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalCash)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalNets)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalPaynow)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalUpi)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalMember)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalCredit)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalOnline)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalYPaynow)}</td>
                              <td style={{ textAlign: 'center' }}>{formatNumber(totalYCard)}</td>
                            </tr>
                            <tr className="grand-total-row">
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalCash)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalNets)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalPaynow)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalUpi)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalMember)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalCredit)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalOnline)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalYPaynow)}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatNumber(totalYCard)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                <div className="prof-report-footer">
                  <span className="system-msg">*** System Generated Report ***</span>
                  <span className="powered-msg">Powered by Unipro</span>
                </div>
              </>
            ) : isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '15px', color: '#ff7f27', fontWeight: '600' }}>
                <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #f3f3f3', borderTop: '3px solid #ff7f27', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
                <div>Loading report data...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : errorMessage ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                ⚠️ Error loading report: {errorMessage}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '14px', color: '#999', fontWeight: '500' }}>
                📋 No Data Found for the selected criteria
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category LOV Modal */}
      {showCategoryLOV && (
        <div className="lov-modal" onClick={() => setShowCategoryLOV(false)}>
          <div className="lov-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lov-modal-header">
              <h3>Select Category</h3>
              <button onClick={() => setShowCategoryLOV(false)}>×</button>
            </div>
            <div className="lov-modal-body">
              <div className="lov-item" onClick={async () => {
                console.log("=== CLEAR CATEGORY ===");
                setCategory("");
                setSelectedCategoryId("");
                setShowCategoryLOV(false);
                setDishGroup("");
                await fetchDishGroups();
              }}>-- Clear Selection --</div>

              {categoryList.map((item, idx) => (
                <div key={idx} className="lov-item" onClick={async () => {
                  const catName = item.CategoryName || item;
                  const catId = item.CategoryId || '';
                  console.log("=== CATEGORY SELECTED ===");
                  console.log("Name:", catName);
                  console.log("ID:", catId);

                  setCategory(catName);
                  setSelectedCategoryId(catId);
                  setShowCategoryLOV(false);
                  setDishGroup("");

                  if (catId) {
                    await fetchDishGroups(catId);
                  }
                }}>
                  {item.CategoryName || item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dish Group LOV Modal */}
      {showDishGroupLOV && (
        <div className="lov-modal" onClick={() => setShowDishGroupLOV(false)}>
          <div className="lov-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lov-modal-header">
              <h3>Select Dish Group</h3>
              <button onClick={() => setShowDishGroupLOV(false)}>×</button>
            </div>
            <div className="lov-modal-body">
              <div className="lov-item" onClick={() => {
                setDishGroup("");
                setShowDishGroupLOV(false);
              }}>-- Clear Selection --</div>

              {dishGroupList.length === 0 && (
                <div className="lov-item" style={{ color: 'red', fontStyle: 'italic' }}>
                  No dish groups found for this category
                </div>
              )}

              {dishGroupList.map((item, idx) => {
                const dishName = typeof item === 'object' ? (item.DishGroupName || item.DishGroup) : item;
                console.log("Rendering dish:", dishName);
                return (
                  <div key={idx} className="lov-item" onClick={() => {
                    console.log("Selected dish:", dishName);
                    setDishGroup(dishName);
                    setShowDishGroupLOV(false);
                  }}>
                    {dishName}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CafeSalesReport;
