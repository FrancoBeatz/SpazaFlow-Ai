import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
} from "./src/types";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom CORS Middleware to prevent iframe fetch/CORS blocks
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Business-Id");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Setup Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI Assistant will operate in simulation mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

const DB_FILE = path.join(process.cwd(), "spaza_db.json");

// Default South African Township Seed Data
const defaultDatabase = {
  products: [
    { id: "p1", name: "Tastic Rice 2kg", barcode: "6001001235123", category: "Staples", costPrice: 42.00, sellingPrice: 52.00, stock: 15, minStock: 8, expiryDate: "2027-04-12", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p2", name: "Iwisa Maize Meal 5kg", barcode: "6001122334455", category: "Staples", costPrice: 65.00, sellingPrice: 78.00, stock: 24, minStock: 10, expiryDate: "2026-12-05", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p3", name: "Albany White Bread 700g", barcode: "6002233445566", category: "Bakery", costPrice: 14.50, sellingPrice: 18.50, stock: 4, minStock: 10, expiryDate: "2026-06-23", fastSelling: true, slowMoving: false, imageUrl: "" }, // low stock
    { id: "p4", name: "Coca-Cola 2L", barcode: "5449000000996", category: "Beverages", costPrice: 19.00, sellingPrice: 24.50, stock: 35, minStock: 15, expiryDate: "2026-11-20", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p5", name: "Lucky Star Pilchards Tomato 400g", barcode: "6001111222233", category: "Canned Food", costPrice: 20.50, sellingPrice: 26.00, stock: 18, minStock: 8, expiryDate: "2028-08-30", fastSelling: false, slowMoving: false, imageUrl: "" },
    { id: "p6", name: "Sunlight Liquid Lemon 750ml", barcode: "6001024345222", category: "Household", costPrice: 28.00, sellingPrice: 36.00, stock: 6, minStock: 8, expiryDate: "2029-01-15", fastSelling: false, slowMoving: false, imageUrl: "" }, // low stock
    { id: "p7", name: "Selati White Sugar 2.5kg", barcode: "6002010101010", category: "Staples", costPrice: 48.00, sellingPrice: 58.00, stock: 12, minStock: 8, expiryDate: "2027-10-10", fastSelling: false, slowMoving: false, imageUrl: "" },
    { id: "p8", name: "Huletts SunSweet Brown Sugar 2kg", barcode: "6003010101010", category: "Staples", costPrice: 39.00, sellingPrice: 47.00, stock: 2, minStock: 8, expiryDate: "2027-09-18", fastSelling: false, slowMoving: true, imageUrl: "" }, // low stock + slow moving
    { id: "p9", name: "Simba Chutney Chips 120g", barcode: "6001234567890", category: "Snacks", costPrice: 13.00, sellingPrice: 17.50, stock: 30, minStock: 12, expiryDate: "2026-09-01", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p10", name: "Shield Men Roll-on 50ml", barcode: "6001087114455", category: "Personal Care", costPrice: 18.00, sellingPrice: 24.00, stock: 5, minStock: 6, expiryDate: "2028-02-14", fastSelling: false, slowMoving: true, imageUrl: "" }, // low stock
    { id: "p11", name: "Blue Label Marie Biscuits 200g", barcode: "6001052345678", category: "Snacks", costPrice: 12.00, sellingPrice: 16.00, stock: 20, minStock: 8, expiryDate: "2027-03-24", fastSelling: false, slowMoving: false, imageUrl: "" }
  ] as Product[],
  
  sales: [
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
  ] as Sale[],

  expenses: [
    { id: "e1", category: "Rent", amount: 2500.00, description: "June Container Rental Premise", timestamp: new Date(Date.now() - 10 * 24 * 3600000).toISOString() },
    { id: "e2", category: "Electricity", amount: 450.00, description: "Eskom Prepaid Token Top-up", timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
    { id: "e3", category: "Water", amount: 120.00, description: "Municipal water logistics", timestamp: new Date(Date.now() - 4 * 24 * 3600000).toISOString() },
    { id: "e4", category: "Transport", amount: 350.00, description: "Taxi hire/petrol for wholesalers collection", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() }
  ] as Expense[],

  suppliers: [
    { id: "sup1", name: "Soweto Cash & Carry Wholesalers", contactPerson: "Musa Ndlovu", phone: "011 933 4567", email: "info@sowetocc.co.za", category: "Bulk Foods & Staples", address: "348 Bara Boulevard, Soweto, JHB" },
    { id: "sup2", name: "SAB Bakers Co-op", contactPerson: "Le Roux van der Merwe", phone: "021 511 8899", email: "orders@sabbakers.co.za", category: "Bakery", address: "8 Epping Industrial Area, Cape Town" },
    { id: "sup3", name: "JHB Fresh Market Logistics", contactPerson: "Zanele Sisulu", phone: "011 888 1234", email: "zanele@jhbfresh.co.za", category: "Fresh Produce", address: "Heidelberg Road, City Deep, JHB" }
  ] as Supplier[],

  marketplaceProducts: [
    { id: "mp1", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Tastic Rice 10kg Bulk Pack", price: 180.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=300&auto=format&fit=crop", minOrderQty: 5 },
    { id: "mp2", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Iwisa Maize Meal 10kg Bulk", price: 110.00, category: "Staples", imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=300&auto=format&fit=crop", minOrderQty: 10 },
    { id: "mp3", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", name: "Coca-Cola 500ml Case (24 units)", price: 216.00, category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop", minOrderQty: 2 },
    { id: "mp4", supplierId: "sup2", supplierName: "SAB Bakers Co-op", name: "Albany Bread Tray (12 loaves)", price: 135.00, category: "Bakery", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300&auto=format&fit=crop", minOrderQty: 1 },
    { id: "mp5", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Fresh Potatoes 10kg Sack", price: 75.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 },
    { id: "mp6", supplierId: "sup3", supplierName: "JHB Fresh Market Logistics", name: "Brown Onions 10kg Sack", price: 65.00, category: "Fresh Produce", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=300&auto=format&fit=crop", minOrderQty: 3 }
  ] as MarketplaceProduct[],

  supplierOrders: [
    { id: "ord1", supplierId: "sup1", supplierName: "Soweto Cash & Carry Wholesalers", items: [{ name: "Tastic Rice 10kg Bulk Pack", quantity: 5, price: 180.00 }], total: 900.00, status: "Delivered", timestamp: new Date(Date.now() - 6 * 24 * 3600000).toISOString() },
    { id: "ord2", supplierId: "sup2", supplierName: "SAB Bakers Co-op", items: [{ name: "Albany Bread Tray (12 loaves)", quantity: 2, price: 135.00 }], total: 270.00, status: "Shipped", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() }
  ] as SupplierOrder[],

  loyalty: [
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
  ] as CustomerLoyalty[],

  employees: [
    { id: "emp1", name: "Sipho Khumalo", role: "Cashier", pin: "1234", status: "Active", attendance: [
      { date: new Date().toISOString().split('T')[0], clockIn: "07:58:12", clockOut: "17:05:00", state: "Present" }
    ], salesCompleted: 23, totalSalesValue: 3120.50 },
    { id: "emp2", name: "Thabo Shabalala", role: "Manager", pin: "0000", status: "Active", attendance: [
      { date: new Date().toISOString().split('T')[0], clockIn: "07:45:00", state: "Present" }
    ], salesCompleted: 12, totalSalesValue: 4890.00 }
  ] as Employee[],

  communityExchange: [
    { id: "c1", ownerSpazaName: "Lindi's Tuck Shop", ownerPhone: "0725556633", productName: "Coca-Cola 500ml Surplus Bottles", quantity: 18, askingPrice: 10.00, location: "Orlando West, Soweto", status: "Available", timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), description: "Got extra delivery error stocks, normal cost is R12, selling for R10 each. Bring boxes." },
    { id: "c2", ownerSpazaName: "Kasi Staples Basket", ownerPhone: "0847771234", productName: "Tastic Rice 10kg Sack", quantity: 3, askingPrice: 150.00, location: "Meadowlands Zone 4, Soweto", status: "Available", timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), description: "We ordered too much rice and need cash for rent. Brand new unopened sacks." }
  ] as CommunityMarketplaceItem[],

  auditLogs: [
    { id: "a1", timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), user: "Thabo Shabalala", role: "Manager", action: "Stock Adjustment", details: "Huletts Brown Sugar verified counting" },
    { id: "a2", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), user: "Sipho Khumalo", role: "Cashier", action: "Clock In", details: "Shift starter check-in at 07:58" }
  ] as AuditLog[],

  users: [
    { email: "thabo@spazaflow.co.za", password: "admin", fullname: "Thabo Shabalala", phone: "072 123 4567", role: "Owner", businessId: "b_soweto1" },
    { email: "owner@spaza.co.za", password: "admin", fullname: "Zama Buthelezi", phone: "082 999 4433", role: "Owner", businessId: "b_soweto1" }
  ] as any[],

  businesses: [
    { id: "b_soweto1", name: "Sizwe Kasi Tuck Shop", slug: "sizwe-kasi-soweto", plan_tier: "Business", subscription_status: "Active", location: "Orlando West, Soweto" },
    { id: "b_alexfresh", name: "Alexandra Staples Depot", slug: "alex-fresh-coop", plan_tier: "Starter", subscription_status: "Active", location: "Alexandra, JHB" },
    { id: "b_mplain", name: "Mitchells Plain Tuck Mart", slug: "mplain-mart", plan_tier: "Free", subscription_status: "Active", location: "Mitchells Plain, CT" }
  ] as any[]
};

let db: any = { ...defaultDatabase };

// Load database file helper
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
      if (!db.users) db.users = [...defaultDatabase.users];
      if (!db.businesses) db.businesses = [...defaultDatabase.businesses];
      console.log("Database successfully loaded from " + DB_FILE);
    } else {
      console.log("No existing database file found. Seeding new township database database...");
      saveDatabase();
    }
  } catch (error) {
    console.error("Error reading database file:", error);
    db = { ...defaultDatabase };
  }
}

