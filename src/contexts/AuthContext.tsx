import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  roles: Role[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default users with passwords including Customer Care users
const defaultUsers: User[] = [
  {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@hdf.com',
    password: 'admin123',
    roleId: 'admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cc-manager-001',
    name: 'Customer Care Manager',
    email: 'ccmanager@hdf.com',
    password: 'ccmanager123',
    roleId: 'customer_care_manager',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cc-agent-001',
    name: 'Customer Care Agent',
    email: 'ccagent@hdf.com',
    password: 'ccagent123',
    roleId: 'customer_care_agent',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cc-supervisor-001',
    name: 'Customer Care Supervisor',
    email: 'ccsupervisor@hdf.com',
    password: 'ccsupervisor123',
    roleId: 'customer_care_supervisor',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'field-supervisor-001',
    name: 'Field Supervisor',
    email: 'fieldsupervisor@hdf.com',
    password: 'field123',
    roleId: 'field_supervisor',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'field-agent-001',
    name: 'Field Agent',
    email: 'fieldagent@hdf.com',
    password: 'agent123',
    roleId: 'field_agent',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Enhanced default roles with specific Customer Care permissions
const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'System Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      // User Management
      'user_read', 'user_create', 'user_update', 'user_delete',
      // Role Management
      'role_read', 'role_create', 'role_update', 'role_delete',
      // Client Management
      'client_read', 'client_create', 'client_update', 'client_delete', 'client_view_all',
      // Farmer Management
      'farmer_read', 'farmer_create', 'farmer_update', 'farmer_delete', 'farmer_view_all',
      // Field Visit Management
      'visit_read', 'visit_create', 'visit_update', 'visit_delete', 'visit_track',
      // Form Management
      'form_view', 'form_create', 'form_update', 'form_delete',
      // Reports
      'reports_view', 'reports_create', 'reports_update', 'reports_delete',
      // Customer Care - Main Access
      'customer_care_access',
      // Customer Care - Task Management
      'task_view_all', 'task_view', 'task_create', 'task_update', 'task_delete',
      // Customer Care - Complaint Management
      'complaint_view_all', 'complaint_view', 'complaint_create', 'complaint_update', 'complaint_delete', 'complaint_resolve', 'complaint_escalate',
      // Communication
      'communication_access', 'whatsapp_send', 'sip_calls'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'customer_care_manager',
    name: 'Customer Care Manager',
    description: 'Full customer care management with complete task and complaint access',
    permissions: [
      'customer_care_access',
      'task_view_all', 'task_view', 'task_create', 'task_update', 'task_delete',
      'complaint_view_all', 'complaint_view', 'complaint_create', 'complaint_update', 'complaint_delete', 'complaint_resolve', 'complaint_escalate',
      'client_read', 'farmer_read', 'reports_view', 'communication_access', 'whatsapp_send'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'customer_care_agent',
    name: 'Customer Care Agent',
    description: 'Basic customer care operations with task and complaint handling',
    permissions: [
      'customer_care_access',
      'task_view_all', 'task_view', 'task_update',
      'complaint_view_all', 'complaint_view', 'complaint_create', 'complaint_update',
      'client_read', 'farmer_read', 'communication_access', 'whatsapp_send'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'customer_care_supervisor',
    name: 'Customer Care Supervisor',
    description: 'Customer care supervision with advanced task and complaint management',
    permissions: [
      'customer_care_access',
      'task_view_all', 'task_view', 'task_create', 'task_update', 'task_delete',
      'complaint_view_all', 'complaint_view', 'complaint_create', 'complaint_update', 'complaint_delete', 'complaint_resolve',
      'client_read', 'farmer_read', 'reports_view', 'communication_access', 'whatsapp_send'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'field_supervisor',
    name: 'Field Supervisor',
    description: 'Field operations management',
    permissions: [
      'visit_read', 'visit_create', 'visit_update', 'visit_delete', 'visit_track',
      'client_read', 'farmer_read', 'form_view', 'reports_view', 'communication_access'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'field_agent',
    name: 'Field Agent',
    description: 'Basic field operations',
    permissions: [
      'visit_read', 'visit_create', 'visit_update', 'visit_track',
      'client_read', 'farmer_read', 'form_view', 'communication_access'
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Location monitoring function
const checkLocationStatus = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const locationCheckInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize data
  useEffect(() => {
    console.log('AuthProvider initializing...');

    // Initialize with fresh default data
    try {
      // Always use fresh default data for consistency
      localStorage.setItem('hdf_users', JSON.stringify(defaultUsers));
      localStorage.setItem('hdf_roles', JSON.stringify(defaultRoles));

      setUsers(defaultUsers);
      setRoles(defaultRoles);

      console.log('Enhanced Customer Care users loaded:', defaultUsers.length, 'users');
      console.log('Enhanced Customer Care roles loaded:', defaultRoles.length, 'roles');
      console.log('Available login credentials:');
      defaultUsers.forEach(u => {
        console.log(`- ${u.email} / ${u.password} (${u.name})`);
      });
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }, []);

  // Location monitoring effect - checks location every 10 seconds when user is logged in
  useEffect(() => {
    let failureCount = 0;
    const MAX_FAILURES = 3;

    const monitorLocation = async () => {
      if (user) {
        const isLocationEnabled = await checkLocationStatus();

        if (isLocationEnabled) {
          // Reset failure count on success
          failureCount = 0;
        } else {
          // Increment failure count
          failureCount++;
          console.warn(`Location check failed (${failureCount}/${MAX_FAILURES})`);

          if (failureCount >= MAX_FAILURES) {
            console.log('Location services persistently disabled - auto logout triggered');
            logout();
            toast.error('Location services disabled. You have been logged out for security reasons.');
          }
        }
      }
    };

    if (user) {
      // Check location immediately when user logs in
      monitorLocation();

      // Then check every 10 seconds for logout on persistent location loss
      locationCheckInterval.current = setInterval(monitorLocation, 10000);
    } else {
      // Clear interval when user logs out
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
      }
    }

    return () => {
      if (locationCheckInterval.current) {
        clearInterval(locationCheckInterval.current);
      }
    };
  }, [user]);

  // Listen for user updates
  useEffect(() => {
    const handleUsersUpdate = (event: CustomEvent) => {
      setUsers(event.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hdf_users' && e.newValue) {
        try {
          const updatedUsers = JSON.parse(e.newValue);
          setUsers(Array.isArray(updatedUsers) ? updatedUsers : defaultUsers);
        } catch (error) {
          console.error('Error parsing updated users:', error);
          setUsers(defaultUsers);
        }
      }
      if (e.key === 'hdf_roles' && e.newValue) {
        try {
          const updatedRoles = JSON.parse(e.newValue);
          setRoles(Array.isArray(updatedRoles) ? updatedRoles : defaultRoles);
        } catch (error) {
          console.error('Error parsing updated roles:', error);
          setRoles(defaultRoles);
        }
      }
    };

    window.addEventListener('usersUpdated', handleUsersUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('usersUpdated', handleUsersUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Login attempt:', { email, password });

      // First check if location is available
      const locationAvailable = await checkLocationStatus();
      if (!locationAvailable) {
        toast.error('Location access is required to login. Please enable location services.');
        return false;
      }

      // Get the latest users from localStorage or use default
      const savedUsers = localStorage.getItem('hdf_users');
      const currentUsers = savedUsers ? JSON.parse(savedUsers) : defaultUsers;

      console.log('Current users for login check:', currentUsers.length, 'users available');

      const foundUser = currentUsers.find((u: User) => {
        const emailMatch = u.email.toLowerCase() === email.toLowerCase();
        const passwordMatch = u.password === password;
        const isActive = u.status === 'active';

        console.log(`Checking user ${u.email}:`, {
          emailMatch,
          passwordMatch,
          isActive,
          userPassword: u.password,
          inputPassword: password
        });

        return emailMatch && passwordMatch && isActive;
      });

      console.log('Found user:', foundUser ? foundUser.name : 'None');

      if (foundUser) {
        // Update last login
        const updatedUsers = currentUsers.map((u: User) =>
          u.id === foundUser.id
            ? { ...u, lastLogin: new Date().toISOString() }
            : u
        );

        localStorage.setItem('hdf_users', JSON.stringify(updatedUsers));
        localStorage.setItem('hdf_current_user', JSON.stringify(foundUser));

        setUser(foundUser);
        setUsers(updatedUsers);

        console.log('✅ Login successful for user:', foundUser.name);
        console.log('📍 Location tracking enabled for user');
        toast.success(`Welcome back, ${foundUser.name}!`);

        return true;
      }

      console.log('❌ Login failed - invalid credentials or inactive user');
      toast.error('Invalid email or password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hdf_current_user');

    // Clear location monitoring interval
    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
    }

    console.log('📍 Location tracking stopped');
    toast.success('Logged out successfully');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const userRole = roles.find(role => role.id === user.roleId);
    const hasAccess = userRole ? userRole.permissions.includes(permission) : false;

    console.log(`Permission check: ${permission} = ${hasAccess} (Role: ${userRole?.name})`);
    return hasAccess;
  };

  const value: AuthContextType = {
    user,
    users,
    roles,
    login,
    logout,
    hasPermission,
    currentUser: user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};