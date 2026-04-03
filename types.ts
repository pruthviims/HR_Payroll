
export interface User {
  username: string;
  password?: string;
  companyId: string;
  role: Role;
  name?: string;
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface SyncStatus {
  lastSynced: Date | null;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'error';
}

export enum TabType {
  HOME = 'home',
  PAYSLIPS = 'payslips',
  INSIGHTS = 'insights',
  TAX = 'tax',
  USERS = 'users'
}

export interface ExtraField {
  label: string;
  value: number;
}

export interface EmployeeSalaryData {
  id: string;
  name: string;
  esiNo: string;
  uanNo: string;
  totalDays: number;
  workedDays: number;
  otHours: number;
  fixedGross: number;
  basicDA: number;
  bonus: number;
  otAmount: number;
  arrears: number;
  attendanceBonus: number;
  esiDeduction: number;
  pfDeduction: number;
  ptDeduction: number;
  lwfDeduction: number;
  canteenDeduction: number;
  advance: number;
  otherDeduction: number;
  extraEarnings: ExtraField[];
  extraDeductions: ExtraField[];
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  month: string;
  year: number;
  displayDate: string;
  principalEmployer: string;
}

export type ColumnMapping = Record<keyof Omit<EmployeeSalaryData, 'extraEarnings' | 'extraDeductions' | 'grossEarnings' | 'totalDeductions' | 'netSalary' | 'month' | 'year' | 'displayDate' | 'principalEmployer'>, string>;

export interface FieldConfig {
  key: string;
  label: string;
  type: 'core' | 'earning' | 'deduction';
  aliases: string[];
}