// Save database file helper
function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Load initial database
loadDatabase();

// --- BACKEND API ROUTING ---

// Helper to extract active business id from request headers
const getBizId = (req: any) => {
  return (req.headers["x-business-id"] || "b_soweto1") as string;
};

// Authentication Endpoints
app.post("/api/auth/signup", (req, res) => {
  const { email, password, fullname, phone } = req.body;
  if (!email || !password || !fullname) {
    return res.status(400).json({ error: "Email, password, and Full Name are required." });
  }

  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "An account with this email address already exists." });
  }

  // Create isolated business tenant for this new merchant
  const businessName = `${fullname}'s Tuck Shop`;
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const businessId = "b_" + Date.now();

  const newBusiness = {
    id: businessId,
    name: businessName,
    slug: slug,
    plan_tier: "Free",
    subscription_status: "Active",
    location: "Soweto, Johannesburg"
  };

  const newUser = {
    email: email.toLowerCase(),
    password,
    fullname,
    phone: phone || "072 555 9911",
    role: "Owner",
    businessId: businessId
  };

  db.users.push(newUser);
  db.businesses.push(newBusiness);

  // Pre-seed baseline products for this new merchant so they don't start empty
  const defaultProducts = [
    { id: "p1_" + businessId, businessId, name: "Tastic Rice 2kg", barcode: "6001001235123", category: "Staples", costPrice: 42.00, sellingPrice: 52.00, stock: 15, minStock: 8, expiryDate: "2027-04-12", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p2_" + businessId, businessId, name: "Iwisa Maize Meal 5kg", barcode: "6001122334455", category: "Staples", costPrice: 65.00, sellingPrice: 78.00, stock: 24, minStock: 10, expiryDate: "2026-12-05", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p3_" + businessId, businessId, name: "Albany White Bread 700g", barcode: "6002233445566", category: "Bakery", costPrice: 14.50, sellingPrice: 18.50, stock: 4, minStock: 10, expiryDate: "2026-06-23", fastSelling: true, slowMoving: false, imageUrl: "" },
    { id: "p4_" + businessId, businessId, name: "Coca-Cola 2L", barcode: "5449000000996", category: "Beverages", costPrice: 19.00, sellingPrice: 24.50, stock: 35, minStock: 15, expiryDate: "2026-11-20", fastSelling: true, slowMoving: false, imageUrl: "" }
  ];
  db.products.push(...defaultProducts);

  // Log audit action
  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    user: fullname,
    role: "Owner",
    action: "Merchant Registered",
    details: `Signed up new business tenant: ${businessName}`
  });

  saveDatabase();

  return res.json({
    user: {
      fullname: newUser.fullname,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      businessId: newUser.businessId
    },
    business: newBusiness
  });
});

