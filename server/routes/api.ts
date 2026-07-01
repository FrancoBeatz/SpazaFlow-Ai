import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabase';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'spazaflow-super-secret-key';

// -------------------------------------------------------------
// SEED DATA BASELINE (South African Tuck Shop catalog)
// -------------------------------------------------------------
const SEED_PRODUCTS = [
  { id: "p1", name: "Tastic Rice 2kg", barcode: "6001001235123", category: "Staples", costPrice: 42.00, sellingPrice: 52.00, stock: 15, minStock: 8, expiryDate: "2027-04-12", fastSelling: true, slowMoving: false },
  { id: "p2", name: "Iwisa Maize Meal 5kg", barcode: "6001122334455", category: "Staples", costPrice: 65.00, sellingPrice: 78.00, stock: 24, minStock: 10, expiryDate: "2026-12-05", fastSelling: true, slowMoving: false },
  { id: "p3", name: "Albany White Bread 700g", barcode: "6002233445566", category: "Bakery", costPrice: 14.50, sellingPrice: 18.50, stock: 4, minStock: 10, expiryDate: "2026-06-23", fastSelling: true, slowMoving: false },
  { id: "p4", name: "Coca-Cola 2L", barcode: "5449000000996", category: "Beverages", costPrice: 19.00, sellingPrice: 24.50, stock: 35, minStock: 15, expiryDate: "2026-11-20", fastSelling: true, slowMoving: false },
  { id: "p5", name: "Lucky Star Pilchards Tomato 400g", barcode: "6001111222233", category: "Canned Food", costPrice: 20.50, sellingPrice: 26.00, stock: 18, minStock: 8, expiryDate: "2028-08-30", fastSelling: false, slowMoving: false },
  { id: "p6", name: "Sunlight Liquid Lemon 750ml", barcode: "6001024345222", category: "Household", costPrice: 28.00, sellingPrice: 36.00, stock: 6, minStock: 8, expiryDate: "2029-01-15", fastSelling: false, slowMoving: false },
  { id: "p7", name: "Selati White Sugar 2.5kg", barcode: "6002010101010", category: "Staples", costPrice: 48.00, sellingPrice: 58.00, stock: 12, minStock: 8, expiryDate: "2027-10-10", fastSelling: false, slowMoving: false },
  { id: "p8", name: "Huletts SunSweet Brown Sugar 2kg", barcode: "6003010101010", category: "Staples", costPrice: 39.00, sellingPrice: 47.00, stock: 2, minStock: 8, expiryDate: "2027-09-18", fastSelling: false, slowMoving: true },
  { id: "p9", name: "Simba Chutney Chips 120g", barcode: "6001234567890", category: "Snacks", costPrice: 13.00, sellingPrice: 17.50, stock: 30, minStock: 12, expiryDate: "2026-09-01", fastSelling: true, slowMoving: false },
  { id: "p10", name: "Shield Men Roll-on 50ml", barcode: "6001087114455", category: "Personal Care", costPrice: 18.00, sellingPrice: 24.00, stock: 5, minStock: 6, expiryDate: "2028-02-14", fastSelling: false, slowMoving: true },
  { id: "p11", name: "Blue Label Marie Biscuits 200g", barcode: "6001052345678", category: "Snacks", costPrice: 12.00, sellingPrice: 16.00, stock: 20, minStock: 8, expiryDate: "2027-03-24", fastSelling: false, slowMoving: false }
];

const SEED_SUPPLIERS = [
  { id: "sup1", name: "Soweto Cash & Carry Wholesalers", contactPerson: "Musa Ndlovu", phone: "011 933 4567", email: "info@sowetocc.co.za", category: "Bulk Foods & Staples", address: "348 Bara Boulevard, Soweto, JHB" },
  { id: "sup2", name: "SAB Bakers Co-op", contactPerson: "Le Roux van der Merwe", phone: "021 511 8899", email: "orders@sabbakers.co.za", category: "Bakery", address: "8 Epping Industrial Area, Cape Town" },
  { id: "sup3", name: "JHB Fresh Market Logistics", contactPerson: "Zanele Sisulu", phone: "011 888 1234", email: "zanele@jhbfresh.co.za", category: "Fresh Produce", address: "Heidelberg Road, City Deep, JHB" }
];

