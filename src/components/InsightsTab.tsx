
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
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface InsightsTabProps {
  employees: EmployeeSalaryData[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ employees }) => {
  const [activeView, setActiveView] = useState<'compliance' | 'financial' | 'productivity' | 'retention'>('compliance');

  const stats = useMemo(() => {
    if (employees.length === 0) return null;

    const periods = Array.from(new Set(employees.map(e => `${e.month} ${e.year}`))).sort((a, b) => {
      const [m1, y1] = a.split(' ');
      const [m2, y2] = b.split(' ');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (y1 !== y2) return parseInt(y1) - parseInt(y2);
      return months.indexOf(m1) - months.indexOf(m2);
    });

    const latestPeriod = periods[periods.length - 1];
    const latestEmployees = employees.filter(e => `${e.month} ${e.year}` === latestPeriod);

    // Statutory Calculations for Latest Month
    const totalPF = latestEmployees.reduce((sum, e) => sum + e.pfDeduction, 0);
    const totalESI = latestEmployees.reduce((sum, e) => sum + e.esiDeduction, 0);
    const totalPT = latestEmployees.reduce((sum, e) => sum + e.ptDeduction, 0);
    const totalLWF = latestEmployees.reduce((sum, e) => sum + e.lwfDeduction, 0);

    // Productivity Stats for Latest Month
    const totalWorkedDays = latestEmployees.reduce((sum, e) => sum + e.workedDays, 0);
    const totalOTHours = latestEmployees.reduce((sum, e) => sum + e.otHours, 0);
    const avgWorkedDays = totalWorkedDays / latestEmployees.length;
    const avgOTHours = totalOTHours / latestEmployees.length;

    // Retention Stats for Latest Month vs Previous
    let newHires = 0;
    let leavers = 0;
    if (periods.length > 1) {
      const prevPeriod = periods[periods.length - 2];
      const prevEmployees = employees.filter(e => `${e.month} ${e.year}` === prevPeriod);
      const prevIds = new Set(prevEmployees.map(e => e.id));
      const currentIds = new Set(latestEmployees.map(e => e.id));
      
      newHires = latestEmployees.filter(e => !prevIds.has(e.id)).length;
      leavers = prevEmployees.filter(e => !currentIds.has(e.id)).length;
    }

    // Employer Share Estimates (Standard Rules)
    const employerPF = latestEmployees.reduce((sum, e) => {
      const share = Math.min(e.basicDA * 0.12, 1800); 
      return sum + share;
    }, 0);

    const employerESI = latestEmployees.reduce((sum, e) => {
      return e.grossEarnings <= 21000 ? sum + (e.grossEarnings * 0.0325) : sum;
    }, 0);

    const totalEmployerLiability = latestEmployees.reduce((sum, e) => sum + e.grossEarnings, 0) + employerPF + employerESI;

    // Trend Data
    const trendData = periods.map((period, idx) => {
      const periodEmployees = employees.filter(e => `${e.month} ${e.year}` === period);
      const pf = periodEmployees.reduce((sum, e) => sum + e.pfDeduction, 0);
      const esi = periodEmployees.reduce((sum, e) => sum + e.esiDeduction, 0);
      const pt = periodEmployees.reduce((sum, e) => sum + e.ptDeduction, 0);
      const lwf = periodEmployees.reduce((sum, e) => sum + e.lwfDeduction, 0);
      const workedDays = periodEmployees.reduce((sum, e) => sum + e.workedDays, 0);
      const otHours = periodEmployees.reduce((sum, e) => sum + e.otHours, 0);
      
      let periodNewHires = 0;
      let periodLeavers = 0;
      if (idx > 0) {
        const prevPeriod = periods[idx - 1];
        const prevEmployees = employees.filter(e => `${e.month} ${e.year}` === prevPeriod);
        const prevIds = new Set(prevEmployees.map(e => e.id));
        const currentIds = new Set(periodEmployees.map(e => e.id));
        periodNewHires = periodEmployees.filter(e => !prevIds.has(e.id)).length;
        periodLeavers = prevEmployees.filter(e => !currentIds.has(e.id)).length;
      }

      return {
        period,
        pf,
        esi,
        pt,
        lwf,
        totalStatutory: pf + esi + pt + lwf,
        headcount: periodEmployees.length,
        gross: periodEmployees.reduce((sum, e) => sum + e.grossEarnings, 0),
        avgWorkedDays: workedDays / periodEmployees.length,
        totalOTHours: otHours,
        avgOTHours: otHours / periodEmployees.length,
        newHires: periodNewHires,
        leavers: periodLeavers,
        retentionRate: idx > 0 ? ((periodEmployees.length - periodNewHires) / employees.filter(e => `${e.month} ${e.year}` === periods[idx-1]).length) * 100 : 100
      };
    });

    // Coverage Stats
    const pfCovered = latestEmployees.filter(e => e.uanNo && e.uanNo !== 'N/A').length;
    const esiCovered = latestEmployees.filter(e => e.esiNo && e.esiNo !== 'N/A').length;

    return {
      latestPeriod,
      totalPF,
      totalESI,
      totalPT,
      totalLWF,
      employerPF,
      employerESI,
      totalEmployerLiability,
      trendData,
      pfCovered,
      esiCovered,
      headcount: latestEmployees.length,
      totalWorkedDays,
      totalOTHours,
      avgWorkedDays,
      avgOTHours,
      newHires,
      leavers
    };
  }, [employees]);

  if (!stats) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-[3rem] border border-dashed border-gray-200">
        <Activity size={48} className="text-gray-300 mb-4" />
        <h3 className="text-xl font-black text-gray-900">No Data Available</h3>
        <p className="text-gray-500 max-w-xs mt-2 font-medium">Upload payroll data to see statutory insights and financial trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payroll Insights</h2>
          <p className="text-gray-500 mt-1 font-medium uppercase text-[10px] tracking-widest">Compliance Tracking & Liability Analysis • {stats.latestPeriod}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveView('compliance')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'compliance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Compliance
          </button>
          <button 
            onClick={() => setActiveView('financial')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'financial' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Financial Trends
          </button>
          <button 
            onClick={() => setActiveView('productivity')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'productivity' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Productivity
          </button>
          <button 
            onClick={() => setActiveView('retention')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'retention' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Workforce
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Users size={20} /></div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">HEADCOUNT</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">{stats.headcount}</h4>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Active Employees</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><ArrowUpRight size={20} /></div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">NEW HIRES</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">{stats.newHires}</h4>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Added this month</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><ArrowDownRight size={20} /></div>
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">LEAVERS</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">{stats.leavers}</h4>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Left from last month</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">RETENTION</span>
          </div>
          <h4 className="text-2xl font-black text-gray-900">
            {stats.headcount > 0 ? Math.round(((stats.headcount - stats.newHires) / (stats.headcount - stats.newHires + stats.leavers)) * 100) : 0}%
          </h4>
          <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-wider">Monthly Stability Rate</p>
        </div>
      </div>

      {activeView === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Statutory Trend */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><BarChart3 size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Statutory Liability Trend</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Monthly Contribution Breakdown</p>
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                    itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                  <Bar dataKey="pf" name="PF" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="esi" name="ESI" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pt" name="PT" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="lwf" name="LWF" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Coverage */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Users size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Compliance Coverage</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Employee Enrollment Status</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PF Enrollment (UAN)</span>
                  <span className="text-sm font-black text-indigo-600">{Math.round((stats.pfCovered / stats.headcount) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.pfCovered / stats.headcount) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{stats.pfCovered} of {stats.headcount} employees have UAN</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ESI Enrollment</span>
                  <span className="text-sm font-black text-emerald-600">{Math.round((stats.esiCovered / stats.headcount) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${(stats.esiCovered / stats.headcount) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">{stats.esiCovered} of {stats.headcount} employees have ESI No.</p>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">PF Eligible</p>
                    <p className="text-lg font-black text-gray-900">{stats.pfCovered}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">ESI Eligible</p>
                    <p className="text-lg font-black text-gray-900">{stats.esiCovered}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cost Distribution */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><PieChartIcon size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Employer Liability Breakdown</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Cost to Company (CTC) Analysis</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Gross Salary', value: stats.totalEmployerLiability - stats.employerPF - stats.employerESI },
                      { name: 'Employer PF', value: stats.employerPF },
                      { name: 'Employer ESI', value: stats.employerESI }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payroll Growth */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><TrendingUp size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Payroll Volume Trend</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Monthly Gross Disbursement</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="gross" name="Gross Payroll" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGross)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'productivity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OT Hours Trend */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><Activity size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Overtime (OT) Trends</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Monthly OT Hours</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Bar dataKey="totalOTHours" name="OT Hours" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Worked Days */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Users size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Attendance Intensity</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Average Worked Days per Employee</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis domain={[0, 31]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Line type="monotone" dataKey="avgWorkedDays" name="Avg Worked Days" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeView === 'retention' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hiring vs Attrition */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><ArrowUpRight size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Hiring vs Attrition</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">New Hires vs Leavers Trend</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                  <Bar dataKey="newHires" name="New Hires" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leavers" name="Leavers" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Retention Rate Trend */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Retention Rate Trend</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Percentage of Staff Retained</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="retentionRate" name="Retention %" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRetention)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