app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(400).json({ error: "Invalid email address or security password." });
  }

  const business = db.businesses.find((b: any) => b.id === user.businessId) || {
    id: user.businessId || "b_soweto1",
    name: `${user.fullname}'s Tuck Shop`,
    slug: "sizwe-kasi-soweto",
    plan_tier: "Business",
    subscription_status: "Active",
    location: "Soweto, Johannesburg"
  };

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    user: user.fullname,
    role: user.role,
    action: "User Sign In",
    details: `Logged into operations console for: ${business.name}`
  });

  saveDatabase();

  return res.json({
    user: {
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.businessId
    },
    business: business
  });
});

// Reset endpoint
app.post("/api/reset", (req, res) => {
  db = JSON.parse(JSON.stringify(defaultDatabase));
  saveDatabase();
  return res.json({ message: "Database reseeded back to standard Johannesburg township default state!" });
});

// Products: GET, POST
app.get("/api/products", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.products.filter((p: any) => p.businessId === bizId || !p.businessId);
  res.json(filtered);
});

app.post("/api/products", (req, res) => {
  const bizId = getBizId(req);
  const { id, name, barcode, category, costPrice, sellingPrice, stock, minStock, expiryDate, fastSelling, slowMoving } = req.body;
  
  if (!name || isNaN(costPrice) || isNaN(sellingPrice) || isNaN(stock)) {
    return res.status(400).json({ error: "Missing required core parameters or invalid types" });
  }

  const existingIndex = db.products.findIndex((p: any) => (p.id === id || (p.barcode && p.barcode === barcode)) && (p.businessId === bizId || !p.businessId));

  if (existingIndex > -1) {
    // Edit existing product
    db.products[existingIndex] = {
      ...db.products[existingIndex],
      name,
      barcode: barcode || db.products[existingIndex].barcode,
      category,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      minStock: Number(minStock || 5),
      expiryDate,
      fastSelling: !!fastSelling,
      slowMoving: !!slowMoving
    };
    
    // Add audit log
    db.auditLogs.unshift({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString(),
      businessId: bizId,
      user: "Current User",
      role: "Manager",
      action: "Product Updated",
      details: `Updated info for product: ${name}`
    });

    saveDatabase();
    return res.json(db.products[existingIndex]);
  } else {
    // Add new product
    const newProduct: any = {
      id: id || "p_" + Date.now(),
      businessId: bizId,
      name,
      barcode: barcode || "b_" + Date.now(),
      category: category || "Groceries",
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      minStock: Number(minStock || 5),
      expiryDate,
      fastSelling: !!fastSelling,
      slowMoving: !!slowMoving
    };

    db.products.push(newProduct);
    
    db.auditLogs.unshift({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString(),
      businessId: bizId,
      user: "Current User",
      role: "Manager",
      action: "Product Created",
      details: `Added new item to catalog: ${name}`
    });

    saveDatabase();
    return res.status(201).json(newProduct);
  }
});