const SEED_EMPLOYEES = [
  { id: "emp1", name: "Sipho Khumalo", role: "Cashier", pin: "1234", status: "Active", attendance: [{ date: new Date().toISOString().split('T')[0], clockIn: "07:58:12", clockOut: "17:05:00", state: "Present" }], salesCompleted: 23, totalSalesValue: 3120.50 },
  { id: "emp2", name: "Thabo Shabalala", role: "Manager", pin: "0000", status: "Active", attendance: [{ date: new Date().toISOString().split('T')[0], clockIn: "07:45:00", state: "Present" }], salesCompleted: 12, totalSalesValue: 4890.00 }
];

const SEED_LOYALTY = [
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

const SEED_EXPENSES = [
  { id: "e1", category: "Rent", amount: 2500.00, description: "June Container Rental Premise", timestamp: new Date(Date.now() - 10 * 24 * 3600000).toISOString() },
  { id: "e2", category: "Electricity", amount: 450.00, description: "Eskom Prepaid Token Top-up", timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
  { id: "e3", category: "Water", amount: 120.00, description: "Municipal water logistics", timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString() },
  { id: "e4", category: "Transport", amount: 350.00, description: "Taxi hire/petrol for wholesalers collection", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() }
];

const SEED_MARKETPLACE = [
  { id: "mp1", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Tastic Rice 10kg Bulk Pack", price: 180.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300&auto=format&fit=crop", minOrderQty: 5 },
  { id: "mp2", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Iwisa Maize Meal 10kg Bulk", price: 110.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=300&auto=format&fit=crop", minOrderQty: 10 },
  { id: "mp3", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Coca-Cola 500ml Case (24 units)", price: 216.00, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop", minOrderQty: 2 },
  { id: "mp4", supplierId: "sup2", supplierName: "SAB Bakers Co-op", name: "Albany Bread Tray (12 loaves)", price: 135.00, category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop", minOrderQty: 1 },
  { id: "mp5", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Fresh Potatoes 10kg Sack", price: 75.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 },
  { id: "mp6", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Brown Onions 10kg Sack", price: 65.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 }
];

const SEED_COMMUNITY = [
  { id: "c1", ownerSpazaName: "Sizwe Kasi Tuck Shop", ownerPhone: "072 123 4567", productName: "Lucky Star Pilchards Tomato 400g", quantity: 15, askingPrice: 21.00, location: "Orlando West, Soweto", status: "Available", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), description: "Expiry Dec 2027. Sealed cases. Swap for maize meal or sugar." },
  { id: "c2", ownerSpazaName: "Alexandra Staples Depot", ownerPhone: "083 987 6543", productName: "Iwisa Maize Meal 5kg", quantity: 8, askingPrice: 68.00, location: "Alexandra, JHB", status: "Available", timestamp: new Date(Date.now() - 10 * 3600000).toISOString(), description: "Excess stock. Need sunlight liquid." }
];

// -------------------------------------------------------------
// MAPPER UTILITIES BETWEEN POSTGRES ROW AND JS OBJ
// -------------------------------------------------------------
function toProductRow(p: any): any {
  return {
    id: p.id,
    business_id: p.businessId,
    name: p.name,
    barcode: p.barcode,
    category_name: p.category || 'General',
    cost_price: p.costPrice !== undefined ? Number(p.costPrice) : 0,
    selling_price: p.sellingPrice !== undefined ? Number(p.sellingPrice) : 0,
    stock: p.stock !== undefined ? Number(p.stock) : 0,
    min_stock: p.minStock !== undefined ? Number(p.minStock) : 5,
    expiry_date: p.expiryDate,
    image_url: p.imageUrl || '',
    fast_selling: !!p.fastSelling,
    slow_moving: !!p.slowMoving,
  };
}

function fromProductRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    barcode: row.barcode,
    category: row.category_name,
    costPrice: Number(row.cost_price || 0),
    sellingPrice: Number(row.selling_price || 0),
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 0),
    expiryDate: row.expiry_date,
    imageUrl: row.image_url,
    fastSelling: row.fast_selling,
    slowMoving: row.slow_moving,
  };
}

function toBusinessRow(b: any): any {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    plan_tier: b.plan_tier || b.planTier || 'Free',
    subscription_status: b.subscription_status || b.subscriptionStatus || 'Active',
    location: b.location || 'South Africa'
  };
}

function fromBusinessRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    planTier: row.plan_tier,
    plan_tier: row.plan_tier,
    subscriptionStatus: row.subscription_status,
    subscription_status: row.subscription_status,
    location: row.location
  };
}

function toUserRow(u: any): any {
  return {
    id: u.id,
    email: u.email?.toLowerCase(),
    fullname: u.fullname,
    phone: u.phone || '',
    password: u.password,
    role: u.role || 'Owner',
    business_id: u.businessId || u.business_id
  };
}

function fromUserRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    email: row.email,
    fullname: row.fullname,
    phone: row.phone,
    password: row.password,
    role: row.role,
    businessId: row.business_id
  };
}

function toSaleRow(s: any): any {
  return {
    id: s.id,
    business_id: s.businessId,
    items: s.items || [],
    subtotal: Number(s.subtotal || 0),
    vat: Number(s.vat || 0),
    total: Number(s.total || 0),
    payment_method: s.paymentMethod,
    paid_amount: Number(s.paidAmount || 0),
    change_amount: Number(s.changeAmount || 0),
    timestamp: s.timestamp,
    customer_phone: s.customerPhone || '',
    customer_id: s.customerId || null,
    points_earned: Number(s.pointsEarned || 0),
    cashier_name: s.cashierName || ''
  };
}

function fromSaleRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    subtotal: Number(row.subtotal || 0),
    vat: Number(row.vat || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method,
    paidAmount: Number(row.paid_amount || 0),
    changeAmount: Number(row.change_amount || 0),
    timestamp: row.timestamp,
    customerPhone: row.customer_phone,
    customerId: row.customer_id,
    pointsEarned: Number(row.points_earned || 0),
    cashierName: row.cashier_name
  };
}

function toExpenseRow(e: any): any {
  return {
    id: e.id,
    business_id: e.businessId,
    category: e.category,
    amount: Number(e.amount || 0),
    description: e.description,
    timestamp: e.timestamp
  };
}

function fromExpenseRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    category: row.category,
    amount: Number(row.amount || 0),
    description: row.description,
    timestamp: row.timestamp
  };
}

function toSupplierRow(s: any): any {
  return {
    id: s.id,
    business_id: s.businessId,
    name: s.name,
    contact_person: s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    category: s.category || 'General',
    address: s.address || ''
  };
}

function fromSupplierRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    category: row.category,
    address: row.address
  };
}

function toSupplierOrderRow(o: any): any {
  return {
    id: o.id,
    business_id: o.businessId,
    supplier_id: o.supplierId,
    supplier_name: o.supplierName,
    items: o.items || [],
    total: Number(o.total || 0),
    status: o.status || 'Pending',
    timestamp: o.timestamp
  };
}

function fromSupplierOrderRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    total: Number(row.total || 0),
    status: row.status,
    timestamp: row.timestamp
  };
}

function toCustomerRow(c: any): any {
  return {
    id: c.id,
    business_id: c.businessId,
    name: c.name,
    phone: c.phone,
    points: Number(c.points || 0),
    card_code: c.cardCode,
    vouchers: c.vouchers || [],
    purchase_history_count: Number(c.purchaseHistoryCount || 0),
    referrals: Number(c.referrals || 0)
  };
}

function fromCustomerRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    points: Number(row.points || 0),
    cardCode: row.card_code,
    vouchers: typeof row.vouchers === 'string' ? JSON.parse(row.vouchers) : row.vouchers,
    purchaseHistoryCount: Number(row.purchase_history_count || 0),
    referrals: Number(row.referrals || 0)
  };
}

function toEmployeeRow(e: any): any {
  return {
    id: e.id,
    business_id: e.businessId,
    name: e.name,
    role: e.role || 'Cashier',
    pin: e.pin,
    status: e.status || 'Active',
    attendance: e.attendance || [],
    sales_completed: Number(e.salesCompleted || 0),
    total_sales_value: Number(e.totalSalesValue || 0)
  };
}

function fromEmployeeRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    role: row.role,
    pin: row.pin,
    status: row.status,
    attendance: typeof row.attendance === 'string' ? JSON.parse(row.attendance) : row.attendance,
    salesCompleted: Number(row.sales_completed || 0),
    totalSalesValue: Number(row.total_sales_value || 0)
  };
}

function toCommunityRow(c: any): any {
  return {
    id: c.id,
    owner_spaza_name: c.ownerSpazaName,
    owner_phone: c.ownerPhone,
    product_name: c.productName,
    quantity: Number(c.quantity || 0),
    asking_price: Number(c.askingPrice || 0),
    location: c.location,
    status: c.status || 'Available',
    description: c.description || '',
    timestamp: c.timestamp
  };
}

function fromCommunityRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    ownerSpazaName: row.owner_spaza_name,
    ownerPhone: row.owner_phone,
    productName: row.product_name,
    quantity: Number(row.quantity || 0),
    askingPrice: Number(row.asking_price || 0),
    location: row.location,
    status: row.status,
    description: row.description,
    timestamp: row.timestamp
  };
}

function toAuditLogRow(l: any): any {
  return {
    id: l.id,
    business_id: l.businessId,
    timestamp: l.timestamp,
    user_fullname: l.user,
    role: l.role,
    action: l.action,
    details: l.details
  };
}

function fromAuditLogRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    timestamp: row.timestamp,
    user: row.user_fullname,
    role: row.role,
    action: row.action,
    details: row.details
  };
}

function toNotificationRow(n: any): any {
  return {
    id: n.id,
    business_id: n.businessId,
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: !!n.is_read,
    timestamp: n.timestamp
  };
}

function fromNotificationRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    message: row.message,
    type: row.type,
    is_read: row.is_read,
    timestamp: row.timestamp
  };
}

