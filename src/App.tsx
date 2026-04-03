
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PieChart, 
  Users as UsersIcon,
  AlertCircle,
  X,
  Cloud,
  RefreshCcw,
  LogOut,
  CheckCircle2,
  Building2,
  Camera,
  Lock,
  Plus,
  Briefcase,
  RotateCcw,
  ShieldEllipsis,
  Loader2,
  Calculator,
} from 'lucide-react';
import Papa from 'papaparse';
import bcrypt from 'bcryptjs';
import { EmployeeSalaryData, TabType, ColumnMapping, AuthState, SyncStatus, Role, FieldConfig } from './types';
import { cloudApi } from './services/api';
import HomeTab from './components/HomeTab';
import { PayslipsTab } from './components/PayslipsTab';
import { InsightsTab } from './components/InsightsTab';
import { TaxTab } from './components/TaxTab';
import UserManagementTab from './components/UserManagementTab';
import Login from './components/Login';
import { Setup } from './components/Setup';

const FIELD_DEFINITIONS: FieldConfig[] = [
  { key: 'id', label: 'EMPLOYEE ID', type: 'core', aliases: ['id', 'code', 'emp id', 'employee id', 'sl no'] },
  { key: 'name', label: 'EMPLOYEE NAME', type: 'core', aliases: ['name', 'employee name', 'emp name'] },
  { key: 'esiNo', label: 'ESI ACCOUNT', type: 'core', aliases: ['esi', 'esi no', 'esi account'] },
  { key: 'uanNo', label: 'UAN NUMBER', type: 'core', aliases: ['uan', 'uan no', 'uan number'] },
  { key: 'totalDays', label: 'TOTAL PERIOD DAYS', type: 'core', aliases: ['total days', 'days in month', 'month days', 'no of days', 'period days'] },
  { key: 'workedDays', label: 'WORKED DAYS', type: 'core', aliases: ['worked days', 'present days', 'days worked', 'worked'] },
  { key: 'otHours', label: 'OT HOURS', type: 'core', aliases: ['ot hours', 'overtime hours', 'ot hrs'] },
  { key: 'fixedGross', label: 'FIXED GROSS', type: 'core', aliases: ['fixed gross', 'gross salary', 'fixed salary'] },
  { key: 'basicDA', label: 'BASIC + DA', type: 'earning', aliases: ['basic', 'da', 'basic+da', 'basic da'] },
  { key: 'bonus', label: 'BONUS', type: 'earning', aliases: ['bonus'] },
  { key: 'otAmount', label: 'OT AMOUNT', type: 'earning', aliases: ['ot amount', 'overtime amount'] },
  { key: 'arrears', label: 'ARREARS', type: 'earning', aliases: ['arrears'] },
  { key: 'attendanceBonus', label: 'ATTENDANCE BONUS', type: 'earning', aliases: ['attendance bonus', 'att bonus'] },
  { key: 'esiDeduction', label: 'ESI DEDUCTION', type: 'deduction', aliases: ['esi deduction', 'esi ded'] },
  { key: 'pfDeduction', label: 'PF DEDUCTION', type: 'deduction', aliases: ['pf deduction', 'pf ded'] },
  { key: 'ptDeduction', label: 'PROF. TAX', type: 'deduction', aliases: ['pt', 'prof tax', 'professional tax'] },
  { key: 'lwfDeduction', label: 'LWF', type: 'deduction', aliases: ['lwf'] },
  { key: 'canteenDeduction', label: 'CANTEEN', type: 'deduction', aliases: ['canteen'] },
  { key: 'advance', label: 'ADVANCE', type: 'deduction', aliases: ['advance'] },
  { key: 'otherDeduction', label: 'OTHER DEDUCTION', type: 'deduction', aliases: ['other deduction', 'other ded'] }
];

const DEFAULT_FIELD_CONFIG: FieldConfig[] = FIELD_DEFINITIONS;

