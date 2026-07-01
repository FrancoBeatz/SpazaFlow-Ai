import { 
  Product, 
  Sale, 
  Expense, 
  Supplier, 
  MarketplaceProduct, 
  SupplierOrder, 
  CustomerLoyalty, 
  Employee, 
  CommunityMarketplaceItem, 
  AuditLog,
  BusinessHealth
} from "../types";

export interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  plan_tier: string;
  subscription_status: string;
  location: string;
}

export interface UserAccount {
  email: string;
  password?: string;
  fullname: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Cashier';
  businessId: string;
}

export const defaultProducts: Product[] = [
  { id: "p1", name: "Tastic Rice 2kg", barcode: "6001001235123", category: "Staples", costPrice: 42.00, sellingPrice: 52.00, stock: 15, minStock: 8, expiryDate: "2027-04-12", fastSelling: true, slowMoving: false, imageUrl: "" },
  { id: "p2", name: "Iwisa Maize Meal 5kg", barcode: "6001122334455", category: "Staples", costPrice: 65.00, sellingPrice: 78.00, stock: 24, minStock: 10, expiryDate: "2026-12-05", fastSelling: true, slowMoving: false, imageUrl: "" },
  { id: "p3", name: "Albany White Bread 700g", barcode: "6002233445566", category: "Bakery", costPrice: 14.50, sellingPrice: 18.50, stock: 4, minStock: 10, expiryDate: "2026-06-23", fastSelling: true, slowMoving: false, imageUrl: "" },
  { id: "p4", name: "Coca-Cola 2L", barcode: "5449000000996", category: "Beverages", costPrice: 19.00, sellingPrice: 24.50, stock: 35, minStock: 15, expiryDate: "2026-11-20", fastSelling: true, slowMoving: false, imageUrl: "" },
  { id: "p5", name: "Lucky Star Pilchards Tomato 400g", barcode: "6001111222233", category: "Canned Food", costPrice: 20.50, sellingPrice: 26.00, stock: 18, minStock: 8, expiryDate: "2028-08-30", fastSelling: false, slowMoving: false, imageUrl: "" },
  { id: "p6", name: "Sunlight Liquid Lemon 750ml", barcode: "6001024345222", category: "Household", costPrice: 28.00, sellingPrice: 36.00, stock: 6, minStock: 8, expiryDate: "2029-01-15", fastSelling: false, slowMoving: false, imageUrl: "" },
  { id: "p7", name: "Selati White Sugar 2.5kg", barcode: "6002010101010", category: "Staples", costPrice: 48.00, sellingPrice: 58.00, stock: 12, minStock: 8, expiryDate: "2027-10-10", fastSelling: false, slowMoving: false, imageUrl: "" },
  { id: "p8", name: "Huletts SunSweet Brown Sugar 2kg", barcode: "6003010101010", category: "Staples", costPrice: 39.00, sellingPrice: 47.00, stock: 2, minStock: 8, expiryDate: "2027-09-18", fastSelling: false, slowMoving: true, imageUrl: "" },
  { id: "p9", name: "Simba Chutney Chips 120g", barcode: "6001234567890", category: "Snacks", costPrice: 13.00, sellingPrice: 17.50, stock: 30, minStock: 12, expiryDate: "2026-09-01", fastSelling: true, slowMoving: false, imageUrl: "" },
  { id: "p10", name: "Shield Men Roll-on 50ml", barcode: "6001087114455", category: "Personal Care", costPrice: 18.00, sellingPrice: 24.00, stock: 5, minStock: 6, expiryDate: "2028-02-14", fastSelling: false, slowMoving: true, imageUrl: "" },
  { id: "p11", name: "Blue Label Marie Biscuits 200g", barcode: "6001052345678", category: "Snacks", costPrice: 12.00, sellingPrice: 16.00, stock: 20, minStock: 8, expiryDate: "2027-03-24", fastSelling: false, slowMoving: false, imageUrl: "" }
];

