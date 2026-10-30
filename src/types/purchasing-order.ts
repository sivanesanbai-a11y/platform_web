export type PurchasingMarketType = "IND" | "EXPORT";
export type PurchasingBranch = "MAIN" | "GANDHIPURAM" | "GOPALAPURAM";

export interface MarketingItem {
  id: string;
  item_name: string;
  model: string;
  qty: number;
  item_value: number;
  add_charge: number;
  image_url?: string;
  specifications?: string;
}

export interface CustomerPaymentRow {
  id: string;
  payment_date: string;
  bank_mode: string;
  amount: number;
}

export interface SupplierRow {
  id: string;
  supplier: string;
  model: string;
  net_value: number;
  terms: string;
  delivery_period: string;
}

export interface AccountsItem {
  id: string;
  particulars: string;
  item_value: number;
  pf_charges: number;
  tax: number;
  total: number;
}

export interface SupplierPaymentRow {
  id: string;
  payment_date: string;
  bank_branch: string;
  mode: string;
  amount: number;
}

export interface PurchasingOrder {
  id: string | number;
  order_id: string;
  branch: PurchasingBranch;
  market_type: PurchasingMarketType;
  quote_no: string;
  quote_date: string;
  marketing_person: string;
  delivery_period: string;
  customer_name: string;
  place: string;
  terms: string;
  marketing_items: MarketingItem[];
  total_order_value: number;
  service_demo: boolean;
  service_installation: boolean;
  service_calibration: boolean;
  service_person: string;
  service_date: string;
  service_amount: number;
  marketing_complete: boolean;

  // Dispatch
  packing_by: string;
  dispatch_on: string;
  weight: string;
  courier_mode: "AIR" | "ROAD" | "RAILWAY" | "OTHER";
  dispatch_amount: number;
  dispatch_sign: string;
  dispatch_complete: boolean;

  // Customer Payment
  customer_payments: CustomerPaymentRow[];
  total_payment_received: number;
  payment_balance: number;
  payment_complete: boolean;

  // Supplier
  supplier_rows: SupplierRow[];
  order_place_to: string;
  supplier_sign: string;
  supplier_complete: boolean;

  // Accounts
  po_date: string;
  po_no: string;
  accounts_supplier_name: string;
  accounts_terms: string;
  proforma_no: string;
  courier_today_basic: string;
  pdc_on_delivery: string;
  accounts_dispatch_date: string;
  accounts_courier: string;
  packing_mode: string;
  docket_no: string;
  courier_rs: number;
  item_received_on: string;
  additional_cost: number;
  accounts_weight: string;
  dispatch_method: string;
  accounts_items: AccountsItem[];
  bill_amount: number;
  purchase_bill_no: string;
  bill_date: string;
  supplier_payments: SupplierPaymentRow[];
  supplier_balance: number;
  total_purchase_cost: number;
  total_selling_cost: number;
  profit: number;
  profit_percentage: number;
  account_remarks: string;
  account_signature: string;
  accounts_complete: boolean;

  // Final Approval
  remarks: string;
  approval_date: string;
  approved_by: string;
  approval_complete: boolean;

  current_status: string;
  created_at: string;
  updated_at: string;
}
