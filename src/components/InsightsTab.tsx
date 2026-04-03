
import React, { useMemo, useState } from 'react';
import { EmployeeSalaryData } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface InsightsTabProps {
  employees: EmployeeSalaryData[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ employees }) => {
  const [compareMode, setCompareMode] = useState<'monthly' | 'yearly'>('monthly');

  const comparisonData = useMemo(() => {
    const data: any[] = [];
    const periods = Array.from(new Set(employees.map(e => `${e.month} ${e.year}`))).sort();
    
    periods.forEach(period => {
      const periodEmployees = employees.filter(e => `${e.month} ${e.year}` === period);
      data.push({
        period,
        totalNet: periodEmployees.reduce((sum, e) => sum + e.netSalary, 0),
        totalGross: periodEmployees.reduce((sum, e) => sum + e.grossEarnings, 0),
        totalDeductions: periodEmployees.reduce((sum, e) => sum + e.totalDeductions, 0),
        headcount: periodEmployees.length
      });
    });
    
    return data;
  }, [employees]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Insights</h2>
          <p className="text-gray-500 mt-1 font-medium uppercase text-[10px] tracking-widest">Advanced Analytics and Payroll Trends</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setCompareMode('monthly')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${compareMode === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setCompareMode('yearly')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${compareMode === 'yearly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Payroll Trends</h3>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparisonData}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="totalNet" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <PieChartIcon size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Cost Distribution</h3>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Net Salary', value: comparisonData.reduce((sum, d) => sum + d.totalNet, 0) },
                    { name: 'Deductions', value: comparisonData.reduce((sum, d) => sum + d.totalDeductions, 0) }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#f1f5f9" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
