import React, { useState } from 'react';
import { Database, ShieldCheck, Key, RefreshCw, Terminal, CheckCircle2, Clipboard, AlertCircle, Sparkles } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, hasSupabaseConfig } from '../lib/supabase';

interface SaasDevPortalProps {
  currentBusiness: {
    id: string;
    name: string;
    plan_tier: string;
    subscription_status: string;
  } | null;
  currentUser: {
    email: string;
    fullname: string;
    role: string;
  } | null;
}

export default function SaasDevPortal({ currentBusiness, currentUser }: SaasDevPortalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'architecture' | 'parameters'>('schema');

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6" id="saas_dev_portal">
      {/* Header Info Banner */}
      <div className="bg-[#141416] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
            SaaS Infrastructure Control
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-1.5">Supabase Multi-Tenant Integration</h2>
          <p className="text-xs text-gray-400 mt-1">
            SpazaFlow AI supports high-scale tenant isolation using Postgres Row Level Security (RLS) policies.
          </p>
        </div>

        <div className="flex gap-2">
          {hasSupabaseConfig ? (
            <div className="flex items-center gap-1.5 bg-emerald-550/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Supabase Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Running Local Sandbox</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-[#141416] p-4 rounded-2xl border border-white/5 space-y-1.5 h-fit">
          <button
            onClick={() => setActiveTab('schema')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'schema'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>PostgreSQL SQL Schema</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'architecture'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Row-Level Security (RLS)</span>
          </button>

          <button
            onClick={() => setActiveTab('parameters')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'parameters'
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Connection Guide</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3 bg-[#141416] p-6 rounded-2xl border border-white/5 min-h-[420px] flex flex-col justify-between">
          
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 -m-6 mb-4 px-6 py-3.5 border-b border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Interactive SQL Schema Blueprint</span>
                </span>
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Run this single schema migration block in your **Supabase Dashboard SQL query console** to configure all core multi-tenant business registries. It generates proper triggers, relationships, and sequences.
              </p>

              <div className="max-h-72 overflow-y-auto bg-[#0A0A0B] p-4 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400 leading-normal scrollbar-thin select-all">
                {SUPABASE_SQL_SCHEMA}
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
                <span>Multi-Tenancy Isolation Guidelines (RLS)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <span className="text-xs font-bold text-indigo-400 block">Row-Level Security (RLS)</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    By binding every data point to `business_id` and querying it against the session's JWT metadata (`auth.uid()`), Supabase blocks cross-tenant data leaks right on the database layer. No user can view or alter other spaza's registries.
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 block">SaaS Subscription Guarding</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Plan tiers like **Starter**, **Business**, and **Enterprise** enforce dynamic limits in our Postgres triggers. For example, registering a product checks the active shop's plan catalog limits immediately.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5 space-y-2 font-sans">
                <span className="text-xs font-semibold text-gray-300 block">Typical JWT Payload Schema</span>
                <div className="bg-[#0A0A0B] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-gray-500">
                  {`{\n  "iss": "https://yourproject.supabase.co/auth/v1",\n  "sub": "08f33190-671a-4c91-95ad-0931221b20ac",\n  "email": "${currentUser?.email || 'owner@spaza.co'}",\n  "app_metadata": { "provider": "email" },\n  "user_metadata": {\n    "role": "${currentUser?.role || 'Owner'}",\n    "business_id": "${currentBusiness?.id || 'f88bcb59-a495-4829-9a7b-20ac190b3726'}"\n  }\n}`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Key className="w-4.5 h-4.5 text-indigo-400" />
                <span>Connecting Your Production Supabase Tenant</span>
              </h3>

              <p className="text-xs text-gray-400 leading-relaxed">
                SpazaFlow AI is fully equipped to interact with live backend systems. Define these keys in your system environment to connect seamlessly:
              </p>

              <div className="space-y-3">
                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 font-mono">STEP 1: Create Supabase Project</span>
                  <p className="text-xs text-gray-300">Open <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">supabase.com</a> and provision a free PostgreSQL database.</p>
                </div>

                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 font-mono">STEP 2: Set Environment Secrets</span>
                  <p className="text-xs text-gray-300">Go to **AI Studio Rules / Settings Menu**, scroll to Environment Variables, and input:</p>
                  <ul className="text-[11px] text-gray-400 list-disc list-inside mt-1.5 space-y-1 pl-1 font-mono">
                    <li><span className="text-indigo-400">VITE_SUPABASE_URL</span> = <span className="text-gray-500">Your Supabase API URL endpoint</span></li>
                    <li><span className="text-indigo-400">VITE_SUPABASE_ANON_KEY</span> = <span className="text-gray-500">Your Supabase Public Anon Key</span></li>
                  </ul>
                </div>

                <div className="bg-[#0A0A0B] p-3.5 rounded-xl border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-500 font-mono">STEP 3: Refresh Dev Environment</span>
                  <p className="text-xs text-gray-300">The platform automatically detects the keys, initiates connection, routes real operations, and unlocks live multi-tenant databases instantly!</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Diagnostic Panel */}
          <div className="pt-4 border-t border-white/5 mt-4 text-[10px] text-gray-500 font-mono flex flex-col sm:flex-row justify-between gap-2">
            <span>Core: SpazaFlow AI Core</span>
            <span>RLS Context: Active (TENANT: {currentBusiness?.id || 'Sandbox_ID_01'})</span>
            <span>Security Rule: compliance_v1.07</span>
          </div>

        </div>
      </div>
    </div>
  );
}
