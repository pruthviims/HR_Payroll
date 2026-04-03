
import React from 'react';
import { EmployeeSalaryData } from '../types';
import { Calculator, ShieldCheck, FileText } from 'lucide-react';

interface TaxTabProps {
  employees: EmployeeSalaryData[];
}

export const TaxTab: React.FC<TaxTabProps> = ({ employees }) => {
  const totalPT = employees.reduce((sum, e) => sum + e.ptDeduction, 0);
  const totalESI = employees.reduce((sum, e) => sum + e.esiDeduction, 0);
  const totalPF = employees.reduce((sum, e) => sum + e.pfDeduction, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Statutory Compliance</h2>
        <p className="text-gray-500 mt-1 font-medium uppercase text-[10px] tracking-widest">Tax and Statutory Contribution Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <Calculator size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Professional Tax</span>
          </div>
          <div className="text-4xl font-black text-gray-900">₹{totalPT.toLocaleString()}</div>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Total PT collected across all employees for the selected period.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">ESI Contribution</span>
          </div>
          <div className="text-4xl font-black text-gray-900">₹{totalESI.toLocaleString()}</div>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Employee share of ESI contribution for health insurance benefits.</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <FileText size={24} />
            </div>
            <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Provident Fund</span>
          </div>
          <div className="text-4xl font-black text-gray-900">₹{totalPF.toLocaleString()}</div>
          <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Total PF deduction for retirement savings and social security.</p>
        </div>
      </div>
    </div>
  );
};
