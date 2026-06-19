import React, { useState } from 'react';
import { Share, MessageSquare, Handshake, CornerDownRight, ThumbsUp, MapPin, Phone, Plus } from 'lucide-react';
import { CommunityMarketplaceItem } from '../types';

interface CommunityExchangeProps {
  items: CommunityMarketplaceItem[];
  onAddListing: (listing: Partial<CommunityMarketplaceItem>) => Promise<void>;
  onAcceptListing: (id: string) => Promise<void>;
  currency: string;
}

export default function CommunityExchange({ items, onAddListing, onAcceptListing, currency }: CommunityExchangeProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [spazaName, setSpazaName] = useState('');
  const [phone, setPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [location, setLocation] = useState('Soweto, JHB');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity || !askingPrice || !spazaName || !phone) {
      alert("Please fill in all required inputs to propose a trade!");
      return;
    }

    await onAddListing({
      ownerSpazaName: spazaName,
      ownerPhone: phone,
      productName,
      quantity: parseInt(quantity),
      askingPrice: parseFloat(askingPrice),
      location,
      description
    });

    setSpazaName('');
    setPhone('');
    setProductName('');
    setQuantity('');
    setAskingPrice('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleNegotiateWhatsApp = (item: CommunityMarketplaceItem) => {
    const text = `Heita ${item.ownerSpazaName}! I saw your excess stock listing on *SpazaFlow AI*: *${item.productName} (x${item.quantity})* on discount for R${item.askingPrice} in ${item.location}. I'm interested in buying this surplus immediately. Can we coordinate details?`;
    window.open(`https://api.whatsapp.com/send?phone=${item.ownerPhone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6" id="community_exchange_view">
      
      {/* Marketplace guidelines */}
      <div className="bg-indigo-600/10 p-5 rounded-2xl border border-indigo-500/20 space-y-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white">
        <div className="space-y-1">
          <h3 className="font-extrabold text-indigo-400 font-sans tracking-tight">Kasi B2B Shared Trade Exchange</h3>
          <p className="text-gray-400 text-xs max-w-xl font-sans">
            Have excess, slow-moving items taking up valuable shelf storage? Cash them out to neighboring spaza networks, or purchase discount surplus bulk lots to preserve capital margins!
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shrink-0 self-end sm:self-auto flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Offer Surplus Batch</span>
          </button>
        )}
      </div>

      {/* Propose surplus trade post form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-xl text-white">
          <div className="border-b border-white/5 pb-2 flex items-center gap-2 text-indigo-400">
            <Handshake className="w-5 h-5" />
            <h4 className="font-bold text-white text-sm">Offer Excess / Surplus Stock to Nearby Spazas</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">Your Spaza Business Name *</label>
              <input
                type="text"
                required
                placeholder="E.g. Sizwe Tuck Shop"
                value={spazaName}
                onChange={(e) => setSpazaName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">WhatsApp Phone Number *</label>
              <input
                type="text"
                required
                placeholder="E.g. 0725556622"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-505 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">Excess Product Name *</label>
              <input
                type="text"
                required
                placeholder="E.g. Coca-Cola 500ml surplus cans"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">Surplus Quantity *</label>
              <input
                type="number"
                required
                placeholder="E.g. 24 cases"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-505 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">Asking Price Per Unit (Rands) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Price: E.g. R10.00"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase">Physical Township Neighborhood *</label>
              <input
                type="text"
                required
                placeholder="E.g. Orlando West, Soweto"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-505 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-gray-400 uppercase">Description detail (Negotiable points, expiry labels, etc)</label>
              <input
                type="text"
                placeholder="Unwanted error deliveries, need the shelf storage back..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
              >
                Log Post Propose
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grid of exchange surplus trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white font-sans">
        {items.map(item => {
          let statusLabel = { bg: 'bg-[#f59e0b]/15 text-amber-400 border border-[#f59e0b]/25', text: 'Available' };
          if (item.status === 'Accepted') statusLabel = { bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20', text: 'Agreement Sealed' };

          return (
            <div 
              key={item.id} 
              className="bg-[#141416] rounded-2xl border border-white/5 shadow-sm hover:border-indigo-500/25 transition-all p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Header flags */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="font-extrabold text-white text-sm">{item.productName}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">Offered by: {item.ownerSpazaName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold tracking-wide uppercase ${statusLabel.bg}`}>
                    {statusLabel.text}
                  </span>
                </div>

                <p className="text-gray-300 text-xs font-semibold leading-relaxed bg-[#0A0A0B]/60 p-2.5 rounded-xl border border-white/5">
                  {item.description}
                </p>

                {/* Grid criteria parameters */}
                <div className="grid grid-cols-3 gap-2.5 font-mono text-[11px] text-gray-400 pt-1">
                  <div>
                    <span className="block text-[9px] uppercase font-sans text-gray-500">Total volume</span>
                    <span className="font-bold text-white text-xs">{item.quantity} units</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-sans text-gray-500">Asking Cost</span>
                    <span className="font-bold text-white text-xs">R{item.askingPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-sans text-gray-500">Aggregate val</span>
                    <span className="font-bold text-white text-xs">R{(item.quantity * item.askingPrice).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Geographic anchor coordinates */}
              <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.location}</span>
                </div>

                {item.status === 'Available' ? (
                  <div className="flex gap-1.5 w-full sm:w-auto self-end">
                    <button
                      onClick={() => onAcceptListing(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-500/20"
                    >
                      <Handshake className="w-3.5 h-3.5 shrink-0" />
                      <span>Seal Deal</span>
                    </button>
                    <button
                      onClick={() => handleNegotiateWhatsApp(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-650 hover:bg-[#10b981] text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp info</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-indigo-400 flex items-center gap-1 text-xs font-bold py-1 bg-indigo-500/10 px-2 rounded-lg border border-indigo-500/20">
                    <ThumbsUp className="w-4.5 h-4.5 shrink-0" />
                    <span>Agreement Closed</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