// -------------------------------------------------------------
// SEED DATABASE FUNCTIONS (SUPABASE IDEMPOTENT)
// -------------------------------------------------------------
async function seedTenantData(businessId: string, businessName: string, location: string) {
  try {
    // 1. Seed Products
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (prodCount === 0) {
      const prods = SEED_PRODUCTS.map(p => toProductRow({ ...p, businessId }));
      await supabase.from('products').insert(prods);
    }

    // 2. Seed Suppliers
    const { count: supCount } = await supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (supCount === 0) {
      const sups = SEED_SUPPLIERS.map(s => toSupplierRow({ ...s, businessId }));
      await supabase.from('suppliers').insert(sups);
    }

    // 3. Seed Employees
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (empCount === 0) {
      const emps = SEED_EMPLOYEES.map(e => toEmployeeRow({ ...e, businessId }));
      await supabase.from('employees').insert(emps);
    }

    // 4. Seed Customers (Loyalty)
    const { count: loyCount } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (loyCount === 0) {
      const loys = SEED_LOYALTY.map(l => toCustomerRow({ ...l, businessId }));
      await supabase.from('customers').insert(loys);
    }

    // 5. Seed Expenses
    const { count: expCount } = await supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (expCount === 0) {
      const exps = SEED_EXPENSES.map(e => toExpenseRow({ ...e, businessId }));
      await supabase.from('expenses').insert(exps);
    }

    // 6. Seed Sales
    const { count: saleCount } = await supabase.from('sales').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (saleCount === 0) {
      const salesSeed = [
        {
          id: "s1",
          businessId,
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
          businessId,
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
        }
      ].map(s => toSaleRow(s));
      await supabase.from('sales').insert(salesSeed);
    }

    // 7. Seed Purchase Orders
    const { count: orderCount } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (orderCount === 0) {
      const orders = [
        { id: "ord1", businessId, supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", items: [{ name: "Tastic Rice 10kg Bulk Pack", quantity: 5, price: 180.00 }], total: 900.00, status: "Delivered", timestamp: new Date(Date.now() - 6 * 24 * 3600000).toISOString() },
        { id: "ord2", businessId, supplierId: "sup2", supplierName: "SAB Bakers Co-op", items: [{ name: "Albany Bread Tray (12 loaves)", quantity: 2, price: 135.00 }], total: 270.00, status: "Shipped", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
      ].map(o => toSupplierOrderRow(o));
      await supabase.from('purchase_orders').insert(orders);
    }

    // 8. Seed Audit Logs
    const { count: auditCount } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (auditCount === 0) {
      const logs = [
        { id: "a1", businessId, timestamp: new Date().toISOString(), user: "Thabo Shabalala (Owner)", role: "Owner", action: "SaaS Authentication Success", details: "Initial onboarding log generated" }
      ].map(l => toAuditLogRow(l));
      await supabase.from('activity_logs').insert(logs);
    }

    // 9. Seed Notifications
    const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('business_id', businessId);
    if (notifCount === 0) {
      const notifs = [
        { id: "n1", businessId, title: 'Welcome to SpazaFlow', message: `Database schemas for ${businessName} initialized successfully in ${location}`, type: 'subscription', is_read: false, timestamp: new Date().toISOString() },
        { id: "n2", businessId, title: 'Low Stock Alert', message: 'Huletts Brown Sugar is down to 2 units.', type: 'low_stock', is_read: false, timestamp: new Date(Date.now() - 5 * 60000).toISOString() }
      ].map(n => toNotificationRow(n));
      await supabase.from('notifications').insert(notifs);
    }

    // 10. Community Marketplace items (Global / trade marketplace)
    const { count: communityCount } = await supabase.from('community_marketplace').select('*', { count: 'exact', head: true });
    if (communityCount === 0) {
      const comms = SEED_COMMUNITY.map(c => toCommunityRow(c));
      await supabase.from('community_marketplace').insert(comms);
    }
  } catch (err) {
    console.error("Error seeding tenant data into Supabase:", err);
  }
}

// Pre-seed default user Thabo Shabalala
export async function seedDefaultDatabase() {
  try {
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt);
      const businessId = 'b_soweto1';

      // Insert Sizwe Kasi Tuck Shop business
      const bizRow = toBusinessRow({
        id: businessId,
        name: 'Sizwe Kasi Tuck Shop',
        slug: 'sizwe-kasi-soweto',
        plan_tier: 'Business',
        subscription_status: 'Active',
        location: 'Orlando West, Soweto',
      });
      await supabase.from('businesses').insert(bizRow);

      // Insert default user
      const userRow = toUserRow({
        id: 'u_thabo_1',
        fullname: 'Thabo Shabalala',
        email: 'thabo@spazaflow.co.za',
        phone: '072 123 4567',
        password: hashedPassword,
        role: 'Owner',
        businessId,
      });
      await supabase.from('users').insert(userRow);

      // Seed mock records
      await seedTenantData(businessId, 'Sizwe Kasi Tuck Shop', 'Orlando West, Soweto');
      console.log('✅ Pre-seeded default Supabase users table (thabo@spazaflow.co.za / password)');
    }
  } catch (err) {
    console.error('Error pre-seeding default database in Supabase: ', err);
  }
}

// -------------------------------------------------------------
// AUTH MIDDLEWARE
// -------------------------------------------------------------
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    fullname: string;
    role: 'Owner' | 'Manager' | 'Cashier';
    businessId: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authorization token' });
  }
}

// -------------------------------------------------------------
// ROUTES: AUTHENTICATION
// -------------------------------------------------------------

