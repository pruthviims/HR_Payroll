import React from 'react';
import { EmployeeSalaryData } from '../types';
import { LayoutDashboard, Users, IndianRupee, Wallet, Calendar, FileDown } from 'lucide-react';

interface HomeTabProps {
  employees: EmployeeSalaryData[];
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  triggerUpload: () => void;
  isAdmin?: boolean;
}

const HomeTab: React.FC<HomeTabProps> = ({ employees, selectedPeriod, setSelectedPeriod, triggerUpload, isAdmin }) => {
  const availablePeriods = Array.from(new Set(employees.map(e => `${e.month}-${e.year}`))).sort().reverse();
  
  const filteredEmployees = employees.filter(e => `${e.month}-${e.year}` === selectedPeriod);

  const stats = {
    headcount: filteredEmployees.length,
    totalNet: filteredEmployees.reduce((sum, e) => sum + e.netSalary, 0),
    totalPF: filteredEmployees.reduce((sum, e) => sum + e.pfDeduction, 0),
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payroll Dashboard</h2>
          <p className="text-gray-500 mt-1 font-medium">Overview of employee payroll records for the selected period.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={triggerUpload}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <FileDown size={18} />
              <span>Import Data</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <Calendar className="text-indigo-600 ml-2" size={20} />
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-gray-700 pr-8 cursor-pointer"
            >
              {availablePeriods.length > 0 ? (
                availablePeriods.map(p => <option key={p} value={p}>{p}</option>)
              ) : (
                <option value="">No Data Available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Users size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Headcount</span>
          </div>
          <div className="text-4xl font-black text-gray-900">{stats.headcount}</div>
          <div className="mt-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">Active Employees</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <IndianRupee size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total Net Payout</span>
          </div>
          <div className="text-4xl font-black text-gray-900">₹{stats.totalNet.toLocaleString()}</div>
          <div className="mt-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">Monthly Disbursement</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <Wallet size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-xs">Total PF Fund</span>
          </div>
          <div className="text-4xl font-black text-gray-900">₹{stats.totalPF.toLocaleString()}</div>
          <div className="mt-2 text-xs font-bold text-amber-600 uppercase tracking-widest">Statutory Contribution</div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Employee Records</h3>
        </div>
        
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Employee Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Attendance</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Gross Earnings</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Deductions</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Net Take-Home</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-100">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{emp.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[80px]">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(emp.workedDays / emp.totalDays) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-700">{emp.workedDays}/{emp.totalDays}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-gray-900 text-sm">₹{emp.grossEarnings.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right font-black text-rose-500 text-sm">₹{emp.totalDeductions.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-sm border border-emerald-100">
                      ₹{emp.netSalary.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-gray-50 rounded-[2rem] text-gray-300">
                        <LayoutDashboard size={48} />
                      </div>
                      <div className="text-gray-400 font-bold uppercase tracking-widest text-sm">No payroll records found for this period</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
