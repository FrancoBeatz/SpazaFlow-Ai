export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  expiryDate?: string; // YYYY-MM-DD
  imageUrl?: string;
  fastSelling?: boolean;
  slowMoving?: boolean;
}

export interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  vat: number; // South African VAT is 15%
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'EFT' | 'Mobile/WhatsApp' | 'Loyalty';
  paidAmount: number;
  changeAmount: number;
  timestamp: string; // ISO string
  customerPhone?: string; // for WhatsApp/loyalty
  customerId?: string;
  pointsEarned?: number;
  cashierName?: string;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Electricity' | 'Water' | 'Supplier Stock' | 'Salaries' | 'Transport' | 'Other';
  amount: number;
  description: string;
  timestamp: string; // ISO string
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
}

export interface MarketplaceProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  minOrderQty: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'Pending' | 'Approved' | 'Shipped' | 'Delivered';
  timestamp: string;
}

export interface CustomerLoyalty {
  id: string;
  name: string;
  phone: string;
  points: number;
  cardCode: string; // e.g. SF-7711
  vouchers: {
    id: string;
    code: string;
    description: string;
    discountValue: number;
    minSpend: number;
    expiryDate: string;
    isUsed: boolean;
  }[];
  purchaseHistoryCount: number;
  referrals: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Manager' | 'Cashier';
  pin: string; // login pin
  status: 'Active' | 'Inactive';
  attendance: {
    date: string; // YYYY-MM-DD
    clockIn: string; // HH:MM:ss
    clockOut?: string; // HH:MM:ss
    state: 'Present' | 'Late' | 'Absent';
  }[];
  salesCompleted: number;
  totalSalesValue: number;
}

export interface CommunityMarketplaceItem {
  id: string;
  ownerSpazaName: string;
  ownerPhone: string;
  productName: string;
  quantity: number;
  askingPrice: number;
  location: string;
  status: 'Available' | 'Accepted' | 'Sold';
  timestamp: string;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface BusinessHealth {
  score: 'Excellent' | 'Good' | 'Warning' | 'Critical';
  scoreValue: number; // 0 - 100
  lowStockCount: number;
  expiringSoonCount: number;
  revenueToday: number;
  transactionsToday: number;
  profitMargin: number;
}