// Delete Product
app.delete("/api/products/:id", (req, res) => {
  const bizId = getBizId(req);
  const productId = req.params.id;
  const productIndex = db.products.findIndex((p: any) => p.id === productId && (p.businessId === bizId || !p.businessId));

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const pName = db.products[productIndex].name;
  db.products.splice(productIndex, 1);

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    businessId: bizId,
    user: "Current User",
    role: "Manager",
    action: "Product Deleted",
    details: `Deleted product: ${pName}`
  });

  saveDatabase();
  res.json({ message: "Product deleted successfully" });
});

// Sales Routing
app.get("/api/sales", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.sales.filter((s: any) => s.businessId === bizId || !s.businessId);
  res.json(filtered);
});

app.post("/api/sales", (req, res) => {
  const bizId = getBizId(req);
  const { items, paymentMethod, paidAmount, customerPhone, cashierName } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: "No items present inside checkout cart." });
  }

  // Double check inventory and tally totals
  let subtotal = 0;
  const processedItems = items.map((cartItem: any) => {
    const originalProd = db.products.find((p: any) => p.id === cartItem.productId && (p.businessId === bizId || !p.businessId));
    const salePrice = cartItem.price || (originalProd?.sellingPrice || 0);
    const qty = Number(cartItem.quantity);
    const itemTotal = salePrice * qty;
    subtotal += itemTotal;

    // Deduct physical inventory
    if (originalProd) {
      originalProd.stock = Math.max(0, originalProd.stock - qty);
    }

    return {
      productId: cartItem.productId,
      productName: cartItem.productName || originalProd?.name || "Unknown item",
      price: salePrice,
      quantity: qty,
      total: itemTotal
    };
  });

  // South African VAT calculations (inclusive)
  const total = subtotal;
  const vat = Number((total - (total / 1.15)).toFixed(2));
  const roundedSubtotal = Number((total - vat).toFixed(2));
  
  const changeAmount = paymentMethod === "Cash" ? Math.max(0, Number(paidAmount) - total) : 0;

  // Handle Loyalty integration
  let pointsEarned = 0;
  let matchesLoyalty = null;
  if (customerPhone) {
    const formattedPhone = customerPhone.trim();
    const loyaltyUser = db.loyalty.find((l: any) => (l.phone === formattedPhone || l.phone.includes(formattedPhone)) && (l.businessId === bizId || !l.businessId));
    if (loyaltyUser) {
      // 1 point earned for every R10 spent in South Africa
      pointsEarned = Math.floor(total / 10);
      loyaltyUser.points += pointsEarned;
      loyaltyUser.purchaseHistoryCount += 1;
      matchesLoyalty = loyaltyUser;
    }
  }

  const newSale: any = {
    id: "s_" + Date.now(),
    businessId: bizId,
    items: processedItems,
    subtotal: roundedSubtotal,
    vat: vat,
    total: total,
    paymentMethod,
    paidAmount: paymentMethod === 'Cash' ? Number(paidAmount) : total,
    changeAmount: Number(changeAmount.toFixed(2)),
    timestamp: new Date().toISOString(),
    customerPhone: customerPhone || "",
    customerId: matchesLoyalty?.id || "",
    pointsEarned,
    cashierName: cashierName || "Sipho Khumalo"
  };

  db.sales.unshift(newSale);

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    businessId: bizId,
    user: cashierName || "Sipho Khumalo",
    role: "Cashier",
    action: "Recorded Sale",
    details: `Sale ${newSale.id} completed. Total: R${total.toFixed(2)} [${paymentMethod}]`
  });

  saveDatabase();
  res.status(201).json(newSale);
});

// Expenses Routing
app.get("/api/expenses", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.expenses.filter((e: any) => e.businessId === bizId || !e.businessId);
  res.json(filtered);
});

app.post("/api/expenses", (req, res) => {
  const bizId = getBizId(req);
  const { category, amount, description } = req.body;
  if (!category || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid dynamic expense body parameters." });
  }

  const newExpense: any = {
    id: "e_" + Date.now(),
    businessId: bizId,
    category,
    amount: Number(amount),
    description: description || "",
    timestamp: new Date().toISOString()
  };

  db.expenses.unshift(newExpense);

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    businessId: bizId,
    user: "Current User",
    role: "Manager",
    action: "Expense Added",
    details: `R${amount} logged under ${category}: ${description}`
  });

  saveDatabase();
  res.status(201).json(newExpense);
});

// Suppliers Portal
app.get("/api/suppliers", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.suppliers.filter((s: any) => s.businessId === bizId || !s.businessId);
  res.json(filtered);
});

