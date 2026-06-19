import React, { useState } from 'react';
import { DollarSign, FilePlus, Receipt, ArrowRight, MinusCircle, Wallet, Plus } from 'lucide-react';
import { Expense, Sale } from '../types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  sales: Sale[];
  onAddExpense: (exp: Partial<Expense>) => Promise<void>;
  currency: string;
}

export default function ExpenseTracker({ expenses, sales, onAddExpense, currency }: ExpenseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<'Rent' | 'Electricity' | 'Water' | 'Supplier Stock' | 'Salaries' | 'Transport' | 'Other'>('Electricity');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpensesValue = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netEarnings = totalSalesRevenue - totalExpensesValue;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      alert("Please provide a valid numeric amount!");
      return;
    }

    await onAddExpense({
      category,
      amount: parseFloat(amount),
      description: description || `Logged expense for ${category}`
    });

    setAmount('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="expense_view">
      
      {/* Bookkeeping Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-white">
        {/* Sales inflow */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-[10px] uppercase">Cash Inflow (Sales)</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              R{totalSalesRevenue.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 font-mono block">Aggregate revenue logged</span>
          </div>
        </div>

        {/* Expenses Outflow */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <MinusCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-[10px] uppercase">Cash Outflow (Expenses)</span>
            <span className="text-2xl font-bold font-sans tracking-tight text-white">
              R{totalExpensesValue.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 font-mono block">Rent, Eskom tokens & stock order POs</span>
          </div>
        </div>

        {/* Standing Profit margin */}
        <div className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-gray-400 font-mono text-[10px] uppercase">Net Earnings cash</span>
            <span className={`text-2xl font-bold font-sans tracking-tight ${netEarnings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              R{netEarnings.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 font-mono block">Inflow minus outflow tally</span>
          </div>
        </div>
      </div>

      {/* Action Header block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141416] p-4 rounded-2xl border border-white/5 shadow-sm">
        <div>
          <h3 className="font-bold text-lg text-white">Operational Expense Tracker</h3>
          <p className="text-xs text-gray-400 font-sans">Compare utility bills, supplier expenses, and log custom tuck shop outlays</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Custom Outlay</span>
          </button>
        )}
      </div>

      {/* Add Custom Outlay Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#141416] p-5 rounded-2xl border border-white/5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-xl text-white">
          <div className="border-b border-white/5 pb-2 flex items-center gap-2 text-indigo-400">
            <FilePlus className="w-5 h-5 text-indigo-150 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">Record Business Expense</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1">
              <label className="block font-semibold uppercase text-gray-400">Expense Category Ledger</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0B] border border-white/10 text-white outline-none focus:border-indigo-500"
              >
                <option value="Electricity" className="bg-[#141416]">Electricity (Eskom Token)</option>
                <option value="Water" className="bg-[#141416]">Water Logistics</option>
                <option value="Rent" className="bg-[#141416]">Container Premise Rent</option>
                <option value="Supplier Stock" className="bg-[#141416]">Supplier Stock Purchases</option>
                <option value="Salaries" className="bg-[#141416]">Cashier Wages / salaries</option>
                <option value="Transport" className="bg-[#141416]">Transport fuel/taxi hire</option>
                <option value="Other" className="bg-[#141416]">Other Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold uppercase text-gray-400">Paid Amount (Rands) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Paid: E.g. R600.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block font-semibold uppercase text-gray-400">Log explanation / Memo details</label>
              <input
                type="text"
                placeholder="E.g. Eskom token receipt, bread deliveries logistics, etc..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-white/10 bg-[#0A0A0B] text-white outline-none focus:border-indigo-500 placeholder-gray-550"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Save Outlay
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Expense log table */}
      <div className="bg-[#141416] rounded-2xl border border-white/5 shadow-xs overflow-hidden">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-white/5 text-gray-400 font-mono border-b border-white/5">
              <th className="p-4 uppercase tracking-wider font-semibold">Expense Category</th>
              <th className="p-4 uppercase tracking-wider font-semibold">Paid Amount</th>
              <th className="p-4 uppercase tracking-wider font-semibold">Memo description</th>
              <th className="p-4 uppercase tracking-wider font-semibold">Tuck shop Date logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-white/2 transition-colors">
                <td className="p-4">
                  <span className="inline-block px-2.5 py-0.8 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] uppercase font-mono font-bold tracking-wider">
                    {exp.category}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-white text-sm">
                  R{exp.amount.toFixed(2)}
                </td>
                <td className="p-4 text-gray-300 font-medium font-sans">
                  {exp.description}
                </td>
                <td className="p-4 text-gray-400 font-mono">
                  {new Date(exp.timestamp).toLocaleString('en-ZA')}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-500 font-semibold font-sans">
                  No logged commercial outlays found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