export const defaultSales: Sale[] = [
  {
    id: "s1",
    items: [
      { productId: "p1", productName: "Tastic Rice 2kg", price: 52.00, quantity: 1, total: 52.00 },
      { productId: "p4", productName: "Coca-Cola 2L", price: 24.50, quantity: 2, total: 49.00 }
    ],
    subtotal: 87.83,
    vat: 13.17,
    total: 101.00,
    paymentMethod: "Cash",
    paidAmount: 120.00,
    changeAmount: 19.00,
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    customerPhone: "0721234567",
    customerId: "l1",
    pointsEarned: 10,
    cashierName: "Sipho Khumalo"
  },
  {
    id: "s2",
    items: [
      { productId: "p3", productName: "Albany White Bread 700g", price: 18.50, quantity: 1, total: 18.50 },
      { productId: "p2", productName: "Iwisa Maize Meal 5kg", price: 78.00, quantity: 1, total: 78.00 },
      { productId: "p9", productName: "Simba Chutney Chips 120g", price: 17.50, quantity: 2, total: 35.00 }
    ],
    subtotal: 114.35,
    vat: 17.15,
    total: 131.50,
    paymentMethod: "Card",
    paidAmount: 131.50,
    changeAmount: 0.00,
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    customerPhone: "",
    pointsEarned: 0,
    cashierName: "Sipho Khumalo"
  },
  {
    id: "s3",
    items: [
      { productId: "p4", productName: "Coca-Cola 2L", price: 24.50, quantity: 4, total: 98.00 },
      { productId: "p9", productName: "Simba Chutney Chips 120g", price: 17.50, quantity: 3, total: 52.50 }
    ],
    subtotal: 130.87,
    vat: 19.63,
    total: 150.50,
    paymentMethod: "EFT",
    paidAmount: 150.50,
    changeAmount: 0.00,
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
    customerPhone: "0839876543",
    customerId: "l2",
    pointsEarned: 15,
    cashierName: "Thabo Shabalala"
  }
];