app.post("/api/suppliers", (req, res) => {
  const bizId = getBizId(req);
  const { name, contactPerson, phone, email, category, address } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Supplier name is core parameter." });
  }

  const newSupplier: any = {
    id: "sup_" + Date.now(),
    businessId: bizId,
    name,
    contactPerson: contactPerson || "",
    phone: phone || "",
    email: email || "",
    category: category || "General Goods",
    address: address || ""
  };

  db.suppliers.push(newSupplier);
  saveDatabase();
  res.status(201).json(newSupplier);
});

// Suppliers Marketplace
app.get("/api/marketplace", (req, res) => {
  res.json(db.marketplaceProducts);
});

app.get("/api/supplier-orders", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.supplierOrders.filter((o: any) => o.businessId === bizId || !o.businessId);
  res.json(filtered);
});

app.post("/api/supplier-orders", (req, res) => {
  const bizId = getBizId(req);
  const { supplierId, supplierName, items, total } = req.body;
  if (!supplierId || !items || !items.length) {
    return res.status(400).json({ error: "Empty purchase items for marketplace bulk supplier order." });
  }

  const newOrder: any = {
    id: "ord_" + Date.now(),
    businessId: bizId,
    supplierId,
    supplierName,
    items,
    total: Number(total),
    status: 'Pending',
    timestamp: new Date().toISOString()
  };

  // Automatically log expense as "Supplier Stock" if it gets approved/delivered, but we log the PO first
  db.supplierOrders.unshift(newOrder);

  // Auto approve simulation immediately for easy UI interactions and stock replenishments
  setTimeout(() => {
    const orderInDb = db.supplierOrders.find((o: any) => o.id === newOrder.id);
    if (orderInDb) {
      orderInDb.status = 'Delivered';
      
      // Auto replenish stock on delivery!
      orderInDb.items.forEach((orderItem: any) => {
        // Find if we have a match in products
        const nameKeywords = orderItem.name.split(" ");
        const firstKeyword = nameKeywords[0];
        const match = db.products.find((p: any) => (p.name.toLowerCase().includes(firstKeyword.toLowerCase()) || orderItem.name.toLowerCase().includes(p.name.toLowerCase())) && (p.businessId === bizId || !p.businessId));
        if (match) {
          match.stock += orderItem.quantity;
        }
      });

      // Insert relative auto expense on delivery arrival
      db.expenses.unshift({
        id: "e_" + Date.now(),
        businessId: bizId,
        category: "Supplier Stock",
        amount: orderInDb.total,
        description: `Delivered Inventory PO: ${orderInDb.supplierName}`,
        timestamp: new Date().toISOString()
      });

      db.auditLogs.unshift({
        id: "a_" + Date.now(),
        timestamp: new Date().toISOString(),
        businessId: bizId,
        user: "System Wholesaler",
        role: "Supplier",
        action: "Order Delivered",
        details: `Order ${orderInDb.id} delivered automatically. Added items to stock shelf.`
      });

      saveDatabase();
    }
  }, 12000); // deliver in 12 seconds in front of user to trigger real-time notification alerts!

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    businessId: bizId,
    user: "Current User",
    role: "Manager",
    action: "Purchase Order Shared",
    details: `PO ${newOrder.id} dispatched to ${supplierName}. Pending approval.`
  });

  saveDatabase();
  res.status(201).json(newOrder);
});

// Loyalty Routing
app.get("/api/loyalty", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.loyalty.filter((l: any) => l.businessId === bizId || !l.businessId);
  res.json(filtered);
});

app.post("/api/loyalty", (req, res) => {
  const bizId = getBizId(req);
  const { name, phone, referrals } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing loyalty profile core factors." });
  }

  const formattedPhone = phone.trim();
  const alreadyExists = db.loyalty.find((l: any) => l.phone === formattedPhone && (l.businessId === bizId || !l.businessId));
  if (alreadyExists) {
    return res.status(400).json({ error: "Phone number already connected to a loyalty card!" });
  }

  const newLoyty: any = {
    id: "l_" + Date.now(),
    businessId: bizId,
    name,
    phone: formattedPhone,
    points: 10, // signup bonus R10 value/points
    cardCode: "SF-" + Math.floor(1000 + Math.random() * 9000),
    vouchers: [
      { id: "v_new_" + Date.now(), code: "KASISIGNUP", description: "R15 Welcome Gift Voucher", discountValue: 15.00, minSpend: 50.00, expiryDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0], isUsed: false }
    ],
    purchaseHistoryCount: 0,
    referrals: Number(referrals || 0)
  };

  db.loyalty.unshift(newLoyty);
  saveDatabase();
  res.status(201).json(newLoyty);
});

// Employee Logs
app.get("/api/employees", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.employees.filter((e: any) => e.businessId === bizId || !e.businessId);
  res.json(filtered);
});

