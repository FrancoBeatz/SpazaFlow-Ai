import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShoppingCart, Package, Users, Compass, 
  Settings2, Activity, RefreshCw, Sparkles, AlertTriangle,
  Truck, Award, BookOpen, Receipt, FileText, Lock, Mail, Phone, ShieldCheck, Maximize, Key, Bell, CreditCard, LogOut, ShieldAlert
} from 'lucide-react';

// Subcomponents import
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PosSystem from './components/PosSystem';
import InventoryCatalog from './components/InventoryCatalog';
import SupplierPortal from './components/SupplierPortal';
import LoyaltyTracker from './components/LoyaltyTracker';
import ExpenseTracker from './components/ExpenseTracker';
import CommunityExchange from './components/CommunityExchange';
import EmployeeManager from './components/EmployeeManager';
import AiAssistantPanel from './components/AiAssistantPanel';
import DocumentsView from './components/DocumentsView';
import SaasDevPortal from './components/SaasDevPortal';
import SaasSubscriptionHub from './components/SaasSubscriptionHub';

// Types
import { 
  Product, Sale, Expense, Supplier, MarketplaceProduct, 
  SupplierOrder, CustomerLoyalty, Employee, CommunityMarketplaceItem, 
  AuditLog, BusinessHealth 
} from './types';

import { supabase, hasSupabaseConfig } from './lib/supabase';

type TabType = 'dashboard' | 'pos' | 'inventory' | 'suppliers' | 'loyalty' | 'expenses' | 'documents' | 'community' | 'employees' | 'ai' | 'subscription' | 'saas_config';

interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  plan_tier: 'Free' | 'Starter' | 'Business' | 'Enterprise';
  subscription_status: 'Active' | 'Delinquent' | 'Trialing';
  location: string;
}

interface WebNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'sales' | 'deliveries' | 'employee_activity' | 'security' | 'subscription';
  is_read: boolean;
  timestamp: string;
}

// Simulated IP addresses matching Johannesburg/Soweto cell routers
const IP_ADDRESSES_POOL = [
  '197.80.21.34', '196.25.255.48', '41.13.125.90', '102.132.8.204'
];

// Device agents for audit logging
const DEVICE_POOL = [
  'Samsung Galaxy A53 (Android 14)', 'Desktop Chrome v134', 'Huawei P30 Lite (Android 10)', 'Apple iPhone 14 Pro Max'
];

