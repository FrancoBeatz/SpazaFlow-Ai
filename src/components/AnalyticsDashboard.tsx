import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, ShoppingCart, Percent, AlertCircle, Sparkles } from 'lucide-react';
import { Product, Sale, Expense, BusinessHealth } from '../types';

interface AnalyticsDashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  health: BusinessHealth;
  currency: string;
}

export default function AnalyticsDashboard({ products, sales, expenses, health, currency }: AnalyticsDashboardProps) {
  // Compute charts data
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.sellingPrice), 0);
  const totalStockCost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  
  // Calculate revenue from past days to draw Line chart
  const getPastSevenDays = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesList = getPastSevenDays();
  const salesByDate = datesList.map(dateStr => {
    const daySales = sales.filter(s => s.timestamp.startsWith(dateStr));
    const totalRev = daySales.reduce((sum, s) => sum + s.total, 0);
    const totalExp = expenses
      .filter(e => e.timestamp.startsWith(dateStr))
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      date: dateStr,
      displayDate: new Date(dateStr).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' }),
      revenue: totalRev,
      expense: totalExp,
      profit: totalRev - totalExp
    };
  });

  // Category distribution
  const categoriesMap: { [key: string]: number } = {};
  products.forEach(p => {
    categoriesMap[p.category] = (categoriesMap[p.category] || 0) + (p.stock * p.sellingPrice);
  });
  const categoryData = Object.entries(categoriesMap).map(([title, val]) => ({ title, val }));

  // Peak hourly transactions
  const hoursMap = Array(24).fill(0);
  sales.forEach(s => {
    try {
      const h = new Date(s.timestamp).getHours();
      hoursMap[h] = hoursMap[h] + 1;
    } catch (e) {}
  });

  const busiestHours = hoursMap
    .map((count, hour) => ({ hour, count }))
    .filter(item => item.count > 0 || (item.hour >= 7 && item.hour <= 20));

  // Determine health style
  const getHealthTheme = (status: string) => {
    switch (status) {
      case 'Excellent':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-400' };
      case 'Good':
        return { bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20', dot: 'bg-teal-500', text: 'text-teal-400' };
      case 'Warning':
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-400' };
      case 'Critical':
      default:
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500', text: 'text-rose-400' };
    }
  };

  const healthTheme = getHealthTheme(health.score);

  // SVG dimensions for graphs
  const chartHeight = 160;
  const chartWidth = 500;

  // Compute SVG Points for Line Chart (Revenue Trend)
  const maxRevenue = Math.max(...salesByDate.map(d => d.revenue), 100);
  const strokePoints = salesByDate.map((d, index) => {
    const x = (index / (salesByDate.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((d.revenue / maxRevenue) * (chartHeight - 40) + 20);
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = strokePoints ? `20,${chartHeight - 10} ${strokePoints} ${chartWidth - 20},${chartHeight - 10}` : '';

  return (
    <div className="space-y-6" id="dashboard_view">
      {/* Dynamic Health Card */}
      <div className={`p-5 rounded-2xl border ${healthTheme.bg} transition-all duration-300 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${healthTheme.dot}`}></span>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">Spaza Health Score</span>
          </div>
          <h2 className="text-3xl font-bold font-sans tracking-tight">Status: {health.score}</h2>
          <p className="text-sm opacity-90 max-w-xl">
            Based on R{health.revenueToday.toLocaleString('en-ZA')} daily sales, {health.lowStockCount} low shelf-stocks, and {health.profitMargin}% average margin.
          </p>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 shrink-0 text-center">
            <span className="block font-mono text-xs text-gray-400 uppercase">Operational Score</span>
            <span className="text-2xl font-bold text-white">{health.scoreValue}/100</span>
          </div>
          {health.lowStockCount > 0 && (
            <div className="bg-rose-500/10 text-rose-400 px-4 py-2.5 rounded-xl border border-rose-500/20 shrink-0 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold uppercase text-rose-350">Restock Req.</span>
                <span className="text-lg font-bold">{health.lowStockCount} Items</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Bento Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Sales */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4 transition-all duration-350">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-xs uppercase">Today's Cash Sales</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              R{health.revenueToday.toFixed(2)}
            </span>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1.5 font-mono">
              {health.transactionsToday} sales
            </span>
          </div>
        </div>

        {/* Card 2: Avg Profit Margin */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4 transition-all duration-350">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-xs uppercase">Avg Profit Margin</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              {health.profitMargin}%
            </span>
            <span className="text-xs flex items-center text-emerald-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5 inline mr-0.5" /> High Margin Staples
            </span>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4 transition-all duration-350">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-xs uppercase">Shelf Expiring (60 Days)</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              {health.expiringSoonCount} Items
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Check dairy & bakeries
            </span>
          </div>
        </div>

        {/* Card 4: Total Inventory Value */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4 transition-all duration-350">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-xs uppercase">Shelf Assets Value</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              R{totalStockValue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-gray-500 font-mono block">
              Wholesale cost: R{totalStockCost.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Line Graph */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Weekly Revenue Flow</h3>
              <p className="text-gray-400 text-xs font-mono">Comparing daily cash revenue in Rands</p>
            </div>
            <TrendingUp className="text-gray-500 w-5 h-5" />
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={chartWidth - 20} y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="20" y1="60" x2={chartWidth - 20} y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="20" y1="100" x2={chartWidth - 20} y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="20" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

              {/* Area Shading */}
              {fillPoints && (
                <polygon
                  points={fillPoints}
                  fill="url(#grad-rev)"
                  className="opacity-15"
                />
              )}

              {/* Line */}
              {strokePoints && (
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={strokePoints}
                />
              )}

              {/* Data points/dots */}
              {salesByDate.map((d, index) => {
                const x = (index / (salesByDate.length - 1)) * (chartWidth - 40) + 20;
                const y = chartHeight - ((d.revenue / maxRevenue) * (chartHeight - 40) + 20);
                return (
                  <g key={index} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#141416"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="#6366f1"
                      className="opacity-0 group-hover:opacity-20 transition-opacity duration-200"
                    />
                  </g>
                );
              })}

              {/* Gradients Definition */}
              <defs>
                <linearGradient id="grad-rev" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Labels Row */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] text-gray-400">
            {salesByDate.map((d, index) => (
              <div key={index} className="truncate px-0.5">
                <span className="block font-semibold text-gray-250">R{Math.round(d.revenue)}</span>
                <span>{d.displayDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Category distribution of shelf items */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Shelf Stock Allocation</h3>
              <p className="text-gray-400 text-xs font-mono">Aggregate pricing asset weight per category</p>
            </div>
            <ShoppingCart className="text-gray-500 w-5 h-5" />
          </div>

          <div className="space-y-3.5 py-2">
            {categoryData.sort((a,b) => b.val - a.val).slice(0, 5).map((cat, index) => {
              const maxVal = Math.max(...categoryData.map(c => c.val), 100);
              const percentage = (cat.val / totalStockValue) * 100;
              
              // dynamic colors
              const barColors = [
                'bg-emerald-500',
                'bg-blue-500',
                'bg-amber-500',
                'bg-purple-500',
                'bg-indigo-500'
              ];
              const colorClass = barColors[index % barColors.length];

              return (
                <div key={cat.title} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-250">{cat.title}</span>
                    <span className="font-mono text-gray-400 text-xs">
                      R{cat.val.toFixed(0)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full ${colorClass} transition-all duration-1000`} 
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Busy Hours analysis */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Peak Sales Activity Chart</h3>
              <p className="text-gray-400 text-xs font-mono">Busiest operational transaction times (24-hour cycle)</p>
            </div>
            <span className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded font-mono uppercase">Hourly</span>
          </div>

          {/* Histogram bar SVG */}
          <div className="pt-2">
            <div className="flex items-end justify-between h-36 gap-1 border-b border-white/10 px-1">
              {busiestHours.map((item) => {
                const maxCount = Math.max(...busiestHours.map(i => i.count), 1);
                const heightPct = (item.count / maxCount) * 100;
                
                return (
                  <div key={item.hour} className="flex-1 flex flex-col items-center group cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute -translate-y-10 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 font-mono shadow-md">
                      {item.count} Sales
                    </div>
                    
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 ${
                        item.count > 1 ? 'bg-indigo-650 group-hover:bg-indigo-500' : 'bg-white/10 group-hover:bg-white/20'
                      }`}
                      style={{ height: `${Math.max(heightPct * 1.2, 5)}px` }}
                    />
                    
                    {/* Label */}
                    <span className="text-[10px] font-mono text-gray-400 mt-2">
                      {item.hour}:00
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spaza Stock advisory alerts */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 text-white">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Smart Fast & Slow Movers</h3>
          </div>
          <p className="text-gray-400 text-xs">AI predictive tracking based on South African customer trend patterns</p>

          <div className="space-y-4 my-2">
            {/* Fast moving items showcase */}
            <div className="space-y-2">
              <span className="inline-block text-[10px] tracking-wider font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                🔥 Hot Fast Sellers
              </span>
              <div className="space-y-1">
                {products.filter(p => p.fastSelling).slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 hover:bg-white/5 px-1 rounded transition-colors">
                    <span className="font-medium text-gray-250">{p.name}</span>
                    <span className="text-gray-400 font-mono">Stock on shelf: {p.stock}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow moving items showcase */}
            <div className="space-y-2">
              <span className="inline-block text-[10px] tracking-wider font-mono font-bold uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                🐢 Slow-Moving Stock
              </span>
              <div className="space-y-1">
                {products.filter(p => p.slowMoving).slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 hover:bg-white/5 px-1 rounded transition-colors">
                    <span className="font-medium text-gray-250">{p.name}</span>
                    <span className="text-amber-450 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono text-[10px]">Recommend Discount</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
