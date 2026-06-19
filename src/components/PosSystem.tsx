import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Ticket, HelpCircle, Check, Printer, Share2, CornerDownRight, Scan, RotateCcw } from 'lucide-react';
import { Product, Sale, CustomerLoyalty } from '../types';

interface PosSystemProps {
  products: Product[];
  loyalty: CustomerLoyalty[];
  onSaleComplete: (newSale: Sale) => void;
  currency: string;
}

export default function PosSystem({ products, loyalty, onSaleComplete, currency }: PosSystemProps) {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string; discountValue: number; code: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'EFT' | 'Mobile/WhatsApp' | 'Loyalty'>('Cash');
  const [cashPaidAmount, setCashPaidAmount] = useState('');
  const [completedSaleSlip, setCompletedSaleSlip] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  
  // Quick cash keys for tender panel
  const quickCashAmounts = [10, 20, 50, 100, 200];

  // Filtering products
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Emulating Barcode Scanner
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const found = products.find(p => p.barcode === barcodeInput || p.id === barcodeInput);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
      // Flash success trigger
      setScannerActive(true);
      setTimeout(() => setScannerActive(false), 800);
    } else {
      alert(`Barcode ${barcodeInput} not recognized. Try typing standard: 5449000000996 (Coke) or 6002233445566 (Bread)`);
      setBarcodeInput('');
    }
  };

  // Add Item to checkout cart
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert(`Stock warning: ${product.name} is depleted! Sell with caution.`);
    }
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Remove / modify quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any);
  };

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  
  // Calculate discount
  const discountValue = appliedVoucher ? appliedVoucher.discountValue : 0;
  const finalTotal = Math.max(0, subtotal - discountValue);
  
  // S.A. VAT 15% inclusive breakdown
  const vatValue = parseFloat((finalTotal - (finalTotal / 1.15)).toFixed(2));
  const preVatSubtotal = parseFloat((finalTotal - vatValue).toFixed(2));

  // Handle Loyalty profile lookup
  const handleCustomerLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = customerSearch.trim();
    if (!cleanNum) return;
    const match = loyalty.find(l => l.phone === cleanNum || l.name.toLowerCase().includes(cleanNum.toLowerCase()));
    if (match) {
      setSelectedCustomer(match);
      setCustomerSearch('');
    } else {
      alert("No matching loyalty member found. Register them in the 'Loyalty' tab first!");
    }
  };

  // Redeem point vouchers
  const applyVoucherCode = (voucher: any) => {
    if (finalTotal < voucher.minSpend) {
      alert(`Min spend requirement of R${voucher.minSpend} not met to use voucher!`);
      return;
    }
    setAppliedVoucher({
      id: voucher.id,
      code: voucher.code,
      discountValue: voucher.discountValue
    });
  };

  // Process checkout POS action
  const handleCheckoutSubmit = async () => {
    if (!cart.length) {
      alert("Checkout cart is empty");
      return;
    }

    if (paymentMethod === 'Cash' && (!cashPaidAmount || parseFloat(cashPaidAmount) < finalTotal)) {
      alert(`Please enter a valid cash amount of at least R${finalTotal.toFixed(2)}`);
      return;
    }

    const checkoutItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.sellingPrice,
      quantity: item.quantity,
      total: item.product.sellingPrice * item.quantity
    }));

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          paymentMethod,
          paidAmount: paymentMethod === 'Cash' ? parseFloat(cashPaidAmount) : finalTotal,
          customerPhone: selectedCustomer ? selectedCustomer.phone : '',
          cashierName: 'Sipho Khumalo' // Cashier simulation
        })
      });

      if (!response.ok) {
        throw new Error('POS Sale execution endpoint error');
      }

      const completedSale: Sale = await response.json();
      onSaleComplete(completedSale);
      
      // Update local state and show receipt
      setCompletedSaleSlip(completedSale);
      setShowReceiptModal(true);
      
      // Clear Cart state
      setCart([]);
      setSelectedCustomer(null);
      setAppliedVoucher(null);
      setCashPaidAmount('');
    } catch (err) {
      console.error(err);
      alert('Failed to process sale on server. Operating offline.');
    }
  };

  // Print slip trigger
  const triggerPrintReceipt = () => {
    window.print();
  };

  // Simulated WhatsApp receipt dispatch
  const handleWhatsAppSend = () => {
    const tel = completedSaleSlip?.customerPhone || "0721234567";
    const body = `*SPAZAFLOW AI TAX INVOICE*%0A---------------------------%0AReceipt No: ${completedSaleSlip?.id}%0ADate: ${new Date().toLocaleDateString('en-ZA')}%0A---------------------------%0A${completedSaleSlip?.items.map(i => `${i.productName} (x${i.quantity}) - R${i.total}`).join('%0A')}%0A---------------------------%0ATOTAL DUE: R${completedSaleSlip?.total.toFixed(2)}%0APAID VIA: ${completedSaleSlip?.paymentMethod}%0ACHANGE: R${completedSaleSlip?.changeAmount.toFixed(2)}%0A---------------------------%0A*Thank you for supporting Sizwe Tuck Shop!*`;
    
    // Open relative prompt
    window.open(`https://api.whatsapp.com/send?phone=${tel}&text=${body}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="pos_module">
      
      {/* LEFT COLUMN: Products selector (cols 7) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search, Filter & Barcode Bar */}
        <div className="bg-[#141416] p-4 rounded-2xl border border-white/5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search inputs */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search Albany bread, Tastic, drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 outline-none focus:border-indigo-500 py-2.5 transition-colors text-xs text-white placeholder-gray-500"
              />
            </div>

            {/* Barcode Form emulation */}
            <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Scan / Type Barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className={`w-full pl-9 pr-16 py-2.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${
                  scannerActive 
                    ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/20 text-white font-mono' 
                    : 'border-white/10 focus:border-indigo-500 bg-[#0A0A0B] text-white font-mono placeholder-gray-500'
                }`}
              />
              <Scan className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg bg-white/10 hover:bg-indigo-650 hover:text-white text-gray-300 transition-colors"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Categories track */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map(p => {
            const isLow = p.stock <= p.minStock;
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-[#141416] p-3 rounded-2xl border border-white/5 hover:border-indigo-500/50 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between h-40 group relative overflow-hidden"
              >
                {isLow && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase font-bold bg-rose-500/10 text-rose-450 px-1.5 py-0.5 rounded-sm z-10 border border-rose-500/20">
                    Low stock ({p.stock})
                  </span>
                )}
                
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{p.category}</span>
                  <h4 className="font-bold text-gray-200 text-sm group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {p.name}
                  </h4>
                </div>

                <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="block text-[9px] uppercase font-semibold text-gray-500">Retail shelf</span>
                    <span className="text-sm font-bold font-mono text-white">
                      R{p.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-1 px-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-650 group-hover:text-white transition-colors uppercase">
                    + Add
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-[#141416] rounded-2xl border border-white/5">
              No spaza products match your current search queries.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart and billing panels (cols 5) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#141416] rounded-2xl border border-white/5 shadow-sm overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white">Checkout Basket</h3>
            </div>
            <span className="px-2.5 py-0.5 font-mono text-xs bg-white/10 text-gray-300 rounded-full">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
            </span>
          </div>

          {/* Cart items scrollable container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[220px]">
            {cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between border-b border-dashed border-white/5 pb-2.5 last:border-0 last:pb-0">
                <div className="flex-1 space-y-0.5 pr-2">
                  <h5 className="font-bold text-white text-sm line-clamp-1">{item.product.name}</h5>
                  <span className="text-xs text-gray-500 font-mono">
                    R{item.product.sellingPrice.toFixed(2)} each
                  </span>
                </div>

                <div className="flex items-center gap-2 px-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-405 hover:text-white hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm text-white w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-405 hover:text-white hover:bg-white/10 rounded-lg text-sm border border-white/10 transition-colors"
                  >
                    +
                  </button>
                </div>

                <span className="font-mono font-bold text-sm text-white pr-1 text-right w-16">
                  R{(item.product.sellingPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-1">
                <ShoppingCart className="w-10 h-10 opacity-20 text-indigo-400" />
                <p className="text-sm font-semibold text-gray-300">Tuck shop basket is empty.</p>
                <p className="text-xs max-w-[220px]">Click any product card on the left or type barcode scan inputs.</p>
              </div>
            )}
          </div>

          {/* Loyalty & Voucher drawer */}
          <div className="p-4 bg-white/5 py-3 border-t border-white/5 space-y-2.5">
            {/* Loyalty identifier search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter Cashier Customer's Phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-[#0A0A0B] border border-white/10 outline-none text-xs text-white focus:border-indigo-505 placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleCustomerLookup}
                className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all whitespace-nowrap"
              >
                Apply Member
              </button>
            </div>

            {/* If loyalty connected, display details and voucher rewards */}
            {selectedCustomer && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative">
                <button 
                  onClick={() => { setSelectedCustomer(null); setAppliedVoucher(null); }}
                  className="absolute right-2 top-2 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  Clear x
                </button>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    👥 Member: {selectedCustomer.name}
                  </span>
                  <span className="font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded font-bold">
                    {selectedCustomer.points} Points
                  </span>
                </div>
                
                {/* Available special loyalty vouchers */}
                {selectedCustomer.vouchers.length > 0 && (
                  <div className="mt-2 space-y-1 bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] uppercase tracking-wider text-gray-450 font-mono block">Apply Eligible Voucher:</span>
                    {selectedCustomer.vouchers.filter(v => !v.isUsed).map(v => (
                      <button
                        key={v.id}
                        onClick={() => applyVoucherCode(v)}
                        disabled={appliedVoucher?.id === v.id}
                        className={`w-full text-left p-1 text-[10px] font-medium rounded flex justify-between items-center border transition-all ${
                          appliedVoucher?.id === v.id
                            ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                            : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300 hover:border-indigo-500/50'
                        }`}
                      >
                        <span>🎫 {v.description}</span>
                        <span className="font-bold text-indigo-455">R{v.discountValue} Off</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout billing grid */}
          <div className="p-4 bg-white/5 text-white space-y-3.5 border-t border-white/5">
            {/* Split breakdown */}
            <div className="space-y-1 font-mono text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal (Excl. VAT):</span>
                <span>R{preVatSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>S.A. VAT (15% Inc.):</span>
                <span>R{vatValue.toFixed(2)}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-500/10 p-1 rounded px-1.5 border border-emerald-500/20 font-sans">
                  <span>Voucher Discount applied [{appliedVoucher.code}]:</span>
                  <span>-R{appliedVoucher.discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-sans font-bold text-white pt-1">
                <span>FINAL TOTAL DUE:</span>
                <span className="text-indigo-400 font-mono text-lg font-extrabold">R{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment selection panel */}
            <div className="grid grid-cols-5 gap-1 pt-1 shrink-0">
              {(['Cash', 'Card', 'EFT', 'Mobile/WhatsApp', 'Loyalty'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider block text-center border transition-all ${
                    paymentMethod === method
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-102 font-extrabold'
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {method === 'Mobile/WhatsApp' ? 'Mobile' : method}
                </button>
              ))}
            </div>

            {/* Conditional tender inputs */}
            {paymentMethod === 'Cash' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-gray-400">Cash Received Tender:</span>
                  <input
                    type="number"
                    placeholder="E.g. 100"
                    value={cashPaidAmount}
                    onChange={(e) => setCashPaidAmount(e.target.value)}
                    className="flex-1 bg-[#0A0A0B] border border-white/10 outline-none px-3 py-1.5 rounded-lg text-xs text-white font-mono text-right focus:border-indigo-505"
                  />
                </div>
                
                {/* Tender quick amounts */}
                <div className="flex gap-1.5 justify-end">
                  {quickCashAmounts.map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashPaidAmount((amt).toString())}
                      className="px-2.5 py-1 text-[10px] font-mono rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5"
                    >
                      +R{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashPaidAmount(finalTotal.toFixed(0))}
                    className="px-2 py-1 text-[10px] bg-indigo-950 border border-indigo-800 hover:bg-indigo-900 text-indigo-200 transition-colors rounded uppercase font-bold"
                  >
                    Exact R{finalTotal.toFixed(0)}
                  </button>
                </div>

                {parseFloat(cashPaidAmount) >= finalTotal && (
                  <div className="text-center font-mono text-emerald-400 text-xs bg-emerald-500/15 py-1.5 rounded border border-emerald-500/20">
                    Change Render: R{(parseFloat(cashPaidAmount) - finalTotal).toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5 text-center">
                Digital Payment Simulation: POS will trigger immediate {paymentMethod} reader handshake.
              </div>
            )}

            {/* Process POS Sale button */}
            <button
              onClick={handleCheckoutSubmit}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                cart.length === 0
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-indigo-650 hover:bg-indigo-600 text-white shadow-md active:scale-98'
              }`}
            >
              <span>💳 Process & Save POS Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* RETAIL SLIP TAX INVOICE MODAL (PRINTING / WHATSAPP PREVIEW) */}
      {showReceiptModal && completedSaleSlip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] rounded-2xl border border-white/10 shadow-xl max-w-sm w-full p-5 overflow-hidden flex flex-col justify-between max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-white animate-once">
            
            {/* SLIP SCREEN */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-white/10">
                <span className="inline-block text-xs font-mono font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/15 px-3 py-1 rounded-full">
                  SIZWE KASI TUCK SHOP
                </span>
                <h4 className="font-bold text-white font-sans mt-2">Spaza POS Terminal</h4>
                <p className="text-[10px] text-gray-400">Khayelitsha Road, Orlando East, Soweto</p>
                <p className="text-[10px] text-gray-500 font-mono">VAT Registration: 4920239414 <br /> Receipt ID: {completedSaleSlip.id}</p>
              </div>

              {/* Timestamp & Operator details */}
              <div className="py-2.5 text-[11px] font-mono text-gray-400 flex justify-between border-b border-dashed border-white/10">
                <span>Date: {new Date(completedSaleSlip.timestamp).toLocaleString()}</span>
                <span>Cashier: Sipho</span>
              </div>

              {/* Bill items list */}
              <div className="py-3.5 space-y-2 border-b border-dashed border-white/10 font-mono text-[11px]">
                {completedSaleSlip.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white block text-sm">{item.productName}</span>
                      <span className="text-gray-400">x{item.quantity} @ R{item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-white">R{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* VAT calculations */}
              <div className="py-3.5 space-y-1 border-b border-dashed border-white/10 font-mono text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Net (Excl. VAT):</span>
                  <span>R{completedSaleSlip.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 pb-1">
                  <span>S.A. VAT (15% incl):</span>
                  <span>R{completedSaleSlip.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-sans font-extrabold text-white border-t border-dashed border-white/10 pt-1.5">
                  <span>TOTAL TAX INVOICE:</span>
                  <span className="text-indigo-400">R{completedSaleSlip.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Transactions change details */}
              <div className="py-3 space-y-1.5 bg-white/5 p-2.5 rounded-lg border border-white/5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-300">Payment Protocol:</span>
                  <span className="font-bold uppercase text-white bg-white/10 px-1 py-0.2 rounded-sm text-[9px]">{completedSaleSlip.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount tendered:</span>
                  <span>R{completedSaleSlip.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bold">
                  <span>Change refunded:</span>
                  <span>R{completedSaleSlip.changeAmount.toFixed(2)}</span>
                </div>
                {completedSaleSlip.pointsEarned ? (
                  <div className="flex justify-between text-indigo-400 font-bold border-t border-dashed border-white/15 pt-1 mt-1 text-[10px]">
                    <span>👥 Spaza Loyalty Points:</span>
                    <span>+{completedSaleSlip.pointsEarned} Points</span>
                  </div>
                ) : null}
              </div>

              <div className="text-center text-gray-500 text-[10px] py-4 space-y-1">
                <p>Nceda uphathe i-loyalty card yakho.</p>
                <p>*** Thank you! Enkosi! Sharp-sharp! ***</p>
                <p className="font-mono text-[8px] text-gray-650">Powered by SpazaFlow AI Core</p>
              </div>
            </div>

            {/* BUTTON CONTROLS */}
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <button
                onClick={triggerPrintReceipt}
                className="py-2.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/10"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Simulate Print</span>
              </button>
              <button
                onClick={handleWhatsAppSend}
                className="py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Slip</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="col-span-2 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition-all"
              >
                Back to POS Counter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