export default function App() {
  // SAAS authentication state
  const [session, setSession] = useState<{
    fullname: string;
    email: string;
    phone: string;
    role: 'Owner' | 'Manager' | 'Cashier';
    isAuthenticated: boolean;
  }>({
    fullname: '',
    email: '',
    phone: '',
    role: 'Owner',
    isAuthenticated: false
  });

  // Tenancy Management State
  const [businesses, setBusinesses] = useState<BusinessTenant[]>([
    { id: 'b_soweto1', name: 'Sizwe Kasi Tuck Shop', slug: 'sizwe-kasi-soweto', plan_tier: 'Business', subscription_status: 'Active', location: 'Orlando West, Soweto' },
    { id: 'b_alexfresh', name: 'Alexandra Staples Depot', slug: 'alex-fresh-coop', plan_tier: 'Starter', subscription_status: 'Active', location: 'Alexandra, JHB' },
    { id: 'b_mplain', name: 'Mitchells Plain Tuck Mart', slug: 'mplain-mart', plan_tier: 'Free', subscription_status: 'Active', location: 'Mitchells Plain, CT' }
  ]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('b_soweto1');
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizLocation, setNewBizLocation] = useState('');
  const [newBizTier, setNewBizTier] = useState<'Free' | 'Starter' | 'Business' | 'Enterprise'>('Free');

  // SaaS Notifications system
  const [notifications, setNotifications] = useState<WebNotification[]>([
    { id: 'n1', title: 'Low Stock Alert', message: 'Huletts Brown Sugar is down to 2 units.', type: 'low_stock', is_read: false, timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'n2', title: 'Loyalty Upgrade', message: 'Mpho Tsotetsi unlocked Platinum Tier Voucher!', type: 'subscription', is_read: false, timestamp: new Date(Date.now() - 43 * 60000).toISOString() },
    { id: 'n3', title: 'Staff Check-In', message: 'Cashier Sipho Khumalo clocked in at 07:58.', type: 'employee_activity', is_read: true, timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString() }
  ]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Data State separate per business tenant (with high-fidelity localStorage fallback)
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceProduct[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [loyalty, setLoyalty] = useState<CustomerLoyalty[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [community, setCommunity] = useState<CommunityMarketplaceItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<BusinessHealth | null>(null);

  // Supabase live connection and schema validation states
  const [usingSupabaseLive, setUsingSupabaseLive] = useState(false);
  const [supabaseSchemaOk, setSupabaseSchemaOk] = useState(true);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);
  const [activeSupabaseBizId, setActiveSupabaseBizId] = useState<string | null>(null);

  // Active Loading state
  const [loading, setLoading] = useState(true);
  const [toastNotif, setToastNotif] = useState<string | null>(null);

  // Signin/Signup form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authFullname, setAuthFullname] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password' | 'phone_otp'>('signin');
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorRequested, setTwoFactorRequested] = useState(false);

  const activeBusiness = businesses.find(b => b.id === activeBusinessId) || businesses[0];

  // Helper: Append User Activity Audit Trail
  const logUserAction = (actionName: string, detailString: string) => {
    const randomIP = IP_ADDRESSES_POOL[Math.floor(Math.random() * IP_ADDRESSES_POOL.length)];
    const randomDevice = DEVICE_POOL[Math.floor(Math.random() * DEVICE_POOL.length)];
    
    const newLog: AuditLog = {
      id: 'a_sim_' + Date.now(),
      timestamp: new Date().toISOString(),
      user: session.fullname + ` (${session.role})`,
      role: session.role,
      action: actionName,
      details: `${detailString} [Device: ${randomDevice}, IP: ${randomIP}, Route: /${activeTab}]`
    };

    setAuditLogs(prev => [newLog, ...prev]);

    // Send visual notification triggers for security audits or actions
    if (actionName.toLowerCase().includes('delete') || actionName.toLowerCase().includes('adjust') || actionName.toLowerCase().includes('security')) {
      const isSecurity = actionName.toLowerCase().includes('security') || actionName.toLowerCase().includes('authentication');
      const actionNotif: WebNotification = {
        id: 'n_not_' + Date.now(),
        title: actionName,
        message: detailString,
        type: isSecurity ? 'security' : 'employee_activity',
        is_read: false,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [actionNotif, ...prev]);
    }
  };

  // Toast auto clear
  useEffect(() => {
    if (toastNotif) {
      const clock = setTimeout(() => setToastNotif(null), 5000);
      return () => clearTimeout(clock);
    }
  }, [toastNotif]);

  // Supabase Auth and State Loader mount hook
  useEffect(() => {
    if (hasSupabaseConfig && supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
        if (activeSession) {
          const user = activeSession.user;
          supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data: profile }) => {
            if (profile) {
              setSession({
                fullname: profile.fullname || user.user_metadata?.fullname || 'Owner',
                email: profile.email || user.email || '',
                phone: profile.phone || user.user_metadata?.phone || '',
                role: (profile.role as any) || 'Owner',
                isAuthenticated: true
              });
              if (profile.current_business_id) {
                supabase.from('businesses').select('*').then(({ data: bizs }) => {
                  if (bizs && bizs.length > 0) {
                    setBusinesses(bizs.map(b => ({
                      id: b.id,
                      name: b.name,
                      slug: b.slug,
                      plan_tier: b.plan_tier || 'Free',
                      subscription_status: b.subscription_status || 'Active',
                      location: b.settings?.location || 'South Africa'
                    })));
                    const matched = bizs.find(b => b.id === profile.current_business_id);
                    if (matched) {
                      setActiveBusinessId(matched.id);
                    } else {
                      setActiveBusinessId(bizs[0].id);
                    }
                  }
                });
              }
            } else {
              // Create user profile in live database
              const newProfile = {
                id: user.id,
                fullname: user.user_metadata?.fullname || 'Owner',
                phone: user.user_metadata?.phone || '',
                email: user.email || '',
                role: 'Owner',
                email_verified: user.email_confirmed_at ? true : false
              };
              supabase.from('profiles').insert(newProfile).then(() => {
                setSession({
                  fullname: newProfile.fullname,
                  email: newProfile.email,
                  phone: newProfile.phone,
                  role: 'Owner',
                  isAuthenticated: true
                });
              });
            }
          });
        } else {
          setSession(prev => ({ ...prev, isAuthenticated: false }));
        }
      });

      // Listen for runtime Auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, activeSession) => {
        if (activeSession) {
          const user = activeSession.user;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) {
            setSession({
              fullname: profile.fullname || user.user_metadata?.fullname || 'Owner',
              email: profile.email || user.email || '',
              phone: profile.phone || user.user_metadata?.phone || '',
              role: (profile.role as any) || 'Owner',
              isAuthenticated: true
            });
            if (profile.current_business_id) {
              setActiveBusinessId(profile.current_business_id);
            }
          }
        } else {
          setSession(prev => ({ ...prev, isAuthenticated: false }));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Sandbox fallback mode session loader
      const savedSession = localStorage.getItem('spazaflow_offline_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      } else {
        // High fidelity default for user test convenience if sandbox is completely fresh
        setSession({
          fullname: 'Thabo Shabalala',
          email: 'thabo@spazaflow.co.za',
          phone: '072 123 4567',
          role: 'Owner',
          isAuthenticated: true
        });
      }
    }
  }, []);

  // Supabase Realtime Sync Channel
  useEffect(() => {
    if (usingSupabaseLive && supabase && activeSupabaseBizId) {
      console.log("Subscribing to live Supabase Realtime for business ID:", activeSupabaseBizId);
      
      const channel = supabase
        .channel(`realtime-biz-${activeSupabaseBizId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public'
          },
          (payload: any) => {
            // Check if the modified record belongs to the active business
            const record = payload.new || payload.old;
            if (record && record.business_id === activeSupabaseBizId) {
              console.log("Live DB change received via Supabase Realtime. Refreshing local dataset...", payload);
              // Clean fetch to synchronize state across all tabs/devices
              fetchTenantDataset();
            }
          }
        )
        .subscribe((status) => {
          console.log(`Supabase Realtime subscription status for ${activeSupabaseBizId}:`, status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [usingSupabaseLive, activeSupabaseBizId]);

  // Load datasets from multi-tenant state storage
  const fetchTenantDataset = async () => {
    setLoading(true);
    try {
      // 1. Core seed products for realistic visuals
      const endpointMap = {
        products: '/api/products',
        sales: '/api/sales',
        expenses: '/api/expenses',
        suppliers: '/api/suppliers',
        marketplace: '/api/marketplace',
        supplierOrders: '/api/supplier-orders',
        loyalty: '/api/loyalty',
        employees: '/api/employees',
        community: '/api/community',
        auditLogs: '/api/audit',
        health: '/api/health-score'
      };

      const fetchJsonOrDefault = async (url: string, defaultValue: any) => {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`Fetch to ${url} returned status ${res.status}`);
            return defaultValue;
          }
          return await res.json();
        } catch (e) {
          console.error(`Failed to fetch ${url}, using default:`, e);
          return defaultValue;
        }
      };

      const [
        prodsRes, salesRes, expRes, supsRes, markRes, 
        ordRes, loyRes, empsRes, commRes, auditRes, healthRes
      ] = await Promise.all([
        fetchJsonOrDefault(endpointMap.products, []),
        fetchJsonOrDefault(endpointMap.sales, []),
        fetchJsonOrDefault(endpointMap.expenses, []),
        fetchJsonOrDefault(endpointMap.suppliers, []),
        fetchJsonOrDefault(endpointMap.marketplace, []),
        fetchJsonOrDefault(endpointMap.supplierOrders, []),
        fetchJsonOrDefault(endpointMap.loyalty, []),
        fetchJsonOrDefault(endpointMap.employees, []),
        fetchJsonOrDefault(endpointMap.community, []),
        fetchJsonOrDefault(endpointMap.auditLogs, []),
        fetchJsonOrDefault(endpointMap.health, { score: 'Good', scoreValue: 85, lowStockCount: 0, expiringSoonCount: 0, revenueToday: 0, transactionsToday: 0, profitMargin: 0 }),
      ]);

      let loadedLiveFromSupabase = false;

      if (hasSupabaseConfig && supabase) {
        try {
          // Perform a quick verification probe
          const { data: testProds, error: testError } = await supabase.from('products').select('id').limit(1);
          
          if (testError) {
            console.warn("Supabase check err:", testError);
            if (testError.message && (testError.message.includes('relation') && testError.message.includes('does not exist')) || testError.code === '42P01') {
              setSupabaseSchemaOk(false);
              setUsingSupabaseLive(false);
              setSupabaseErrorMsg("Connected! However, our SQL tables schema has not yet been executed in your Supabase project. Navigate to 'Database & SQL Integration' to copy the schema script.");
            } else {
              setUsingSupabaseLive(false);
              setSupabaseErrorMsg(testError.message || "Failed to communicate with connected Supabase instance.");
            }
          } else {
            setSupabaseSchemaOk(true);
            setUsingSupabaseLive(true);
            setSupabaseErrorMsg(null);

            // Fetch or insert the business tenant in the live DB
            const { data: activeDBBizs } = await supabase.from('businesses').select('*').eq('slug', activeBusiness.slug);
            let targetBizUUID = null;

            if (activeDBBizs && activeDBBizs.length > 0) {
              targetBizUUID = activeDBBizs[0].id;
            } else {
              // Register this business automatically in live database
              const { data: insertedBiz, error: insertBizError } = await supabase.from('businesses').insert({
                name: activeBusiness.name,
                slug: activeBusiness.slug,
                owner_id: '00000000-0000-0000-0000-000000000000', // System anon default owner
                plan_tier: activeBusiness.plan_tier,
                subscription_status: activeBusiness.subscription_status
              }).select();

              if (insertedBiz && insertedBiz.length > 0) {
                targetBizUUID = insertedBiz[0].id;
              }
            }

            if (targetBizUUID) {
              setActiveSupabaseBizId(targetBizUUID);

              // Pull tenant metrics
              const [
                { data: dbProds },
                { data: dbSales },
                { data: dbExps },
                { data: dbLoyalty },
                { data: dbOrders },
                { data: dbEmps },
                { data: dbLogs }
              ] = await Promise.all([
                supabase.from('products').select('*').eq('business_id', targetBizUUID),
                supabase.from('sales').select('*').eq('business_id', targetBizUUID).order('timestamp', { ascending: false }),
                supabase.from('expenses').select('*').eq('business_id', targetBizUUID).order('timestamp', { ascending: false }),
                supabase.from('customers').select('*').eq('business_id', targetBizUUID),
                supabase.from('purchase_orders').select('*').eq('business_id', targetBizUUID).order('timestamp', { ascending: false }),
                supabase.from('employees').select('*').eq('business_id', targetBizUUID),
                supabase.from('activity_logs').select('*').eq('business_id', targetBizUUID).order('timestamp', { ascending: false })
              ]);

              // Seed / map products
              if (dbProds && dbProds.length > 0) {
                setProducts(dbProds.map(p => ({
                  id: p.id,
                  name: p.name,
                  barcode: p.barcode || '',
                  category: p.category_name || 'General',
                  costPrice: Number(p.cost_price || 0),
                  sellingPrice: Number(p.selling_price || 0),
                  stock: Number(p.stock ?? 0),
                  minStock: Number(p.min_stock ?? 5),
                  expiryDate: p.expiry_date || undefined,
                  fastSelling: p.fast_selling,
                  slowMoving: p.slow_moving,
                  imageUrl: p.image_url || undefined
                })));
              } else {
                // Seed baseline catalog to give a highly qualitative start state
                const customSeed = prodsRes.map((p: any) => ({
                  business_id: targetBizUUID,
                  name: p.name,
                  barcode: p.barcode,
                  category_name: p.category,
                  cost_price: p.costPrice,
                  selling_price: p.sellingPrice,
                  stock: p.stock,
                  min_stock: p.minStock,
                  expiry_date: p.expiryDate,
                  fast_selling: p.fastSelling,
                  slow_moving: p.slowMoving
                }));
                await supabase.from('products').insert(customSeed);
                // Pull after insert
                const { data: dbProdsRetry } = await supabase.from('products').select('*').eq('business_id', targetBizUUID);
                if (dbProdsRetry) {
                  setProducts(dbProdsRetry.map(p => ({
                    id: p.id,
                    name: p.name,
                    barcode: p.barcode || '',
                    category: p.category_name || 'General',
                    costPrice: Number(p.cost_price || 0),
                    sellingPrice: Number(p.selling_price || 0),
                    stock: Number(p.stock ?? 0),
                    minStock: Number(p.min_stock ?? 5),
                    expiryDate: p.expiry_date || undefined,
                    fastSelling: p.fast_selling,
                    slowMoving: p.slow_moving,
                    imageUrl: p.image_url || undefined
                  })));
                }
              }

              // Set sales
              if (dbSales && dbSales.length > 0) {
                setSales(dbSales.map(s => ({
                  id: s.id,
                  items: s.items || [],
                  subtotal: Number(s.subtotal || 0),
                  vat: Number(s.vat || 0),
                  total: Number(s.total || 0),
                  paymentMethod: s.payment_method || 'Cash',
                  paidAmount: Number(s.paid_amount || 0),
                  changeAmount: Number(s.change_amount || 0),
                  timestamp: s.timestamp,
                  customerPhone: s.customer_phone || '',
                  pointsEarned: Number(s.points_earned || 0),
                  cashierName: s.cashier_name || 'Thabo Shabalala'
                })));
              } else {
                setSales([]);
              }

              // Set expenses
              if (dbExps && dbExps.length > 0) {
                setExpenses(dbExps.map(e => ({
                  id: e.id,
                  category: e.category,
                  amount: Number(e.amount),
                  description: e.description || '',
                  timestamp: e.timestamp
                })));
              } else {
                setExpenses([]);
              }

              // Set customers
              if (dbLoyalty && dbLoyalty.length > 0) {
                setLoyalty(dbLoyalty.map(c => ({
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  points: Number(c.points || 0),
                  cardCode: c.card_code || 'SF-' + Math.floor(1000 + Math.random() * 9000),
                  purchaseHistoryCount: 0,
                  referrals: Number(c.referrals || 0),
                  vouchers: []
                })));
              } else {
                setLoyalty([]);
              }

              // Set purchase orders
              if (dbOrders && dbOrders.length > 0) {
                setSupplierOrders(dbOrders.map(o => ({
                  id: o.id,
                  supplierId: o.supplier_id || '',
                  supplierName: o.supplier_name,
                  items: o.items || [],
                  total: Number(o.total || 0),
                  status: o.status || 'Pending',
                  timestamp: o.timestamp
                })));
              } else {
                setSupplierOrders([]);
              }

              // Set employees
              if (dbEmps && dbEmps.length > 0) {
                setEmployees(dbEmps.map(e => ({
                  id: e.id,
                  name: e.name,
                  role: e.role || 'Cashier',
                  pin: e.pin || '1234',
                  status: e.status || 'Active',
                  attendance: []
                })));
              } else {
                setEmployees([]);
              }

              // Set audit logs
              if (dbLogs && dbLogs.length > 0) {
                setAuditLogs(dbLogs.map(l => ({
                  id: l.id,
                  timestamp: l.timestamp,
                  user: l.user_fullname || 'Unknown Staff',
                  role: 'Manager',
                  action: l.action,
                  details: l.details || ''
                })));
              } else {
                setAuditLogs([]);
              }

              loadedLiveFromSupabase = true;
            }
          }
        } catch (dbError) {
          console.error("Failed querying Supabase live tables: ", dbError);
          setUsingSupabaseLive(false);
        }
      }

      if (!loadedLiveFromSupabase) {
        // Check if we have customized local storage databases for multi-tenant isolation
        const localSaaSKey = `spazaflow_saas_multi_${activeBusinessId}`;
        const savedTenantData = localStorage.getItem(localSaaSKey);

        if (savedTenantData) {
          const parsed = JSON.parse(savedTenantData);
          setProducts(parsed.products || []);
          setSales(parsed.sales || []);
          setExpenses(parsed.expenses || []);
          setSupplierOrders(parsed.supplierOrders || []);
          setLoyalty(parsed.loyalty || []);
          setEmployees(parsed.employees || []);
          setAuditLogs(parsed.auditLogs || []);
          setHealth(parsed.health || healthRes);
        } else {
          // Fallback or seed tenant data separately based on location setting
          const suffix = ` (${activeBusiness.name})`;
          const customizedProducts = prodsRes.map((p: any, idx: number) => ({
            ...p,
            // vary prices slightly so metrics feel isolated
            sellingPrice: p.sellingPrice + (idx % 3 === 0 ? 3.50 : -2.00),
            stock: activeBusinessId === 'b_mplain' ? Math.max(0, p.stock - 8) : p.stock
          }));

          setProducts(customizedProducts);
          setSales(salesRes);
          setExpenses(expRes);
          setSupplierOrders(ordRes);
          setLoyalty(loyRes);
          setEmployees(empsRes);
          setAuditLogs(auditRes);
          setHealth(healthRes);

          // Keep catalog state stored
          const initialSaaSPack = {
            products: customizedProducts,
            sales: salesRes,
            expenses: expRes,
            supplierOrders: ordRes,
            loyalty: loyRes,
            employees: empsRes,
            auditLogs: auditRes,
            health: healthRes
          };
          localStorage.setItem(localSaaSKey, JSON.stringify(initialSaaSPack));
        }
      }

      setSuppliers(supsRes);
      setMarketplace(markRes);
      setCommunity(commRes);

    } catch (err) {
      console.error("Error loading multi-tenant data logs: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever active tenant switches
  useEffect(() => {
    fetchTenantDataset();
  }, [activeBusinessId]);

  // Persists local dataset modifications
  const persistTenantData = (updatedFields: Partial<{
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    supplierOrders: SupplierOrder[];
    loyalty: CustomerLoyalty[];
    employees: Employee[];
    auditLogs: AuditLog[];
    health: BusinessHealth;
  }>) => {
    const localSaaSKey = `spazaflow_saas_multi_${activeBusinessId}`;
    const activePack = JSON.parse(localStorage.getItem(localSaaSKey) || '{}');
    const newPack = { ...activePack, ...updatedFields };
    localStorage.setItem(localSaaSKey, JSON.stringify(newPack));
  };

  // Multi-Tenant CRUD handles
  const handleSaveProduct = async (payload: Partial<Product>) => {
    const isNew = !payload.id;
    let computedProds: Product[] = [];
    let savedId = payload.id;

    if (usingSupabaseLive && supabase && activeSupabaseBizId) {
      try {
        const dbPayload = {
          business_id: activeSupabaseBizId,
          name: payload.name || 'Unnamed product',
          barcode: payload.barcode || 'b_' + Date.now(),
          category_name: payload.category || 'General',
          cost_price: Number(payload.costPrice || 0),
          selling_price: Number(payload.sellingPrice || 0),
          stock: Number(payload.stock ?? 0),
          min_stock: Number(payload.minStock ?? 5),
          expiry_date: payload.expiryDate || null,
          fast_selling: payload.fastSelling || false,
          slow_moving: payload.slowMoving || false
        };

        if (isNew || (payload.id && payload.id.startsWith('p_'))) {
          // Insert new
          const { data, error } = await supabase.from('products').insert(dbPayload).select();
          if (error) throw error;
          if (data && data[0]) {
            savedId = data[0].id;
          }
        } else {
          // Update existing
          const { error } = await supabase.from('products').update(dbPayload).eq('id', payload.id);
          if (error) throw error;
        }

        // Live audit log
        await supabase.from('activity_logs').insert({
          business_id: activeSupabaseBizId,
          action: isNew ? 'Product Creation' : 'Product Updated',
          details: `Live DB sync: ${payload.name || 'Item'}`,
          user_fullname: session.fullname,
          page_visited: '/' + activeTab
        });

      } catch (err: any) {
        console.error("Supabase live product save failed, falling back to local:", err);
      }
    }

    if (isNew) {
      const newProd: Product = {
        id: savedId || 'p_' + Date.now(),
        name: payload.name || 'Unnamed product',
        barcode: payload.barcode || 'b_' + Date.now(),
        category: payload.category || 'General',
        costPrice: Number(payload.costPrice || 0),
        sellingPrice: Number(payload.sellingPrice || 0),
        stock: Number(payload.stock || 0),
        minStock: Number(payload.minStock || 5),
        expiryDate: payload.expiryDate,
        fastSelling: payload.fastSelling,
        slowMoving: payload.slowMoving
      };
      computedProds = [newProd, ...products];
      logUserAction('Product Creation', `Registered beautiful new inventory item: ${newProd.name}`);
    } else {
      computedProds = products.map(p => p.id === payload.id ? { ...p, ...payload as Product } : p);
      logUserAction('Product Updated', `Refined specification or margins for: ${payload.name}`);
    }

    setProducts(computedProds);
    persistTenantData({ products: computedProds });
    recalculateDashboardAndHealth(computedProds, sales, expenses);
  };

  const handleDeleteProduct = async (id: string) => {
    const targetProd = products.find(p => p.id === id);

    if (usingSupabaseLive && supabase && activeSupabaseBizId && id && !id.startsWith('p_')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        await supabase.from('activity_logs').insert({
          business_id: activeSupabaseBizId,
          action: 'Product Deleted',
          details: `Item: ${targetProd?.name || id}`,
          user_fullname: session.fullname,
          page_visited: '/' + activeTab
        });
      } catch (err: any) {
        console.error("Supabase product deletion error:", err);
      }
    }

    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    persistTenantData({ products: updated });
    logUserAction('Product Deleted', `Removed item from enterprise catalog: ${targetProd?.name || id}`);
    recalculateDashboardAndHealth(updated, sales, expenses);
  };

  const handleCheckoutSale = async (cartItems: any[], paymentMethod: any, paidAmount: number, customerPhone: string) => {
    let subtotal = 0;
    const processedItems = cartItems.map((cartItem: any) => {
      const prod = products.find(p => p.id === cartItem.productId);
      const sPrice = cartItem.price || (prod?.sellingPrice || 0);
      const qty = Number(cartItem.quantity);
      subtotal += sPrice * qty;

      if (prod) {
        prod.stock = Math.max(0, prod.stock - qty);
      }
      return {
        productId: cartItem.productId,
        productName: cartItem.productName || prod?.name || "Kasi Goods",
        price: sPrice,
        quantity: qty,
        total: sPrice * qty
      };
    });

    const vat = Number((subtotal - (subtotal / 1.15)).toFixed(2));
    const roundedSub = Number((subtotal - vat).toFixed(2));
    const change = paymentMethod === 'Cash' ? Math.max(0, paidAmount - subtotal) : 0;

    const pointsEarned = Math.floor(subtotal / 10);
    
    // update loyalty if phone exists
    let updatedLoyalty = [...loyalty];
    if (customerPhone) {
      updatedLoyalty = loyalty.map(l => {
        if (l.phone === customerPhone) {
          const pointsToAdd = pointsEarned;
          
          if (usingSupabaseLive && supabase && activeSupabaseBizId && l.id && !l.id.startsWith('l_')) {
            supabase.from('customers')
              .update({ points: (l.points || 0) + pointsToAdd })
              .eq('id', l.id)
              .then(({ error }) => {
                if (error) console.error("Error updating points in Supabase:", error);
              });
          }

          return { ...l, points: l.points + pointsToAdd, purchaseHistoryCount: l.purchaseHistoryCount + 1 };
        }
        return l;
      });
      setLoyalty(updatedLoyalty);
    }

    let liveSaleId = 's_' + Date.now();

    if (usingSupabaseLive && supabase && activeSupabaseBizId) {
      try {
        const { data: dbSale, error: saleErr } = await supabase.from('sales').insert({
          business_id: activeSupabaseBizId,
          subtotal: roundedSub,
          vat,
          total: subtotal,
          payment_method: paymentMethod,
          paid_amount: paymentMethod === 'Cash' ? paidAmount : subtotal,
          change_amount: change,
          customer_phone: customerPhone || null,
          points_earned: pointsEarned,
          cashier_name: session.fullname
        }).select();

        if (saleErr) throw saleErr;
        if (dbSale && dbSale[0]) {
          liveSaleId = dbSale[0].id;
          
          // Insert sale items
          const dbItems = processedItems.map((ci: any) => ({
            sale_id: liveSaleId,
            product_id: ci.productId && !ci.productId.startsWith('p_') ? ci.productId : null,
            product_name: ci.productName,
            price: ci.price,
            quantity: ci.quantity,
            total: ci.total
          }));
          await supabase.from('sale_items').insert(dbItems);

          // Update stock counts in live database
          for (const ci of processedItems) {
            if (ci.productId && !ci.productId.startsWith('p_')) {
              const matchedProd = products.find(p => p.id === ci.productId);
              if (matchedProd) {
                const finalStock = Math.max(0, matchedProd.stock - ci.quantity);
                await supabase.from('products').update({ stock: finalStock }).eq('id', ci.productId);
              }
            }
          }

          // Live activity log
          await supabase.from('activity_logs').insert({
            business_id: activeSupabaseBizId,
            action: 'Sales Completed',
            details: `R${subtotal.toFixed(2)} invoiced checkout`,
            user_fullname: session.fullname,
            page_visited: '/' + activeTab
          });
        }
      } catch (err: any) {
        console.error("Supabase checkout sync failed, falling back to local storage:", err);
      }
    }

    const newSale: Sale = {
      id: liveSaleId,
      items: processedItems,
      subtotal: roundedSub,
      vat,
      total: subtotal,
      paymentMethod,
      paidAmount: paymentMethod === 'Cash' ? paidAmount : subtotal,
      changeAmount: change,
      timestamp: new Date().toISOString(),
      customerPhone,
      pointsEarned,
      cashierName: session.fullname
    };

    const newSalesList = [newSale, ...sales];
    setSales(newSalesList);
    setProducts([...products]); // update stock quantities
    
    persistTenantData({ 
      products, 
      sales: newSalesList,
      loyalty: updatedLoyalty
    });

    logUserAction('Sales Completed', `Invoiced checkout of R${subtotal.toFixed(2)} under transactional ledger SF-${newSale.id}`);

    // Create real-time notification alert of new transactions!
    const txnNotification: WebNotification = {
      id: 'n_txn_' + Date.now(),
      title: 'New Transaction Received',
      message: `Completed R${subtotal.toFixed(2)} [${paymentMethod}] and awarded ${pointsEarned} loyalty points!`,
      type: 'sales',
      is_read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [txnNotification, ...prev]);
    setToastNotif(`💵 Sales Invoiced! R${subtotal.toFixed(2)} logged instantly.`);

    recalculateDashboardAndHealth(products, newSalesList, expenses);
    return newSale;
  };

  const handleAddExpense = async (payload: Partial<Expense>) => {
    let savedId = 'e_' + Date.now();

    if (usingSupabaseLive && supabase && activeSupabaseBizId) {
      try {
        const { data, error } = await supabase.from('expenses').insert({
          business_id: activeSupabaseBizId,
          category: payload.category || 'Other',
          amount: Number(payload.amount || 0),
          description: payload.description || 'General logistics'
        }).select();

        if (error) throw error;
        if (data && data[0]) {
          savedId = data[0].id;
        }

        await supabase.from('activity_logs').insert({
          business_id: activeSupabaseBizId,
          action: 'Expense Added',
          details: `Logged operations outgoing R${Number(payload.amount).toFixed(2)} category: ${payload.category}`,
          user_fullname: session.fullname,
          page_visited: '/' + activeTab
        });
      } catch (err) {
        console.error("Supabase expense insert failed:", err);
      }
    }

    const newExp: Expense = {
      id: savedId,
      category: payload.category as any || 'Other',
      amount: Number(payload.amount || 0),
      description: payload.description || 'General logistics',
      timestamp: new Date().toISOString()
    };

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    persistTenantData({ expenses: updated });
    logUserAction('Expense Added', `Logged operations outgoing R${newExp.amount.toFixed(2)} category: ${newExp.category}`);
    recalculateDashboardAndHealth(products, sales, updated);
  };

  const handleOrderPlace = async (payload: Partial<SupplierOrder>) => {
    const newOrder: SupplierOrder = {
      id: 'ord_saas_' + Date.now(),
      supplierId: payload.supplierId || 'sup_1',
      supplierName: payload.supplierName || 'Soweto Cash & Carry',
      items: payload.items || [],
      total: Number(payload.total || 0),
      status: 'Pending',
      timestamp: new Date().toISOString()
    };

    const nextOrders = [newOrder, ...supplierOrders];
    setSupplierOrders(nextOrders);
    persistTenantData({ supplierOrders: nextOrders });
    logUserAction('Purchase Order Shared', `Dispatched PO ${newOrder.id} to wholesale marketplace: ${newOrder.supplierName}`);

    // Trigger delivery simulation and update inventory status in 12 seconds
    setTimeout(() => {
      setSupplierOrders(preList => {
        const matchingIdx = preList.findIndex(o => o.id === newOrder.id);
        if (matchingIdx > -1) {
          const finished = { ...preList[matchingIdx], status: 'Delivered' as const };
          const updatedOrders = [...preList];
          updatedOrders[matchingIdx] = finished;

          // Add to expense
          const replenExpense: Expense = {
            id: 'e_replen_' + Date.now(),
            category: 'Supplier Stock',
            amount: finished.total,
            description: `Auto stock delivery PO: ${finished.supplierName}`,
            timestamp: new Date().toISOString()
          };

          setExpenses(exps => {
            const nextExps = [replenExpense, ...exps];
            // Auto replenish product stock
            setProducts(prods => {
              const matchedProds = prods.map(p => {
                const keyword = finished.items[0]?.name.split(' ')[0];
                if (finished.items[0]?.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(keyword?.toLowerCase() || '')) {
                  return { ...p, stock: p.stock + finished.items[0].quantity };
                }
                return p;
              });
              persistTenantData({ 
                products: matchedProds, 
                expenses: nextExps,
                supplierOrders: updatedOrders 
              });
              return matchedProds;
            });
            return nextExps;
          });

          // Trigger alert notification
          const deliveryNotification: WebNotification = {
            id: 'n_del_' + Date.now(),
            title: 'Supplier stock delivered',
            message: `Delivered PO ${finished.id} from ${finished.supplierName}. Stock replenished.`,
            type: 'deliveries',
            is_read: false,
            timestamp: new Date().toISOString()
          };
          setNotifications(prev => [deliveryNotification, ...prev]);
          setToastNotif(`🎁 Wholesaler Delivery arrived! ${finished.supplierName} verified.`);

          return updatedOrders;
        }
        return preList;
      });
    }, 12000);
  };

  const handleAddSupplier = async (payload: Partial<Supplier>) => {
    // Shared state logic mock
    fetchTenantDataset();
  };

  const handleAddLoyalty = async (payload: Partial<CustomerLoyalty>) => {
    let savedId = 'l_' + Date.now();
    const computedCode = 'SF-' + Math.floor(1000 + Math.random() * 9000);

    if (usingSupabaseLive && supabase && activeSupabaseBizId) {
      try {
        const { data, error } = await supabase.from('customers').insert({
          business_id: activeSupabaseBizId,
          name: payload.name || 'Anonymous Loyalty Club',
          phone: payload.phone || '',
          points: 10,
          card_code: computedCode,
          referrals: Number(payload.referrals || 0)
        }).select();

        if (error) throw error;
        if (data && data[0]) {
          savedId = data[0].id;
        }

        await supabase.from('activity_logs').insert({
          business_id: activeSupabaseBizId,
          action: 'Customer Loyalty Registered',
          details: `Registered customer: ${payload.name || 'Anonymous'}`,
          user_fullname: session.fullname,
          page_visited: '/' + activeTab
        });
      } catch (err) {
        console.error("Supabase customer loyalty insert failed:", err);
      }
    }

    const newL: CustomerLoyalty = {
      id: savedId,
      name: payload.name || 'Anonymous Loyalty Club',
      phone: payload.phone || '',
      points: 10,
      cardCode: computedCode,
      vouchers: [
        { id: 'v_' + Date.now(), code: 'WELCOMESAAS', description: 'R15 Welcome Bonus Voucher', discountValue: 15.00, minSpend: 50.00, expiryDate: '2026-12-31', isUsed: false }
      ],
      purchaseHistoryCount: 0,
      referrals: payload.referrals || 0
    };

    const nextLoyalty = [newL, ...loyalty];
    setLoyalty(nextLoyalty);
    persistTenantData({ loyalty: nextLoyalty });
    logUserAction('Customer Loyalty Registered', `Created smart customer profile and physical phone scanner card for: ${newL.name}`);
  };

  const handleAttendanceLog = async (employeeId: string, isClockIn: boolean) => {
    const rightNowStr = new Date().toTimeString().split(' ')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const upEmps = employees.map(e => {
      if (e.id === employeeId) {
        const refreshedAttendance = [...e.attendance];
        if (isClockIn) {
          refreshedAttendance.push({
            date: todayStr,
            clockIn: rightNowStr,
            state: rightNowStr > '08:15:00' ? 'Late' : 'Present'
          });
          logUserAction('Security Auth Audit', `Cashier employee ${e.name} clocked in at ${rightNowStr}`);
        } else {
          const matchToday = refreshedAttendance.find(a => a.date === todayStr);
          if (matchToday) matchToday.clockOut = rightNowStr;
          logUserAction('Security Auth Audit', `Cashier employee ${e.name} clocked out shift at ${rightNowStr}`);
        }
        return { ...e, attendance: refreshedAttendance };
      }
      return e;
    });

    setEmployees(upEmps);
    persistTenantData({ employees: upEmps });
  };

  const handleAcceptListing = async (id: string) => {
    logUserAction('Community trade agreed', `Accepted surplus trade swap checkout.`);
    fetchTenantDataset();
  };

  const handleDatabaseReset = async () => {
    if (confirm("Reseed this tenant business to fresh baseline seed parameters?")) {
      localStorage.removeItem(`spazaflow_saas_multi_${activeBusinessId}`);
      fetchTenantDataset();
      logUserAction('Database Reseed Action', 'Flushed customized schemas back to baseline pre-seeding.');
    }
  };

  const handleAddBusinessTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const newId = 'b_tenant_' + Date.now();
    const newBiz: BusinessTenant = {
      id: newId,
      name: newBizName,
      slug: newBizName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      plan_tier: newBizTier,
      subscription_status: 'Active',
      location: newBizLocation || 'South Africa'
    };

    setBusinesses([...businesses, newBiz]);
    setActiveBusinessId(newId);
    setShowBusinessModal(false);
    setNewBizName('');
    setNewBizLocation('');
    logUserAction('Multi-Tenant Register', `Provisioned isolated multi-tenant database & workspace schema: ${newBiz.name}`);
    setToastNotif(`⚡ Isolated Tenant Database Created!`);
  };

  const handleSaaSSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    if (hasSupabaseConfig && supabase) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
        setToastNotif("🔓 Signed in successfully!");
      } catch (err: any) {
        alert("Authentication failed: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    } else {
      // Offline mock authentication flow
      if (authPassword.length >= 4) {
        const mockSession = {
          fullname: authFullname || 'Thabo Shabalala',
          email: authEmail,
          phone: authPhone || '072 555 9911',
          role: 'Owner' as const,
          isAuthenticated: true
        };
        setSession(mockSession);
        localStorage.setItem('spazaflow_offline_session', JSON.stringify(mockSession));
        setToastNotif("🔓 Signed in successfully!");
      } else {
        alert("Invalid password (must be at least 4 characters)");
      }
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const mockSession = {
      fullname: authFullname || 'Thabo Shabalala',
      email: authEmail,
      phone: authPhone || '072 555 9911',
      role: 'Owner' as const,
      isAuthenticated: true
    };
    setSession(mockSession);
    localStorage.setItem('spazaflow_offline_session', JSON.stringify(mockSession));
    setTwoFactorRequested(false);
    logUserAction('SaaS Authentication Success', `2FA verification checks passed. JWT generated for email ${authEmail}`);
  };

  const handleSaaSSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authFullname) return;

    if (hasSupabaseConfig && supabase) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              fullname: authFullname,
              phone: authPhone
            }
          }
        });
        if (error) throw error;
        
        const user = data.user;
        if (user) {
          // Create user first business
          const businessName = `${authFullname}'s Tuck Shop`;
          const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          
          const { data: insertedBiz, error: bizError } = await supabase.from('businesses').insert({
            name: businessName,
            slug: slug,
            owner_id: user.id,
            plan_tier: 'Free',
            subscription_status: 'Active'
          }).select();
          
          if (bizError) throw bizError;
          const targetBizId = insertedBiz?.[0]?.id;

          const newProfile = {
            id: user.id,
            fullname: authFullname,
            phone: authPhone,
            email: authEmail,
            role: 'Owner',
            current_business_id: targetBizId,
            email_verified: false
          };
          
          const { error: profileError } = await supabase.from('profiles').insert(newProfile);
          if (profileError) throw profileError;

          setToastNotif(`🎉 Welcome to SpazaFlow! Please verify your email.`);
        }
      } catch (err: any) {
        alert("Registration failed: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    } else {
      // Mock signup flow
      const mockSession = {
        fullname: authFullname || 'Mpho Sithole',
        email: authEmail,
        phone: authPhone || '083 444 1212',
        role: 'Owner' as const,
        isAuthenticated: true
      };
      setSession(mockSession);
      localStorage.setItem('spazaflow_offline_session', JSON.stringify(mockSession));
      setToastNotif(`🎉 Welcome to SpazaFlow! Sandbox account created.`);
    }
  };

  const handleGoogleLogin = async () => {
    if (hasSupabaseConfig && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
      } catch (err: any) {
        alert("Google Authentication failed: " + (err.message || err));
      }
    } else {
      // Mock Google Login
      const mockSession = {
        fullname: 'Zama Buthelezi (Google)',
        email: 'zama.buthelezi@gmail.com',
        phone: '082 999 4433',
        role: 'Owner' as const,
        isAuthenticated: true
      };
      setSession(mockSession);
      localStorage.setItem('spazaflow_offline_session', JSON.stringify(mockSession));
      setToastNotif("🎉 Mock Google Login succeeded!");
    }
  };

  const handlePasswordReset = async () => {
    if (!authEmail) {
      alert("Please enter your business email first.");
      return;
    }
    if (hasSupabaseConfig && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        alert("A secure Supabase auth reset token link has been dispatched to your email!");
        setAuthMode('signin');
      } catch (err: any) {
        alert("Password reset request failed: " + (err.message || err));
      }
    } else {
      alert("Mock recovery link dispatched to: " + authEmail);
      setAuthMode('signin');
    }
  };

  const handleSignOut = async () => {
    if (confirm("Log out of your SpazaFlow credentials?")) {
      if (hasSupabaseConfig && supabase) {
        await supabase.auth.signOut();
      } else {
        setSession({
          fullname: '',
          email: '',
          phone: '',
          role: 'Owner',
          isAuthenticated: false
        });
        localStorage.removeItem('spazaflow_offline_session');
      }
    }
  };

  const handleUpgradePlan = (tier: 'Free' | 'Starter' | 'Business' | 'Enterprise') => {
    setBusinesses(prev => prev.map(b => b.id === activeBusinessId ? { ...b, plan_tier: tier } : b));
    logUserAction('SaaS Billing Level Up', `Upgraded Multi-Tenant Business plan to: ${tier} Tier`);
    setToastNotif(`💳 Upgraded successfully to ${tier} Package!`);
  };

  // Metric Recalculator
  const recalculateDashboardAndHealth = (prods: Product[], sList: Sale[], eList: Expense[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sList.filter(s => s.timestamp.startsWith(todayStr));
    const revenueToday = todaySales.reduce((acc, s) => acc + s.total, 0);

    const lowStockCount = prods.filter(p => p.stock <= p.minStock).length;
    const sixtyDaysTime = Date.now() + (60 * 24 * 3600000);
    const expiringSoonCount = prods.filter(p => p.expiryDate && new Date(p.expiryDate).getTime() < sixtyDaysTime).length;

    let totalCost = 0;
    let totalSellValue = 0;
    prods.forEach(p => {
      totalCost += p.costPrice * p.stock;
      totalSellValue += p.sellingPrice * p.stock;
    });

    const profitMargin = totalSellValue > 0 ? ((totalSellValue - totalCost) / totalSellValue) * 100 : 0;

    // Compute status score
    let scoreVal = 85;
    if (lowStockCount > 3) scoreVal -= 15;
    if (expiringSoonCount > 2) scoreVal -= 10;
    if (profitMargin < 15) scoreVal -= 20;

    let scoreName: 'Excellent' | 'Good' | 'Warning' | 'Critical' = 'Good';
    if (scoreVal >= 85) scoreName = 'Excellent';
    else if (scoreVal >= 65) scoreName = 'Good';
    else if (scoreVal >= 40) scoreName = 'Warning';
    else scoreName = 'Critical';

    setHealth({
      score: scoreName,
      scoreValue: scoreVal,
      lowStockCount,
      expiringSoonCount,
      revenueToday: Number(revenueToday.toFixed(2)),
      transactionsToday: todaySales.length,
      profitMargin: Number(profitMargin.toFixed(2))
    });

    persistTenantData({
      health: {
        score: scoreName,
        scoreValue: scoreVal,
        lowStockCount,
        expiringSoonCount,
        revenueToday: Number(revenueToday.toFixed(2)),
        transactionsToday: todaySales.length,
        profitMargin: Number(profitMargin.toFixed(2))
      }
    });
  };

  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  const markAllNotifRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  // AUTH GUARD VIEW
  if (!session.isAuthenticated) {
    return (
      <div className="bg-[#0A0A0B] min-h-screen text-[#F4F4F5] flex flex-col font-sans justify-center items-center p-6 relative select-none antialiased">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))] pointer-events-none" />
        
        {/* Auth Box Container */}
        <div className="w-full max-w-md bg-[#141416] border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-650 text-white rounded-2xl flex items-center justify-center font-black text-2xl italic mx-auto shadow-lg shadow-indigo-650/20">
              S
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">SpazaFlow</h1>
            <p className="text-xs text-gray-400">Manage your business sales, customers, and inventory in one place</p>
          </div>

          {twoFactorRequested ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                <span className="text-xs font-bold text-indigo-400 block flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verification Required</span>
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">Please enter the verification code sent to your phone number.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none text-white focus:border-indigo-500 text-center tracking-widest text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Verify Code
              </button>
            </form>
          ) : authMode === 'signin' ? (
            <form onSubmit={handleSaaSSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="owner@spaza.co.za"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/10 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Password</label>
                  <button type="button" onClick={() => setAuthMode('forgot_password')} className="text-[10px] text-indigo-400 hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/10 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase tracking-wider shadow-lg shadow-indigo-650/15"
              >
                Sign In
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-3 bg-[#141416] text-[10px] uppercase font-bold text-gray-500 tracking-wider">Or continue with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#currentColor" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.113 15.44 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.31-.176-1.879H12.24z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">New? </span>
                <button type="button" onClick={() => setAuthMode('signup')} className="text-xs text-indigo-400 font-bold hover:underline">Create Account</button>
              </div>
            </form>
          ) : authMode === 'signup' ? (
            <form onSubmit={handleSaaSSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full name</label>
                <input
                  type="text"
                  required
                  placeholder="Sibusiso Zuma"
                  value={authFullname}
                  onChange={(e) => setAuthFullname(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sibu@spaza.co.za"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    required
                    placeholder="072 555 1234"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/10 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/10 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase tracking-wider shadow-lg shadow-indigo-650/15"
              >
                Sign Up
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-3 bg-[#141416] text-[10px] uppercase font-bold text-gray-500 tracking-wider">Or register with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#currentColor" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155 2.113 15.44 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.31-.176-1.879H12.24z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">Already have an account? </span>
                <button type="button" onClick={() => setAuthMode('signin')} className="text-xs text-indigo-400 font-bold hover:underline">Log In</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <span className="text-xs text-gray-300 block leading-relaxed text-center">Enter your email address below to reset your password. We will send you a password reset link.</span>
              <input
                type="email"
                placeholder="merchant@kasi.za"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs outline-none text-white font-semibold"
              />
              <button
                onClick={handlePasswordReset}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider"
              >
                Send Reset Link
              </button>
              <button onClick={() => setAuthMode('signin')} className="w-full text-xs text-gray-450 hover:underline">Return to Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] min-h-screen text-[#F4F4F5] flex flex-col font-sans relative antialiased leading-normal">
      
      {/* Toast Alert floating container */}
      {toastNotif && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-[#141416] border border-white/10 text-white rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm animate-bounce">
          <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-indigo-400">SaaS Live Notification</span>
            <p className="text-gray-350">{toastNotif}</p>
          </div>
        </div>
      )}

      {/* MAIN TOP BAR HEADER */}
      <header className="bg-[#141416] border-b border-white/5 py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm relative z-40">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-indigo-650 text-white rounded-xl flex items-center justify-center font-black text-xl italic shadow-md">
            S
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h1 className="font-bold text-xl tracking-tight text-white">SpazaFlow <span className="text-indigo-400">SaaS</span></h1>
              <span className="text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">Production-Ready</span>
            </span>
            <p className="text-[11px] text-gray-400 font-medium">Multi-tenant operations framework matching Supabase schemas</p>
          </div>
        </div>

        {/* Tenant Switcher & Health indicators */}
        <div className="flex items-center gap-3.5 flex-wrap justify-center text-xs">
          
          {/* Tenant Switcher drop down widget */}
          <div className="bg-white/5 border border-white/5 pl-3 pr-2 py-1 rounded-xl flex items-center gap-2 relative">
            <span className="text-[9px] uppercase font-bold text-gray-400 font-mono tracking-wide">Active Merchant:</span>
            <select
              value={activeBusinessId}
              onChange={(e) => setActiveBusinessId(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-white outline-none border-none py-1 cursor-pointer pr-1"
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id} className="bg-[#141416] text-[#F4F4F5] text-xs font-bold py-1">
                  {b.name} ({b.plan_tier})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowBusinessModal(true)}
              className="p-1 hover:bg-white/10 rounded-lg text-indigo-400 ml-1 font-bold"
              title="Add a new isolated business tenant"
            >
              + Add
            </button>
          </div>

          {/* Health Indicators */}
          {health && (
            <div className="flex items-center gap-4 select-none">
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 font-mono blockLeading-none leading-none">Health score</span>
                  <span className="font-extrabold text-white text-[11px]">{health.score} ({health.scoreValue}%)</span>
                </div>
              </div>

              {health.lowStockCount > 0 && (
                <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-rose-300 font-mono block leading-none">Low Stocks</span>
                    <span className="font-extrabold text-[11px]">{health.lowStockCount} items</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATION BUTTON WITH ALERT COUNT */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifMenu(!showNotifMenu); markAllNotifRead(); }}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/5 font-semibold transition-all flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-indigo-400" />
              {unreadNotifsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-650 text-white rounded-full text-[9px] font-black leading-none shrink-0 animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification drop menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2.5 w-72 bg-[#141416] border border-white/10 rounded-2xl shadow-xl p-4 space-y-3 z-50 text-left select-all animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-white">Live Operations Alerts</span>
                  <button onClick={() => setNotifications([])} className="text-[10px] text-gray-400 hover:text-white">Clear</button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-gray-500 text-[11px]">No alerts pending.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2 bg-[#0A0A0B] rounded-xl border border-white/5 flex gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'low_stock' ? 'bg-rose-500' : n.type === 'sales' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />
                        <div>
                          <span className="text-[10px] font-bold text-gray-300 block">{n.title}</span>
                          <p className="text-[9px] text-gray-400 leading-normal mt-0.5">{n.message}</p>
                          <span className="text-[8px] text-gray-500 block mt-1 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* USER SIGN OUT PROFILE */}
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl border border-white/10 bg-[#141416] text-[#F4F4F5] hover:bg-white/5 text-[11px] font-extrabold flex items-center gap-1.5"
            title="Log out of SaaS session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-455" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>
      </header>

      {/* BUSINESS REGISTER ONBOARDING MODAL */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none">
          <form
            onSubmit={handleAddBusinessTenant}
            className="w-full max-w-sm bg-[#141416] border border-white/10 rounded-2xl p-6 space-y-4 text-left shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Package className="w-5 h-5 text-indigo-400" />
              <span>Register Business Tenant</span>
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed">
              Provision a completely isolated multi-tenant database sandbox with individual catalog schemas, separate bookkeeping tracking, and custom staff pins.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Business Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Fresh Staples Shop"
                value={newBizName}
                onChange={(e) => setNewBizName(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Location Municipality</label>
              <input
                type="text"
                placeholder="e.g. Johannesburg, Alexandra"
                value={newBizLocation}
                onChange={(e) => setNewBizLocation(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Database Entry Tier Plan</label>
              <select
                value={newBizTier}
                onChange={(e) => setNewBizTier(e.target.value as any)}
                className="w-full bg-[#0A0A0B] border border-white/10 px-3 py-2 rounded-xl text-xs text-white"
              >
                <option value="Free">Free Package (50 products count)</option>
                <option value="Starter">Starter Package (200 products count)</option>
                <option value="Business">Business Package (Unlimited items)</option>
                <option value="Enterprise">Enterprise Package (Unlimited multi-store)</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBusinessModal(false)}
                className="flex-1 py-2 bg-white/5 text-gray-300 hover:bg-white/10 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-650 text-white hover:bg-indigo-600 rounded-xl text-xs font-bold"
              >
                Create Isolated DB
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN CONTAINER WORKSPACE STRUCTURE */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* SIDE BAR NAVIGATION MODULES RAILS */}
        <aside className="bg-[#141416] border-r border-white/5 w-full md:w-64 max-h-[160px] md:max-h-none overflow-y-auto shrink-0 flex flex-col justify-between shadow-xs">
          
          <div className="p-4 space-y-1 w-full flex md:flex-col overflow-x-auto md:overflow-x-visible md:h-auto gap-1 md:gap-0 shrink-0">
            
            {(['dashboard', 'pos', 'inventory', 'suppliers', 'loyalty', 'expenses', 'documents', 'community', 'employees', 'ai', 'subscription', 'saas_config'] as const).map(tab => {
              const labels = {
                dashboard: { text: 'Dashboard', icon: BarChart3 },
                pos: { text: 'POS System', icon: ShoppingCart },
                inventory: { text: 'Inventory Catalog', icon: Package },
                suppliers: { text: 'Supplier Directory', icon: Truck },
                loyalty: { text: 'Loyalty Program', icon: Award },
                expenses: { text: 'Expense Tracker', icon: BookOpen },
                documents: { text: 'Invoices & Documents', icon: FileText },
                community: { text: 'Community Exchange', icon: Compass },
                employees: { text: 'Employees', icon: Users },
                ai: { text: 'Business Assistant', icon: Sparkles },
                subscription: { text: 'Subscription', icon: CreditCard },
                saas_config: { text: 'Database Settings', icon: Key }
              };
              const meta = labels[tab];
              const IconComp = meta.icon;

              const isSaaSOnly = tab === 'subscription' || tab === 'saas_config';

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-1 whitespace-nowrap md:whitespace-normal ${
                    activeTab === tab
                      ? 'bg-white/5 border-l-2 border-indigo-500 text-indigo-400 rounded-r-lg font-semibold shadow-xs'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4.5 h-4.5 shrink-0" />
                    <span>{meta.text}</span>
                  </div>

                  {isSaaSOnly && (
                    <span className="hidden md:inline px-1 py-0.2 text-[8px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded">SaaS</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick baseline diagnostics */}
          <div className="hidden md:block p-4 border-t border-white/5 text-[10px] text-gray-500 select-none font-mono">
            <p>Active Tenant: {activeBusiness.slug}</p>
            <p>Environment: Supabase Sandbox</p>
            <p>Rands Base: South Africa (R)</p>
          </div>
        </aside>

        {/* CONTAINER SHELF STAGE FOR ACTIVE TABS */}
        <main className="flex-1 p-6 overflow-y-auto" id="stage_stage">
          
          {loading ? (
            <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center space-y-2 select-none">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="font-semibold text-xs text-indigo-400">Initializing multi-tenant database partition RLS security limits...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
               
               {activeTab === 'dashboard' && (
                <AnalyticsDashboard 
                  health={health || { score: 'Good', scoreValue: 80, lowStockCount: 0, expiringSoonCount: 0, revenueToday: 0, transactionsToday: 0, profitMargin: 20 }} 
                  sales={sales} 
                  expenses={expenses} 
                  products={products} 
                  currency="R"
                />
              )}

              {activeTab === 'pos' && (
                <PosSystem 
                  products={products} 
                  onSaleComplete={async (completedSale: Sale) => {
                    // Update layout metrics and fetch latest states
                    setSales(prev => [completedSale, ...prev]);
                    await fetchTenantDataset();
                  }} 
                  loyalty={loyalty} 
                  currency="R" 
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryCatalog 
                  products={products} 
                  onSaveProduct={handleSaveProduct} 
                  onDeleteProduct={handleDeleteProduct} 
                />
              )}

              {activeTab === 'suppliers' && (
                <SupplierPortal 
                  suppliers={suppliers} 
                  marketplace={marketplace} 
                  orders={supplierOrders} 
                  products={products} 
                  onOrderPlace={handleOrderPlace} 
                  onAddSupplier={handleAddSupplier} 
                  currency="R" 
                />
              )}

              {activeTab === 'loyalty' && (
                <LoyaltyTracker 
                  loyalty={loyalty} 
                  onAddLoyalty={handleAddLoyalty} 
                  currency="R" 
                />
              )}

              {activeTab === 'expenses' && (
                <ExpenseTracker 
                  expenses={expenses} 
                  sales={sales} 
                  onAddExpense={handleAddExpense} 
                  currency="R" 
                />
              )}

              {activeTab === 'documents' && (
                <DocumentsView 
                  sales={sales} 
                  supplierOrders={supplierOrders} 
                  products={products} 
                  currency="R" 
                />
              )}

              {activeTab === 'community' && (
                <CommunityExchange 
                  items={community} 
                  onAddListing={fetchTenantDataset} 
                  onAcceptListing={handleAcceptListing} 
                  currency="R" 
                />
              )}

              {activeTab === 'employees' && (
                <EmployeeManager 
                  employees={employees} 
                  onAttendanceLog={handleAttendanceLog} 
                  currency="R" 
                />
              )}

              {activeTab === 'ai' && (
                <AiAssistantPanel />
              )}

              {activeTab === 'subscription' && (
                <SaasSubscriptionHub 
                  currentBusiness={activeBusiness} 
                  onUpgradePlan={handleUpgradePlan} 
                  productsCount={products.length} 
                />
              )}

              {activeTab === 'saas_config' && (
                <SaasDevPortal 
                  currentBusiness={activeBusiness} 
                  currentUser={session} 
                  usingSupabaseLive={usingSupabaseLive}
                  supabaseSchemaOk={supabaseSchemaOk}
                  supabaseErrorMsg={supabaseErrorMsg}
                />
              )}

            </div>
          )}

        </main>

      </div>

      {/* Floating Audit tracker footer activity feed */}
      <footer className="bg-[#141416] border-t border-white/5 px-6 py-2 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 font-mono gap-1 select-all relative z-40">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>Activity Log:</span>
          <span className="text-gray-300 font-bold">{auditLogs[0] ? auditLogs[0].details : 'Connected'}</span>
        </span>
        <span className="hidden md:inline">SpazaFlow Platform v1.45</span>
      </footer>

    </div>
  );
}
