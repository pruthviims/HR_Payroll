import React, { useState } from 'react';
import { Client } from '../types';
import { 
  Briefcase, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Calendar,
  Search,
  Building2
} from 'lucide-react';

interface ClientManagementTabProps {
  clients: Client[];
  onAddClient: (name: string) => void;
  onToggleStatus: (clientName: string) => void;
  isAdmin: boolean;
}

export const ClientManagementTab: React.FC<ClientManagementTabProps> = ({ 
  clients, 
  onAddClient, 
  onToggleStatus,
  isAdmin 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!newClientName.trim()) return;
    onAddClient(newClientName.trim());
    setNewClientName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Client Management</h2>
          <p className="text-gray-500 mt-1 font-medium uppercase text-[10px] tracking-widest">Manage Principal Employers and Operational Status</p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Add New Client</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active: {clients.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suspended: {clients.filter(c => c.status === 'suspended').length}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Client Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Added Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map((client) => (
                <tr key={client.name} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border transition-all ${client.status === 'active' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className={`font-black text-sm transition-colors ${client.status === 'active' ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{client.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Principal Employer</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs">
                      <Calendar size={14} className="text-gray-300" />
                      {new Date(client.addedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {client.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <ShieldCheck size={12} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
                        <ShieldAlert size={12} />
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => onToggleStatus(client.name)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${client.status === 'active' ? 'text-rose-600 border-rose-100 hover:bg-rose-50' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                      >
                        {client.status === 'active' ? 'Suspend Client' : 'Activate Client'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-gray-50 rounded-[2rem] text-gray-300">
                        <Briefcase size={48} />
                      </div>
                      <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No clients found</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[150] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">New Principal Employer</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">Add a new company/client to your Maruthi portal.</p>
              
              <input 
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                placeholder="Client Company Name"
                autoFocus
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold mb-6 outline-none focus:ring-2 focus:ring-indigo-600"
              />

              <div className="flex gap-4 w-full">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Add Client</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
