import React, { useState } from 'react';
import { Package, PlusCircle, AlertTriangle, Calendar, Save, Trash2, Tag, ArrowUpRight, Barcode, Upload, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

interface InventoryCatalogProps {
  products: Product[];
  onSaveProduct: (p: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function InventoryCatalog({ products, onSaveProduct, onDeleteProduct }: InventoryCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBarcodePreview, setShowBarcodePreview] = useState<string | null>(null);

  // New products fields state
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');

  // Storage / Image Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => 
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !costPrice || !sellingPrice || !stock) {
      alert("Please provide name, prices and stock counts!");
      return;
    }

    const payload: Partial<Product> = {
      name,
      barcode: barcode || "600" + Math.floor(Math.random() * 10000000000),
      category,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      stock: parseInt(stock),
      minStock: parseInt(minStock || '5'),
      expiryDate: expiryDate || undefined,
      imageUrl: imageUrl || undefined,
      fastSelling: false,
      slowMoving: false
    };

    await onSaveProduct(payload);
    
    // Clear state
    setName('');
    setBarcode('');
    setCostPrice('');
    setSellingPrice('');
    setStock('');
    setMinStock('5');
    setExpiryDate('');
    setImageUrl('');
    setShowAddForm(false);
  };

  const uploadFileProcess = async (file: File) => {
    if (hasSupabaseConfig && supabase) {
      setUploadingImage(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `product-pics/${fileName}`;

        // Upload file to Supabase storage bucket called 'products'
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Retrieve public URL
        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        setImageUrl(publicUrl);
      } catch (err: any) {
        alert("Upload error: " + (err.message || err));
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Offline sandbox local fallback preview
      setUploadingImage(true);
      setTimeout(() => {
        const previewUrl = URL.createObjectURL(file);
        setImageUrl(previewUrl);
        setUploadingImage(false);
      }, 600);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFileProcess(file);
    }
  };

  const handleFileSelectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileProcess(file);
    }
  };

  const handleUpdateStock = async (p: Product, change: number) => {
    const updatedStock = Math.max(0, p.stock + change);
    await onSaveProduct({
      ...p,
      stock: updatedStock
    });
  };

  const handleEditInit = (p: Product) => {
    setEditingProduct({ ...p });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onSaveProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6" id="inventory_view">
      
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141416] p-4 rounded-2xl border border-white/5 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-white">Shelf Inventory Catalog</h3>
          <p className="text-xs text-gray-400">Track raw margins, stock levels, and expiry warnings of your items</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showAddForm ? 'Close Intake Form' : 'Register New Item'}</span>
        </button>
      </div>

      {/* Register New item form */}
      {showAddForm && (
        <form onSubmit={handleSubmitNew} className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="border-b border-white/5 pb-2 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">Register New Spaza Product Intake</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Product Description name *</label>
              <input
                type="text"
                placeholder="E.g. Tastic Rice 2kg, Albany Bread"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-505 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Custom Barcode SKU</label>
              <input
                type="text"
                placeholder="Scan or Generate auto"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-550 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Product Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Groceries">Groceries</option>
                <option value="Staples">Staples</option>
                <option value="Bakery">Bakery</option>
                <option value="Beverages">Beverages</option>
                <option value="Canned Food">Canned Food</option>
                <option value="Household">Household</option>
                <option value="Snacks">Snacks</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Supplier Cost price (R) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Cost: R42.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-500 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Retail Selling price (R) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Retail: R52.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-500 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Available Stock Shelf qty *</label>
              <input
                type="number"
                placeholder="Stock count"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-500 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Min Stock Threshold limit</label>
              <input
                type="number"
                placeholder="Low stock flag limit"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-505 placeholder-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Goods Batch Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Drag & Drop Product Image Upload Field */}
            <div className="col-span-full space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Product Branding Image</label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                  dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-[#0A0A0B] hover:border-white/20'
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-[11px] font-bold text-indigo-400">Uploading media to Supabase storage...</span>
                  </div>
                ) : imageUrl ? (
                  <div className="flex items-center justify-between gap-4 p-2">
                    <div className="flex items-center gap-3">
                      <img 
                        src={imageUrl} 
                        alt="Product Preview" 
                        className="w-12 h-12 rounded-lg object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left">
                        <span className="text-[11px] font-bold text-white block">Image uploaded successfully</span>
                        <span className="text-[9px] text-emerald-400 font-mono block overflow-hidden max-w-[200px] text-ellipsis whitespace-nowrap">{imageUrl}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setImageUrl('')}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-500 mx-auto" />
                    <div className="text-xs text-gray-400">
                      <label className="text-indigo-400 font-bold hover:underline cursor-pointer">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileSelectChange}
                          className="hidden" 
                        />
                      </label>
                      <span> or drag and drop your product branding image here</span>
                    </div>
                    <p className="text-[9px] text-gray-500">Supports PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-full flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 font-semibold text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-xs bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-sm"
              >
                Log Entry Stock
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Category selector track */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : 'bg-[#141416]/40 border-white/5 text-gray-450 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Catalog inventory shelf table */}
      <div className="bg-[#141416] rounded-2xl border border-white/5 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-white/5 text-gray-400 font-mono border-b border-white/5">
                <th className="p-4 uppercase tracking-wider font-semibold">Product Description</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Category</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Supplier Price</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Retail Price</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Margin (Prof)</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Shelf Stock</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Batch Expiry</th>
                <th className="p-4 uppercase tracking-wider font-semibold">Skus</th>
                <th className="p-4 uppercase tracking-wider font-semibold text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map(p => {
                const markup = p.sellingPrice - p.costPrice;
                const marginPct = (markup / p.sellingPrice) * 100;
                const isLow = p.stock <= p.minStock;
                
                // Expiry warnings
                let expiryColor = "text-gray-400";
                const isExpiringSoon = p.expiryDate && new Date(p.expiryDate).getTime() < Date.now() + (60*24*3600000);
                if (isExpiringSoon) expiryColor = "text-amber-450 bg-amber-500/10 border-amber-500/25 font-semibold px-2 py-0.5 rounded-sm";

                return (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    
                    {/* Item details */}
                    <td className="p-4 font-sans max-w-xs">
                      <div className="flex items-center gap-3">
                        {p.imageUrl && (
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          {editingProduct?.id === p.id ? (
                            <input
                              type="text"
                              value={editingProduct.name || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              className="p-1 border border-white/10 bg-[#0A0A0B] text-white rounded w-full outline-none text-xs"
                            />
                          ) : (
                            <span className="font-bold text-white text-sm block leading-tight truncate">{p.name}</span>
                          )}
                          <span className="text-[10px] font-mono text-gray-500 mt-0.5 block">Barcode ID: {p.barcode}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      {editingProduct?.id === p.id ? (
                        <input
                          type="text"
                          value={editingProduct.category || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                          className="p-1 border border-white/10 bg-[#0A0A0B] text-white rounded max-w-28 text-xs"
                        />
                      ) : (
                        <span className="inline-block px-2.5 py-0.8 bg-white/5 text-gray-300 rounded-lg text-[10px] font-bold tracking-wide uppercase">
                          {p.category}
                        </span>
                      )}
                    </td>

                    {/* Cost */}
                    <td className="p-4 font-mono font-medium text-gray-300">
                      {editingProduct?.id === p.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.costPrice || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                          className="px-2 py-1 bg-[#0A0A0B] border border-white/10 text-white rounded w-16 text-xs outline-none focus:border-indigo-500"
                        />
                      ) : (
                        `R${p.costPrice.toFixed(2)}`
                      )}
                    </td>

                    {/* Retail */}
                    <td className="p-4 font-mono font-bold text-white">
                      {editingProduct?.id === p.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.sellingPrice || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) })}
                          className="px-2 py-1 bg-[#0A0A0B] border border-white/10 text-white rounded w-16 text-xs outline-none focus:border-indigo-500"
                        />
                      ) : (
                        `R${p.sellingPrice.toFixed(2)}`
                      )}
                    </td>

                    {/* Profit Margin */}
                    <td className="p-4 font-mono">
                      <span className="text-emerald-400 block font-bold text-xs">R{markup.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-400">{marginPct.toFixed(0)}% margin</span>
                    </td>

                    {/* Shelf Stock */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {editingProduct?.id === p.id ? (
                          <input
                            type="number"
                            value={editingProduct.stock || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                            className="px-2 py-1 bg-[#0A0A0B] border border-white/10 text-white rounded w-14 text-xs outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-sm font-bold ${isLow ? 'text-rose-455 font-extrabold' : 'text-gray-200'}`}>
                              {p.stock} units
                            </span>
                            {isLow && (
                              <span className="text-rose-400 font-mono font-semibold bg-rose-500/10 border border-rose-550/20 rounded px-1 text-[9px] uppercase tracking-wide flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-rose-500" /> Low
                              </span>
                            )}
                          </div>
                        )}

                        {/* Fast additive +/- quick click triggers */}
                        {editingProduct?.id !== p.id && (
                          <div className="flex flex-col gap-0.5 ml-2.5">
                            <button
                              onClick={() => handleUpdateStock(p, 5)}
                              className="px-1 py-0.2 bg-white/5 hover:bg-white/15 text-gray-300 text-[8px] font-bold rounded uppercase tracking-wider"
                              title="Add 5 units quickly"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => handleUpdateStock(p, -1)}
                              disabled={p.stock === 0}
                              className="px-1 py-0.2 bg-white/5 hover:bg-white/10 text-gray-400 text-[8px] font-bold rounded uppercase tracking-wider disabled:opacity-30"
                              title="Subtract 1 unit"
                            >
                              -1
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Batch Expiry */}
                    <td className="p-4">
                      {p.expiryDate ? (
                        <span className={`${expiryColor} flex items-center gap-1 text-[11px]`}>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(p.expiryDate).toLocaleDateString('en-ZA')}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono">—</span>
                      )}
                    </td>

                    {/* Barcodes Visual previews */}
                    <td className="p-4">
                      <button
                        onClick={() => setShowBarcodePreview(p.barcode)}
                        className="p-1.5 bg-white/5 hover:bg-indigo-500/10 text-gray-300 hover:text-indigo-400 rounded-lg transition-colors border border-white/5"
                        title="Display Printable EAN Barcode sheet"
                      >
                        <Barcode className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions edit / delete buttons */}
                    <td className="p-4 text-right">
                      {editingProduct?.id === p.id ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-md"
                          >
                            <Save className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="bg-white/10 text-gray-350 p-1 rounded-md text-xs hover:bg-white/15"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end select-none">
                          <button
                            onClick={() => handleEditInit(p)}
                            className="text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10px] font-bold rounded uppercase border border-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { if(confirm(`Confirm delete of ${p.name}?`)) onDeleteProduct(p.id); }}
                            className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 rounded-lg border border-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BARCODE MODAL PREVIEW DRAW */}
      {showBarcodePreview && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#141416] rounded-2xl border border-white/10 max-w-sm w-full p-5 text-center animate-in zoom-in-95 duration-200 text-white animate-once">
            <h4 className="font-bold text-white tracking-tight">Printable Spaza Barcode SKU sheet</h4>
            <p className="text-gray-405 text-xs mt-1">EAN-13 South African digital generation protocol matches spaza scopes</p>

            {/* Simulated barcode box drawing */}
            <div className="bg-white/5 border border-white/5 p-5 py-7 rounded-xl my-4 space-y-1 select-none flex flex-col items-center justify-center">
              <span className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-widest font-mono">SpazaFlow AI Core</span>
              
              {/* Bars drawn with flex divs */}
              <div className="flex items-stretch h-14 bg-white mt-3 p-1 px-3 border rounded-sm w-56 justify-center">
                <div className="w-1 bg-black mr-0.5"></div>
                <div className="w-0.5 bg-black mr-1"></div>
                <div className="w-1.5 bg-black mr-0.5"></div>
                <div className="w-1 bg-black mr-1.5"></div>
                <div className="w-2 bg-black mr-0.5"></div>
                <div className="w-0.5 bg-black mr-0.5"></div>
                <div className="w-1.5 bg-black mr-1"></div>
                <div className="w-1 bg-black mr-0.5"></div>
                <div className="w-0.5 bg-black mr-0.5"></div>
                <div className="w-1.5 bg-black mr-1.5"></div>
                <div className="w-1 bg-black mr-0.5"></div>
                <div className="w-2 bg-black mr-0.5"></div>
                <div className="w-1 bg-black mr-0.5"></div>
                <div className="w-0.5 bg-black"></div>
              </div>
              
              <span className="block font-mono text-xs font-bold tracking-widest mt-1 text-white">
                {showBarcodePreview}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => window.print()}
                className="py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/10 transition-all"
              >
                Print Barcode Labels
              </button>
              <button
                onClick={() => setShowBarcodePreview(null)}
                className="py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all"
              >
                Back to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
