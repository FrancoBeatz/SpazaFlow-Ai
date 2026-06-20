import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// The perfect master SQL script requested for Supabase Database Design
export const SUPABASE_SQL_SCHEMA = `-- SPAZAFLOW AI SaaS - MASTER DATABASE DESIGN
-- Execute this SQL block inside your Supabase project's SQL Editor

-- 1. ENABLE EXTENSIONS (For UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TENANT BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  plan_tier TEXT DEFAULT 'Free', -- Free, Starter, Business, Enterprise
  subscription_status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb
);

-- 3. CREATE PROFILES TABLE (Linked to Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT,
  phone TEXT,
  email TEXT,
  current_business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'Owner', -- Owner, Manager, Cashier
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE EMPLOYEES TABLE (Staff belonging to a business)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Cashier', -- Manager, Cashier
  pin TEXT NOT NULL, -- Login pin (e.g. 1234)
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  barcode TEXT,
  category_name TEXT NOT NULL DEFAULT 'General',
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  expiry_date DATE,
  image_url TEXT,
  fast_selling BOOLEAN DEFAULT FALSE,
  slow_moving BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  points INT DEFAULT 0,
  card_code TEXT UNIQUE,
  referrals INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CREATE LOYALTY VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_value NUMERIC(10,2) DEFAULT 0.00,
  min_spend NUMERIC(10,2) DEFAULT 0.00,
  expiry_date DATE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  vat NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- Cash, Card, EFT, Mobile/WhatsApp, Loyalty
  paid_amount NUMERIC(10,2) NOT NULL,
  change_amount NUMERIC(10,2) NOT NULL,
  customer_phone TEXT,
  points_earned INT DEFAULT 0,
  cashier_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREATE SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

-- 11. CREATE EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Rent, Electricity, Water, Supplier Stock, Salaries, Transport, Other
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CREATE SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CREATE PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  items JSONB NOT NULL, -- list of {name, quantity, price}
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Shipped, Delivered
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- low_stock, sales, deliveries, employee_activity, security, subscription
  is_read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CREATE ACTIVITY LOGS TABLE (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID,
  user_fullname TEXT,
  action TEXT NOT NULL, -- login, logout, failed_login, product_create, stock_update, etc.
  details TEXT,
  page_visited TEXT,
  device_info TEXT,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 17. CREATE RLS POLICIES FOR MULTI-TENANCY CONTROL
-- Ensure users can only query/write data belonging to their associated business_id

CREATE POLICY select_business ON public.businesses
  FOR SELECT USING (id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

CREATE POLICY update_business ON public.businesses
  FOR UPDATE USING (id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Owner'));

CREATE POLICY select_profile ON public.profiles
  FOR SELECT USING (id = auth.uid() OR current_business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

CREATE POLICY update_profile ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Product RLS
CREATE POLICY product_isolation ON public.products
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Orders RLS
CREATE POLICY order_isolation ON public.purchase_orders
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Customers RLS
CREATE POLICY customer_isolation ON public.customers
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Sales RLS
CREATE POLICY sales_isolation ON public.sales
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Expenses RLS
CREATE POLICY expenses_isolation ON public.expenses
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Actitivy Logs RLS
CREATE POLICY activity_isolation ON public.activity_logs
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Notifications RLS
CREATE POLICY notifications_isolation ON public.notifications
  FOR ALL USING (business_id = (SELECT current_business_id FROM public.profiles WHERE profiles.id = auth.uid()));
`;
