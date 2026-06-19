import React, { useState } from 'react';
import { User, QrCode, Ticket, PlusCircle, Award, Sparkles, UserPlus } from 'lucide-react';
import { CustomerLoyalty } from '../types';

interface LoyaltyTrackerProps {
  loyalty: CustomerLoyalty[];
  onAddLoyalty: (member: Partial<CustomerLoyalty>) => Promise<void>;
  currency: string;
}

export default function LoyaltyTracker({ loyalty, onAddLoyalty, currency }: LoyaltyTrackerProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referrals, setReferrals] = useState('0');
  const [showQrCard, setShowQrCard] = useState<CustomerLoyalty | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Please provide the customer name and phone numbers!");
      return;
    }

    await onAddLoyalty({
      name,
      phone,
      referrals: parseInt(referrals || '0')
    });

    setName('');
    setPhone('');
    setReferrals('0');
    setShowAddMember(false);
  };

  return (
    <div className="space-y-6" id="loyalty_view">
      
      {/* Loyalty Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h3 className="font-bold text-lg text-slate-850">Customer Loyalty Rewards</h3>
          <p className="text-xs text-slate-500">Enable township buyers to earn 1 point for every R10 spent and redeem discount vouchers</p>
        </div>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="px-4.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddMember ? 'Close Enrollment' : 'Enroll New Member'}</span>
        </button>
      </div>

      {/* Enrollment Form */}
      {showAddMember && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-xl">
          <div className="border-b border-slate-100 pb-2 flex items-center gap-2 text-orange-500">
            <User className="w-5 h-5 animate-pulse" />
            <h4 className="font-bold text-slate-800 text-sm">Enroll New Member Profile</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold uppercase text-slate-500">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="E.g. Sipho Dlamini"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold uppercase text-slate-500">WhatsApp Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="E.g. 0725551234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold uppercase text-slate-500">Sign Up Referrals</label>
              <input
                type="number"
                placeholder="Number of friends referred"
                value={referrals}
                onChange={(e) => setReferrals(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 outline-none focus:border-orange-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                Enroll Member
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Loyalty listings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loyalty.map(member => {
          // Dynamic card theme colors based on points
          let cardTheme = "from-sky-700 via-sky-800 to-sky-900";
          let badgeText = "Silver Tier";
          if (member.points > 150) {
            cardTheme = "from-amber-600 via-amber-700 to-amber-900";
            badgeText = "Gold VIP Tier";
          } else if (member.points > 80) {
            cardTheme = "from-indigo-650 via-indigo-750 to-indigo-850";
            badgeText = "Platinum tier";
          }

          return (
            <div 
              key={member.id} 
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              
              {/* Premium Card layout */}
              <div className={`p-5 bg-gradient-to-tr ${cardTheme} text-white space-y-4 relative overflow-hidden shrink-0`}>
                <div className="absolute right-[-15px] bottom-[-15px] opacity-10">
                  <QrCode className="w-36 h-36" />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      {badgeText}
                    </span>
                    <h4 className="text-lg font-bold font-sans tracking-tight pt-1.5 leading-snug">{member.name}</h4>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
                </div>

                <div className="flex justify-between items-end pt-5">
                  <div className="font-mono text-[10px] space-y-0.5 text-slate-100">
                    <p>Phone: {member.phone}</p>
                    <p>Referrals: {member.referrals} friends</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-white/70 block">Available Balance</span>
                    <span className="font-mono text-xl font-black">{member.points} Points</span>
                  </div>
                </div>
              </div>

              {/* Vouchers lists */}
              <div className="p-4 space-y-2 flex-grow">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">Active Discount Vouchers:</span>
                {member.vouchers.filter(v => !v.isUsed).map(v => (
                  <div 
                    key={v.id} 
                    className="p-2 border border-slate-100 bg-slate-50 rounded-lg flex items-center justify-between text-xs hover:bg-orange-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block text-[11px]">{v.description}</span>
                      <span className="text-[9px] font-mono text-slate-400">Min spend: R{v.minSpend} | Expiry: {v.expiryDate}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 select-all" title="Click and share code">
                      {v.code}
                    </span>
                  </div>
                ))}
                {member.vouchers.filter(v => !v.isUsed).length === 0 && (
                  <p className="text-[11px] text-slate-400 italic">No available discount vouchers. Vouchers are earned automatically with points accumulation!</p>
                )}
              </div>

              {/* Interactive buttons */}
              <div className="p-4 pt-0 border-t border-slate-50 flex gap-2 pt-3 bg-slate-50/50">
                <button
                  onClick={() => setShowQrCard(member)}
                  className="flex-1 py-1.8 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-250 transition-all rounded-lg flex items-center justify-center gap-1 border border-slate-200"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Card QR Code</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* REWARDS CARD QR MODAL */}
      {showQrCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 text-center animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-slate-800 tracking-tight">Kasi Reward QR Identification</h4>
            <p className="text-slate-500 text-xs mt-1">Scan at checkout scanner laser to earn/redeem loyalty codes instantly</p>

            <div className="bg-gradient-to-tr from-orange-400 to-orange-500 border p-5 py-7 rounded-xl my-4 space-y-1 select-none flex flex-col items-center justify-center">
              <span className="block text-xs font-semibold text-white/90 uppercase tracking-widest font-mono">Spaza Reward Card</span>
              
              {/* Visual custom shape CSS QR drawing box */}
              <div className="w-36 h-36 bg-white rounded-xl mt-3 p-3 flex flex-wrap gap-1 items-center justify-center border shadow-xs relative">
                {/* 4 outer square anchors represented */}
                <div className="w-6 h-6 bg-slate-900 border-4 border-slate-900 rounded-xs absolute top-3 left-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-2xs"></div>
                </div>
                <div className="w-6 h-6 bg-slate-900 border-4 border-slate-900 rounded-xs absolute top-3 right-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-2xs"></div>
                </div>
                <div className="w-6 h-6 bg-slate-900 border-4 border-slate-900 rounded-xs absolute bottom-3 left-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-2xs"></div>
                </div>
                {/* inner abstract lines mimicking QR grids */}
                <div className="flex flex-col gap-1.5 w-full h-full items-center justify-center pt-2">
                  <div className="h-1 bg-slate-800 w-12 rounded-sm ml-6"></div>
                  <div className="h-1 bg-slate-800 w-16 rounded-sm mr-2"></div>
                  <div className="h-1 bg-slate-800 w-10 rounded-sm ml-4"></div>
                  <div className="h-1.5 bg-slate-800 w-14 rounded-sm"></div>
                </div>
              </div>
              
              <span className="block font-mono text-sm font-bold tracking-widest mt-2 text-white/90">
                {showQrCard.cardCode}
              </span>
            </div>

            <p className="text-slate-500 text-xs italic font-mono mb-2">Member: {showQrCard.name}</p>

            <button
              onClick={() => setShowQrCard(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              Done, close card
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
