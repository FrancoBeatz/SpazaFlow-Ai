import React, { useState } from 'react';
import { FileText, Printer, CheckCircle, Download, CornerRightDown, Plus, Eye, Share } from 'lucide-react';
import { Sale, SupplierOrder, Product } from '../types';

interface DocumentsViewProps {
  sales: Sale[];
  supplierOrders: SupplierOrder[];
  products: Product[];
  currency: string;
}

export default function DocumentsView({ sales, supplierOrders, products, currency }: DocumentsViewProps) {
  const [activeDocType, setActiveDocType] = useState<'invoice' | 'po' | 'quote' | 'delivery'>('invoice');
  const [selectedSaleId, setSelectedSaleId] = useState<string>(sales[0]?.id || '');
  const [selectedPoId, setSelectedPoId] = useState<string>(supplierOrders[0]?.id || '');
  
  // Custom Quotation Builder state
  const [quoteCustomer, setQuoteCustomer] = useState('Gogo Thandi Mzobe');
  const [quotePhone, setQuotePhone] = useState('072 112 5543');
  const [quoteItems, setQuoteItems] = useState<{ product: Product; qty: number }[]>([
    { product: products[0], qty: 2 },
    { product: products[1], qty: 1 }
  ]);
  const [additionalItem, setAdditionalItem] = useState(products[0]?.id || '');

  const selectedSale = sales.find(s => s.id === selectedSaleId) || sales[0];
  const selectedPo = supplierOrders.find(o => o.id === selectedPoId) || supplierOrders[0];

  const handleAddQuoteItem = () => {
    const prod = products.find(p => p.id === additionalItem);
    if (!prod) return;
    const existing = quoteItems.find(i => i.product.id === prod.id);
    if (existing) {
      setQuoteItems(quoteItems.map(i => i.product.id === prod.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setQuoteItems([...quoteItems, { product: prod, qty: 1 }]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportSimulated = () => {
    alert("Exporting Document PDF file... Download successfully queued in background.");
  };

  const handleExportCSV = (type: 'current' | 'all-sales' | 'all-inventory' | 'all-pos') => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    let filename = "";
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bizName = "Sizwe_Kasi_Tuck_Shop";

    if (type === 'current') {
      filename = `${bizName}_${activeDocType.toUpperCase()}_${timestamp}.csv`;
      csvContent += "Item No,Product Label,Unit Price (ZAR),Quantity,Sum Total (ZAR)\n";

      if (activeDocType === 'invoice' && selectedSale) {
        selectedSale.items.forEach((item, index) => {
          const row = [
            index + 1,
            `"${item.productName.replace(/"/g, '""')}"`,
            item.price.toFixed(2),
            item.quantity,
            item.total.toFixed(2)
          ].join(",");
          csvContent += row + "\n";
        });
      } else if (activeDocType === 'po' && selectedPo) {
        selectedPo.items.forEach((item, index) => {
          const row = [
            index + 1,
            `"${item.name.replace(/"/g, '""')}"`,
            item.price.toFixed(2),
            item.quantity,
            (item.price * item.quantity).toFixed(2)
          ].join(",");
          csvContent += row + "\n";
        });
      } else if (activeDocType === 'quote') {
        quoteItems.forEach((item, index) => {
          const row = [
            index + 1,
            `"${item.product.name.replace(/"/g, '""')}"`,
            item.product.sellingPrice.toFixed(2),
            item.qty,
            (item.product.sellingPrice * item.qty).toFixed(2)
          ].join(",");
          csvContent += row + "\n";
        });
      } else if (activeDocType === 'delivery' && selectedSale) {
        selectedSale.items.forEach((item, index) => {
          const row = [
            index + 1,
            `"${item.productName.replace(/"/g, '""')}"`,
            item.price.toFixed(2),
            item.quantity,
            item.total.toFixed(2)
          ].join(",");
          csvContent += row + "\n";
        });
      }
    } else if (type === 'all-sales') {
      filename = `${bizName}_ALL_SALES_INVOICES_${timestamp}.csv`;
      csvContent += "Sale ID,Date,Customer Phone,Payment Method,Subtotal (ZAR),VAT Tax (ZAR),Total Amount (ZAR),Items Count\n";

      sales.forEach(s => {
        const row = [
          `"${s.id}"`,
          `"${new Date(s.timestamp || Date.now()).toLocaleDateString()}"`,
          `"${(s.customerPhone || 'Walk-in').replace(/"/g, '""')}"`,
          `"${s.paymentMethod}"`,
          s.subtotal.toFixed(2),
          s.vat.toFixed(2),
          s.total.toFixed(2),
          s.items.length
        ].join(",");
        csvContent += row + "\n";
      });
    } else if (type === 'all-inventory') {
      filename = `${bizName}_ALL_INVENTORY_${timestamp}.csv`;
      csvContent += "Product ID,Barcode,Product Name,Category,Stock Level,Min Stock,Supplier Cost (ZAR),Selling Retail (ZAR),Profit Margin (%)\n";

      products.forEach(p => {
        const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : "0.0";
        const row = [
          `"${p.id}"`,
          `"${(p.barcode || '').replace(/"/g, '""')}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.category}"`,
          p.stock,
          p.minStock,
          p.costPrice.toFixed(2),
          p.sellingPrice.toFixed(2),
          margin
        ].join(",");
        csvContent += row + "\n";
      });
    } else if (type === 'all-pos') {
      filename = `${bizName}_ALL_PURCHASE_ORDERS_${timestamp}.csv`;
      csvContent += "PO ID,Supplier Name,Status,Total Cost (ZAR),Items Count,Created At\n";

      supplierOrders.forEach(o => {
        const row = [
          `"${o.id}"`,
          `"${o.supplierName.replace(/"/g, '""')}"`,
          `"${o.status}"`,
          o.total.toFixed(2),
          o.items.length,
          `"${new Date(o.timestamp || Date.now()).toLocaleDateString()}"`
        ].join(",");
        csvContent += row + "\n";
      });
    }

    const lines = csvContent.split("\n");
    if (lines.length <= 2 && lines[1] === "") {
      alert("No data is available to export currently!");
      return;
    }

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-white font-sans" id="documents_module">
      
      {/* Document selectors (col 4) */}
      <div className="lg:col-span-4 bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="border-b border-white/15 pb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h4 className="font-bold text-sm text-white">Document Generation Station</h4>
        </div>

        {/* Tab triggers */}
        <div className="space-y-2 text-xs">
          {(['invoice', 'po', 'quote', 'delivery'] as const).map(type => {
            const labels = {
              invoice: '🧾 Tax Invoice Statement',
              po: '📦 Purchase Order (PO)',
              quote: '📝 Commercial Quotation (Quote)',
              delivery: '🚚 Delivery Docket note'
            };
            return (
              <button
                key={type}
                onClick={() => setActiveDocType(type)}
                className={`w-full text-left p-3.5 rounded-xl border font-bold transition-all ${
                  activeDocType === type
                    ? 'bg-indigo-650 border-indigo-600 text-white shadow-md'
                    : 'bg-[#0A0A0B] border-white/10 text-gray-300 hover:bg-white/5'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Context inputs selector */}
        <div className="space-y-3 pt-3 border-t border-white/10 text-xs text-semibold">
          
          {/* If invoice */}
          {activeDocType === 'invoice' && (
            <div className="space-y-1">
              <label className="block text-gray-400 font-semibold uppercase">Choose past POS Transaction</label>
              <select
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none font-mono"
              >
                {sales.map(s => (
                  <option key={s.id} value={s.id}>{s.id} (R{s.total.toFixed(0)} - {s.paymentMethod})</option>
                ))}
              </select>
            </div>
          )}

          {/* If PO */}
          {activeDocType === 'po' && (
            <div className="space-y-1">
              <label className="block text-gray-400 font-semibold uppercase">Choose Supplier PO Record</label>
              <select
                value={selectedPoId}
                onChange={(e) => setSelectedPoId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none font-mono"
              >
                {supplierOrders.map(o => (
                  <option key={o.id} value={o.id}>{o.id} ({o.supplierName.split(" ")[0]})</option>
                ))}
              </select>
            </div>
          )}

          {/* If Quote builder */}
          {activeDocType === 'quote' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold uppercase">Client description Fullname</label>
                <input
                  type="text"
                  value={quoteCustomer}
                  onChange={(e) => setQuoteCustomer(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none text-xs placeholder-gray-550"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-gray-400 font-semibold uppercase">WhatsApp Contact Mobiles</label>
                <input
                  type="text"
                  value={quotePhone}
                  onChange={(e) => setQuotePhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none text-xs placeholder-gray-550"
                />
              </div>

              {/* Add Custom items to quote drawer */}
              <div className="space-y-1 border-t border-white/10 pt-2 mt-1">
                <label className="block text-gray-400 font-semibold uppercase">Select additive item to quote</label>
                <div className="flex gap-2">
                  <select
                    value={additionalItem}
                    onChange={(e) => setAdditionalItem(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none text-xs font-mono"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (R{p.sellingPrice})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddQuoteItem}
                    className="p-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors border border-indigo-500/20"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* If delivery */}
          {activeDocType === 'delivery' && (
            <div className="space-y-1">
              <label className="block text-gray-400 font-semibold uppercase">Link to past POS Invoice</label>
              <select
                value={selectedSaleId}
                onChange={(e) => setSelectedSaleId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none font-mono"
              >
                {sales.map(s => (
                  <option key={s.id} value={s.id}>{s.id} (R{s.total.toFixed(0)})</option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>
        {/* RENDER SHEET PANEL (col 8) */}
      <div className="lg:col-span-8 bg-[#141416] border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between p-5 min-h-[480px]">
        
        {/* Printable/Export sheet frame */}
        <div className="p-8 border border-white/10 bg-[#0A0A0B] rounded-xl flex-1 flex flex-col justify-between max-h-[480px] overflow-y-auto" id="printable_sheet">
          
          {/* Header block logo details */}
          <div className="flex justify-between items-start border-b pb-4 border-white/10">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono">SIZWE KASI TUCK SHOP</span>
              <h3 className="font-black text-white text-xl font-sans tracking-tight pt-1">
                {activeDocType === 'invoice' && 'TAX INVOICE STATEMENT'}
                {activeDocType === 'po' && 'PURCHASE ORDER OUTLINE'}
                {activeDocType === 'quote' && 'PRICE ESTIMATE QUOTATION'}
                {activeDocType === 'delivery' && 'DELIVERY DOCKET NOTE'}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">VAT Reg No: 4920239414 | Soweto JHB Depot</p>
            </div>

            <div className="text-right font-mono text-[10px] text-gray-400 leading-normal">
              <p className="font-bold text-white">Doc Reference No:</p>
              <p className="text-gray-200 bg-white/5 border border-white/10 px-2 py-0.5 rounded mt-0.5 select-all inline-block">
                {activeDocType === 'invoice' && (selectedSale?.id || 's_default')}
                {activeDocType === 'po' && (selectedPo?.id || 'ord_default')}
                {activeDocType === 'quote' && 'QT-Estimate'}
                {activeDocType === 'delivery' && `DEL-${selectedSale?.id || 's_default'}`}
              </p>
              <p className="pt-1">Date: {new Date().toLocaleDateString('en-ZA')}</p>
            </div>
          </div>

          {/* Client target profiles */}
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-white/10 text-gray-300">
            <div>
              <span className="block text-[9px] uppercase font-semibold text-gray-500 font-mono">Issued From Tuck shop:</span>
              <span className="font-bold text-white block">Sizwe Tuck Spaza AI Pty</span>
              <span className="text-gray-400 block">Orlando West Khayelisha Blvd</span>
              <span className="text-gray-400 block">Phone: +27 11 933 1243</span>
            </div>

            <div className="sm:text-right">
              <span className="block text-[9px] uppercase font-semibold text-gray-500 font-mono">Issued To Recipient:</span>
              
              {activeDocType === 'invoice' && (
                <>
                  <span className="font-bold text-white block">{selectedSale?.customerPhone ? 'Enroll Loyalty Customer' : 'Counter Walk-In Cash Sale'}</span>
                  {selectedSale?.customerPhone && <span className="text-gray-400 block font-mono">Cont: {selectedSale.customerPhone}</span>}
                </>
              )}

              {activeDocType === 'po' && (
                <>
                  <span className="font-bold text-white block">{selectedPo?.supplierName || 'Soweto cash & carry wholesalers'}</span>
                  <span className="text-gray-400 block">Headquarters warehouse delivery</span>
                </>
              )}

              {activeDocType === 'quote' && (
                <>
                  <span className="font-bold text-white block">{quoteCustomer}</span>
                  <span className="text-gray-400 block font-mono">Cont: {quotePhone}</span>
                </>
              )}

              {activeDocType === 'delivery' && (
                <>
                  <span className="font-bold text-white block">Residential Dispatch dropoff</span>
                  <span className="text-gray-400 block">Kasi logistics coordinates</span>
                </>
              )}
            </div>
          </div>

          {/* Bill items listings table */}
          <div className="py-4 border-b border-white/10">
            <table className="w-full text-left text-[11px] font-mono select-none">
              <thead>
                <tr className="text-gray-500 uppercase font-bold tracking-wide border-b border-white/10 text-[10px] pb-1 block flex justify-between pr-2">
                  <th className="flex-1">Product label</th>
                  <th className="w-16 text-center">Unit Price</th>
                  <th className="w-12 text-center">Qty</th>
                  <th className="w-20 text-right">Sum total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300 pt-2 block space-y-1 max-h-[140px] overflow-y-auto">
                
                {activeDocType === 'invoice' && selectedSale?.items.map((i, idx) => (
                  <tr key={idx} className="block flex justify-between pr-2 py-1 items-center">
                    <td className="flex-1 font-bold text-white font-sans text-xs">{i.productName}</td>
                    <td className="w-16 text-center">R{i.price.toFixed(2)}</td>
                    <td className="w-12 text-center font-bold text-indigo-400">{i.quantity}</td>
                    <td className="w-20 text-right font-bold text-white">R{i.total.toFixed(2)}</td>
                  </tr>
                ))}

                {activeDocType === 'po' && selectedPo?.items.map((i, idx) => (
                  <tr key={idx} className="block flex justify-between pr-2 py-1 items-center">
                    <td className="flex-1 font-bold text-white font-sans text-xs">{i.name}</td>
                    <td className="w-16 text-center">R{i.price.toFixed(2)}</td>
                    <td className="w-12 text-center font-bold text-indigo-400">{i.quantity}</td>
                    <td className="w-20 text-right font-bold text-white">R{(i.price * i.quantity).toFixed(2)}</td>
                  </tr>
                ))}

                {activeDocType === 'quote' && quoteItems.map((i, idx) => (
                  <tr key={idx} className="block flex justify-between pr-2 py-1 items-center">
                    <td className="flex-1 font-bold text-white font-sans text-xs">{i.product.name}</td>
                    <td className="w-16 text-center">R{i.product.sellingPrice.toFixed(2)}</td>
                    <td className="w-12 text-center font-bold text-indigo-400">{i.qty}</td>
                    <td className="w-20 text-right font-bold text-white">R{(i.product.sellingPrice * i.qty).toFixed(2)}</td>
                  </tr>
                ))}

                {activeDocType === 'delivery' && selectedSale?.items.map((i, idx) => (
                  <tr key={idx} className="block flex justify-between pr-2 py-1 items-center">
                    <td className="flex-1 font-bold text-white font-sans text-xs">{i.productName}</td>
                    <td className="w-16 text-center">R{i.price.toFixed(2)}</td>
                    <td className="w-12 text-center font-bold text-indigo-400">{i.quantity}</td>
                    <td className="w-20 text-right font-bold text-white">R{i.total.toFixed(2)}</td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Aggregate math block */}
          <div className="py-4 flex justify-end font-mono text-xs pr-2 select-all">
            <div className="w-60 space-y-1">
              <div className="flex justify-between text-gray-400 border-b border-white/5 pb-1">
                <span>Subtotal (Excl. VAT):</span>
                <span className="text-white">
                  R{activeDocType === 'invoice' && selectedSale?.subtotal.toFixed(2)}
                  {activeDocType === 'po' && ((selectedPo?.total || 0) / 1.15).toFixed(2)}
                  {activeDocType === 'quote' && (quoteItems.reduce((acc, i) => acc + (i.product.sellingPrice * i.qty), 0) / 1.15).toFixed(2)}
                  {activeDocType === 'delivery' && selectedSale?.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 border-b border-white/5 pb-1">
                <span>S.A. VAT inclusive (15%):</span>
                <span className="text-white">
                  R{activeDocType === 'invoice' && selectedSale?.vat.toFixed(2)}
                  {activeDocType === 'po' && (selectedPo?.total ? (selectedPo.total - (selectedPo.total / 1.15)) : 0).toFixed(2)}
                  {activeDocType === 'quote' && (quoteItems.reduce((acc, i) => acc + (i.product.sellingPrice * i.qty), 0) - (quoteItems.reduce((acc, i) => acc + (i.product.sellingPrice * i.qty), 0) / 1.15)).toFixed(2)}
                  {activeDocType === 'delivery' && selectedSale?.vat.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-white font-extrabold font-sans text-sm pt-1 bg-white/5 p-2 rounded-xl border border-white/5">
                <span>NET FINAL VALUE:</span>
                <span className="text-indigo-400 font-bold">
                  R{activeDocType === 'invoice' && selectedSale?.total.toFixed(2)}
                  {activeDocType === 'po' && selectedPo?.total.toFixed(2)}
                  {activeDocType === 'quote' && quoteItems.reduce((acc, i) => acc + (i.product.sellingPrice * i.qty), 0).toFixed(2)}
                  {activeDocType === 'delivery' && selectedSale?.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Action sheet buttons */}
        <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 text-xs font-bold bg-[#0A0A0B] hover:bg-white/5 text-gray-200 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet (window.print)</span>
            </button>
            <button
              onClick={handleExportSimulated}
              className="py-2.5 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer pointer-events-auto"
            >
              <Download className="w-3.5 h-3.5 font-bold" />
              <span>Simulate PDF Download</span>
            </button>
          </div>

          <div className="border-t border-white/5 pt-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
              📊 Export Ledger Datasets to CSV
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleExportCSV('current')}
                className="py-2 px-2 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Export current document items"
              >
                <Download className="w-3 h-3" />
                <span>Doc Items CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV('all-sales')}
                className="py-2 px-2 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Export all sales invoices"
              >
                <Download className="w-3 h-3" />
                <span>Sales CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV('all-inventory')}
                className="py-2 px-2 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Export all inventory products"
              >
                <Download className="w-3 h-3" />
                <span>Inventory CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV('all-pos')}
                className="py-2 px-2 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Export all supplier purchase orders"
              >
                <Download className="w-3 h-3" />
                <span>POs CSV</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