// SIGN UP
router.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password, fullname, phone, role } = req.body;
  if (!email || !password || !fullname) {
    return res.status(400).json({ success: false, message: 'Email, password, and fullname are required' });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Create a new business tenant
    const businessId = 'b_tenant_' + Date.now();
    const businessName = `${fullname}'s Tuck Shop`;
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const bizRow = toBusinessRow({
      id: businessId,
      name: businessName,
      slug: slug,
      plan_tier: 'Free',
      subscription_status: 'Active',
      location: 'Soweto, Johannesburg',
    });
    await supabase.from('businesses').insert(bizRow);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userId = 'u_client_' + Date.now();
    const userRow = toUserRow({
      id: userId,
      fullname,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: role || 'Owner',
      businessId,
    });
    await supabase.from('users').insert(userRow);

    // Seed database for this tenant immediately
    await seedTenantData(businessId, businessName, 'Soweto, Johannesburg');

    // Create JWT
    const token = jwt.sign({
      userId,
      email: email.toLowerCase(),
      fullname,
      role: role || 'Owner',
      businessId
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account and isolated business tenant database provisioned successfully.',
      token,
      session: {
        fullname,
        email: email.toLowerCase(),
        phone: phone || '',
        role: role || 'Owner',
        businessId,
        isAuthenticated: true
      },
      business: { id: businessId, name: businessName, slug, plan_tier: 'Free', subscription_status: 'Active', location: 'Soweto, Johannesburg' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error during signup' });
  }
});

// SIGN IN
router.post('/auth/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!userRow) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, userRow.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { data: bizRow } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', userRow.business_id)
      .maybeSingle();

    // Create JWT
    const token = jwt.sign({
      userId: userRow.id,
      email: userRow.email,
      fullname: userRow.fullname,
      role: userRow.role,
      businessId: userRow.business_id
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      session: {
        fullname: userRow.fullname,
        email: userRow.email,
        phone: userRow.phone,
        role: userRow.role,
        businessId: userRow.business_id,
        isAuthenticated: true
      },
      business: fromBusinessRow(bizRow) || { id: userRow.business_id, name: 'Spaza Shop', location: 'South Africa', plan_tier: 'Free', subscription_status: 'Active' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error during signin' });
  }
});

// GET ME
router.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false });
    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('email', req.user.email)
      .maybeSingle();

    if (!userRow) return res.status(404).json({ success: false, message: 'User not found' });
    const { data: bizRow } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', userRow.business_id)
      .maybeSingle();

    res.json({
      success: true,
      session: {
        fullname: userRow.fullname,
        email: userRow.email,
        phone: userRow.phone,
        role: userRow.role,
        businessId: userRow.business_id,
        isAuthenticated: true
      },
      business: fromBusinessRow(bizRow) || { id: userRow.business_id, name: 'Spaza Shop', location: 'South Africa', plan_tier: 'Free', subscription_status: 'Active' }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// -------------------------------------------------------------
// ROUTES: MULTI-TENANCY BUSINESS LIST
// -------------------------------------------------------------
router.get('/businesses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: list } = await supabase.from('businesses').select('*');
    res.json({ success: true, data: (list || []).map(b => fromBusinessRow(b)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/businesses', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, location, plan_tier } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Business name is required' });

  try {
    const id = 'b_tenant_' + Date.now();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const bizRow = toBusinessRow({
      id,
      name,
      slug,
      plan_tier,
      location,
    });
    await supabase.from('businesses').insert(bizRow);

    // Seed this fresh tenant
    await seedTenantData(id, name, location || 'South Africa');

    // Update the current logged in user's active tenant
    if (req.user) {
      await supabase
        .from('users')
        .update({ business_id: id })
        .eq('email', req.user.email);
    }

    res.status(201).json({ success: true, data: fromBusinessRow(bizRow) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/businesses/tier', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  if (!tier || !req.user) return res.status(400).json({ success: false, message: 'Tier level required' });

  try {
    const { data: updated } = await supabase
      .from('businesses')
      .update({ plan_tier: tier })
      .eq('id', req.user.businessId)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromBusinessRow(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: PRODUCTS (INVENTORY CATALOG)
// -------------------------------------------------------------
router.get('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId);

    res.json({ success: true, data: (data || []).map(p => fromProductRow(p)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'p_' + Date.now();
    const row = toProductRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('products')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromProductRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const payload = req.body;

    const currentData = toProductRow({ ...payload, businessId, id });
    const { data } = await supabase
      .from('products')
      .update(currentData)
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!data) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: fromProductRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('business_id', businessId)
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: SALES (POS LEDGER)
// -------------------------------------------------------------
router.get('/sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('business_id', businessId);

    // Sort by timestamp or created_at descending in js for complete accuracy
    const list = (data || []).map(s => fromSaleRow(s)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sales', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 's_' + Date.now();
    const row = toSaleRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('sales')
      .insert(row)
      .select()
      .single();

    // Deduct inventory stock for sold items
    for (const item of payload.items) {
      const { data: currentProd } = await supabase
        .from('products')
        .select('stock')
        .eq('business_id', businessId)
        .eq('id', item.productId)
        .maybeSingle();

      if (currentProd) {
        const newStock = Math.max(0, Number(currentProd.stock || 0) - Number(item.quantity || 0));
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('business_id', businessId)
          .eq('id', item.productId);
      }
    }

    res.status(201).json({ success: true, data: fromSaleRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: EXPENSES
// -------------------------------------------------------------
router.get('/expenses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId);

    const list = (data || []).map(e => fromExpenseRow(e)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/expenses', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'e_' + Date.now();
    const row = toExpenseRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('expenses')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromExpenseRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: SUPPLIERS & WHOLESALE MARKETPLACE
// -------------------------------------------------------------
router.get('/suppliers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId);

    res.json({ success: true, data: (data || []).map(s => fromSupplierRow(s)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/suppliers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = 'sup_' + Date.now();
    const row = toSupplierRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('suppliers')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromSupplierRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/marketplace', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: SEED_MARKETPLACE });
});

// -------------------------------------------------------------
// ROUTES: SUPPLIER ORDERS
// -------------------------------------------------------------
router.get('/supplier-orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('business_id', businessId);

    const list = (data || []).map(o => fromSupplierOrderRow(o)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/supplier-orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'ord_saas_' + Date.now();
    const row = toSupplierOrderRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('purchase_orders')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromSupplierOrderRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/supplier-orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const payload = req.body;

    const row = toSupplierOrderRow({ ...payload, businessId, id });
    const { data } = await supabase
      .from('purchase_orders')
      .update(row)
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromSupplierOrderRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: CUSTOMER LOYALTY
// -------------------------------------------------------------
router.get('/loyalty', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId);

    res.json({ success: true, data: (data || []).map(c => fromCustomerRow(c)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/loyalty', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'l_' + Date.now();
    const row = toCustomerRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('customers')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromCustomerRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/loyalty/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const payload = req.body;

    const row = toCustomerRow({ ...payload, businessId, id });
    const { data } = await supabase
      .from('customers')
      .update(row)
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromCustomerRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: EMPLOYEES
// -------------------------------------------------------------
router.get('/employees', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId);

    res.json({ success: true, data: (data || []).map(e => fromEmployeeRow(e)) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/employees', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'emp_' + Date.now();
    const row = toEmployeeRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('employees')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromEmployeeRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/employees/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const payload = req.body;

    const row = toEmployeeRow({ ...payload, businessId, id });
    const { data } = await supabase
      .from('employees')
      .update(row)
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromEmployeeRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: COMMUNITY MARKETPLACE
// -------------------------------------------------------------
router.get('/community', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await supabase
      .from('community_marketplace')
      .select('*');

    const list = (data || []).map(c => fromCommunityRow(c)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/community', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body;
    const id = payload.id || 'c_' + Date.now();
    const row = toCommunityRow({
      ...payload,
      id,
    });
    const { data } = await supabase
      .from('community_marketplace')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromCommunityRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/community/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const row = toCommunityRow({ ...payload, id });
    const { data } = await supabase
      .from('community_marketplace')
      .update(row)
      .eq('id', id)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromCommunityRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: AUDIT LOGS
// -------------------------------------------------------------
router.get('/audit-logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('business_id', businessId);

    const list = (data || []).map(l => fromAuditLogRow(l)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/audit-logs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'a_' + Date.now();
    const row = toAuditLogRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('activity_logs')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromAuditLogRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: WEB NOTIFICATIONS
// -------------------------------------------------------------
router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessId);

    const list = (data || []).map(n => fromNotificationRow(n)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const payload = req.body;

    const id = payload.id || 'n_' + Date.now();
    const row = toNotificationRow({
      ...payload,
      id,
      businessId,
    });
    const { data } = await supabase
      .from('notifications')
      .insert(row)
      .select()
      .single();

    res.status(201).json({ success: true, data: fromNotificationRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;

    const { data } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle();

    res.json({ success: true, data: fromNotificationRow(data) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/mark-all-read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('business_id', businessId);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