export const defaultExpenses: Expense[] = [
  { id: "e1", category: "Rent", amount: 2500.00, description: "June Container Rental Premise", timestamp: new Date(Date.now() - 10 * 24 * 3600000).toISOString() },
  { id: "e2", category: "Electricity", amount: 450.00, description: "Eskom Prepaid Token Top-up", timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
  { id: "e3", category: "Water", amount: 120.00, description: "Municipal water logistics", timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString() },
  { id: "e4", category: "Transport", amount: 350.00, description: "Taxi hire/petrol for wholesalers collection", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() }
];

export const defaultSuppliers: Supplier[] = [
  { id: "sup1", name: "Soweto Cash & Carry Wholesalers", contactPerson: "Musa Ndlovu", phone: "011 933 4567", email: "info@sowetocc.co.za", category: "Bulk Foods & Staples", address: "348 Bara Boulevard, Soweto, JHB" },
  { id: "sup2", name: "SAB Bakers Co-op", contactPerson: "Le Roux van der Merwe", phone: "021 511 8899", email: "orders@sabbakers.co.za", category: "Bakery", address: "8 Epping Industrial Area, Cape Town" },
  { id: "sup3", name: "JHB Fresh Market Logistics", contactPerson: "Zanele Sisulu", phone: "011 888 1234", email: "zanele@jhbfresh.co.za", category: "Fresh Produce", address: "Heidelberg Road, City Deep, JHB" }
];

export const defaultMarketplace: MarketplaceProduct[] = [
  { id: "mp1", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Tastic Rice 10kg Bulk Pack", price: 180.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300&auto=format&fit=crop", minOrderQty: 5 },
  { id: "mp2", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Iwisa Maize Meal 10kg Bulk", price: 110.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=300&auto=format&fit=crop", minOrderQty: 10 },
  { id: "mp3", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Coca-Cola 500ml Case (24 units)", price: 216.00, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop", minOrderQty: 2 },
  { id: "mp4", supplierId: "sup2", supplierName: "SAB Bakers Co-op", name: "Albany Bread Tray (12 loaves)", price: 135.00, category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop", minOrderQty: 1 },
  { id: "mp5", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Fresh Potatoes 10kg Sack", price: 75.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 },
  { id: "mp6", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Brown Onions 10kg Sack", price: 65.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 }
];

export const defaultSupplierOrders: SupplierOrder[] = [
  { id: "ord1", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", items: [{ name: "Tastic Rice 10kg Bulk Pack", quantity: 5, price: 180.00 }], total: 900.00, status: "Delivered", timestamp: new Date(Date.now() - 6 * 24 * 3600000).toISOString() },
  { id: "ord2", supplierId: "sup2", supplierName: "SAB Bakers Co-op", items: [{ name: "Albany Bread Tray (12 loaves)", quantity: 2, price: 135.00 }], total: 270.00, status: "Shipped", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
];

export const defaultLoyalty: CustomerLoyalty[] = [
  { id: "l1", name: "Mpho Tsotetsi", phone: "0721234567", points: 125, cardCode: "SF-4821", vouchers: [
    { id: "v1", code: "SFINY25", description: "R25 Festive Season Discount", discountValue: 25.00, minSpend: 100.00, expiryDate: "2026-12-31", isUsed: false },
    { id: "v2", code: "SPAZAFREE10", description: "R10 Off Staples Special", discountValue: 10.00, minSpend: 50.00, expiryDate: "2026-08-30", isUsed: false }
  ], purchaseHistoryCount: 14, referrals: 2 },
  { id: "l2", name: "Sibusiso Zulu", phone: "0839876543", points: 72, cardCode: "SF-8891", vouchers: [
    { id: "v3", code: "WELCOME15", description: "R15 New Member Discount", discountValue: 15.00, minSpend: 80.00, expiryDate: "2026-10-15", isUsed: false }
  ], purchaseHistoryCount: 5, referrals: 0 },
  { id: "l3", name: "Zodwa Khumalo", phone: "0612234455", points: 210, cardCode: "SF-3310", vouchers: [
    { id: "v4", code: "PLATINUM50", description: "R50 Spaza loyalty tier voucher", discountValue: 50.00, minSpend: 200.00, expiryDate: "2026-09-19", isUsed: false }
  ], purchaseHistoryCount: 22, referrals: 5 }
];

export const defaultEmployees: Employee[] = [
  { id: "emp1", name: "Sipho Khumalo", role: "Cashier", pin: "1234", status: "Active", attendance: [
    { date: new Date().toISOString().split('T')[0], clockIn: "07:58:12", clockOut: "17:05:00", state: "Present" }
  ], salesCompleted: 23, totalSalesValue: 3120.50 },
  { id: "emp2", name: "Thabo Shabalala", role: "Manager", pin: "0000", status: "Active", attendance: [
    { date: new Date().toISOString().split('T')[0], clockIn: "07:45:00", state: "Present" }
  ], salesCompleted: 12, totalSalesValue: 4890.00 }
];

export const defaultCommunityExchange: CommunityMarketplaceItem[] = [
  { id: "c1", ownerSpazaName: "Lindi's Tuck Shop", ownerPhone: "0725556633", productName: "Coca-Cola 500ml Surplus Bottles", quantity: 18, askingPrice: 10.00, location: "Orlando West, Soweto", status: "Available", timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), description: "Got extra delivery error stocks, normal cost is R12, selling for R10 each. Bring boxes." },
  { id: "c2", ownerSpazaName: "Kasi Staples Basket", ownerPhone: "0847771234", productName: "Tastic Rice 10kg Sack", quantity: 3, askingPrice: 150.00, location: "Meadowlands Zone 4, Soweto", status: "Available", timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), description: "We ordered too much rice and need cash for rent. Brand new unopened sacks." }
];

export const defaultAuditLogs: AuditLog[] = [
  { id: "a1", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), user: "Thabo Shabalala", role: "Manager", action: "Stock Adjustment", details: "Huletts Brown Sugar verified counting" },
  { id: "a2", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), user: "Sipho Khumalo", role: "Cashier", action: "Clock In", details: "Shift starter check-in at 07:58" }
];

export const defaultUsers: UserAccount[] = [
  { email: "thabo@spazaflow.co.za", password: "admin", fullname: "Thabo Shabalala", phone: "072 123 4567", role: "Owner", businessId: "b_soweto1" },
  { email: "owner@spaza.co.za", password: "admin", fullname: "Zama Buthelezi", phone: "082 999 4433", role: "Owner", businessId: "b_soweto1" }
];

export const defaultBusinesses: BusinessTenant[] = [
  { id: "b_soweto1", name: "Sizwe Kasi Tuck Shop", slug: "sizwe-kasi-soweto", plan_tier: "Business", subscription_status: "Active", location: "Orlando West, Soweto" },
  { id: "b_alexfresh", name: "Alexandra Staples Depot", slug: "alex-fresh-coop", plan_tier: "Starter", subscription_status: "Active", location: "Alexandra, JHB" },
  { id: "b_mplain", name: "Mitchells Plain Tuck Mart", slug: "mplain-mart", plan_tier: "Free", subscription_status: "Active", location: "Mitchells Plain, CT" }
];

export const defaultHealth: BusinessHealth = { 
  score: 'Good', 
  scoreValue: 85, 
  lowStockCount: 4, 
  expiringSoonCount: 1, 
  revenueToday: 1250, 
  transactionsToday: 18, 
  profitMargin: 21.5 
};
