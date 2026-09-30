const validateHeader = (data) => {
  if (!data.tranDate || isNaN(Date.parse(data.tranDate)))
    throw new Error("Invalid Transaction Date");

  if (!data.tranType)
    throw new Error("Transaction Type required");

  if (!data.supplierId)
    throw new Error("Vendor required");

  if (!data.supplierName)
    throw new Error("Vendor Name required");

  if (!data.invoiceDate || isNaN(Date.parse(data.invoiceDate)))
    throw new Error("Invalid Invoice Date");
};

const validateItems = (items) => {
  if (!items || items.length === 0)
    throw new Error("Items required");

  items.forEach(i => {
    if (!i.itemCode) throw new Error("ItemCode required");
    if (!i.uom) throw new Error("UOM required");
    if (!i.qty || i.qty <= 0) throw new Error("Qty invalid");
    if (!i.price || i.price <= 0) throw new Error("Price invalid");
    if (!i.total || i.total <= 0) throw new Error("Total invalid");
  });
};

module.exports = { validateHeader, validateItems };