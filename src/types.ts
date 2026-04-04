
export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

export interface User {
  username: string; 
  password: string;
  role: Role;
  name?: string;
  email?: string;
  companyId?: string;
}

export interface GradeConfig {
  grade: string;
  basicDA: number;
  bonus: number;
  pfPercent: number;
  esiPercent: number;
  ptAmount: number;
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
  otherDeduction: number;
  canteenDeduction: number;
  advance: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  month: string;
  year: number;
  displayDate: string;
  principalEmployer: string;
  grade?: string;
  designation?: string;
  department?: string;
  bankName?: string;
  accountNo?: string;
  extraEarnings?: { label: string; value: number }[];
  extraDeductions?: { label: string; value: number }[];
}

export enum TabType {
  HOME = 'home',
  ATTENDANCE = 'attendance',
  PAYSLIPS = 'payslips',
  INSIGHTS = 'insights',
  USERS = 'users',
  TAX = 'tax',
  CLIENTS = 'clients'
}

export interface Client {
  name: string;
  status: 'active' | 'suspended';
  addedAt: string;
}

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  client: string;
  month: string;
  year: number;
  totalDays: number;
  workedDays: number;
  leaveDays: number;
  grade: string;
  otHours: number;
  ctc: number;
  basicDA: number;
  bonus: number;
  pfPercent: number;
  esiPercent: number;
  canteenDeduction: number;
  ptDeduction: number;
  computedGross?: number;
  computedDeductions?: number;
  computedNet?: number;
}

export type ColumnMapping = Record<string, string>;

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

export interface FieldConfig {
  key: string;
  label: string;
  type: 'core' | 'earning' | 'deduction';
  aliases: string[];
}

export enum PayslipTemplateId {
  CLASSIC = 'classic',
  MODERN = 'modern',
  PROFESSIONAL = 'professional',
  MINIMAL = 'minimal'
}
