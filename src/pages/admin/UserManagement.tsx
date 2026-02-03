import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  UserX,
  Eye,
  EyeOff,
  UserPlus,
  ArrowRight
} from 'lucide-react';
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

interface Client {
  id: string;
  assignedUserId?: string;
  createdBy?: string;
  name: string;
  // Add other client properties as needed
}

interface Farmer {
  id: string;
  assignedUserId?: string;
  createdBy?: string;
  name: string;
  // Add other farmer properties as needed
}

const UserManagement: React.FC = () => {
  const { users, hasPermission, currentUser } = useAuth();
  
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRoleTimestamp, setLastRoleTimestamp] = useState<string>('');
  
  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  
  // Editing states
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Reassignment states
  const [userAssignments, setUserAssignments] = useState<{
    clients: Client[];
    farmers: Farmer[];
  }>({ clients: [], farmers: [] });
  const [reassignToUserId, setReassignToUserId] = useState<string>('');
  
  // Form data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Load data from localStorage
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // Enhanced role synchronization with multiple event listeners
  useEffect(() => {
    const handleRoleUpdates = () => {
      console.log('Role update event received in UserManagement');
      loadRoles();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hdf_roles') {
        console.log('Storage change detected for roles');
        loadRoles();
      }
      if (e.key === 'hdf_users') {
        loadUsers();
      }
    };

    const handleRoleChanged = () => {
      console.log('Role changed event received');
      loadRoles();
    };

    // Multiple event listeners for maximum compatibility
    window.addEventListener('rolesUpdated', handleRoleUpdates);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rolesChanged', handleRoleChanged);
    
    // Aggressive polling with timestamp checking
    const roleCheckInterval = setInterval(() => {
      const currentTimestamp = localStorage.getItem('hdf_roles_timestamp');
      if (currentTimestamp && currentTimestamp !== lastRoleTimestamp) {
        console.log('Timestamp change detected, reloading roles');
        setLastRoleTimestamp(currentTimestamp);
        loadRoles();
      }
    }, 200); // Check every 200ms

    return () => {
      window.removeEventListener('rolesUpdated', handleRoleUpdates);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rolesChanged', handleRoleChanged);
      clearInterval(roleCheckInterval);
    };
  }, [lastRoleTimestamp]);

  const loadUsers = () => {
    try {
      const savedUsers = localStorage.getItem('hdf_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setLocalUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setLocalUsers([]);
    }
  };

  const loadRoles = () => {
    try {
      const savedRoles = localStorage.getItem('hdf_roles');
      if (savedRoles) {
        const parsedRoles = JSON.parse(savedRoles);
        const rolesArray = Array.isArray(parsedRoles) ? parsedRoles : [];
        console.log('Roles loaded in UserManagement:', rolesArray.length);
        setRoles(rolesArray);
        
        // Update timestamp tracker
        const timestamp = localStorage.getItem('hdf_roles_timestamp');
        if (timestamp) {
          setLastRoleTimestamp(timestamp);
        }
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    }
  };

  // Save users function
  const saveUsers = (updatedUsers: User[]) => {
    try {
      localStorage.setItem('hdf_users', JSON.stringify(updatedUsers));
      setLocalUsers(updatedUsers);
      
      // Trigger a custom event to notify AuthContext
      window.dispatchEvent(new CustomEvent('usersUpdated', { 
        detail: updatedUsers 
      }));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  // Reassign clients and farmers to another user
  const reassignUserData = (fromUserId: string, toUserId: string) => {
    try {
      let clientsReassigned = 0;
      let farmersReassigned = 0;

      // Reassign clients - check both assignedUserId and createdBy fields
      const savedClients = localStorage.getItem('hdf_clients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const updatedClients = clients.map(client => {
          if (client.assignedUserId === fromUserId || client.createdBy === fromUserId) {
            clientsReassigned++;
            return { 
              ...client, 
              assignedUserId: toUserId,
              createdBy: toUserId,
              updatedAt: new Date().toISOString() 
            };
          }
          return client;
        });
        localStorage.setItem('hdf_clients', JSON.stringify(updatedClients));
      }

      // Reassign farmers - check both assignedUserId and createdBy fields
      const savedFarmers = localStorage.getItem('hdf_farmers');
      if (savedFarmers) {
        const farmers: Farmer[] = JSON.parse(savedFarmers);
        const updatedFarmers = farmers.map(farmer => {
          if (farmer.assignedUserId === fromUserId || farmer.createdBy === fromUserId) {
            farmersReassigned++;
            return { 
              ...farmer, 
              assignedUserId: toUserId,
              createdBy: toUserId,
              updatedAt: new Date().toISOString() 
            };
          }
          return farmer;
        });
        localStorage.setItem('hdf_farmers', JSON.stringify(updatedFarmers));
      }

      console.log(`Reassigned ${clientsReassigned} clients and ${farmersReassigned} farmers`);

      // Trigger events to notify other components
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      window.dispatchEvent(new CustomEvent('farmersUpdated'));

      return { clientsReassigned, farmersReassigned };
    } catch (error) {
      console.error('Error reassigning user data:', error);
      return { clientsReassigned: 0, farmersReassigned: 0 };
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = localUsers;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [localUsers, searchTerm]);

  // Get role name by ID
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Get active roles for dropdown - with force refresh capability
  const activeRoles = useMemo(() => {
    const filtered = roles.filter(role => role.isActive);
    console.log('Active roles for dropdown:', filtered.length, filtered.map(r => r.name));
    return filtered;
  }, [roles]);

  // Get active users for reassignment (excluding the user being deleted and current user)
  const availableUsersForReassignment = useMemo(() => {
    return localUsers.filter(user => 
      user.id !== userToDelete && 
      user.id !== currentUser?.id && 
      user.status === 'active'
    );
  }, [localUsers, userToDelete, currentUser]);

  // User handlers
  const handleAddUser = () => {
    // Force refresh roles before opening modal
    loadRoles();
    setTimeout(() => loadRoles(), 100); // Double check
    
    setEditingUser(null);
    setUserData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      status: 'active',
    });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (userId: string) => {
    // Force refresh roles before opening modal
    loadRoles();
    setTimeout(() => loadRoles(), 100); // Double check
    
    const user = localUsers.find(u => u.id === userId);
    if (user) {
      setEditingUser(userId);
      setUserData({
        name: user.name,
        email: user.email,
        password: user.password,
        roleId: user.roleId,
        status: user.status,
      });
      setIsUserModalOpen(true);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserData({ ...userData, password });
    toast.success('Password generated successfully');
  };

  const handleSubmitUser = () => {
    if (!userData.name || !userData.email || !userData.password || !userData.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email already exists (excluding current user when editing)
    const emailExists = localUsers.some(user => 
      user.email.toLowerCase() === userData.email.toLowerCase() && 
      user.id !== editingUser
    );
    
    if (emailExists) {
      toast.error('Email address already exists');
      return;
    }

    // Password validation
    if (userData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Verify selected role still exists
    const selectedRole = roles.find(role => role.id === userData.roleId);
    if (!selectedRole) {
      toast.error('Selected role is no longer available. Please select another role.');
      loadRoles(); // Refresh roles
      return;
    }

    const now = new Date().toISOString();
    
    if (editingUser) {
      const updatedUsers = localUsers.map(user =>
        user.id === editingUser
          ? {
              ...user,
              ...userData,
              updatedAt: now
            }
          : user
      );
      saveUsers(updatedUsers);
      toast.success('User updated successfully');
    } else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: now,
        updatedAt: now,
      };
      saveUsers([...localUsers, newUser]);
      toast.success('User created successfully');
    }
    setIsUserModalOpen(false);
  };

  // COMPLETELY REWRITTEN DELETE HANDLER - Now checks both assignedUserId AND createdBy
  const handleDeleteUser = (userId: string) => {
    // Prevent deleting current user
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    
    console.log('=== DELETE USER PROCESS STARTED ===');
    console.log('User ID to delete:', userId);
    
    // Check for client assignments - check BOTH assignedUserId AND createdBy
    let userClients: Client[] = [];
    try {
      const savedClients = localStorage.getItem('hdf_clients');
      console.log('Raw clients data:', savedClients);
      
      if (savedClients) {
        const allClients: Client[] = JSON.parse(savedClients);
        userClients = allClients.filter(client => 
          client.assignedUserId === userId || client.createdBy === userId
        );
        console.log('Found clients for user:', userClients.length, userClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
    
    // Check for farmer assignments - check BOTH assignedUserId AND createdBy
    let userFarmers: Farmer[] = [];
    try {
      const savedFarmers = localStorage.getItem('hdf_farmers');
      console.log('Raw farmers data:', savedFarmers);
      
      if (savedFarmers) {
        const allFarmers: Farmer[] = JSON.parse(savedFarmers);
        userFarmers = allFarmers.filter(farmer => 
          farmer.assignedUserId === userId || farmer.createdBy === userId
        );
        console.log('Found farmers for user:', userFarmers.length, userFarmers);
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
    
    const hasAssignments = userClients.length > 0 || userFarmers.length > 0;
    
    console.log('=== ASSIGNMENT CHECK RESULTS ===');
    console.log('Clients assigned/created:', userClients.length);
    console.log('Farmers assigned/created:', userFarmers.length);
    console.log('Has assignments:', hasAssignments);
    
    // Set the user to delete and assignments
    setUserToDelete(userId);
    setUserAssignments({
      clients: userClients,
      farmers: userFarmers
    });
    
    if (hasAssignments) {
      console.log('Opening REASSIGNMENT modal');
      setIsReassignModalOpen(true);
      toast.info(`User has ${userClients.length} clients and ${userFarmers.length} farmers that need reassignment`);
    } else {
      console.log('Opening DELETE CONFIRMATION modal');
      setIsDeleteModalOpen(true);
    }
    
    console.log('=== DELETE USER PROCESS COMPLETED ===');
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      const userToDeleteData = localUsers.find(u => u.id === userToDelete);
      const updatedUsers = localUsers.filter(user => user.id !== userToDelete);
      saveUsers(updatedUsers);
      toast.success(`User "${userToDeleteData?.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleConfirmReassignAndDelete = () => {
    if (!userToDelete) {
      toast.error('No user selected for deletion');
      return;
    }

    const hasAssignments = userAssignments.clients.length > 0 || userAssignments.farmers.length > 0;
    
    if (hasAssignments) {
      if (!reassignToUserId) {
        toast.error('Please select a user to reassign the clients and farmers to');
        return;
      }
      
      console.log('Starting reassignment process...');
      console.log('From user:', userToDelete);
      console.log('To user:', reassignToUserId);
      console.log('Clients to reassign:', userAssignments.clients.length);
      console.log('Farmers to reassign:', userAssignments.farmers.length);
      
      // Reassign all clients and farmers
      const result = reassignUserData(userToDelete, reassignToUserId);
      
      const reassignedUser = localUsers.find(u => u.id === reassignToUserId);
      const userToDeleteData = localUsers.find(u => u.id === userToDelete);
      
      toast.success(`Successfully reassigned ${result.clientsReassigned} clients and ${result.farmersReassigned} farmers to ${reassignedUser?.name}`);
    }

    // Delete the user
    const userToDeleteData = localUsers.find(u => u.id === userToDelete);
    const updatedUsers = localUsers.filter(user => user.id !== userToDelete);
    saveUsers(updatedUsers);
    
    toast.success(`User "${userToDeleteData?.name}" deleted successfully`);
    
    // Reset all states
    setIsReassignModalOpen(false);
    setUserToDelete(null);
    setReassignToUserId('');
    setUserAssignments({ clients: [], farmers: [] });
  };

  const handleToggleStatus = (userId: string) => {
    // Prevent deactivating current user
    if (userId === currentUser?.id) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    const updatedUsers = localUsers.map(user =>
      user.id === userId
        ? {
            ...user,
            status: user.status === 'active' ? 'inactive' as const : 'active' as const,
            updatedAt: new Date().toISOString()
          }
        : user
    );
    saveUsers(updatedUsers);
    toast.success('User status updated successfully');
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Name',
      width: '20%',
    },
    {
      key: 'email',
      title: 'Email',
      width: '25%',
    },
    {
      key: 'roleId',
      title: 'Role',
      width: '15%',
      render: (roleId: unknown) => (
        <Badge variant="secondary">
          {getRoleName(String(roleId))}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '10%',
      render: (status: unknown, record: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleStatus(record.id)}
          className={`${
            status === 'active' 
              ? 'text-green-600 hover:text-green-700' 
              : 'text-red-600 hover:text-red-700'
          }`}
        >
          <Badge variant={status === 'active' ? 'default' : 'destructive'}>
            {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
          </Badge>
        </Button>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      width: '15%',
      render: (createdAt: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(createdAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '15%',
      render: (_: unknown, record: User) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(record.id)}
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(record.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete User"
            disabled={record.id === currentUser?.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Statistics
  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.status === 'active').length,
    inactive: filteredUsers.filter(u => u.status === 'inactive').length,
  };

  if (!hasPermission('user_read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their access</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search users..."
        onSearch={setSearchTerm}
        onAdd={hasPermission('user_create') ? handleAddUser : undefined}
        addButtonText="Add User"
        showAddButton={hasPermission('user_create')}
        emptyMessage="No users found"
      />

      {/* User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and permissions.' : 'Create a new user account with role assignment and password.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-name" className="text-right">Name *</Label>
              <Input
                id="user-name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-email" className="text-right">Email *</Label>
              <Input
                id="user-email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-password" className="text-right">Password *</Label>
              <div className="col-span-3 flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    placeholder="Enter password (min 6 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-role" className="text-right">Role *</Label>
              <Select
                value={userData.roleId}
                onValueChange={(value) => setUserData({ ...userData, roleId: value })}
                onOpenChange={(open) => {
                  if (open) {
                    // Force refresh roles when dropdown opens
                    console.log('Role dropdown opened, refreshing roles...');
                    loadRoles();
                    setTimeout(() => loadRoles(), 50);
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {activeRoles.length > 0 ? (
                    activeRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No active roles available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-status" className="text-right">Status</Label>
              <Select
                value={userData.status}
                onValueChange={(value: 'active' | 'inactive') => setUserData({ ...userData, status: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUser}>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Modal */}
      <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-600" />
              ⚠️ User Has Assignments - Reassignment Required
            </DialogTitle>
            <DialogDescription>
              This user has assigned clients and farmers. You must reassign them to another user before deletion to prevent data loss.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* User being deleted info */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">User to Delete:</h4>
              <p className="text-red-800 font-medium">
                {localUsers.find(u => u.id === userToDelete)?.name} 
                <span className="text-red-600 ml-2">({localUsers.find(u => u.id === userToDelete)?.email})</span>
              </p>
            </div>

            {/* Current assignments summary */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-3">📊 Current Assignments to Transfer:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-blue-700">Clients:</span>
                    <span className="font-bold text-blue-900 ml-2 text-lg">{userAssignments.clients.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-green-700">Farmers:</span>
                    <span className="font-bold text-green-900 ml-2 text-lg">{userAssignments.farmers.length}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ Total: {userAssignments.clients.length + userAssignments.farmers.length} assignments must be transferred before deletion
                </p>
              </div>
            </div>

            {/* Reassignment selection */}
            <div className="space-y-3">
              <Label htmlFor="reassign-user" className="text-base font-medium text-gray-900">
                🎯 Select User to Receive ALL Assignments *
              </Label>
              <Select
                value={reassignToUserId}
                onValueChange={setReassignToUserId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a user to transfer all assignments to..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsersForReassignment.length > 0 ? (
                    availableUsersForReassignment.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-3 py-1">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getRoleName(user.roleId)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      ❌ No active users available for reassignment
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer preview */}
            {reassignToUserId && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-3">📋 Transfer Preview:</h5>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-medium">Will transfer:</span>
                  <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium">
                    {userAssignments.clients.length} clients
                  </span>
                  <span className="text-gray-500">+</span>
                  <span className="bg-green-100 px-3 py-1 rounded-full text-green-800 font-medium">
                    {userAssignments.farmers.length} farmers
                  </span>
                  <ArrowRight className="h-4 w-4 mx-2 text-blue-600" />
                  <span className="font-bold text-blue-700">
                    {availableUsersForReassignment.find(u => u.id === reassignToUserId)?.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsReassignModalOpen(false);
              setReassignToUserId('');
              setUserToDelete(null);
              setUserAssignments({ clients: [], farmers: [] });
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReassignAndDelete}
              disabled={!reassignToUserId}
              className="bg-red-600 hover:bg-red-700"
            >
              🔄 Reassign & Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete User (No Assignments)
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This user has no assigned clients or farmers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                ✅ Safe to delete - No client or farmer assignments found for this user.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteModalOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              🗑️ Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;