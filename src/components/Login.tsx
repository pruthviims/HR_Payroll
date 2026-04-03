import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Loader2, Mail, ShieldAlert, Building2, ShieldCheck } from 'lucide-react';
import { cloudApi } from '../services/api';

interface LoginProps {
  onLogin: (username: string, password: string, companyId: string) => Promise<void>;
  onSetupClick: () => void;
  error?: string | null;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

const Login: React.FC<LoginProps> = ({ onLogin, onSetupClick, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCompanyId, setForgotCompanyId] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCompanyId = params.get('companyId');
    if (urlCompanyId) {
      setCompanyId(urlCompanyId);
      console.log(`[LOGIN] URL Company ID detected: ${urlCompanyId}. Fetching logo...`);
      // Fetch company logo if companyId is present
      cloudApi.fetchLogo(urlCompanyId).then(logo => {
        console.log(`[LOGIN] fetchLogo returned: ${logo ? 'logo data' : 'null'}`);
        if (logo) setCompanyLogo(logo);
        else setCompanyLogo(null); // Explicitly clear if null
      });
    }
  }, []);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => setLockoutTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  // Handle external errors (like invalid creds) to increment attempts
  useEffect(() => {
    if (error) {
      setAttempts(prev => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) setLockoutTime(COOLDOWN_SECONDS);
        return next;
      });
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;
    
    setIsLoggingIn(true);
    const slugifiedCompanyId = companyId.toLowerCase().trim().replace(/\s+/g, '_');
    const cleanUsername = username.toLowerCase().trim();
    console.log(`[LOGIN] Submitting: username=${cleanUsername}, companyId=${slugifiedCompanyId}`);
    
    try {
      await onLogin(cleanUsername, password, slugifiedCompanyId);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    setRecoveryMessage(null);

    try {
      const slugifiedCompanyId = forgotCompanyId.toLowerCase().trim().replace(/\s+/g, '_');
      const user = await cloudApi.recoverPassword(slugifiedCompanyId, forgotEmail);

      if (user) {
        const loginUrl = `${window.location.origin}/payroll/?companyId=${slugifiedCompanyId}`;
        const subject = encodeURIComponent(`Account Recovery - Staff Access Portal`);
        const body = encodeURIComponent(
          `Hello ${user.name},\n\n` +
          `You requested account recovery for your HR Portal access.\n\n` +
          `Company ID: ${slugifiedCompanyId}\n` +
          `Username: ${user.username}\n\n` +
          `SECURITY NOTICE: Your password is encrypted and cannot be recovered in plain text.\n` +
          `Please contact your Payroll Administrator to have your password reset.\n\n` +
          `Login URL: ${loginUrl}\n\n` +
          `Regards,\n` +
          `System Administrator`
        );

        // Open mail client to the user's email
        window.location.assign(`mailto:${user.email}?subject=${subject}&body=${body}`);
        
        setRecoveryMessage({ 
          text: "Recovery request prepared. Please contact your administrator to reset your encrypted password.", 
          type: 'success' 
        });
      } else {
        setRecoveryMessage({ 
          text: "No account found with this email in the specified company.", 
          type: 'error' 
        });
      }
    } catch {
      setRecoveryMessage({ 
        text: "Failed to process recovery request. Please contact support.", 
        type: 'error' 
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-[120px]" />

      {/* Top Error Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-6 pointer-events-none">
        {error && (
          <div className="pointer-events-auto p-4 bg-white border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 shadow-2xl animate-in slide-in-from-top-8 duration-500">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white p-10 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-10">
          <div 
            className="w-28 h-20 bg-white rounded-[20px] flex items-center justify-center overflow-hidden mb-6 shadow-lg shadow-indigo-100/50 p-1 border border-gray-100 transition-transform hover:scale-105 duration-300"
          >
            <img 
              src={companyLogo || "https://cdn-icons-png.flaticon.com/512/3135/3135706.png"} 
              alt="Payslip Portal" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Access Portal</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Secure HR Portal Gateway</p>
        </div>

        {lockoutTime > 0 ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center text-center gap-4 animate-in slide-in-from-top-2">
            <ShieldAlert size={48} className="text-red-500" />
            <h3 className="text-lg font-black text-red-900">Security Lockout</h3>
            <p className="text-sm text-red-700 font-medium">Too many failed attempts. Access temporarily disabled for security.</p>
            <div className="px-6 py-2 bg-red-100 text-red-600 rounded-full font-black text-lg">
              {lockoutTime}s
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company ID</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Building2 size={18} />
                </div>
                <input 
                  type="text" 
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="e.g. company-id"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Staff Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Mail ID"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <><span>Enter Portal</span><ArrowRight size={20} /></>}
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-gray-100 text-center flex flex-col gap-4">
          <button 
            onClick={onSetupClick}
            className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
          >
            Platform Setup
          </button>
          <div className="inline-flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>AES-256 Cloud Encryption Active</span>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Recover Account</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">
                Enter your details to recover your access credentials.
              </p>
              
              <form onSubmit={handleRecoverPassword} className="w-full space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company ID</label>
                  <input 
                    type="text" 
                    required
                    value={forgotCompanyId}
                    onChange={(e) => setForgotCompanyId(e.target.value)}
                    placeholder="e.g. company-id"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>

                {recoveryMessage && (
                  <div className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-tight ${
                    recoveryMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {recoveryMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isRecovering ? <Loader2 className="animate-spin" size={16} /> : <><span>Send Recovery Email</span><ArrowRight size={14} /></>}
                </button>
              </form>

              <button 
                onClick={() => {
                  setShowForgotModal(false);
                  setRecoveryMessage(null);
                }}
                className="mt-4 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;