const INACTIVITY_TIMEOUT = 2 * 60 * 1000;

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthState>({ isAuthenticated: false, user: null, loading: true });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.HOME);
  const [employees, setEmployees] = useState<EmployeeSalaryData[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>(DEFAULT_FIELD_CONFIG);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('MARUTHI HR SOLUTIONS');
  const [favicon, setFavicon] = useState<string | null>(null);
  const [sync, setSync] = useState<SyncStatus>({ lastSynced: null, isSyncing: false, status: 'offline' });
  
  const [employers, setEmployers] = useState<string[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isAddEmployerOpen, setIsAddEmployerOpen] = useState(false);
  const [newEmployerName, setNewEmployerName] = useState('');

  // Clear notifications when tab changes
  useEffect(() => {
    setNotification(null);
    setUploadError(null);
  }, [activeTab]);

  const [showMapping, setShowMapping] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [currentCsvData, setCurrentCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [extraEarningsMapping, setExtraEarningsMapping] = useState<string[]>([]);
  const [extraDeductionsMapping, setExtraDeductionsMapping] = useState<string[]>([]);
  const [importMonth, setImportMonth] = useState<string>(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()]);
  const [importYear, setImportYear] = useState<number>(new Date().getFullYear());

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearCacheOpen, setIsClearCacheOpen] = useState(false);
  const [confirmResetType, setConfirmResetType] = useState<'local' | null>(null);
  const [resetOldPass, setResetOldPass] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTenantData = useCallback(async (companyId: string) => {
    console.log(`[DATA] Loading tenant data for: ${companyId}`);
    try {
      const cloudLogo = await cloudApi.fetchLogo(companyId);
      const cloudName = await cloudApi.fetchCompanyName(companyId);
      const cloudFavicon = await cloudApi.fetchFavicon(companyId);
      const employerList = await cloudApi.fetchEmployers(companyId);
      const cloudConfigs = await cloudApi.fetchFieldConfigs(companyId);
      const data = await cloudApi.fetchEmployees(companyId);

      // Explicitly set or clear states to avoid persistence issues
      setCompanyLogo(cloudLogo || null);
      setCompanyName(cloudName || 'HR Payroll Portal');
      
      if (cloudFavicon) {
        setFavicon(cloudFavicon);
        const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = cloudFavicon;
        document.getElementsByTagName('head')[0].appendChild(link);
      } else {
        setFavicon(null);
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) link.href = "/favicon.ico";
      }

      console.log(`[DATA] Fetched ${employerList.length} employers:`, employerList);
      setEmployers(employerList || []);
      if (employerList.length > 0) {
        setSelectedEmployer(employerList[0]);
      } else {
        setSelectedEmployer('');
      }

      if (cloudConfigs) setFieldConfigs(cloudConfigs);

      console.log(`[DATA] Fetched ${data.length} employees`);
      setEmployees(data || []);
      
      if (data.length > 0) {
        const periods = Array.from(new Set(data.map(e => `${e.month}-${e.year}`))).sort().reverse();
        if (periods.length > 0) setSelectedPeriod(periods[0]);
      }
      
      console.log("[DATA] Tenant data loaded successfully");
    } catch (e) {
      console.error("[DATA] Failed to load tenant data", e);
    }
  }, []);

  const handleLogout = useCallback(async (reason?: string) => {
    localStorage.removeItem('payroll_user');
    setAuthStatus({ isAuthenticated: false, user: null, loading: false });
    if (reason === 'inactivity') setAuthError('Session expired due to inactivity.');
    setActiveTab(TabType.HOME);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const loadFromCloud = useCallback(async () => {
    if (!authStatus.user?.companyId) return;
    const companyId = authStatus.user.companyId;
    setSync(prev => ({ ...prev, isSyncing: true }));
    try {
      await loadTenantData(companyId);
      setSync({ 
        lastSynced: new Date(), 
        isSyncing: false, 
        status: cloudApi.isCloudActive() ? 'online' : 'offline' 
      });
    } catch (err) {
      console.error("[DATA] Sync failed:", err);
      setSync(prev => ({ ...prev, isSyncing: false, status: 'error' }));
    }
  }, [authStatus.user?.companyId, loadTenantData]);

  const filteredEmployees = useMemo(() => {
    if (!selectedEmployer) return employees;
    return employees.filter(e => e.principalEmployer === selectedEmployer);
  }, [employees, selectedEmployer]);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (authStatus.isAuthenticated) {
      timeoutRef.current = setTimeout(() => handleLogout('inactivity'), INACTIVITY_TIMEOUT);
    }
  }, [authStatus.isAuthenticated, handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'visibilitychange'];
    if (authStatus.isAuthenticated) {
      resetInactivityTimer();
      events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    }
    return () => events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
  }, [authStatus.isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    if (favicon) {
      const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement;
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [favicon]);

  useEffect(() => {
    const loadInitialData = async () => {
      // Test connection first
      const isConnected = await cloudApi.testConnection();
      
      if (isConnected) {
        // Check if database is empty (no users)
        const hasUsers = await cloudApi.checkIfUsersExist();
        if (!hasUsers) {
          console.warn("[APP] No users found in database. Switching to setup mode.");
          setIsSetupMode(true);
        }
      }

      // Set up auth listener
      const unsubscribe = cloudApi.onAuthChange((user) => {
        if (user) {
          setAuthStatus({ isAuthenticated: true, user, loading: false });
          loadTenantData(user.companyId);
        } else {
          setAuthStatus({ isAuthenticated: false, user: null, loading: false });
        }
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    loadInitialData().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadTenantData]);

  useEffect(() => {
    setNotification(null);
    setUploadError(null);
  }, [activeTab]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const pushToCloud = async (newEmployees: EmployeeSalaryData[]) => {
    if (!authStatus.user?.companyId) return;
    const companyId = authStatus.user.companyId;
    setSync(prev => ({ ...prev, isSyncing: true }));
    try {
      await cloudApi.saveEmployees(companyId, newEmployees);
      setSync({ 
        lastSynced: new Date(), 
        isSyncing: false, 
        status: cloudApi.isCloudActive() ? 'online' : 'offline' 
      });
    } catch {
      setSync(prev => ({ ...prev, isSyncing: false, status: 'error' }));
      setUploadError("Cloud Sync Failed. Data saved locally only.");
    }
  };

  const handleLogin = async (username: string, password: string, companyId: string) => {
    console.log(`[APP] handleLogin started for ${username} @ ${companyId}`);
    setAuthError(null);
    try {
      const user = await cloudApi.authenticate(companyId, username, password);
      console.log(`[APP] authenticate returned: ${user ? 'user object' : 'null'}`);
      if (user) {
        console.log("[APP] Login successful, updating state");
        localStorage.setItem('payroll_user', JSON.stringify(user));
        setAuthStatus({ isAuthenticated: true, user, loading: false });
        setAuthError(null);
        // After login, load tenant specific data
        await loadTenantData(companyId);
        showNotification(`Welcome back, ${user.name}!`, 'success');
      } else {
        console.warn("[APP] Login failed: authenticate returned null");
        setAuthError('Invalid credentials. Access denied. Please check your username, password, and Company ID.');
      }
    } catch (error: any) {
      console.error("[APP] Login error caught", error);
      let errorMessage = 'Login failed. Please check your connection and try again.';
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = `Login Error: ${errorData.error || 'Permission Denied'}`;
      } catch {
        if (error.message) errorMessage = error.message;
      }
      setAuthError(errorMessage);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    if (!authStatus.user || !authStatus.user.companyId) return;
    
    // Verify current password (hashed)
    const isMatch = bcrypt.compareSync(resetOldPass, authStatus.user.password);
    if (!isMatch) return setResetError('Incorrect current password.');
    
    if (resetNewPass !== resetConfirmPass) return setResetError('Passwords mismatch.');
    if (resetNewPass.length < 6) return setResetError('Too short.');

    setIsResetting(true);
    try {
      await cloudApi.updateUserPassword(authStatus.user.companyId, authStatus.user.username, resetNewPass);
      // Fetch updated user to get the new hash
      const users = await cloudApi.fetchUsers(authStatus.user.companyId);
      const updatedUser = users.find(u => u.username === authStatus.user?.username);
      
      if (updatedUser) {
        localStorage.setItem('payroll_user', JSON.stringify(updatedUser));
        setAuthStatus(prev => ({ ...prev, user: updatedUser }));
      }
      
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setResetOldPass(''); setResetNewPass(''); setResetConfirmPass('');
      }, 2000);
    } catch { setResetError('Update failed.'); } finally { setIsResetting(false); }
  };

  useEffect(() => {
    if (authStatus.isAuthenticated) {
      loadFromCloud();
    }
  }, [authStatus.isAuthenticated, loadFromCloud]);

  const handleAddEmployer = async () => {
    if (!newEmployerName.trim() || !authStatus.user?.companyId) return;
    const companyId = authStatus.user.companyId;
    try {
      const updated = [...employers, newEmployerName.trim()];
      await cloudApi.saveEmployers(companyId, updated);
      setEmployers(updated);
      setSelectedEmployer(newEmployerName.trim());
      setNewEmployerName('');
      setIsAddEmployerOpen(false);
    } catch (err: any) {
      console.error("Failed to add employer:", err);
      setUploadError("Failed to add client. Please check your connection or permissions.");
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && authStatus.user?.companyId) {
      const companyId = authStatus.user.companyId;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setCompanyLogo(base64);
        await cloudApi.saveLogo(companyId, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && authStatus.user?.companyId) {
      const companyId = authStatus.user.companyId;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setFavicon(base64);
        await cloudApi.saveFavicon(companyId, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyNameChange = async (name: string) => {
    if (!authStatus.user?.companyId) return;
    const companyId = authStatus.user.companyId;
    setCompanyName(name);
    await cloudApi.saveCompanyName(companyId, name);
  };

  const cleanNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    let str = String(val).trim().replace(/,/g, '').replace(/\s/g, '');
    if (str === '-' || str === '') return 0;
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!selectedEmployer) {
      setUploadError("Please add an employer name before importing employee data.");
      if (event.target) event.target.value = '';
      return;
    }

    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const headers = Object.keys(results.data[0]);
          setCsvHeaders(headers);
          setCurrentCsvData(results.data);
          
          const newMapping: Partial<ColumnMapping> = {};
          const assignedHeaders = new Set<string>();
          
          FIELD_DEFINITIONS.forEach(fieldDef => {
            const match = headers.find(h => 
              !assignedHeaders.has(h) && 
              (fieldDef.aliases || []).some(alias => h.toLowerCase().trim().includes(alias))
            );
            if (match) {
              newMapping[fieldDef.key as keyof ColumnMapping] = match;
              assignedHeaders.add(match);
            }
          });
          
          // Also check current fieldConfigs for auto-mapping if they have aliases
          fieldConfigs.forEach(fConfig => {
            if (!newMapping[fConfig.key as keyof ColumnMapping]) {
              const match = headers.find(h => 
                !assignedHeaders.has(h) && 
                (fConfig.aliases || []).some(alias => h.toLowerCase().trim().includes(alias))
              );
              if (match) {
                newMapping[fConfig.key as keyof ColumnMapping] = match;
                assignedHeaders.add(match);
              }
            }
          });
          
          setMapping(newMapping);
          setShowMapping(true);
        }
      }
    });
    if (event.target) event.target.value = '';
  };

  const cleanNumericString = (val: any) => {
    if (!val) return 'N/A';
    const str = String(val).trim();
    const noDecimal = str.split('.')[0];
    const onlyDigits = noDecimal.replace(/\D/g, '');
    return onlyDigits || 'N/A';
  };

  const processDataWithMapping = async () => {
    try {
      const displayMonth = importMonth;
      const displayYear = importYear;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = monthNames.indexOf(displayMonth);
      const daysInSelectedMonth = new Date(displayYear, monthIndex + 1, 0).getDate();
      const prevMonthEndStr = `${daysInSelectedMonth}-${displayMonth}-${displayYear}`;

      const parsedData = currentCsvData.map((row: any) => {
        const getVal = (fieldKey: string) => cleanNumber(row[mapping[fieldKey as keyof ColumnMapping]!]);
        const empId = String(row[mapping.id as keyof ColumnMapping] || 'N/A');
        const empName = (row[mapping.name as keyof ColumnMapping] || 'Unknown').toUpperCase();
        
        // Core Financial Inputs
        const totalDaysInMonth = getVal('totalDays') || daysInSelectedMonth || 30;
        const workedDays = getVal('workedDays');
        const otHours = getVal('otHours');
        const baseBasic = getVal('basicDA');
        const baseBonus = getVal('bonus');
        
        // Calculations (Only used as fallbacks if CSV columns are not mapped)
        const workedRatio = workedDays / totalDaysInMonth;
        const earnedBasic = baseBasic * workedRatio;
        const earnedBonus = baseBonus * workedRatio;
        const calculatedOtAmount = ((baseBasic / 26 / 8) * 2) * otHours;
        
        // Process Earnings
        const extraEarnings = extraEarningsMapping.map(header => ({
          label: header,
          value: cleanNumber(row[header])
        })).filter(f => f.value !== 0);

        let grossEarnings = 0;
        fieldConfigs.filter(f => f.type === 'earning').forEach(config => {
          let val = getVal(config.key);
          
          // If the column is NOT mapped in the CSV, we can use our calculation logic
          if (!mapping[config.key as keyof ColumnMapping]) {
            if (config.key === 'otAmount' && otHours > 0) val = calculatedOtAmount;
            // For basicDA and bonus, if they aren't mapped, val is already 0.
          }
          // Note: If basicDA or bonus ARE mapped, we use the CSV value directly (val) 
          // and do NOT prorate it here, as the CSV is assumed to be the source of truth for the month.

          grossEarnings += val;
        });
        
        const extraEarningsTotal = extraEarnings.reduce((sum, f) => sum + f.value, 0);
        grossEarnings += extraEarningsTotal;

        // Process Deductions
        const extraDeductions = extraDeductionsMapping.map(header => ({
          label: header,
          value: cleanNumber(row[header])
        })).filter(f => f.value !== 0);

        // Statutory Rules (Fallbacks)
        const calculatedPfDed = Math.floor((mapping['basicDA'] ? getVal('basicDA') : earnedBasic) * 0.12);
        const calculatedEsiDed = Math.ceil(grossEarnings * 0.0075);

        let totalDeductions = 0;
        fieldConfigs.filter(f => f.type === 'deduction').forEach(config => {
          let val = getVal(config.key);
          
          // Only calculate if not mapped
          if (!mapping[config.key as keyof ColumnMapping]) {
            if (config.key === 'pfDeduction') val = calculatedPfDed;
            if (config.key === 'esiDeduction') val = calculatedEsiDed;
          }
          
          totalDeductions += val;
        });

        const extraDeductionsTotal = extraDeductions.reduce((sum, f) => sum + f.value, 0);
        totalDeductions += extraDeductionsTotal;

        const finalBasicDA = mapping['basicDA'] ? getVal('basicDA') : earnedBasic;
        const finalBonus = mapping['bonus'] ? getVal('bonus') : earnedBonus;
        const finalOtAmount = mapping['otAmount'] ? getVal('otAmount') : calculatedOtAmount;

        return {
          id: empId,
          name: empName,
          esiNo: cleanNumericString(row[mapping.esiNo as keyof ColumnMapping]),
          uanNo: cleanNumericString(row[mapping.uanNo as keyof ColumnMapping]),
          totalDays: totalDaysInMonth,
          workedDays: workedDays,
          otHours: otHours,
          fixedGross: getVal('fixedGross'),
          basicDA: finalBasicDA,
          bonus: finalBonus,
          otAmount: finalOtAmount,
          arrears: getVal('arrears'),
          attendanceBonus: getVal('attendanceBonus'),
          esiDeduction: mapping['esiDeduction'] ? getVal('esiDeduction') : calculatedEsiDed,
          pfDeduction: mapping['pfDeduction'] ? getVal('pfDeduction') : calculatedPfDed,
          ptDeduction: getVal('ptDeduction'),
          lwfDeduction: getVal('lwfDeduction'),
          canteenDeduction: getVal('canteenDeduction'),
          advance: getVal('advance'),
          otherDeduction: getVal('otherDeduction'),
          extraEarnings,
          extraDeductions,
          grossEarnings: grossEarnings,
          totalDeductions: totalDeductions,
          netSalary: grossEarnings - totalDeductions,
          month: displayMonth,
          year: displayYear,
          displayDate: prevMonthEndStr,
          principalEmployer: selectedEmployer
        } as EmployeeSalaryData;
      });

      const updatedList = [...employees, ...parsedData];
      setEmployees(updatedList);
      
      await pushToCloud(updatedList);
      if (authStatus.user?.companyId) {
        await cloudApi.saveFieldConfigs(authStatus.user.companyId, fieldConfigs);
      }
      setShowMapping(false);
    } catch (err) { 
      console.error(err);
      setUploadError("Mapping failed."); 
    }
  };

  const isAdmin = authStatus.user?.role === Role.ADMIN;

  const renderContent = () => (
    <div className="flex flex-col md:flex-row min-h-screen">
      <nav className="w-full md:w-80 bg-white border-r border-gray-100 p-8 flex flex-col gap-2 overflow-y-auto">
        <div className="flex flex-col gap-6 mb-10">
          <div className="relative group w-24 h-20 self-center">
            <div className="w-28 h-20 bg-white rounded-[20px] flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm transition-all group-hover:scale-[1.02] p-1">
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain object-center scale-110" />
              ) : (
                <Building2 size={24} className="text-gray-300" />
              )}
            </div>
            {isAdmin && (
              <div className="absolute -bottom-1 -right-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => logoInputRef.current?.click()} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg border-2 border-white" title="Change Logo">
                  <Camera size={10} />
                </button>
                <button onClick={() => faviconInputRef.current?.click()} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg border-2 border-white" title="Change Favicon">
                  <LayoutDashboard size={10} />
                </button>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={handleFaviconChange} />
          </div>
          <div className="text-center space-y-2">
            {isAdmin ? (
              <input 
                type="text" 
                value={companyName} 
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                className="w-full text-center text-lg font-black text-gray-900 tracking-tighter leading-none bg-transparent border-b border-transparent hover:border-indigo-200 focus:border-indigo-500 outline-none transition-all"
                placeholder="Company Name"
              />
            ) : (
              <h1 className="text-lg font-black text-gray-900 tracking-tighter leading-none">{companyName}</h1>
            )}
            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1">HR Portal</p>
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Briefcase size={12} className="text-indigo-400" /> Active Client</label>
          <div className="flex gap-2">
            <select value={selectedEmployer} onChange={(e) => setSelectedEmployer(e.target.value)} className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-3 text-xs font-black text-indigo-900 outline-none appearance-none">
              {employers.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {isAdmin && (
              <button onClick={() => setIsAddEmployerOpen(true)} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg"><Plus size={16} /></button>
            )}
          </div>
        </div>

        <button onClick={() => setActiveTab(TabType.HOME)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.HOME ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutDashboard size={20} /><span>Payroll Audit</span></button>
        <button onClick={() => setActiveTab(TabType.PAYSLIPS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.PAYSLIPS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}><FileText size={20} /><span>Payslip Search</span></button>
        {isAdmin && <button onClick={() => setActiveTab(TabType.TAX)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.TAX ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}><Calculator size={20} /><span>Tax Audit</span></button>}
        {isAdmin && <button onClick={() => setActiveTab(TabType.INSIGHTS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.INSIGHTS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}><PieChart size={20} /><span>Statutory Insights</span></button>}
        {isAdmin && <button onClick={() => setActiveTab(TabType.USERS)} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === TabType.USERS ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}><UsersIcon size={20} /><span>User Accounts</span></button>}

        <div className="mt-auto pt-8 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">© 2026 Enterprise HR</p>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 overflow-auto relative">
        {/* Fixed Notifications Container */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-6 pointer-events-none space-y-3">
          {notification && (
            <div className={`pointer-events-auto p-4 border rounded-2xl flex items-center justify-between shadow-2xl animate-in slide-in-from-top-8 duration-500 ${
              notification.type === 'success' 
                ? 'bg-white border-emerald-100 text-emerald-700' 
                : 'bg-white border-red-100 text-red-700'
            }`}>
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-xs font-bold uppercase">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-full"><X size={16} /></button>
            </div>
          )}

          {uploadError && (
            <div className="pointer-events-auto p-4 bg-white border border-red-100 rounded-2xl flex items-center justify-between text-red-700 shadow-2xl animate-in slide-in-from-top-8 duration-500">
              <div className="flex items-center gap-3"><AlertCircle size={20} /><p className="text-xs font-bold uppercase">{uploadError}</p></div>
              <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${sync.status === 'online' ? 'bg-emerald-500 animate-pulse' : sync.status === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Environment:</span>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{selectedEmployer}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => loadFromCloud()}
                disabled={sync.isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50/30 hover:bg-indigo-50 rounded-full border border-indigo-50 transition-all active:scale-95 disabled:opacity-50"
              >
                  <RefreshCcw size={14} className={`text-indigo-400 ${sync.isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">{sync.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    {authStatus.user?.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-black text-gray-700 uppercase tracking-tighter hidden sm:inline">{authStatus.user?.username}</span>
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[140]" onClick={() => setIsUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-4 z-[150] animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-gray-50 mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</p>
                        <p className="text-sm font-black text-gray-900 truncate">{authStatus.user?.username}</p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1">{authStatus.user?.role === Role.ADMIN ? 'Administrator' : 'Company Admin'}</p>
                      </div>
                      <div className="space-y-1">
                        {isAdmin && (
                          <button 
                            onClick={() => { setIsClearCacheOpen(true); setIsUserDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black text-amber-600 hover:bg-amber-50 uppercase transition-all"
                          >
                            <RotateCcw size={16} /> System Reset
                          </button>
                        )}
                        <button 
                          onClick={() => { setIsResetModalOpen(true); setIsUserDropdownOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-50 uppercase transition-all"
                        >
                          <ShieldEllipsis size={16} /> Password Reset
                        </button>
                        <div className="h-px bg-gray-50 my-2" />
                        <button 
                          onClick={() => handleLogout()}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black text-gray-400 hover:text-red-500 hover:bg-red-50 uppercase transition-all"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
        </div>

        <div className="animate-in fade-in duration-700">
          {activeTab === TabType.HOME && (
            <HomeTab 
              employees={filteredEmployees} 
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              triggerUpload={isAdmin ? () => {
                if (!selectedEmployer) {
                  setUploadError("Please add an employer name before importing employee data.");
                  return;
                }
                fileInputRef.current?.click();
              } : () => {}} 
              isAdmin={isAdmin}
            />
          )}
          {activeTab === TabType.PAYSLIPS && <PayslipsTab employees={filteredEmployees} companyLogo={companyLogo} companyName={companyName} fieldConfigs={fieldConfigs} />}
          {activeTab === TabType.TAX && isAdmin && <TaxTab employees={filteredEmployees} currentUser={authStatus.user} />}
          {activeTab === TabType.INSIGHTS && isAdmin && <InsightsTab employees={filteredEmployees} />}
          {activeTab === TabType.USERS && isAdmin && (
            <UserManagementTab 
              employees={filteredEmployees} 
              onLogout={handleLogout} 
              showNotification={showNotification} 
              currentUser={authStatus.user} 
              companyName={companyName}
            />
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
      </main>
    </div>
  );

  useEffect(() => {
    setAuthError(null);
  }, [isSetupMode]);

  if (authStatus.loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><RefreshCcw className="animate-spin text-indigo-600" size={48} /></div>;
  
  if (!cloudApi.isCloudActive()) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-3xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Configuration Required</h2>
          <p className="text-gray-500 font-medium text-sm leading-relaxed">
            The application backend has been migrated to Supabase. To continue, please set the following environment variables in your project settings:
          </p>
          <div className="bg-gray-50 p-4 rounded-2xl text-left space-y-2">
            <code className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">VITE_SUPABASE_URL</code>
            <code className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">VITE_SUPABASE_ANON_KEY</code>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            After setting these, refresh the page to initialize the portal.
          </p>
        </div>
      </div>
    );
  }

  if (!authStatus.isAuthenticated) {
    if (isSetupMode) {
      return <Setup onBack={() => setIsSetupMode(false)} onSuccess={() => setIsSetupMode(false)} />;
    }
    return (
      <Login 
        onLogin={handleLogin} 
        onSetupClick={() => setIsSetupMode(true)} 
        error={authError} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {renderContent()}
      
      {showMapping && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-6xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 bg-[#5B50E6] text-white flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Import for {selectedEmployer}</h3>
                  <p className="text-xs font-bold mt-1 uppercase tracking-widest opacity-80">Dynamic Component Mapping</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl border border-white/20">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-60">Import Month</label>
                    <select 
                      value={importMonth}
                      onChange={(e) => setImportMonth(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-black uppercase cursor-pointer"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                        <option key={m} value={m} className="text-gray-900">{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-60">Import Year</label>
                    <select 
                      value={importYear}
                      onChange={(e) => setImportYear(parseInt(e.target.value))}
                      className="bg-transparent border-none outline-none text-xs font-black uppercase cursor-pointer"
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y} className="text-gray-900">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const newKey = `custom_${Date.now()}`;
                    const newConfigs = [...fieldConfigs, { key: newKey, label: 'NEW COMPONENT', type: 'earning', aliases: [] }];
                    setFieldConfigs(newConfigs);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Plus size={14} /> Add Component
                </button>
                <button onClick={() => setShowMapping(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fieldConfigs.map((fConfig) => {
                  const usedHeaders = Object.entries(mapping)
                    .filter(([k, v]) => k !== fConfig.key && v)
                    .map(([_, v]) => v);
                  
                  const availableHeaders = csvHeaders.filter(h => !usedHeaders.includes(h));

                  return (
                    <div key={fConfig.key} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 relative group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select 
                            value={fConfig.type}
                            onChange={(e) => {
                              if (fConfig.type === 'core') return;
                              const newConfigs = [...fieldConfigs];
                              const idx = newConfigs.findIndex(f => f.key === fConfig.key);
                              if (idx !== -1) {
                                newConfigs[idx] = { ...newConfigs[idx], type: e.target.value as any };
                                setFieldConfigs(newConfigs);
                              }
                            }}
                            disabled={fConfig.type === 'core'}
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none outline-none cursor-pointer ${
                              fConfig.type === 'earning' ? 'bg-emerald-50 text-emerald-600' : 
                              fConfig.type === 'deduction' ? 'bg-amber-50 text-amber-600' : 
                              'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            <option value="core">Core</option>
                            <option value="earning">Earning</option>
                            <option value="deduction">Deduction</option>
                          </select>
                        </div>
                        {fConfig.type !== 'core' && (
                          <button 
                            onClick={() => setFieldConfigs(fieldConfigs.filter(f => f.key !== fConfig.key))}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Component Name</label>
                        <input 
                          type="text"
                          value={fConfig.label}
                          onChange={(e) => {
                            const newConfigs = [...fieldConfigs];
                            const idx = newConfigs.findIndex(f => f.key === fConfig.key);
                            if (idx !== -1) {
                              newConfigs[idx] = { ...newConfigs[idx], label: e.target.value };
                              setFieldConfigs(newConfigs);
                            }
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="Label in Payslip"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Excel Column</label>
                        <select 
                          value={mapping[fConfig.key as keyof ColumnMapping] || ''} 
                          onChange={(e) => setMapping(prev => ({ ...prev, [fConfig.key]: e.target.value }))}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#5B50E6] transition-all appearance-none cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.8rem' }}
                        >
                          <option value="">-- Ignore --</option>
                          {mapping[fConfig.key as keyof ColumnMapping] && !availableHeaders.includes(mapping[fConfig.key as keyof ColumnMapping]!) && (
                            <option value={mapping[fConfig.key as keyof ColumnMapping]}>{mapping[fConfig.key as keyof ColumnMapping]}</option>
                          )}
                          {availableHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra Mapping for unmapped columns */}
              <div className="mt-12 p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-black text-indigo-900">Bulk Column Import</h4>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Quickly map multiple columns to categories</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Additional Earnings</span>
                      <button onClick={() => setExtraEarningsMapping([...extraEarningsMapping, ''])} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all"><Plus size={14} /></button>
                    </div>
                    {extraEarningsMapping.map((val, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select 
                          value={val}
                          onChange={(e) => {
                            const newMap = [...extraEarningsMapping];
                            newMap[idx] = e.target.value;
                            setExtraEarningsMapping(newMap);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                        >
                          <option value="">-- Select Column --</option>
                          {csvHeaders.filter(h => !Object.values(mapping).includes(h) && !extraDeductionsMapping.includes(h) && (!extraEarningsMapping.includes(h) || h === val)).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <button onClick={() => setExtraEarningsMapping(extraEarningsMapping.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:text-red-600"><X size={16} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Additional Deductions</span>
                      <button onClick={() => setExtraDeductionsMapping([...extraDeductionsMapping, ''])} className="p-1.5 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-all"><Plus size={14} /></button>
                    </div>
                    {extraDeductionsMapping.map((val, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select 
                          value={val}
                          onChange={(e) => {
                            const newMap = [...extraDeductionsMapping];
                            newMap[idx] = e.target.value;
                            setExtraDeductionsMapping(newMap);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                        >
                          <option value="">-- Select Column --</option>
                          {csvHeaders.filter(h => !Object.values(mapping).includes(h) && !extraEarningsMapping.includes(h) && (!extraDeductionsMapping.includes(h) || h === val)).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <button onClick={() => setExtraDeductionsMapping(extraDeductionsMapping.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:text-red-600"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 bg-white border-t border-gray-50 flex items-center justify-center">
              <button 
                onClick={processDataWithMapping}
                disabled={!mapping.id || !mapping.name}
                className="w-full max-w-2xl py-5 bg-[#5B50E6] text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-[#4A40D5] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <Cloud size={20} />
                <span>Process & Sync to Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employer Modal */}
      {isAddEmployerOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Building2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Register New Client</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">Add a new principal employer to the consultancy roster</p>
              
              <div className="w-full space-y-4 mb-8">
                <div className="text-left space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Employer Name</label>
                  <input 
                    type="text" 
                    value={newEmployerName}
                    onChange={(e) => setNewEmployerName(e.target.value)}
                    placeholder="e.g. RELIANCE INDUSTRIES"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={() => setIsAddEmployerOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={handleAddEmployer} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100">Add Client</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cache Modal */}
      {isClearCacheOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <RotateCcw size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">System Reset</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">Clear local browser cache to refresh data from the cloud.</p>
              
              {!confirmResetType ? (
                <div className="w-full space-y-3 mb-8">
                  <button 
                    onClick={() => setConfirmResetType('local')} 
                    className="w-full py-4 bg-amber-50 text-amber-600 font-black rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest text-xs border border-amber-100"
                  >
                    Clear Local Cache
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-4 mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="flex items-center gap-3 text-amber-600 mb-2">
                    <RotateCcw size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Confirm Action</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 text-left leading-relaxed">
                    This will clear your local browser cache. You will remain logged in, but local data will be re-synced from the cloud.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setConfirmResetType(null)}
                      className="flex-1 py-3 bg-white text-gray-400 font-black rounded-xl border border-gray-200 uppercase text-[10px]"
                    >
                      Back
                    </button>
                    <button 
                      onClick={async () => {
                        await cloudApi.clearLocalCache();
                        setIsClearCacheOpen(false);
                        setConfirmResetType(null);
                      }}
                      className="flex-1 py-3 text-white font-black rounded-xl uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 bg-amber-500 shadow-amber-100"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => { setIsClearCacheOpen(false); setConfirmResetType(null); }} className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Password Reset</h3>
                <p className="text-sm text-gray-500 font-medium">Update your portal access credentials</p>
              </div>

              {resetError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-6 animate-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-[10px] font-bold uppercase">{resetError}</p>
                </div>
              )}

              {resetSuccess ? (
                <div className="py-12 flex flex-col items-center text-center gap-4 animate-in fade-in">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={48} />
                  </div>
                  <h4 className="text-lg font-black text-gray-900">Password Updated</h4>
                  <p className="text-sm text-gray-500 font-medium">Your new credentials are now active.</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                    <input type="password" value={resetOldPass} onChange={e => setResetOldPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                    <input type="password" value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input type="password" value={resetConfirmPass} onChange={e => setResetConfirmPass(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" required />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" disabled={isResetting} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                      {isResetting ? <Loader2 className="animate-spin" size={18} /> : 'Update Access'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
