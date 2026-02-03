import React, { useState, useMemo } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, AlertTriangle, Key, Eye, EyeOff, ArrowRight, Users, UserCheck, Mail, Phone, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'individual' | 'corporate';
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastActivity: string;
  totalOrders: number;
  totalSpent: number;
  notes: string;
  assignedUserId?: string;
}

interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  farmSize: number;
  cropTypes: string[];
  registrationDate: string;
  status: 'active' | 'inactive' | 'pending';
  lastActivity: string;
  totalSales: number;
  notes: string;
  assignedUserId?: string;
}

const UserManagement: React.FC = () => {
  const { 
    users, 
    roles, 
    hasPermission, 
    createUser, 
    updateUser, 
    deleteUser,
    changePassword 
  } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isBlockedDeleteModalOpen, setIsBlockedDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Reassignment states
  const [userAssignments, setUserAssignments] = useState<{
    clients: Client[];
    farmers: Farmer[];
  }>({ clients: [], farmers: [] });
  const [newAssigneeId, setNewAssigneeId] = useState<string>('');
  const [blockedUserName, setBlockedUserName] = useState<string>('');
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  // Load clients and farmers to check assignments
  const loadAssignments = (userId: string) => {
    try {
      const savedClients = localStorage.getItem('hdf_clients');
      const savedFarmers = localStorage.getItem('hdf_farmers');
      
      const clients: Client[] = savedClients ? JSON.parse(savedClients) : [];
      const farmers: Farmer[] = savedFarmers ? JSON.parse(savedFarmers) : [];

      const assignedClients = clients.filter(c => c.assignedUserId === userId);
      const assignedFarmers = farmers.filter(f => f.assignedUserId === userId);

      return { clients: assignedClients, farmers: assignedFarmers };
    } catch (error) {
      console.error('Error loading assignments:', error);
      return { clients: [], farmers: [] };
    }
  };

  // Check if current user can manage assignments (has user management permissions)
  const canManageAssignments = () => {
    return hasPermission('user_delete') && hasPermission('user_update');
  };

  // Reassign clients and farmers to new user
  const reassignUserData = (fromUserId: string, toUserId: string) => {
    try {
      // Update clients
      const savedClients = localStorage.getItem('hdf_clients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const updatedClients = clients.map(client => 
          client.assignedUserId === fromUserId 
            ? { ...client, assignedUserId: toUserId }
            : client
        );
        localStorage.setItem('hdf_clients', JSON.stringify(updatedClients));
      }

      // Update farmers
      const savedFarmers = localStorage.getItem('hdf_farmers');
      if (savedFarmers) {
        const farmers: Farmer[] = JSON.parse(savedFarmers);
        const updatedFarmers = farmers.map(farmer => 
          farmer.assignedUserId === fromUserId 
            ? { ...farmer, assignedUserId: toUserId }
            : farmer
        );
        localStorage.setItem('hdf_farmers', JSON.stringify(updatedFarmers));
      }
    } catch (error) {
      console.error('Error reassigning user data:', error);
      throw error;
    }
  };

  // Get assignment counts for each user
  const getUserAssignmentCounts = (userId: string) => {
    const assignments = loadAssignments(userId);
    return {
      clients: assignments.clients.length,
      farmers: assignments.farmers.length,
      total: assignments.clients.length + assignments.farmers.length
    };
  };

  // Check if user can be deleted (no assignments or user has management permissions)
  const canDeleteUser = (userId: string) => {
    if (!hasPermission('user_delete')) return false;
    
    const assignments = getUserAssignmentCounts(userId);
    const hasAssignments = assignments.total > 0;
    
    // If user has assignments, current user must have management permissions
    if (hasAssignments && !canManageAssignments()) {
      return false;
    }
    
    return true;
  };

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleAddUser = () => {
    if (!hasPermission('user_create')) {
      toast.error('You do not have permission to create users');
      return;
    }
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      isActive: true,
    });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (userId: string) => {
    if (!hasPermission('user_update')) {
      toast.error('You do not have permission to edit users');
      return;
    }
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditingUser(userId);
      setFormData({
        name: user.name,
        email: user.email,
        password: user.password,
        roleId: user.roleId,
        isActive: user.isActive,
      });
      setIsUserModalOpen(true);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!hasPermission('user_delete')) {
      toast.error('You do not have permission to delete users');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Check if user has assigned clients or farmers
    const assignments = loadAssignments(userId);
    const totalAssignments = assignments.clients.length + assignments.farmers.length;

    if (totalAssignments > 0) {
      // Check if current user has management permissions to handle reassignments
      if (!canManageAssignments()) {
        setBlockedUserName(user.name);
        setIsBlockedDeleteModalOpen(true);
        return;
      }
      
      // Show reassignment modal if user has assignments and current user can manage
      setUserToDelete(userId);
      setUserAssignments(assignments);
      setNewAssigneeId('');
      setIsReassignModalOpen(true);
    } else {
      // Direct delete if no assignments
      setUserToDelete(userId);
      setIsDeleteModalOpen(true);
    }
  };

  const handleChangePassword = (userId: string) => {
    if (!hasPermission('user_update')) {
      toast.error('You do not have permission to change passwords');
      return;
    }
    setUserToChangePassword(userId);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSubmitUser = () => {
    if (!formData.name || !formData.email || !formData.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    // Check for duplicate email
    const existingUser = users.find(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      u.id !== editingUser
    );
    
    if (existingUser) {
      toast.error('A user with this email already exists');
      return;
    }

    try {
      if (editingUser) {
        updateUser(editingUser, formData);
        toast.success('User updated successfully');
      } else {
        createUser(formData);
        toast.success('User created successfully');
      }
      setIsUserModalOpen(false);
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      try {
        deleteUser(userToDelete);
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleConfirmReassignAndDelete = () => {
    if (!userToDelete || !newAssigneeId) {
      toast.error('Please select a user to reassign data to');
      return;
    }

    if (!canManageAssignments()) {
      toast.error('You do not have permission to manage user assignments');
      return;
    }

    try {
      // Reassign all clients and farmers to the new user
      reassignUserData(userToDelete, newAssigneeId);
      
      // Delete the user
      deleteUser(userToDelete);
      
      const newAssignee = users.find(u => u.id === newAssigneeId);
      toast.success(
        `User deleted successfully. ${userAssignments.clients.length} clients and ${userAssignments.farmers.length} farmers reassigned to ${newAssignee?.name}`
      );
      
      setIsReassignModalOpen(false);
      setUserToDelete(null);
      setUserAssignments({ clients: [], farmers: [] });
      setNewAssigneeId('');
    } catch (error) {
      toast.error('Failed to reassign data. User deletion cancelled.');
    }
  };

  const handleDeleteWithoutReassign = () => {
    if (!userToDelete) return;

    if (!canManageAssignments()) {
      toast.error('You do not have permission to manage user assignments');
      return;
    }

    try {
      // Remove assignments from clients and farmers (set to undefined)
      const savedClients = localStorage.getItem('hdf_clients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const updatedClients = clients.map(client => 
          client.assignedUserId === userToDelete 
            ? { ...client, assignedUserId: undefined }
            : client
        );
        localStorage.setItem('hdf_clients', JSON.stringify(updatedClients));
      }

      const savedFarmers = localStorage.getItem('hdf_farmers');
      if (savedFarmers) {
        const farmers: Farmer[] = JSON.parse(savedFarmers);
        const updatedFarmers = farmers.map(farmer => 
          farmer.assignedUserId === userToDelete 
            ? { ...farmer, assignedUserId: undefined }
            : farmer
        );
        localStorage.setItem('hdf_farmers', JSON.stringify(updatedFarmers));
      }

      // Delete the user
      deleteUser(userToDelete);
      
      toast.success(
        `User deleted successfully. ${userAssignments.clients.length} clients and ${userAssignments.farmers.length} farmers are now unassigned.`
      );
      
      setIsReassignModalOpen(false);
      setUserToDelete(null);
      setUserAssignments({ clients: [], farmers: [] });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSubmitPasswordChange = () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (userToChangePassword) {
      try {
        changePassword(userToChangePassword, newPassword);
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setUserToChangePassword(null);
        setNewPassword('');
        setConfirmPassword('');
      } catch (error) {
        toast.error('Failed to change password');
      }
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
      width: '18%',
    },
    {
      key: 'email',
      title: 'Email',
      width: '20%',
    },
    {
      key: 'roleId',
      title: 'Role',
      width: '12%',
      render: (roleId: unknown) => (
        <Badge variant="secondary">
          {getRoleName(String(roleId))}
        </Badge>
      ),
    },
    {
      key: 'assignments',
      title: 'Assignments',
      width: '12%',
      render: (_: unknown, record: User) => {
        const counts = getUserAssignmentCounts(record.id);
        const hasAssignments = counts.total > 0;
        
        return (
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              <span>{counts.clients}C</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-green-600" />
              <span>{counts.farmers}F</span>
            </div>
            {hasAssignments && !canManageAssignments() && (
              <div className="flex items-center gap-1 mt-1">
                <Lock className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">Protected</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '8%',
      render: (isActive: unknown) => (
        <Badge variant={isActive ? 'default' : 'destructive'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      width: '12%',
      render: (lastLogin: unknown) => (
        <span className="text-sm text-gray-500">
          {lastLogin ? new Date(String(lastLogin)).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '18%',
      render: (_: unknown, record: User) => {
        const canDelete = canDeleteUser(record.id);
        const assignments = getUserAssignmentCounts(record.id);
        const hasAssignments = assignments.total > 0;
        
        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(record.id)}
              disabled={!hasPermission('user_update')}
              title="Edit User"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleChangePassword(record.id)}
              disabled={!hasPermission('user_update')}
              title="Change Password"
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUser(record.id)}
              disabled={!canDelete || record.id === 'admin-1'}
              className={`${!canDelete && hasAssignments ? 'text-orange-500 hover:text-orange-600' : 'text-red-600 hover:text-red-700'}`}
              title={
                !canDelete && hasAssignments 
                  ? 'User has assignments - requires management permissions'
                  : 'Delete User'
              }
            >
              {!canDelete && hasAssignments ? (
                <Shield className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users, roles, passwords, and assignments</p>
        </div>
      </div>

      {/* Permission Notice */}
      {!canManageAssignments() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900 text-base">Limited Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              You have limited user management permissions. Users with assigned clients or farmers cannot be deleted 
              without proper reassignment permissions. Contact an administrator for full access.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => roles.find(r => r.id === u.roleId)?.name === 'Administrator').length}
            </div>
            <p className="text-xs text-muted-foreground">Admin users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((total, user) => {
                const counts = getUserAssignmentCounts(user.id);
                return total + counts.total;
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Clients & farmers assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const counts = getUserAssignmentCounts(u.id);
                return counts.total > 0 && !canManageAssignments();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Cannot be deleted</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search users..."
        onSearch={setSearchTerm}
        onAdd={handleAddUser}
        addButtonText="Add User"
        showAddButton={hasPermission('user_create')}
        emptyMessage="No users found"
      />

      {/* User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update user information and role assignment.' : 'Create a new user account with appropriate role and password.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                placeholder="user@hdf.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password *
              </Label>
              <div className="col-span-3 flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
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
                  title="Generate Random Password"
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role *
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r.isActive).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Active
              </Label>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            {formData.password && (
              <div className="col-span-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Generated Password:</strong> {formData.password}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Make sure to share this password securely with the user.
                </p>
              </div>
            )}
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

      {/* Blocked Delete Modal */}
      <Dialog open={isBlockedDeleteModalOpen} onOpenChange={setIsBlockedDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Cannot Delete User
            </DialogTitle>
            <DialogDescription>
              You cannot delete this user because they have assigned clients or farmers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-900 mb-2">User: {blockedUserName}</h4>
              <p className="text-sm text-orange-800 mb-3">
                This user has assigned clients and/or farmers. To delete this user, you need:
              </p>
              <ul className="text-sm text-orange-800 space-y-1 ml-4">
                <li>• User management permissions (user_update and user_delete)</li>
                <li>• Ability to reassign clients and farmers to other users</li>
                <li>• Or permission to unassign all their data</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">What you can do:</h5>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• Contact an administrator to delete this user</li>
                <li>• Request additional permissions for user management</li>
                <li>• Deactivate the user instead of deleting (if you have edit permissions)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsBlockedDeleteModalOpen(false)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Modal */}
      <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              Reassign User Data Before Deletion
            </DialogTitle>
            <DialogDescription>
              This user has assigned clients and farmers. Please choose how to handle their data before deletion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Assignment Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Assignments:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{userAssignments.clients.length} Clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span>{userAssignments.farmers.length} Farmers</span>
                </div>
              </div>
            </div>

            {/* Assignment Details */}
            {userAssignments.clients.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Assigned Clients:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {userAssignments.clients.map(client => (
                    <div key={client.id} className="text-sm p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">{client.name}</span>
                      <span className="text-gray-500">({client.email})</span>
                      <Badge variant="outline" className="text-xs">{client.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userAssignments.farmers.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Assigned Farmers:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {userAssignments.farmers.map(farmer => (
                    <div key={farmer.id} className="text-sm p-2 bg-gray-50 rounded flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">{farmer.name}</span>
                      <span className="text-gray-500">({farmer.email})</span>
                      <Badge variant="outline" className="text-xs">{farmer.farmSize} acres</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reassignment Options */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="newAssignee" className="text-sm font-medium">
                  Reassign to User (Optional)
                </Label>
                <Select value={newAssigneeId} onValueChange={setNewAssigneeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a user to reassign data to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.id !== userToDelete && u.isActive)
                      .map(user => {
                        const counts = getUserAssignmentCounts(user.id);
                        return (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({getRoleName(user.roleId)}) - Current: {counts.total} assignments
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a user to transfer all assignments, or leave unselected to unassign all data.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col space-y-2">
            <div className="flex w-full gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsReassignModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteWithoutReassign}
                className="flex-1"
                disabled={!canManageAssignments()}
              >
                Delete & Unassign All
              </Button>
            </div>
            {newAssigneeId && (
              <Button 
                onClick={handleConfirmReassignAndDelete}
                className="w-full"
                disabled={!canManageAssignments()}
              >
                Reassign to {users.find(u => u.id === newAssigneeId)?.name} & Delete User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {users.find(u => u.id === userToChangePassword)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                New Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmPassword" className="text-right">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="col-span-3"
              />
            </div>
            <div className="col-span-4 text-xs text-gray-500">
              Password must be at least 6 characters long.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPasswordChange}>
              Change Password
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
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              All data associated with this user will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;