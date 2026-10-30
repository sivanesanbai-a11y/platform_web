import type { MarketingItem, PurchasingOrder, SupplierRow } from "@/types/purchasing-order";

export function createItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch {}
  }
  return `itm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newMarketingItem(index = 1): MarketingItem {
  return {
    id: createItemId(),
    item_name: "",
    model: "",
    qty: 1,
    item_value: 0,
    add_charge: 0
  };
}

export function newSupplierRow(): SupplierRow {
  return {
    id: createItemId(),
    supplier: "",
    model: "",
    net_value: 0,
    terms: "Immediate",
    delivery_period: "7 days"
  };
}

export function blankPurchasingOrder(): PurchasingOrder {
  const today = new Date().toISOString().slice(0, 10);
  const monthCode = new Date().toLocaleString("en-US", { month: "short" }).toUpperCase().slice(0, 1);
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const orderId = `NM${monthCode}${randomSeq}`;

  return {
    id: orderId,
    order_id: orderId,
    branch: "MAIN",
    market_type: "IND",
    quote_no: `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    quote_date: today,
    marketing_person: "",
    delivery_period: "1 to 2 Weeks",
    customer_name: "",
    place: "Coimbatore",
    terms: "50% Advance, Balance on Delivery",
    marketing_items: [newMarketingItem(1), newMarketingItem(2), newMarketingItem(3)],
    total_order_value: 0,
    service_demo: false,
    service_installation: false,
    service_calibration: false,
    service_person: "",
    service_date: "",
    service_amount: 0,
    marketing_complete: false,

    packing_by: "",
    dispatch_on: today,
    weight: "",
    courier_mode: "ROAD",
    dispatch_amount: 0,
    dispatch_sign: "",
    dispatch_complete: false,

    customer_payments: [
      { id: createItemId(), payment_date: today, bank_mode: "NEFT / RTGS", amount: 0 }
    ],
    total_payment_received: 0,
    payment_balance: 0,
    payment_complete: false,

    supplier_rows: [newSupplierRow(), newSupplierRow()],
    order_place_to: "",
    supplier_sign: "",
    supplier_complete: false,

    po_date: today,
    po_no: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    accounts_supplier_name: "",
    accounts_terms: "30 Days Credit",
    proforma_no: "",
    courier_today_basic: "Yes",
    pdc_on_delivery: "No",
    accounts_dispatch_date: today,
    accounts_courier: "Professional Courier",
    packing_mode: "Wooden Box",
    docket_no: "",
    courier_rs: 0,
    item_received_on: "",
    additional_cost: 0,
    accounts_weight: "",
    dispatch_method: "ROAD",
    accounts_items: [
      { id: createItemId(), particulars: "", item_value: 0, pf_charges: 0, tax: 0, total: 0 }
    ],
    bill_amount: 0,
    purchase_bill_no: "",
    bill_date: today,
    supplier_payments: [
      { id: createItemId(), payment_date: today, bank_branch: "HDFC Coimbatore", mode: "Online", amount: 0 }
    ],
    supplier_balance: 0,
    total_purchase_cost: 0,
    total_selling_cost: 0,
    profit: 0,
    profit_percentage: 0,
    account_remarks: "",
    account_signature: "",
    accounts_complete: false,

    remarks: "",
    approval_date: today,
    approved_by: "Managing Director",
    approval_complete: false,

    current_status: "Marketing",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
