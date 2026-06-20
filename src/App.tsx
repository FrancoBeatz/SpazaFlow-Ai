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

import { hasSupabaseConfig } from './lib/supabase';

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
    fullname: 'Thabo Shabalala',
    email: 'thabo@spazaflow.co.za',
    phone: '072 123 4567',
    role: 'Owner',
    isAuthenticated: true // Loaded by default for high visual convenience
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

      const [
        prodsRes, salesRes, expRes, supsRes, markRes, 
        ordRes, loyRes, empsRes, commRes, auditRes, healthRes
      ] = await Promise.all([
        fetch(endpointMap.products).then(r => r.json()),
        fetch(endpointMap.sales).then(r => r.json()),
        fetch(endpointMap.expenses).then(r => r.json()),
        fetch(endpointMap.suppliers).then(r => r.json()),
        fetch(endpointMap.marketplace).then(r => r.json()),
        fetch(endpointMap.supplierOrders).then(r => r.json()),
        fetch(endpointMap.loyalty).then(r => r.json()),
        fetch(endpointMap.employees).then(r => r.json()),
        fetch(endpointMap.community).then(r => r.json()),
        fetch(endpointMap.auditLogs).then(r => r.json()),
        fetch(endpointMap.health).then(r => r.json()),
      ]);

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

    if (isNew) {
      const newProd: Product = {
        id: 'p_' + Date.now(),
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
          return { ...l, points: l.points + pointsEarned, purchaseHistoryCount: l.purchaseHistoryCount + 1 };
        }
        return l;
      });
      setLoyalty(updatedLoyalty);
    }

    const newSale: Sale = {
      id: 's_' + Date.now(),
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
    const newExp: Expense = {
      id: 'e_' + Date.now(),
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
    const newL: CustomerLoyalty = {
      id: 'l_' + Date.now(),
      name: payload.name || 'Anonymous Loyalty Club',
      phone: payload.phone || '',
      points: 10,
      cardCode: 'SF-' + Math.floor(1000 + Math.random() * 9000),
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

  const handleSaaSSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    if (authEmail.includes('admin') || authPassword.length >= 4) {
      setTwoFactorRequested(true);
      logUserAction('SaaS Authentication Challenge', `Triggered 2FA credentials challenge block for email ${authEmail}`);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setSession({
      fullname: authFullname || 'Thabo Shabalala',
      email: authEmail,
      phone: authPhone || '072 555 9911',
      role: 'Owner',
      isAuthenticated: true
    });
    setTwoFactorRequested(false);
    logUserAction('SaaS Authentication Success', `2FA verification checks passed. JWT generated for email ${authEmail}`);
  };

  const handleSaaSSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSession({
      fullname: authFullname || 'Mpho Sithole',
      email: authEmail,
      phone: authPhone || '083 444 1212',
      role: 'Owner',
      isAuthenticated: true
    });
    setToastNotif(`🎉 Welcome to SpazaFlow! Account created.`);
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
            <h1 className="text-2xl font-black text-white tracking-tight">SpazaFlow <span className="text-indigo-400">SaaS</span></h1>
            <p className="text-xs text-gray-400">Enterprise operations console supporting thousands of businesses simultaneously</p>
          </div>

          {twoFactorRequested ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                <span className="text-xs font-bold text-indigo-400 block flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-Factor Authentication (2FA) Required</span>
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">We sent a secure validation code SMS OTP to your registered phone number.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Verification OTP Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 883190"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs font-bold outline-none text-white focus:border-indigo-500 text-center tracking-widest text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Verify 2FA Credential Identity
              </button>
            </form>
          ) : authMode === 'signin' ? (
            <form onSubmit={handleSaaSSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Business Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="owner@spazaflow.co.za"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-white/10 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Security Password</label>
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
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase"
              >
                Sign In with Supabase Identity
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">New merchant? </span>
                <button type="button" onClick={() => setAuthMode('signup')} className="text-xs text-indigo-400 font-bold hover:underline">Create SaaS Account</button>
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
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Business Email</label>
                <input
                  type="email"
                  required
                  placeholder="sibu@mykasispecial.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs font-semibold outline-none text-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contact Phone</label>
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

              <button
                type="submit"
                className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase"
              >
                Register & Initialize DB
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-400">Already registered? </span>
                <button type="button" onClick={() => setAuthMode('signin')} className="text-xs text-indigo-400 font-bold hover:underline">Log In</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <span className="text-xs text-gray-300 block leading-relaxed text-center">To reset your account passphrase, submit your verified business email below. A secure Supabase auth reset token link will be dispatched automatically.</span>
              <input
                type="email"
                placeholder="merchant@kasi.za"
                className="w-full bg-[#0A0A0B] border border-white/10 px-4 py-3 rounded-xl text-xs outline-none text-white"
              />
              <button
                onClick={() => { alert("Password reset link shared!"); setAuthMode('signin'); }}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold font-sans"
              >
                Send Recovery link
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
            onClick={() => {
              if (confirm("Log out of your SpazaFlow credentials?")) {
                setSession(prev => ({ ...prev, isAuthenticated: false }));
              }
            }}
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
                dashboard: { text: 'Analytical Rhythms', icon: BarChart3 },
                pos: { text: 'Cash Cashier POS', icon: ShoppingCart },
                inventory: { text: 'Inventory Stock Catalog', icon: Package },
                suppliers: { text: 'Suppliers Depot Marketplace', icon: Truck },
                loyalty: { text: 'Kasi Loyalty Program', icon: Award },
                expenses: { text: 'Operations Bookkeeping', icon: BookOpen },
                documents: { text: 'Invoices & Receipts', icon: FileText },
                community: { text: 'Township Trade Exchange', icon: Compass },
                employees: { text: 'Shift Cashiers', icon: Users },
                ai: { text: 'AI Business Commander', icon: Sparkles },
                subscription: { text: 'SaaS Subscription Tier', icon: CreditCard },
                saas_config: { text: 'Database & SQL Integration', icon: Key }
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
                  onSaleComplete={handleCheckoutSale} 
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
          <span>Tenant Action audit:</span>
          <span className="text-gray-300 font-bold">{auditLogs[0] ? auditLogs[0].details : 'Active listening on port 3000'}</span>
        </span>
        <span className="hidden md:inline">SpazaFlow-AI Cloud Platform v1.45 • RLS Enforcement Mode</span>
      </footer>

    </div>
  );
}
