
import React, { useState, useEffect, useCallback } from 'react';
import { User, Role, EmployeeSalaryData } from '../types';
import { cloudApi } from '../services/api';
import { UserPlus, RefreshCcw, Shield, Trash2, X, UserCheck, Send, Info, ShieldAlert } from 'lucide-react';

interface UserManagementTabProps {
  employees: EmployeeSalaryData[];
  onLogout?: () => void;
  showNotification?: (message: string, type: 'success' | 'error') => void;
  currentUser?: User | null;
  companyName?: string;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ employees: _employees, onLogout, showNotification, currentUser, companyName }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [sharingStatus, setSharingStatus] = useState<Record<string, boolean>>({});
  
  // Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>(Role.EMPLOYEE);
  
  const loadUsers = useCallback(async () => {
    if (!currentUser?.companyId) return;
    const data = await cloudApi.fetchUsers(currentUser.companyId);
    setUsers(data);
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Access Control
  if (currentUser?.role !== Role.ADMIN) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8 shadow-xl shadow-red-100/50">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Access Restricted</h2>
        <p className="text-gray-500 max-w-md font-medium leading-relaxed">
          This management portal is reserved for Payroll Administrators. Please contact your system supervisor if you believe this is an error.
        </p>
      </div>
    );
  }

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    const pass = Array(10).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    setNewUserPassword(pass);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername || !newUserPassword || !currentUser?.companyId) return;

    const lowerEmail = newUserEmail.toLowerCase();
    const newUser: User = {
      name: newUserName,
      email: lowerEmail,
      username: newUserUsername,
      password: newUserPassword,
      role: newUserRole,
      companyId: currentUser.companyId
    };

    const updatedUsers = [...users, newUser];
    await cloudApi.saveUsers(currentUser.companyId, updatedUsers);
    setUsers(updatedUsers);
    if (showNotification) {
      showNotification(`Account created for ${newUserName}`, 'success');
    }
    setIsModalOpen(false);
    
    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserRole(Role.EMPLOYEE);
  };

  const deleteUser = async (username: string) => {
    if (username === 'admin' || !currentUser?.companyId) return; 
    const updated = users.filter(u => u.username !== username);
    await cloudApi.saveUsers(currentUser.companyId, updated);
    setUsers(updated);
  };

  const handleRemoveAllUsers = async () => {
    if (!currentUser?.companyId) return;
    try {
      await cloudApi.removeAllUsers(currentUser.companyId);
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to remove all users", e);
    }
  };

  const shareCredentials = (user: User) => {
    if (!user.email) {
      if (showNotification) {
        showNotification("No email address associated with this account.", 'error');
      }
      return;
    }
    
    setSharingStatus({ ...sharingStatus, [user.username]: true });

    const slugifiedCompanyId = user.companyId || '';
    const loginUrl = `${window.location.origin}${window.location.pathname}?companyId=${slugifiedCompanyId}`;
    const subject = encodeURIComponent(`Your ${companyName || 'HR Portal'} Login Credentials`);
    const body = encodeURIComponent(
      `Hello ${user.name},\n\n` +
      `Your access to the ${companyName || 'HR Portal'} has been created.\n\n` +
      `Company ID: ${slugifiedCompanyId}\n` +
      `Username: ${user.username}\n` +
      `Password: ${user.password}\n\n` +
      `Login URL: ${loginUrl}\n\n` +
      `Please log in at your earliest convenience.\n\n` +
      `Regards,\n` +
      `Payroll Administration`
    );

    // Open mail client
    window.location.assign(`mailto:${user.email}?subject=${subject}&body=${body}`);
    
    setTimeout(() => {
      setSharingStatus({ ...sharingStatus, [user.username]: false });
      if (showNotification) {
        showNotification(`Email client opened for ${user.email}.`, 'success');
      }
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Staff Management</h2>
          <p className="text-sm text-gray-500 font-medium">Control access for Payroll and HR/Finance team members</p>
          
          <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3">
             <Info className="text-indigo-600 shrink-0" size={18} />
             <div className="space-y-1">
               <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">How to share credentials</p>
               <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                 Clicking the <Send size={10} className="inline mx-0.5" /> icon will open your device's default email app (Outlook/Gmail) with a pre-filled draft. Simply click 'Send' in your mail app to finish.
               </p>
             </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl border border-red-100 hover:bg-red-100 transition-all shrink-0"
          >
            <Trash2 size={18} />
            <span className="text-xs uppercase tracking-widest">Remove All Users</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all shrink-0"
          >
            <UserPlus size={18} />
            <span className="text-xs uppercase tracking-widest">Add New Staff Member</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-50">
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-6">Staff Name & Email</th>
                <th className="px-8 py-6">Username / ID</th>
                <th className="px-8 py-6">Role / Team</th>
                <th className="px-8 py-6">Password</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.username} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.name || 'System'}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{u.email || 'No email set'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">{u.username}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${u.role === Role.ADMIN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      <Shield size={10} /> {u.role === Role.ADMIN ? 'Payroll Admin' : 'HR/Finance Team'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg font-mono text-[10px] font-bold text-gray-400 w-fit italic">
                      {u.password?.startsWith('$2') ? '•••••••• (Encrypted)' : u.password}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          if (u.password?.startsWith('$2')) {
                            if (showNotification) showNotification("Cannot share encrypted password. Reset it to share new credentials.", 'error');
                            return;
                          }
                          shareCredentials(u);
                        }}
                        disabled={sharingStatus[u.username] || !u.email}
                        className="p-3 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-30"
                        title="Open Email Client with Credentials"
                      >
                        {sharingStatus[u.username] ? <RefreshCcw size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                      <button 
                        onClick={() => deleteUser(u.username)}
                        disabled={u.username === 'admin'}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3"><UserCheck size={24}/> Create Staff Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. John Doe" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <input required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. john@company.com" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username / Login ID</label>
                <input required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. hr_auditor_1" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600">
                  <option value={Role.EMPLOYEE}>HR / Finance Team (View Only)</option>
                  <option value={Role.ADMIN}>Payroll Admin (Full Access)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <div className="flex gap-2">
                  <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="text" className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Set or Generate" />
                  <button type="button" onClick={generatePassword} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"><RefreshCcw size={18}/></button>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                  Confirm & Save User
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (!newUserName || !newUserUsername || !newUserPassword) {
                      if (showNotification) showNotification("Please fill in all fields first.", 'error');
                      return;
                    }
                    shareCredentials({
                      name: newUserName,
                      email: newUserEmail,
                      username: newUserUsername,
                      password: newUserPassword,
                      role: newUserRole,
                      companyId: currentUser?.companyId || ''
                    });
                  }}
                  className="px-6 py-4 bg-indigo-50 text-indigo-600 font-black rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                  title="Share credentials before saving"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[120] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-red-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3"><Trash2 size={24}/> Dangerous Action</h3>
              <button onClick={() => setIsResetConfirmOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-sm font-bold text-red-700 leading-relaxed">
                  You are about to remove <span className="underline">ALL</span> user accounts from the system. This includes your own account.
                </p>
                <p className="mt-2 text-xs font-medium text-red-600">
                  Once confirmed, you will be logged out immediately and the system will require initial setup for the next login.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleRemoveAllUsers}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all uppercase tracking-widest text-xs"
                >
                  Yes, Remove All & Logout
                </button>
                <button 
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
