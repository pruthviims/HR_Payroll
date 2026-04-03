import { supabase, isConfigured } from '../lib/supabase';
import { EmployeeSalaryData, User, Role } from '../types';
import bcrypt from 'bcryptjs';

// Custom Auth State Management
let authCallback: ((user: any | null) => void) | null = null;

export const supabaseApi = {
  isCloudActive(): boolean {
    return isConfigured;
  },

  async fetchLogo(companyId: string): Promise<string | null> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_config`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) {
        console.error(`[API] Error fetching logo for ${companyId}`, error);
        return null;
      }
      return data?.data?.logo_url || null;
    } catch (e) {
      console.error(`[API] Exception in fetchLogo for ${companyId}`, e);
      return null;
    }
  },

  async saveLogo(companyId: string, logoBase64: string): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `${companyId}_config`)
      .single();

    const newData = { ...(existing?.data || {}), logo_url: logoBase64 };
    
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_config`, data: newData });
    
    if (error) throw error;
  },

  async fetchCompanyName(companyId: string): Promise<string | null> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_config`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) return null;
      return data?.data?.name || null;
    } catch {
      return null;
    }
  },

  async saveCompanyName(companyId: string, name: string): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `${companyId}_config`)
      .single();

    const newData = { ...(existing?.data || {}), name };
    
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_config`, data: newData });
    
    if (error) throw error;
  },

  async fetchFavicon(companyId: string): Promise<string | null> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_config`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) return null;
      return data?.data?.favicon_url || null;
    } catch {
      return null;
    }
  },

  async saveFavicon(companyId: string, faviconBase64: string): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `${companyId}_config`)
      .single();

    const newData = { ...(existing?.data || {}), favicon_url: faviconBase64 };
    
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_config`, data: newData });
    
    if (error) throw error;
  },

  async fetchEmployees(companyId: string): Promise<EmployeeSalaryData[]> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_employees`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
      ]);
      
      if (error) return [];
      return data?.data || [];
    } catch {
      return [];
    }
  },

  async saveEmployees(companyId: string, employees: EmployeeSalaryData[]): Promise<void> {
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_employees`, data: employees });
    
    if (error) throw error;
  },

  async fetchUsers(companyId: string): Promise<User[]> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `global_users`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) return [];
      const users = (data?.data || []) as User[];
      return users.filter(u => u.companyId === companyId);
    } catch {
      return [];
    }
  },

  async saveUsers(companyId: string, users: User[]): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();

    const allUsers = (existing?.data || []) as User[];
    
    // Process users to ensure passwords are hashed if they are new/changed
    const processedUsers = users.map(u => {
      // If password doesn't look like a bcrypt hash, hash it
      if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
        const salt = bcrypt.genSaltSync(10);
        return { ...u, password: bcrypt.hashSync(u.password, salt) };
      }
      return u;
    });

    const otherUsers = allUsers.filter(u => u.companyId !== companyId);
    const newAllUsers = [...otherUsers, ...processedUsers];

    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `global_users`, data: newAllUsers });
    
    if (error) throw error;
  },

  async updateUserPassword(companyId: string, username: string, newPass: string): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();

    const allUsers = (existing?.data || []) as User[];
    const userIndex = allUsers.findIndex(u => u.username === username && u.companyId === companyId);
    
    if (userIndex === -1) throw new Error('User not found');
    
    // Hash the new password
    const salt = bcrypt.genSaltSync(10);
    allUsers[userIndex].password = bcrypt.hashSync(newPass, salt);

    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `global_users`, data: allUsers });
    
    if (error) throw error;
  },

  async fetchEmployers(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_employers`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) return [];
      return data?.data || [];
    } catch {
      return [];
    }
  },

  async saveEmployers(companyId: string, employers: string[]): Promise<void> {
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_employers`, data: employers });
    
    if (error) throw error;
  },

  async authenticate(companyId: string, username: string, password: string): Promise<User | null> {
    console.log(`[AUTH] Attempting login for user: ${username}, company: ${companyId}`);
    
    let timeoutId: any;
    const timeoutPromise = new Promise<any>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.warn("[AUTH] Authentication request timed out after 30s");
        reject(new Error('Authentication Timeout (30s)'));
      }, 30000);
    });

    try {
      console.log("[AUTH] Fetching global_users from database...");
      const start = Date.now();
      
      // We use a more direct approach to see if the promise even starts
      const fetchPromise = (async () => {
        try {
          console.log("[AUTH] Initiating Supabase query...");
          const response = await supabase
            .from('payroll_records')
            .select('data')
            .eq('id', `global_users`)
            .maybeSingle();
          console.log(`[AUTH] Supabase query returned in ${Date.now() - start}ms`);
          return response;
        } catch (err) {
          console.error("[AUTH] Supabase query exception:", err);
          throw err;
        }
      })();
      
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      if (!result) {
        console.warn("[AUTH] Fetch returned null result (unexpected)");
        return null;
      }

      const { data, error } = result;

      if (error) {
        console.error("[AUTH] Supabase error fetching users record:", error);
        return null;
      }

      if (!data) {
        console.warn("[AUTH] No global_users record found in database. System might be uninitialized.");
        return null;
      }

      const users = (data?.data || []) as User[];
      if (!Array.isArray(users)) {
        console.error("[AUTH] global_users data is not an array", data.data);
        return null;
      }
      
      console.log(`[AUTH] Found ${users.length} total users in global_users`);
      
      const user = users.find(u => 
        (u.username?.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) && 
        u.companyId === companyId
      );

      if (!user) {
        console.warn(`[AUTH] User "${username}" not found in global_users for company "${companyId}"`);
        // Log available users for debugging (masking passwords)
        const availableUsers = users.map(u => ({ username: u.username, companyId: u.companyId }));
        console.log("[AUTH] Available users in DB:", availableUsers);
        return null;
      }

      console.log(`[AUTH] User found: ${user.username}. Verifying password...`);

      // Verify hashed password
      try {
        console.log("[AUTH] Starting bcrypt verification...");
        const isMatch = bcrypt.compareSync(password, user.password);
        console.log(`[AUTH] bcrypt verification result: ${isMatch}`);
        if (!isMatch) {
          console.warn("[AUTH] Password mismatch");
          return null;
        }
      } catch (e) {
        console.error("[AUTH] bcrypt verification error", e);
        // Fallback for plain text if migration is in progress or hash is invalid
        if (password !== user.password) {
          console.warn("[AUTH] Plain text password mismatch fallback");
          return null;
        }
        console.log("[AUTH] Plain text password match fallback successful");
      }

      console.log("[AUTH] Login successful! Setting local session.");
      localStorage.setItem('payroll_user', JSON.stringify(user));
      if (authCallback) authCallback(user);
      
      return user;
    } catch (e: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("[AUTH] Unexpected error during authentication", e);
      // If it's a timeout, we should probably let the user know
      if (e.message === 'Authentication Timeout') {
        throw new Error('Login request timed out. Please check your internet connection and try again.');
      }
      return null;
    }
  },

  async setupAdmin(companyName: string, email: string, password: string, secret: string): Promise<User> {
    const systemSecret = import.meta.env.VITE_SYSTEM_SECRET;
    if (systemSecret && secret !== systemSecret) {
      throw new Error('Invalid System Secret Key. Setup unauthorized.');
    }

    const companyId = companyName.toLowerCase().replace(/\s+/g, '_');

    // 1. Create Tenant Config
    const { error: configError } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_config`, data: { name: companyName } });
    
    if (configError) throw configError;

    // 2. Create Admin User in global_users
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();

    const allUsers = (existing?.data || []) as User[];
    const salt = bcrypt.genSaltSync(10);
    const adminUser: User = {
      username: email, // Use full email as username for clarity
      email: email,
      password: bcrypt.hashSync(password, salt),
      role: Role.ADMIN,
      name: 'Administrator',
      companyId: companyId
    };

    // Check if user already exists
    const existingIndex = allUsers.findIndex(u => u.username === adminUser.username && u.companyId === companyId);
    if (existingIndex !== -1) {
      allUsers[existingIndex] = adminUser;
    } else {
      allUsers.push(adminUser);
    }

    const { error: userError } = await supabase
      .from('payroll_records')
      .upsert({ id: `global_users`, data: allUsers });
    
    if (userError) throw userError;

    localStorage.setItem('payroll_user', JSON.stringify(adminUser));
    if (authCallback) authCallback(adminUser);

    return adminUser;
  },

  async removeAllUsers(companyId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();

    const allUsers = (existing?.data || []) as User[];
    const otherUsers = allUsers.filter(u => u.companyId !== companyId);

    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `global_users`, data: otherUsers });
    
    if (error) throw error;
  },

  async fetchFieldConfigs(companyId: string): Promise<any[] | null> {
    try {
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('data').eq('id', `${companyId}_field_configs`).maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (error) return null;
      return data?.data || null;
    } catch {
      return null;
    }
  },

  async saveFieldConfigs(companyId: string, configs: any[]): Promise<void> {
    const { error } = await supabase
      .from('payroll_records')
      .upsert({ id: `${companyId}_field_configs`, data: configs });
    
    if (error) throw error;
  },

  async hasAnyUsers(): Promise<boolean> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();
    
    if (error) return false;
    const users = (data?.data || []) as User[];
    return users.length > 0;
  },

  async clearLocalCache(keepSession: boolean = true, shouldReload: boolean = true): Promise<void> {
    console.log(`[CACHE] Clearing local cache. keepSession=${keepSession}`);
    const storedUser = localStorage.getItem('payroll_user');
    
    // Clear all local storage
    localStorage.clear();
    
    // Clear session storage as well
    sessionStorage.clear();
    
    if (keepSession && storedUser) {
      localStorage.setItem('payroll_user', storedUser);
    } else {
      if (authCallback) authCallback(null);
    }
    
    if (shouldReload) {
      // Force a clean reload from server
      window.location.href = window.location.origin + window.location.pathname;
    }
  },

  async factoryResetCloud(): Promise<void> {
    console.log("[API] Initiating factory reset on cloud...");
    try {
      const { error, count } = await supabase
        .from('payroll_records')
        .delete({ count: 'exact' })
        .neq('id', 'placeholder');
      
      if (error) {
        console.error("[API] Factory reset failed with error:", error);
        throw error;
      }
      
      console.log(`[API] Factory reset successful. Deleted ${count || 0} records.`);
      await this.clearLocalCache(false, true);
    } catch (e) {
      console.error("[API] Factory reset exception:", e);
      throw e;
    }
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('payroll_user');
    if (authCallback) authCallback(null);
  },

  async recoverPassword(companyId: string, email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('data')
      .eq('id', `global_users`)
      .single();

    if (error) return null;
    const users = (data?.data || []) as User[];
    const user = users.find(u => u.email === email && u.companyId === companyId);
    
    return user || null;
  },

  async fetchAdminEmail(companyId: string): Promise<string | null> {
    const users = await this.fetchUsers(companyId);
    const admin = users.find(u => u.role === Role.ADMIN);
    return admin?.email || null;
  },

  onAuthChange(callback: (user: any | null) => void) {
    authCallback = callback;
    
    // Initial check
    const storedUser = localStorage.getItem('payroll_user');
    if (storedUser) {
      try {
        callback(JSON.parse(storedUser));
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }

    return () => {
      authCallback = null;
    };
  },

  async checkIfUsersExist(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('data')
        .eq('id', 'global_users')
        .maybeSingle();
      
      if (error) return false;
      const users = (data?.data || []) as User[];
      return users.length > 0;
    } catch {
      return false;
    }
  },

  async testConnection(): Promise<boolean> {
    console.log("[API] Testing Supabase connection...");
    const start = Date.now();
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        try {
          console.log("[API] Initiating network ping to Supabase...");
          const controller = new AbortController();
          const id = setTimeout(() => {
            console.warn("[API] Network ping timed out after 10s");
            controller.abort();
          }, 10000);
          
          const ping = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`, {
            method: 'GET',
            headers: { 'apikey': supabaseAnonKey },
            signal: controller.signal
          });
          clearTimeout(id);
          console.log(`[API] Network ping to Supabase: ${ping.status} (${Date.now() - start}ms)`);
        } catch (pingErr: any) {
          console.warn("[API] Network ping to Supabase failed:", pingErr.message || pingErr);
        }
      }

      console.log("[API] Initiating Supabase client test query...");
      const { data, error } = await Promise.race([
        supabase.from('payroll_records').select('id').limit(1),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Supabase Client Timeout (30s)')), 30000))
      ]);
      
      if (error) {
        console.error("[API] Supabase connection test failed:", error);
        return false;
      }
      
      console.log(`[API] Supabase connection test successful (${Date.now() - start}ms). Data found: ${data?.length || 0}`);
      return true;
    } catch (err: any) {
      console.error("[API] Supabase connection test exception:", err.message || err);
      return false;
    }
  }
};
