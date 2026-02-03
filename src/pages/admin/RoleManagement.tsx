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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  ShieldCheck, 
  ShieldX 
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced permissions with specific Customer Care permissions
const availablePermissions = [
  // User Management
  { id: 'user_read', name: 'View Users', category: 'User Management' },
  { id: 'user_create', name: 'Create Users', category: 'User Management' },
  { id: 'user_update', name: 'Update Users', category: 'User Management' },
  { id: 'user_delete', name: 'Delete Users', category: 'User Management' },
  
  // Role Management
  { id: 'role_read', name: 'View Roles', category: 'Role Management' },
  { id: 'role_create', name: 'Create Roles', category: 'Role Management' },
  { id: 'role_update', name: 'Update Roles', category: 'Role Management' },
  { id: 'role_delete', name: 'Delete Roles', category: 'Role Management' },
  
  // Client Management
  { id: 'client_read', name: 'View Clients', category: 'Client Management' },
  { id: 'client_create', name: 'Create Clients', category: 'Client Management' },
  { id: 'client_update', name: 'Update Clients', category: 'Client Management' },
  { id: 'client_delete', name: 'Delete Clients', category: 'Client Management' },
  { id: 'client_view_all', name: 'View All Clients (Admin)', category: 'Client Management' },
  
  // Farmer Management
  { id: 'farmer_read', name: 'View Farmers', category: 'Farmer Management' },
  { id: 'farmer_create', name: 'Create Farmers', category: 'Farmer Management' },
  { id: 'farmer_update', name: 'Update Farmers', category: 'Farmer Management' },
  { id: 'farmer_delete', name: 'Delete Farmers', category: 'Farmer Management' },
  { id: 'farmer_view_all', name: 'View All Farmers (Admin)', category: 'Farmer Management' },
  
  // Field Visit Management
  { id: 'visit_read', name: 'View Field Visits', category: 'Field Visit Management' },
  { id: 'visit_create', name: 'Create Field Visits', category: 'Field Visit Management' },
  { id: 'visit_update', name: 'Update Field Visits', category: 'Field Visit Management' },
  { id: 'visit_delete', name: 'Delete Field Visits', category: 'Field Visit Management' },
  { id: 'visit_track', name: 'Track Live Location', category: 'Field Visit Management' },
  
  // Form Management
  { id: 'form_view', name: 'View Forms', category: 'Form Management' },
  { id: 'form_create', name: 'Create Forms', category: 'Form Management' },
  { id: 'form_update', name: 'Update Forms', category: 'Form Management' },
  { id: 'form_delete', name: 'Delete Forms', category: 'Form Management' },
  
  // Reports
  { id: 'reports_view', name: 'View Reports', category: 'Reports' },
  { id: 'reports_create', name: 'Create Reports', category: 'Reports' },
  { id: 'reports_update', name: 'Update Reports', category: 'Reports' },
  { id: 'reports_delete', name: 'Delete Reports', category: 'Reports' },
  
  // Customer Care - Main Access
  { id: 'customer_care_access', name: 'Access Customer Care (Sidebar Menu)', category: 'Customer Care' },
  
  // Customer Care - Task Management
  { id: 'task_view_all', name: 'View All Tasks', category: 'Customer Care' },
  { id: 'task_view', name: 'View Tasks', category: 'Customer Care' },
  { id: 'task_create', name: 'Create Tasks', category: 'Customer Care' },
  { id: 'task_update', name: 'Update Tasks', category: 'Customer Care' },
  { id: 'task_delete', name: 'Delete Tasks', category: 'Customer Care' },
  
  // Customer Care - Complaint Management
  { id: 'complaint_view_all', name: 'View All Complaints', category: 'Customer Care' },
  { id: 'complaint_view', name: 'View Complaints', category: 'Customer Care' },
  { id: 'complaint_create', name: 'Create Complaints', category: 'Customer Care' },
  { id: 'complaint_update', name: 'Update Complaints', category: 'Customer Care' },
  { id: 'complaint_delete', name: 'Delete Complaints', category: 'Customer Care' },
  { id: 'complaint_resolve', name: 'Resolve Complaints', category: 'Customer Care' },
  { id: 'complaint_escalate', name: 'Escalate Complaints', category: 'Customer Care' },
  
  // Communication
  { id: 'communication_access', name: 'Access Communication Tools', category: 'Communication' },
  { id: 'whatsapp_send', name: 'Send WhatsApp Messages', category: 'Communication' },
  { id: 'sip_calls', name: 'Make SIP Calls', category: 'Communication' },
];

const RoleManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Editing states
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  
  // Form data
  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  });

  // Load roles from localStorage and initialize default roles if needed
  useEffect(() => {
    loadRoles();
    initializeDefaultRoles();
  }, []);

  const loadRoles = () => {
    try {
      const savedRoles = localStorage.getItem('hdf_roles');
      if (savedRoles) {
        const parsedRoles = JSON.parse(savedRoles);
        setRoles(Array.isArray(parsedRoles) ? parsedRoles : []);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    }
  };

  // Initialize default roles with enhanced Customer Care permissions
  const initializeDefaultRoles = () => {
    const savedRoles = localStorage.getItem('hdf_roles');
    if (!savedRoles) {
      const defaultRoles: Role[] = [
        {
          id: 'admin',
          name: 'System Administrator',
          description: 'Full system access with all permissions',
          permissions: availablePermissions.map(p => p.id),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('hdf_roles', JSON.stringify(defaultRoles));
      setRoles(defaultRoles);
      console.log('Enhanced Customer Care roles initialized with specific permissions');
    }
  };

  // Enhanced save roles function with multiple notification methods
  const saveRoles = (updatedRoles: Role[]) => {
    try {
      localStorage.setItem('hdf_roles', JSON.stringify(updatedRoles));
      setRoles(updatedRoles);
      
      console.log('Roles saved, triggering notifications...');
      
      // Method 1: Custom event
      window.dispatchEvent(new CustomEvent('rolesUpdated', { 
        detail: updatedRoles 
      }));
      
      // Method 2: Storage event (for cross-tab)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'hdf_roles',
        newValue: JSON.stringify(updatedRoles),
        oldValue: localStorage.getItem('hdf_roles'),
        storageArea: localStorage
      }));
      
      // Method 3: Direct localStorage trigger
      setTimeout(() => {
        window.dispatchEvent(new Event('rolesChanged'));
      }, 100);
      
      // Method 4: Force update with timestamp
      localStorage.setItem('hdf_roles_timestamp', Date.now().toString());
      
      console.log('All role update notifications sent');
      
    } catch (error) {
      console.error('Error saving roles:', error);
    }
  };

  // Filter roles
  const filteredRoles = useMemo(() => {
    let filtered = roles;

    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [roles, searchTerm]);

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped: { [key: string]: typeof availablePermissions } = {};
    availablePermissions.forEach(permission => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });
    return grouped;
  }, []);

  // Role handlers
  const handleAddRole = () => {
    setEditingRole(null);
    setRoleData({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    });
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setEditingRole(roleId);
      setRoleData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
        isActive: role.isActive,
      });
      setIsRoleModalOpen(true);
    }
  };

  const handleSubmitRole = () => {
    if (!roleData.name || !roleData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if role name already exists (excluding current role when editing)
    const nameExists = roles.some(role => 
      role.name.toLowerCase() === roleData.name.toLowerCase() && 
      role.id !== editingRole
    );
    
    if (nameExists) {
      toast.error('Role name already exists');
      return;
    }

    const now = new Date().toISOString();
    
    if (editingRole) {
      const updatedRoles = roles.map(role =>
        role.id === editingRole
          ? {
              ...role,
              ...roleData,
              updatedAt: now
            }
          : role
      );
      saveRoles(updatedRoles);
      toast.success('Role updated successfully');
    } else {
      const newRole: Role = {
        id: `role_${Date.now()}`,
        ...roleData,
        createdAt: now,
        updatedAt: now,
      };
      const updatedRoles = [...roles, newRole];
      saveRoles(updatedRoles);
      toast.success('Role created successfully');
      console.log('New role created:', newRole.name);
    }
    setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (roleId: string) => {
    // Check if role is being used by any users
    const savedUsers = localStorage.getItem('hdf_users');
    if (savedUsers) {
      try {
        const users = JSON.parse(savedUsers);
        const isRoleInUse = users.some((user: any) => user.roleId === roleId);
        
        if (isRoleInUse) {
          toast.error('Cannot delete role that is assigned to users');
          return;
        }
      } catch (error) {
        console.error('Error checking role usage:', error);
      }
    }
    
    setRoleToDelete(roleId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      const updatedRoles = roles.filter(role => role.id !== roleToDelete);
      saveRoles(updatedRoles);
      toast.success('Role deleted successfully');
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleToggleActive = (roleId: string) => {
    const updatedRoles = roles.map(role =>
      role.id === roleId
        ? {
            ...role,
            isActive: !role.isActive,
            updatedAt: new Date().toISOString()
          }
        : role
    );
    saveRoles(updatedRoles);
    toast.success('Role status updated successfully');
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setRoleData({
        ...roleData,
        permissions: [...roleData.permissions, permissionId]
      });
    } else {
      setRoleData({
        ...roleData,
        permissions: roleData.permissions.filter(p => p !== permissionId)
      });
    }
  };

  const handleSelectAllPermissions = (category: string, checked: boolean) => {
    const categoryPermissions = permissionsByCategory[category].map(p => p.id);
    
    if (checked) {
      const newPermissions = [...new Set([...roleData.permissions, ...categoryPermissions])];
      setRoleData({ ...roleData, permissions: newPermissions });
    } else {
      const newPermissions = roleData.permissions.filter(p => !categoryPermissions.includes(p));
      setRoleData({ ...roleData, permissions: newPermissions });
    }
  };

  // Test Customer Care roles function
  const testCustomerCareRoles = () => {
    const customerCarePermissions = availablePermissions.filter(p => p.category === 'Customer Care');
    console.log('Customer Care Permissions:', customerCarePermissions);
    
    const customerCareRoles = roles.filter(role => 
      role.permissions.some(p => customerCarePermissions.map(cp => cp.id).includes(p))
    );
    console.log('Roles with Customer Care permissions:', customerCareRoles);
    
    toast.success(`Found ${customerCarePermissions.length} Customer Care permissions and ${customerCareRoles.length} roles using them`);
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      title: 'Role Name',
      width: '20%',
    },
    {
      key: 'description',
      title: 'Description',
      width: '30%',
    },
    {
      key: 'permissions',
      title: 'Permissions',
      width: '20%',
      render: (permissions: unknown, record: Role) => {
        const customerCarePerms = Array.isArray(permissions) 
          ? permissions.filter(p => availablePermissions.find(ap => ap.id === p && ap.category === 'Customer Care')).length
          : 0;
        
        return (
          <div className="space-y-1">
            <Badge variant="outline">
              {Array.isArray(permissions) ? permissions.length : 0} total
            </Badge>
            {customerCarePerms > 0 && (
              <Badge variant="secondary" className="text-xs">
                {customerCarePerms} Customer Care
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      title: 'Status',
      width: '10%',
      render: (isActive: unknown, record: Role) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleToggleActive(record.id)}
          className={`${
            isActive 
              ? 'text-green-600 hover:text-green-700' 
              : 'text-red-600 hover:text-red-700'
          }`}
        >
          <Badge variant={isActive ? 'default' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Button>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '20%',
      render: (_: unknown, record: Role) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditRole(record.id)}
            title="Edit Role"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteRole(record.id)}
            className="text-red-600 hover:text-red-700"
            title="Delete Role"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Statistics
  const stats = {
    total: filteredRoles.length,
    active: filteredRoles.filter(r => r.isActive).length,
    inactive: filteredRoles.filter(r => !r.isActive).length,
    customerCare: filteredRoles.filter(r => 
      r.permissions.some(p => availablePermissions.find(ap => ap.id === p && ap.category === 'Customer Care'))
    ).length,
  };

  if (!hasPermission('role_read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Button onClick={testCustomerCareRoles} variant="outline" size="sm">
          Test Customer Care Roles
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Roles</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Care Roles</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customerCare}</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={filteredRoles}
        columns={columns}
        searchPlaceholder="Search roles..."
        onSearch={setSearchTerm}
        onAdd={hasPermission('role_create') ? handleAddRole : undefined}
        addButtonText="Add Role"
        showAddButton={hasPermission('role_create')}
        emptyMessage="No roles found"
      />

      {/* Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? 'Update role information and permissions.' : 'Create a new role with specific permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">Name *</Label>
              <Input
                id="role-name"
                value={roleData.name}
                onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter role name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-description" className="text-right">Description *</Label>
              <Textarea
                id="role-description"
                value={roleData.description}
                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                className="col-span-3"
                placeholder="Enter role description"
                rows={2}
              />
            </div>
            
            {/* Permissions Section */}
            <div className="col-span-4">
              <Label className="text-sm font-medium">Permissions</Label>
              <div className="mt-2 space-y-4 max-h-60 overflow-y-auto border rounded-md p-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={permissions.every(p => roleData.permissions.includes(p.id))}
                        onCheckedChange={(checked) => handleSelectAllPermissions(category, !!checked)}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className={`text-sm font-medium ${
                          category === 'Customer Care' ? 'text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {category} ({permissions.length} permissions)
                        {category === 'Customer Care' && ' - Tasks & Complaints Management'}
                      </Label>
                    </div>
                    <div className="ml-6 space-y-1">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={roleData.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                          />
                          <Label 
                            htmlFor={permission.id}
                            className={`text-sm ${
                              category === 'Customer Care' ? 'text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRole}>
              {editingRole ? 'Update Role' : 'Create Role'}
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
              Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;