-- SPAZAFLOW AI SaaS - MASTER DATABASE DESIGN
-- Execute this SQL block inside your Supabase project's SQL Editor

-- 1. ENABLE EXTENSIONS (For UUIDs if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TENANT BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_tier TEXT DEFAULT 'Free', -- Free, Starter, Business, Enterprise
  subscription_status TEXT DEFAULT 'Active',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 3. CREATE USERS TABLE (For Express-JWT JWT/Bcrypt authentication)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  fullname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Owner', -- Owner, Manager, Cashier
  business_id TEXT REFERENCES public.businesses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE EMPLOYEES TABLE (Staff belonging to a business)
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Cashier', -- Manager, Cashier
  pin TEXT NOT NULL, -- Login pin (e.g. 1234)
  status TEXT DEFAULT 'Active',
  attendance JSONB DEFAULT '[]'::jsonb,
  sales_completed INT DEFAULT 0,
  total_sales_value NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  barcode TEXT,
  category_name TEXT NOT NULL DEFAULT 'General',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  expiry_date TEXT,
  image_url TEXT,
  fast_selling BOOLEAN DEFAULT FALSE,
  slow_moving BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE INVENTORY (Stock adjustments & logs) TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_changed INT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL, -- 'Sale', 'Restock', 'Expiry', 'Damaged', 'Audit Adjustment'
  cashier_name TEXT,
  timestamp TEXT
);

-- 8. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  points INT DEFAULT 0,
  card_code TEXT,
  referrals INT DEFAULT 0,
  vouchers JSONB DEFAULT '[]'::jsonb,
  purchase_history_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  vat NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- Cash, Card, EFT, Mobile/WhatsApp, Loyalty
  paid_amount NUMERIC(10,2) NOT NULL,
  change_amount NUMERIC(10,2) NOT NULL,
  customer_phone TEXT,
  points_earned INT DEFAULT 0,
  cashier_name TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Rent, Electricity, Water, Supplier Stock, Salaries, Transport, Other
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CREATE SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CREATE PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  items JSONB NOT NULL, -- list of {name, quantity, price}
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Shipped, Delivered
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- low_stock, sales, deliveries, employee_activity, security, subscription
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CREATE ACTIVITY LOGS TABLE (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  timestamp TEXT,
  user_fullname TEXT,
  role TEXT,
  action TEXT NOT NULL, -- login, logout, failed_login, product_create, etc.
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CREATE COMMUNITY MARKETPLACE TABLE (Township-wide surplus stock trading)
CREATE TABLE IF NOT EXISTS public.community_marketplace (
  id TEXT PRIMARY KEY,
  owner_spaza_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  asking_price NUMERIC(10,2) NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'Available', -- 'Available', 'Accepted', 'Sold'
  description TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 16. INDEXES FOR HIGH-PERFORMANCE SEARCH & RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business ON public.employees(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON public.suppliers(business_id);


-- 17. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_marketplace ENABLE ROW LEVEL SECURITY;


-- 18. DEFINE LIBERAL RLS POLICIES FOR BACKEND AND CLIENT SYNCS
-- (When querying via the Service Role Key from Node.js Express, RLS is automatically bypassed anyway!)
CREATE POLICY allow_all_businesses ON public.businesses FOR ALL USING (true);
CREATE POLICY allow_all_users ON public.users FOR ALL USING (true);
CREATE POLICY allow_all_employees ON public.employees FOR ALL USING (true);
CREATE POLICY allow_all_products ON public.products FOR ALL USING (true);
CREATE POLICY allow_all_categories ON public.categories FOR ALL USING (true);
CREATE POLICY allow_all_inventory ON public.inventory FOR ALL USING (true);
CREATE POLICY allow_all_customers ON public.customers FOR ALL USING (true);
CREATE POLICY allow_all_sales ON public.sales FOR ALL USING (true);
CREATE POLICY allow_all_expenses ON public.expenses FOR ALL USING (true);
CREATE POLICY allow_all_suppliers ON public.suppliers FOR ALL USING (true);
CREATE POLICY allow_all_purchase_orders ON public.purchase_orders FOR ALL USING (true);
CREATE POLICY allow_all_notifications ON public.notifications FOR ALL USING (true);
CREATE POLICY allow_all_activity_logs ON public.activity_logs FOR ALL USING (true);
CREATE POLICY allow_all_community_marketplace ON public.community_marketplace FOR ALL USING (true);


-- 19. DATABASE FUNCTION FOR TRANSACTIONAL BULK UPDATE
CREATE OR REPLACE FUNCTION public.bulk_update_product_prices(updates_json jsonb, biz_id text)
RETURNS SETOF public.products AS $$
DECLARE
  update_record record;
BEGIN
  FOR update_record IN SELECT * FROM jsonb_to_recordset(updates_json) AS x(id text, cost_price numeric, selling_price numeric) LOOP
    UPDATE public.products
    SET cost_price = update_record.cost_price,
        selling_price = update_record.selling_price
    WHERE id = update_record.id AND business_id = biz_id;
  END LOOP;
  
  RETURN QUERY SELECT * FROM public.products WHERE business_id = biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