app.post("/api/employees/attendance", (req, res) => {
  const bizId = getBizId(req);
  const { employeeId, isClockIn } = req.body;
  const emp = db.employees.find((e: any) => e.id === employeeId && (e.businessId === bizId || !e.businessId));
  if (!emp) {
    return res.status(404).json({ error: "Employee account not registered." });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const rightNowStr = new Date().toTimeString().split(' ')[0];

  if (isClockIn) {
    // Check if clocked in today
    if (!emp.attendance) emp.attendance = [];
    const alreadyClocked = emp.attendance.find((a: any) => a.date === todayStr);
    if (alreadyClocked) {
      return res.status(400).json({ error: "Employee already clock-in today!" });
    }

    const state = rightNowStr > "08:15:00" ? "Late" : "Present";
    emp.attendance.push({
      date: todayStr,
      clockIn: rightNowStr,
      state
    });
    
    db.auditLogs.unshift({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString(),
      businessId: bizId,
      user: emp.name,
      role: emp.role,
      action: "Attendance Check-In",
      details: `Clocked in at ${rightNowStr} - status: ${state}`
    });
  } else {
    // Clock-out
    if (!emp.attendance) emp.attendance = [];
    const activeAtt = emp.attendance.find((a: any) => a.date === todayStr);
    if (!activeAtt) {
      return res.status(400).json({ error: "No clock-in shift found for today!" });
    }
    activeAtt.clockOut = rightNowStr;

    db.auditLogs.unshift({
      id: "a_" + Date.now(),
      timestamp: new Date().toISOString(),
      businessId: bizId,
      user: emp.name,
      role: emp.role,
      action: "Attendance Check-Out",
      details: `Shift completed. Clocked out at ${rightNowStr}`
    });
  }

  saveDatabase();
  res.json(emp);
});

// Community Interchange Trade List
app.get("/api/community", (req, res) => {
  res.json(db.communityExchange);
});

app.post("/api/community", (req, res) => {
  const bizId = getBizId(req);
  const { spazaName, phone, productName, quantity, askingPrice, location, description } = req.body;
  if (!productName || isNaN(quantity) || isNaN(askingPrice)) {
    return res.status(400).json({ error: "Trade items need product, quantity, asking price parameters." });
  }

  const exchangeItem: any = {
    id: "c_" + Date.now(),
    businessId: bizId,
    ownerSpazaName: spazaName || "Unnamed Spaza",
    ownerPhone: phone || "0720001122",
    productName,
    quantity: Number(quantity),
    askingPrice: Number(askingPrice),
    location: location || "Soweto, Gauteng",
    status: 'Available',
    timestamp: new Date().toISOString(),
    description: description || ""
  };

  db.communityExchange.unshift(exchangeItem);
  saveDatabase();
  res.status(201).json(exchangeItem);
});

app.post("/api/community/accept/:id", (req, res) => {
  const bizId = getBizId(req);
  const itemId = req.params.id;
  const item = db.communityExchange.find((i: any) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: "Listing id incorrect." });
  }

  item.status = "Accepted";

  db.auditLogs.unshift({
    id: "a_" + Date.now(),
    timestamp: new Date().toISOString(),
    businessId: bizId,
    user: "Current User",
    role: "Manager",
    action: "Kasi Exchange Accepted",
    details: `Agreed to trade of surplus: ${item.productName} with ${item.ownerSpazaName}`
  });

  saveDatabase();
  res.json(item);
});

// Audit Logs Route
app.get("/api/audit", (req, res) => {
  const bizId = getBizId(req);
  const filtered = db.auditLogs.filter((l: any) => l.businessId === bizId || !l.businessId);
  res.json(filtered);
});

// Dynamic Business health calculator
app.get("/api/health-score", (req, res) => {
  try {
    const bizId = getBizId(req);
    const todayStr = new Date().toISOString().split('T')[0];
    const salesArr = (db.sales || []).filter((s: any) => s.businessId === bizId || !s.businessId);
    const productsArr = (db.products || []).filter((p: any) => p.businessId === bizId || !p.businessId);

    const todaySales = salesArr.filter(s => s && s.timestamp && typeof s.timestamp === 'string' && s.timestamp.startsWith(todayStr));
    const revenueToday = todaySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    const lowStockCount = productsArr.filter(p => p && Number(p.stock || 0) <= Number(p.minStock || 5)).length;
    
    // Expiring in next 60 days
    const sixtyDaysTime = Date.now() + (60 * 24 * 3600000);
    const expiringSoonCount = productsArr.filter(p => p && p.expiryDate && new Date(p.expiryDate).getTime() < sixtyDaysTime).length;

    let totalCost = 0;
    let totalSellValue = 0;
    productsArr.forEach(p => {
      if (p) {
        totalCost += (Number(p.costPrice) || 0) * (Number(p.stock) || 0);
        totalSellValue += (Number(p.sellingPrice) || 0) * (Number(p.stock) || 0);
      }
    });

    const profitMargin = totalSellValue > 0 ? ((totalSellValue - totalCost) / totalSellValue) * 100 : 0;

    // Compute standard township score (0-100)
    let scoreValue = 85; 
    if (lowStockCount > 3) scoreValue -= 15;
    if (expiringSoonCount > 2) scoreValue -= 10;
    if (profitMargin < 15) scoreValue -= 20;

    let score: 'Excellent' | 'Good' | 'Warning' | 'Critical' = 'Good';
    if (scoreValue >= 85) score = 'Excellent';
    else if (scoreValue >= 65) score = 'Good';
    else if (scoreValue >= 40) score = 'Warning';
    else score = 'Critical';

    const healthPayload: BusinessHealth = {
      score,
      scoreValue,
      lowStockCount,
      expiringSoonCount,
      revenueToday: Number(revenueToday.toFixed(2)),
      transactionsToday: todaySales.length,
      profitMargin: Number(profitMargin.toFixed(2))
    };

    res.json(healthPayload);
  } catch (err) {
    console.error("Error in health-score calculation:", err);
    res.status(500).json({ error: "Internal Server Error in health-score" });
  }
});


