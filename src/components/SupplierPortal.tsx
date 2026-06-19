import React, { useState } from 'react';
import { Truck, ShoppingCart, ShieldAlert, BadgePercent, CheckCircle, Clock, FilePlus, ChevronRight } from 'lucide-react';
import { Supplier, MarketplaceProduct, SupplierOrder, Product } from '../types';

interface SupplierPortalProps {
  suppliers: Supplier[];
  marketplace: MarketplaceProduct[];
  orders: SupplierOrder[];
  products: Product[];
  onOrderPlace: (order: Partial<SupplierOrder>) => Promise<void>;
  onAddSupplier: (sup: Partial<Supplier>) => Promise<void>;
  currency: string;
}

export default function SupplierPortal({ suppliers, marketplace, orders, products, onOrderPlace, onAddSupplier, currency }: SupplierPortalProps) {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'directory' | 'orders'>('marketplace');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('All');
  const [cart, setCart] = useState<{ product: MarketplaceProduct; qty: number }[]>([]);

  // Directory form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supCat, setSupCat] = useState('Staples');
  const [supAddress, setSupAddress] = useState('');

  const filteredMarketplace = marketplace.filter(item => 
    selectedSupplierId === 'All' || item.supplierId === selectedSupplierId
  );

  // Cart operations
  const addToCart = (product: MarketplaceProduct) => {
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, { product, qty: product.minOrderQty }]);
    }
  };

  const handleUpdateCartQty = (productId: string, val: number) => {
    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const nextQty = Math.max(i.product.minOrderQty, i.qty + val);
        return { ...i, qty: nextQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.product.id !== id));
  };

  const cartTotal = cart.reduce((acc, i) => acc + (i.product.price * i.qty), 0);

  // Submit Purchase order
  const handleCheckoutOrder = async (supplierId: string, supplierName: string) => {
    const supplierItems = cart.filter(i => i.product.supplierId === supplierId);
    if (!supplierItems.length) return;

    const orderPayload = {
      supplierId,
      supplierName,
      items: supplierItems.map(i => ({
        name: i.product.name,
        quantity: i.qty,
        price: i.product.price
      })),
      total: supplierItems.reduce((acc, i) => acc + (i.product.price * i.qty), 0)
    };

    await onOrderPlace(orderPayload);
    alert(`Purchase order dispatched to ${supplierName}! Items will arrive in 12s, which will automatically replenish your spaza shelves & record expenses.`);
    
    // Clear cart of these supplier products
    setCart(cart.filter(i => i.product.supplierId !== supplierId));
  };

  // Add brand new supplier contact details
  const handleAddSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    await onAddSupplier({
      name: supName,
      contactPerson: supContact,
      phone: supPhone,
      email: supEmail,
      category: supCat,
      address: supAddress
    });

    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="supplier_view">
      
      {/* Navigation Sub Tab bar */}
      <div className="flex justify-between items-center bg-[#141416] p-2 rounded-2xl border border-white/5 shadow-xs flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'marketplace'
                ? 'bg-indigo-650 text-white shadow-xs font-extrabold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            🛒 Wholesaler Marketplace
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-650 text-white shadow-xs font-extrabold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            📋 Purchase History & POs
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'directory'
                ? 'bg-indigo-650 text-white shadow-xs font-extrabold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            👥 Supplier Contact Directory
          </button>
        </div>

        {activeTab === 'directory' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-bold shrink-0 self-end sm:self-auto border border-indigo-500/20"
          >
            + Register Supplier Profile
          </button>
        )}
      </div>

      {/* RENDER TAB 1: Supplier Marketplace listings */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Marketplace listing cards (cols 8) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Wholesalers partner filter row */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
              <span className="text-gray-500 text-xs font-mono font-semibold uppercase whitespace-nowrap">Filter partner:</span>
              <button
                onClick={() => setSelectedSupplierId('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${
                  selectedSupplierId === 'All' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 text-gray-305 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                All Wholesalers
              </button>
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSupplierId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap ${
                    selectedSupplierId === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-extrabold' : 'bg-white/5 text-gray-305 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Wholesale products listings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMarketplace.map(item => {
                // Find retail price of matching item if database matches
                const kw = item.name.split(" ")[0];
                const relativeProduct = products.find(p => p.name.includes(kw));

                return (
                  <div key={item.id} className="bg-[#141416] rounded-2xl border border-white/5 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover opacity-85"
                    />
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-500 font-mono block">
                          {item.supplierName}
                        </span>
                        <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug">
                          {item.name}
                        </h4>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/5">
                        {/* Wholesaler price info */}
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[10px] text-gray-505 uppercase">Wholesale bulk price</span>
                            <span className="block font-mono text-base font-bold text-white">
                              R{item.price.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                            Min Qty: {item.minOrderQty} packs
                          </span>
                        </div>

                        {/* Retail pricing comparative logic help */}
                        {relativeProduct && (
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px] border border-indigo-500/15 space-y-0.5 flex items-start gap-1">
                            <BadgePercent className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                            <div>
                              <span>Matched retail: <strong>R{relativeProduct.sellingPrice.toFixed(2)}</strong> ({relativeProduct.name})</span>
                              <span className="block font-semibold text-[10px] text-indigo-200">Restocking is highly recommended to increase profit margins.</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => addToCart(item)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-colors rounded-xl text-xs font-bold"
                        >
                          + Add to Purchase Order
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE DISPATCH PO BASKET (cols 4) */}
          <div className="lg:col-span-4">
            <div className="bg-[#141416] rounded-2xl border border-white/5 shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-between">
              <div>
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-bold text-white text-sm">Wholesale PO Drafts</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono text-[10px] font-bold">
                    {cart.length} Packs
                  </span>
                </div>

                {/* Draft PO items */}
                <div className="p-4 space-y-3 max-h-[250px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0 text-white">
                      <div className="flex-1 pr-2">
                        <span className="text-[10px] font-mono text-gray-500 block truncate">{item.product.supplierName}</span>
                        <h5 className="font-bold text-gray-200 truncate">{item.product.name}</h5>
                        <span className="text-gray-400 font-mono">R{item.product.price} x {item.qty}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mr-2 shrink-0">
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center bg-white/15 hover:bg-white/20 rounded font-bold text-white"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold w-4 text-center text-white">{item.qty}</span>
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center bg-white/15 hover:bg-white/20 rounded font-bold text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-rose-450 hover:text-rose-350 font-bold px-1"
                      >
                        x
                      </button>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                      <ShoppingCart className="w-8 h-8 opacity-20 text-gray-500 mb-1" />
                      <p className="font-semibold text-xs">No PO items drafted.</p>
                      <p className="text-[10px] text-gray-500 max-w-[180px]">Click any wholesaler card on the left to add stocks.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Draft actions and checkout totals grouped per wholesaler */}
              {cart.length > 0 && (
                <div className="p-4 bg-white/5 text-white space-y-3 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-gray-400">Aggregated Wholesaler Total:</span>
                    <span className="font-mono text-base font-bold text-indigo-400">
                      R{cartTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Dispatch PO individual action buttons per Wholesaler grouped */}
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {Array.from(new Set(cart.map(i => i.product.supplierId))).map(supId => {
                      const idStr = supId as string;
                      const sName = cart.find(i => i.product.supplierId === idStr)?.product.supplierName || "Supplier";
                      const sTotal = cart.filter(i => i.product.supplierId === idStr).reduce((s, i) => s + (i.product.price * i.qty), 0);
                      return (
                        <button
                          key={idStr}
                          onClick={() => handleCheckoutOrder(idStr, sName)}
                          className="w-full p-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[10px] uppercase font-bold tracking-wider flex justify-between items-center transition-all active:scale-98"
                        >
                          <span>Log PO with {sName.split(" ")[0]} ➔</span>
                          <span className="font-mono bg-white/10 px-2 py-0.5 rounded">R{sTotal.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* RENDER TAB 2: Purchase order history */}
      {activeTab === 'orders' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold text-slate-800 text-sm">Purchase Order log & Delivery checks</h4>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map(order => {
              const dateStr = new Date(order.timestamp).toLocaleString();
              let statusTheme = { bg: 'bg-slate-50 text-slate-500 border-slate-100', dot: 'bg-slate-400' };
              if (order.status === 'Shipped') statusTheme = { bg: 'bg-sky-50 text-sky-800 border-sky-100', dot: 'bg-sky-500' };
              if (order.status === 'Delivered') statusTheme = { bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-500' };

              return (
                <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-800">PO Ref ID: {order.id}</span>
                      <span className="text-[10px] text-slate-450 font-mono">Date: {dateStr}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 block">Deliver to: {order.supplierName}</span>
                    <div className="text-xs text-slate-500 pl-2 border-l-2 border-slate-200 mt-1 space-y-0.5">
                      {order.items.map((i, index) => (
                        <div key={index} className="flex gap-1">
                          <ChevronRight className="w-3.5 h-3.5 mt-0.2 select-none" />
                          <span>{i.name} (x{i.quantity} packs) - @ R{i.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 uppercase">Aggregate Payable</span>
                      <span className="font-mono text-sm font-bold text-slate-800">
                        R{order.total.toFixed(2)}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] tracking-wider uppercase font-extrabold rounded-lg border flex items-center gap-1 w-28 justify-center ${statusTheme.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dot}`}></span>
                      <span>{order.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                No purchases currently found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 3: Supplier Contact directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4 text-white">
          
          {showAddForm && (
            <form onSubmit={handleAddSupplierSubmit} className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="border-b border-white/5 pb-2 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Register Supplier contacts Card</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Corporate Registered Name *</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="E.g. JHB Produce Wholesale Center"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Key Account Contact Person</label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="E.g. Musa Zulu"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Corporate Phone numbers</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="E.g. 011 922 4531"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Active email inbox</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="E.g. info@jhbproduce.co.za"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-505 placeholder-gray-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Category scope</label>
                  <input
                    type="text"
                    value={supCat}
                    onChange={(e) => setSupCat(e.target.value)}
                    placeholder="E.g. Fresh Produce, Bakery, Liquids"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold uppercase text-gray-400">Headquarters building physical coordinates</label>
                  <input
                    type="text"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    placeholder="E.g. City Deep Depot, Johannesburg"
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-650"
                  />
                </div>

                <div className="col-span-full flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold"
                  >
                    Save Supplier Card
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Directory Listings map card layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-[#141416] p-4 rounded-2xl border border-white/5 shadow-xs flex flex-col justify-between hover:border-indigo-505/25 transition-colors">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded block w-fit">
                    {s.category}
                  </span>
                  <h4 className="font-bold text-white text-sm leading-tight pt-1">
                    {s.name}
                  </h4>
                  <div className="space-y-1 text-gray-450 text-xs pt-1 border-t border-white/5">
                    <p>🧔 Contact: <span className="font-semibold text-gray-300">{s.contactPerson}</span></p>
                    <p>📞 Phone: <span className="font-mono text-gray-305">{s.phone}</span></p>
                    <p>✉️ Inbox: <span className="font-mono text-gray-300 text-[11px] truncate block">{s.email}</span></p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono mt-3">
                  📍 {s.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
