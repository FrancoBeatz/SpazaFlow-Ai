import React from 'react';
import { Award, Zap, TrendingUp, Users, Package, AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface SaasSubscriptionHubProps {
  currentBusiness: {
    id: string;
    name: string;
    plan_tier: string;
    subscription_status: string;
  } | null;
  onUpgradePlan: (tier: 'Free' | 'Starter' | 'Business' | 'Enterprise') => void;
  productsCount: number;
}

export default function SaasSubscriptionHub({ currentBusiness, onUpgradePlan, productsCount }: SaasSubscriptionHubProps) {
  
  const planDetails = {
    Free: {
      price: 'R0',
      period: 'forever',
      description: 'Perfect for local family tuck shops getting started with high contrast inventory monitoring.',
      features: ['Up to 50 shelf products', '1 Active Cashier slot', 'Basic analytical graphs', 'Audit logs stored for 24 hours', 'In-App Alerts'],
      limitProducts: 50,
      limitCashiers: 1
    },
    Starter: {
      price: 'R250',
      period: 'per month',
      description: 'Ideal for busy local mini-marts and individual spaza merchants expanding their inventory.',
      features: ['Up to 200 shelf products', '2 Active Cashier slots', 'Advanced Analytics logs export', '7-Day complete audit trail', 'In-App & Email alerts', 'Bread replenishment automation'],
      limitProducts: 200,
      limitCashiers: 2
    },
    Business: {
      price: 'R600',
      period: 'per month',
      description: 'Empowers premium high-scale spazas with fully automated supplier markets & grounded AI assistant.',
      features: ['Unlimited products', '10 Cashier seats', '30-Day audit log trail', 'Email & SMS alerts', 'Full Grounded Gemini Advisor access', 'Automated whatsapp promotional writer'],
      limitProducts: 99999,
      limitCashiers: 10
    },
    Enterprise: {
      price: 'R1500',
      period: 'per month',
      description: 'Perfect for consolidated franchise chains running multiple depots under centralized control.',
      features: ['Unlimited products', 'Unlimited cashier seats', 'Lifetime audit log trails', 'Email + SMS + Push alert indicators', 'Dedicated Multi-Store SaaS Console', 'Custom Wholesaler API imports'],
      limitProducts: 99999,
      limitCashiers: 999
    }
  };

  const businessTier = currentBusiness?.plan_tier as 'Free' | 'Starter' | 'Business' | 'Enterprise' || 'Free';
  const tierInfo = planDetails[businessTier];

  // SaaS analytical metrics
  const activeSaaSUsers = businessTier === 'Free' ? 1 : businessTier === 'Starter' ? 2 : businessTier === 'Business' ? 6 : 14;
  const mrrContribution = businessTier === 'Free' ? 0 : businessTier === 'Starter' ? 250 : businessTier === 'Business' ? 600 : 1500;

  return (
    <div className="space-y-6" id="saas_subscription_hub">
      {/* SaaS Statistics Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Active plan state card */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Active Platform tier</span>
            <span className="text-lg font-black text-white tracking-tight">{businessTier} Plan</span>
            <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Status: {currentBusiness?.subscription_status || 'Active'}</span>
          </div>
        </div>

        {/* MMR progress */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">MRR Contribution</span>
            <span className="text-lg font-black text-white tracking-tight">R{mrrContribution.toFixed(2)}</span>
            <span className="text-[10px] text-gray-500 block">Billed monthly recurring</span>
          </div>
        </div>

        {/* Active Users tracker */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Active Shop Staff Slots</span>
            <span className="text-lg font-black text-white tracking-tight">{activeSaaSUsers} / {tierInfo.limitCashiers === 999 ? 'Unlimited' : tierInfo.limitCashiers} Seats</span>
            <span className="text-[10px] text-gray-500 block">Logged-in cashiers</span>
          </div>
        </div>

        {/* Core items tracker limits */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Category Catalog limits</span>
            <span className="text-lg font-black text-white tracking-tight">{productsCount} / {tierInfo.limitProducts === 99999 ? 'Unlimited' : tierInfo.limitProducts} Items</span>
            <span className="text-[10px] text-gray-500 block">Registered on catalog</span>
          </div>
        </div>

      </div>

      {/* Plans comparison list */}
      <div className="bg-[#141416] p-6 rounded-2xl border border-white/5 space-y-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Choose Your Business Plan</h2>
          <p className="text-xs text-gray-400">Scale your enterprise dynamically. Upgrade or downgrade plans immediately with prorated billing adjustments.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {(['Free', 'Starter', 'Business', 'Enterprise'] as const).map(tier => {
            const spec = planDetails[tier];
            const isCurrent = businessTier === tier;

            return (
              <div
                key={tier}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/[0.04] border-indigo-500 shadow-lg shadow-indigo-650/5'
                    : 'bg-[#0A0A0B]/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{tier}</h4>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5">{spec.price !== 'R0' ? `${spec.price} / mo` : 'Free package'}</p>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px] font-extrabold uppercase rounded-md">
                        Current Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{spec.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    {spec.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start gap-1.5 text-[10px] text-gray-300">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold font-sans cursor-not-allowed uppercase"
                    >
                      Active Tier
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpgradePlan(tier)}
                      className="w-full py-2 bg-[#0A0A0B] hover:bg-white/5 text-white border border-white/10 rounded-xl text-xs font-bold font-sans transition-all uppercase hover:border-indigo-500"
                    >
                      Upgrade Core
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