// --- GEMINI BUSINESS ASSISTANT ENDPOINT ---
app.post("/api/gemini/assistant", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Search request prompt is missing" });
  }

  // Generate ground truth business statistics summaries so the model resides in absolute sync with actual state
  const totalRevenue = db.sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = db.expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const numProducts = db.products.length;
  const lowStockProducts = db.products.filter(p => p.stock <= p.minStock).map(p => `${p.name} (stock: ${p.stock}, min: ${p.minStock})`);
  const expiringProducts = db.products.filter(p => p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + 60*24*3600000).map(p => `${p.name} (expiry: ${p.expiryDate})`);
  
  // Fast and slow moving products
  const fastItems = db.products.filter(p => p.fastSelling).map(p => p.name);
  const slowItems = db.products.filter(p => p.slowMoving).map(p => p.name);

  // Compute relative metrics
  const productPerformance = db.products.map(p => {
    // how much sold
    let totalQty = 0;
    db.sales.forEach(s => {
      s.items.forEach(it => {
        if (it.productId === p.id) totalQty += it.quantity;
      });
    });
    return { name: p.name, unitsSold: totalQty, revenue: totalQty * p.sellingPrice };
  }).sort((a,b) => b.unitsSold - a.unitsSold);

  // Compare supplier pricing options
  const cheapestStapleOptions = [
    "Tastic Rice 2kg: Spaza shelf is R52. Wholesaler Soweto Bulk selling 10kg pack for R180 (equivalent to R36 per 2kg - big profitable margin increase!)",
    "Iwisa Maize Meal 5kg: Spaza shelf is R78. Wholesaler Soweto Bulk selling 10kg bulk for R110 (equivalent to R55 per 5kg - saving of R10 per bag)"
  ];

  const businessReportDump = `
========= GROUND TRUTH LIVE BUSINESS STATS =========
- Core Business Name: SpazaFlow AI Core Shop
- Total Lifetime App Revenue Tracked: R${totalRevenue.toFixed(2)}
- Total Lifetime App Expenses Tracked: R${totalExpenses.toFixed(2)}
- Projected Net Cumulative Profit: R${netProfit.toFixed(2)}
- Registered Products catalog size: ${numProducts}
- Low Stock Alerts active [CRITICAL RESTOCK RECOMMENDED]:
  ${lowStockProducts.length ? lowStockProducts.join(", ") : "None. All stocked!"}
- Products Expiring soon:
  ${expiringProducts.length ? expiringProducts.join(", ") : "None. Fresh!"}
- Fast Selling Products: ${fastItems.join(", ")}
- Slow Moving Products: ${slowItems.join(", ")}
- Sales leaderboard rankings:
  ${productPerformance.slice(0, 5).map(p => `- ${p.name}: ${p.unitsSold} units, R${p.revenue.toFixed(2)} revenue`).join("\n  ")}
- Cheaper Wholesale price comparison opportunities:
  ${cheapestStapleOptions.join("\n  ")}
=============================================
`;

  const systemPrompt = `You are SpazaFlow AI Assistant, the ultimate smart cashier, inventory advisor, and financial growth commander designed for small township tuck shops ("spaza shops") in South Africa (Soweto, Alexandra, Mitchells Plain, Khayelitsha, Tembisa, etc.).

Your personality:
- Extremely friendly, supportive, business-smart, and deeply helpful.
- Infuse your text with a warm, professional South African flavor. You may occasionally use common respectful, positive gestures and township terms like "Aweh", "My Leader", "Chief", "Heita", "Chomi", "Sharp sharp", "Rands", "Kasi" or "Spaza" in a professional, tasteful manner.
- Do not explain code, file structures, or technical web elements. Focus 100% on inventory advice, supplier comparisons, pricing, bookkeeping, sales forecast predictions, promotion writing, or business advice.

Ground truth business figures are provided below. Refer to them as absolute truth values when answering questions. If the user asks about calculations, do the math elegantly based on these data:
${businessReportDump}

If the user asks you to:
1. "Which products sell the most?" -> Show them the sales leaderboard rankings.
2. "What should I restock?" or "Predict shortages" -> Point out the active Low Stock products, fast-selling items, and recommend purchasing the wholesale bulk equivalent (e.g. recommend ordering Tastic Rice 10kg Bulk Pack or Albany Bread Drawer Tray in the Marketplace).
3. "Generate promotional material", "WhatsApp advertising", "SMS", "Voucher advertisement" -> Generate a highly energetic, localized South African WhatsApp flyer copy, with emojis, price specials, and call-to-actions.
4. "How much profit?" -> Give them the exact Rands value.
5. "Predict next month's sales" -> Assume a robust 12% growth due to the loyalty program attraction and winter seasonal staples moving, estimate figures constructively based on current weekly sales trends.

Keep your response in elegant markdown formatting. Avoid being overly verbose, keep it punchy and clear.`;

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Offline Simulated AI Mode for visual integrity when API key is missing
      console.log("No Gemini API key available. Generating local mock response...");
      const simulatedResponse = simulateAIResponse(prompt, businessReportDump);
      return res.json({ text: simulatedResponse });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const outputText = response.text || "Aweh! It seems I couldn't formulate a message right now. Let's try again in a bit!";
    return res.json({ text: outputText });

  } catch (error: any) {
    console.error("Gemini Assistant Route error:", error);
    return res.status(500).json({ error: error.message || "Failed to process search query through Gemini." });
  }
});

