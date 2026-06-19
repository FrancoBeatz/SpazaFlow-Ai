import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShoppingCart, Package, Users, Compass, 
  Settings2, Activity, RefreshCw, Sparkles, HelpCircle,
  Truck, Award, AlertTriangle, BookOpen, Receipt, FileText
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

// Types
import { 
  Product, Sale, Expense, Supplier, MarketplaceProduct, 
  SupplierOrder, CustomerLoyalty, Employee, CommunityMarketplaceItem, 
  AuditLog, BusinessHealth 
} from './types';

type TabType = 'dashboard' | 'pos' | 'inventory' | 'suppliers' | 'loyalty' | 'expenses' | 'documents' | 'community' | 'employees' | 'ai';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Data State
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

  // Loading indicator states
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<string | null>(null);

  // Toast alert auto-clear
  useEffect(() => {
    if (notif) {
      const timer = setTimeout(() => setNotif(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  // Load everything from express backend
  const fetchAllData = async () => {
    try {
      const [
        prodsRes, salesRes, expRes, supsRes, markRes, 
        ordRes, loyRes, empsRes, commRes, auditRes, healthRes
      ] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/marketplace').then(r => r.json()),
        fetch('/api/supplier-orders').then(r => r.json()),
        fetch('/api/loyalty').then(r => r.json()),
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/community').then(r => r.json()),
        fetch('/api/audit').then(r => r.json()),
        fetch('/api/health-score').then(r => r.json()),
      ]);

      setProducts(prodsRes);
      setSales(salesRes);
      setExpenses(expRes);
      setSuppliers(supsRes);
      setMarketplace(markRes);
      
      // Delivery Alert check triggers
      const preOrders = supplierOrders;
      setSupplierOrders(ordRes);
      
      // Check if some pending order in state now is status "Delivered" inside the response
      if (preOrders.length > 0) {
        const newlyDelivered = ordRes.find((newO: any) => {
          const matchingOld = preOrders.find(oldO => oldO.id === newO.id);
          return matchingOld && matchingOld.status === 'Pending' && newO.status === 'Delivered';
        });

        if (newlyDelivered) {
          setNotif(`🎁 Wholesaler Delivery arrived! ${newlyDelivered.supplierName} stocks added to shelf.`);
        }
      }

      setLoyalty(loyRes);
      setEmployees(empsRes);
      setCommunity(commRes);
      setAuditLogs(auditRes);
      setHealth(healthRes);
    } catch (error) {
      console.error("Error fetching data from server: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Poll endpoints every 5 seconds to catch delivery simulation actions effortlessly
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  // API Call Helpers
  const handleSaveProduct = async (payload: Partial<Product>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAllData();
  };

  const handleCheckoutSale = async (cartItems: any[], paymentMethod: string, paidAmount: number, customerPhone: string) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        paymentMethod,
        paidAmount,
        customerPhone
      })
    });
    if (res.ok) {
      fetchAllData();
      return await res.json();
    }
    return null;
  };

  const handleAddExpense = async (payload: Partial<Expense>) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleOrderPlace = async (payload: Partial<SupplierOrder>) => {
    const res = await fetch('/api/supplier-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleAddSupplier = async (payload: Partial<Supplier>) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleAddLoyalty = async (payload: Partial<CustomerLoyalty>) => {
    const res = await fetch('/api/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleAttendanceLog = async (employeeId: string, isClockIn: boolean) => {
    const res = await fetch('/api/employees/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, isClockIn })
    });
    if (res.ok) fetchAllData();
  };

  const handleAddListing = async (payload: Partial<CommunityMarketplaceItem>) => {
    const res = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) fetchAllData();
  };

  const handleAcceptListing = async (id: string) => {
    const res = await fetch(`/api/community/accept/${id}`, { method: 'POST' });
    if (res.ok) fetchAllData();
  };

  const handleDatabaseReset = async () => {
    if (confirm("Reset Soweto Database back to default seeded presets? All mock customizations will be wiped.")) {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        fetchAllData();
        alert("Database successfully restored!");
      }
    }
  };

  return (
    <div className="bg-[#0A0A0B] min-h-screen text-[#F4F4F5] flex flex-col font-sans relative antialiased leading-normal">
      
      {/* Dynamic Toast banner notification channel */}
      {notif && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-[#141416] border border-white/10 text-white rounded-2xl shadow-xl flex items-center gap-3 max-w-sm animate-bounce">
          <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold block text-indigo-400">Delivery Arrived</span>
            <p className="text-slate-300">{notif}</p>
          </div>
        </div>
      )}

      {/* CORE HEADER BAR */}
      <header className="bg-[#141416] border-b border-white/5 py-3.5 px-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-indigo-650 text-white rounded-xl flex items-center justify-center font-black text-xl italic shadow-md shadow-indigo-650/15">
            S
          </div>
          <div>
            <span className="flex items-center gap-1.5">
              <h1 className="font-bold text-xl tracking-tight text-white">SpazaFlow <span className="text-indigo-400">AI</span></h1>
              <span className="text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-450 rounded border border-indigo-500/20">SA Township Edition</span>
            </span>
            <p className="text-[11px] text-gray-400 font-medium">Modern operations controller tailored for local tuck shops</p>
          </div>
        </div>

        {/* Business Health and quick tools */}
        {health && (
          <div className="flex items-center gap-4.5 select-none text-xs flex-wrap justify-center">
            
            {/* Health Indicators */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 py-1.5 rounded-xl">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-400 font-mono block">Health score</span>
                <span className="font-extrabold text-white">{health.score} ({health.scoreValue}%)</span>
              </div>
            </div>

            {/* Expiring warnings */}
            {health.expiringSoonCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 p-2 py-1.5 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-300 font-mono block">Expiry Warnings</span>
                  <span className="font-extrabold">{health.expiringSoonCount} products expiring</span>
                </div>
              </div>
            )}

            {/* Low stock indicators */}
            {health.lowStockCount > 0 && (
              <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2 py-1.5 rounded-xl">
                <Package className="w-4 h-4 shrink-0 text-rose-500" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-rose-300 font-mono block">Out of stock</span>
                  <span className="font-extrabold">{health.lowStockCount} items low</span>
                </div>
              </div>
            )}

            {/* Reseed control panel button */}
            <button
              onClick={handleDatabaseReset}
              className="px-3.5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-semibold tracking-wide transition-all flex items-center gap-1.5 bg-[#141416]/50 text-[11px] text-gray-300 hover:text-white"
              title="Auckland Park Seed baseline restorer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reseed Preset Data</span>
            </button>

          </div>
        )}
      </header>

      {/* RENDER BODY PLATFORM FRAME */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* SIDE BAR NAVIGATION RAIL (or scrollable top bar on mobile screens) */}
        <aside className="bg-[#141416] border-r border-white/5 w-full md:w-64 max-h-[140px] md:max-h-none overflow-y-auto shrink-0 flex flex-col justify-between shadow-2xs">
          
          <div className="p-4 space-y-1 w-full flex md:flex-col overflow-x-auto md:overflow-x-visible md:h-auto gap-1 md:gap-0 shrink-0">
            
            {(['dashboard', 'pos', 'inventory', 'suppliers', 'loyalty', 'expenses', 'documents', 'community', 'employees', 'ai'] as const).map(tab => {
              const labels = {
                dashboard: { text: 'Analytical Rhythms', icon: BarChart3 },
                pos: { text: 'Cash cashier POS', icon: ShoppingCart },
                inventory: { text: 'Inventory Stock Catalog', icon: Package },
                suppliers: { text: 'Suppliers Depot Marketplace', icon: Truck },
                loyalty: { text: 'Kasi Loyalty Program', icon: Award },
                expenses: { text: 'Operations Bookkeeping', icon: BookOpen },
                documents: { text: 'Invoices & Receipts', icon: FileText },
                community: { text: 'Township Trade exchange', icon: Compass },
                employees: { text: 'Shift Cashiers', icon: Users },
                ai: { text: 'AI Business commanders', icon: Sparkles }
              };
              const meta = labels[tab];
              const IconComp = meta.icon;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 whitespace-nowrap md:whitespace-normal ${
                    activeTab === tab
                      ? 'bg-white/5 border-l-2 border-indigo-500 text-indigo-400 rounded-r-lg font-semibold'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{meta.text}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block p-4.5 border-t border-white/5 text-[10px] text-gray-500 select-none font-mono">
            <p>Platform: SpazaFlow AI v1.4</p>
            <p>Database: JSON Persistence</p>
            <p>Location: Johannesburg (SA)</p>
          </div>
        </aside>

        {/* CONTAINER SHELF STAGE FOR ACTIVE TABS */}
        <main className="flex-1 p-6 overflow-y-auto" id="stage_stage">
          
          {loading ? (
            <div className="py-24 text-center text-gray-400 flex flex-col items-center justify-center space-y-2 select-none">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-555" />
              <p className="font-semibold text-xs text-indigo-400">Summoning Johannesburg township spaza registries...</p>
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
                  onSaleComplete={fetchAllData} 
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
                  onAddListing={handleAddListing} 
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

            </div>
          )}

        </main>

      </div>

    </div>
  );
}
