
import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { cloudApi } from '../services/api';

interface SetupProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const Setup: React.FC<SetupProps> = ({ onBack, onSuccess }) => {
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId.trim()) {
      setError('Company ID is required');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!secret.trim()) {
      setError('System Secret Key is required');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[SETUP-UI] Form submitted. Initiating setup sequence...");
      await cloudApi.setupAdmin(companyId.trim(), email.trim(), password, secret.trim());
      console.log("[SETUP-UI] Setup successful! Redirecting...");
      onSuccess();
    } catch (err: any) {
      console.error("[SETUP-UI] Setup failed:", err);
      setError(err.message || 'Failed to setup admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100 border border-indigo-50">
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200 mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight text-center">Maruthi Security Setup</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Secure your payroll portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company ID</label>
            <input 
              type="text" 
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              placeholder="e.g. company-id"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              placeholder="admin@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Secret Key</label>
            <input 
              type="password" 
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold"
              placeholder="Enter Secret Key"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={20} />
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