// Mock simulation of AI response if API key is not present
function simulateAIResponse(prompt: string, report: string) {
  const p = prompt.toLowerCase();
  
  if (p.includes("sell") || p.includes("top") || p.includes("best") || p.includes("most")) {
    return `### 🏆 SpazaFlow Best Seller Report
Aweh, Chief! Here are your top performing items based on modern Kasi demand:

1. **Coca-Cola 2L**: Moving fast (6 units sold, R147.00 revenue). It's a goldmine during weekends!
2. **Iwisa Maize Meal 5kg**: High consistent volume.
3. **Albany White Bread**: High frequency, but stock sits at **4 loaves** which is dangerously low.

*Growers Tip: Bundle chips with soft drinks for any loyalty buyers to boost invoice size!*`;
  }
  
  if (p.includes("restock") || p.includes("stock") || p.includes("shortage") || p.includes("buy")) {
    return `### 🚨 Urgent Inventory & replenishment Advisor
Heita, my leader! Looking at your current spaza shelves, you should prioritize these:

1. **Huletts SunSweet Brown Sugar**: Stock is down to **2 units** (Critical standard is 8). Slow-moving but crucial staple.
2. **Albany White Bread 700g**: You have only **4 loaves left**. Bread sells daily! Order a *Bread Tray (12 loaves)* from SAB Bakers Co-op in the supplier marketplace right away.
3. **Sunlight Liquid Lemon**: Currently at **6 bottles**.

**💡 Wholesaler Deal Opportunity:**
Our wholesale comparison system shows **Tastic Rice 10kg** is selling for **R180.00** at Metro Soweto. Standard R52 per 2kg means your profit margins will rise by 15% if you replenish through Metro marketplace!`;
  }

  if (p.includes("whatsapp") || p.includes("promo") || p.includes("advert") || p.includes("market")) {
    return `### 📱 Custom WhatsApp Kasi Special Flyer
Copy and paste this into your community WhatsApp status to bring clients running:

---
🔥 **LINDAS TUCK SHOP WEEKEND SUPER SPARK SPECIALS!** 🔥
Aweh, our beloved neighbors! Check out these insane deals to cover your family table:

🍚 **Tastic Rice 2kg** ➔ ONLY **R52.00**
🌽 **Iwisa Maize Meal 5kg** ➔ ONLY **R78.00**
🍞 **Fresh Albany White Bread** ➔ ONLY **R18.50**
🥤 **Ice Cold Coca-Cola 2L** ➔ ONLY **R24.50**

✨ *Earn Loyalty Points on every purchase! Tap your phone card with Sipho at checkout to get discount vouchers.*
📍 Location: Orlando West, Soweto
📞 Send a WhatsApp to order for walk-by pickup: 0725556633
---`;
  }

  if (p.includes("profit") || p.includes("money") || p.includes("revenue") || p.includes("expenses")) {
    return `### 📊 Spaza Monthly Bookkeeping & Profit report
Here is where your business stands, my Leader:

- **Total Lifetime Revenue**: R383.00
- **Total Expenses Logged**: R3420.00 (Rent R2500, Eskom R450, Municipal R120)
- **Net Standing cash**: R-3037.00
- **Valuation on Shelf Goods**: R2,504.00

*Advisor Note: Your gross profit margin is a healthy **23%**. Rent takes up a high percentage of expenses. Consider inviting a local supplier box or fruit vendor block to subrent the tuck shop frontage coordinates for an extra R500 a month.*`;
  }

  return `### 🌟 SpazaFlow AI Township Companion
Aweh, Chief! I am your SpazaFlow assistant. I can help you:
- Find **which products sell the most** during taxi rank peak hours.
- Predict **what inventory to restock** or stock alerts.
- Tally your **profits, revenues, and expenses**.
- Write **catchy WhatsApp promotional ads** filled with township pride.

What can I report for you today, my Leader?`;
}


// Setup Vite Dev server or Production dist server middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware HMR...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files safely
    app.use(express.static(distPath));
    
    // Explicit static rule for assets folder if it exists
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`SpazaFlow AI Platform successfully running!`);
    console.log(`Ingress routed at: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer();
