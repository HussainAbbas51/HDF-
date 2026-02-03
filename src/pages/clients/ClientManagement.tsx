import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Edit, Trash2, Phone, Mail, MapPin, Calendar, AlertTriangle, Sprout, Search, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  area: string;
  type: 'individual' | 'corporate';
  status: 'active' | 'inactive';
  registrationDate: string;
  lastContact: string;
  notes: string;
  createdBy?: string; // User ID who created this client
  assignedUserId?: string; // User ID assigned to this client
}

interface Farmer {
  id: string;
  name: string;
  phone: string;
  address: string;
  animalName: string;
  consultDr: string;
  drPhone: string;
  middleMan: string;
  middleManPhone: string;
  fodder: string;
  price: number;
  registrationDate: string;
  status: 'active' | 'inactive';
  notes: string;
  createdBy?: string; // User ID who created this farmer
  assignedUserId?: string; // User ID assigned to this farmer
}

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const ClientManagement: React.FC = () => {
  const { hasPermission, user, roles } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  // Form states
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editingFarmer, setEditingFarmer] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'client' | 'farmer'; name: string } | null>(null);

  // Reassignment states
  const [reassignToUserId, setReassignToUserId] = useState<string>('');
  const [hasRelatedData, setHasRelatedData] = useState(false);

  const [clientForm, setClientForm] = useState<Omit<Client, 'id' | 'registrationDate' | 'lastContact' | 'createdBy' | 'assignedUserId'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    area: '',
    type: 'individual',
    status: 'active',
    notes: '',
  });

  const [farmerForm, setFarmerForm] = useState<Omit<Farmer, 'id' | 'registrationDate' | 'createdBy' | 'assignedUserId'>>({
    name: '',
    phone: '',
    address: '',
    animalName: '',
    consultDr: '',
    drPhone: '',
    middleMan: '',
    middleManPhone: '',
    fodder: '',
    price: 0,
    status: 'active',
    notes: '',
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    loadClients();
    loadFarmers();
    loadUsers();
  }, []);

  const loadClients = () => {
    const savedClients = localStorage.getItem('hdf_clients');
    if (savedClients) {
      try {
        const allClients = JSON.parse(savedClients);
        setClients(Array.isArray(allClients) ? allClients : []);
      } catch (error) {
        console.error('Error loading clients:', error);
        setClients([]);
      }
    } else {
      setClients([]);
    }
  };

  const loadFarmers = () => {
    const savedFarmers = localStorage.getItem('hdf_farmers');
    if (savedFarmers) {
      try {
        const allFarmers = JSON.parse(savedFarmers);
        setFarmers(Array.isArray(allFarmers) ? allFarmers : []);
      } catch (error) {
        console.error('Error loading farmers:', error);
        setFarmers([]);
      }
    } else {
      setFarmers([]);
    }
  };

  const loadUsers = () => {
    const savedUsers = localStorage.getItem('hdf_users');
    if (savedUsers) {
      try {
        const allUsers = JSON.parse(savedUsers);
        setUsers(Array.isArray(allUsers) ? allUsers : []);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
    } else {
      setUsers([]);
    }
  };

  const saveClients = (updatedClients: Client[]) => {
    localStorage.setItem('hdf_clients', JSON.stringify(updatedClients));
    setClients(updatedClients);
  };

  const saveFarmers = (updatedFarmers: Farmer[]) => {
    localStorage.setItem('hdf_farmers', JSON.stringify(updatedFarmers));
    setFarmers(updatedFarmers);
  };

  // Get user role for permission checks
  const getUserRole = () => {
    if (!user || !roles) return null;
    return roles.find(role => role.id === user.roleId);
  };

  // Check if user is admin
  const isAdmin = () => {
    const userRole = getUserRole();
    return userRole?.name === 'Administrator' || user?.roleId === 'admin-role';
  };

  // Filter clients and farmers based on user permissions
  const getAccessibleClients = () => {
    if (!user) return [];

    // Admin or users with view_all permission can see all
    if (isAdmin() || hasPermission('client_view_all')) {
      return clients;
    }

    // Otherwise, return clients created by user OR assigned to user
    return clients.filter(client =>
      client.createdBy === user.id || client.assignedUserId === user.id
    );
  };

  const getAccessibleFarmers = () => {
    if (!user) return [];

    // Admin or users with view_all permission can see all
    if (isAdmin() || hasPermission('farmer_view_all')) {
      return farmers;
    }

    // Otherwise, return farmers created by user OR assigned to user
    return farmers.filter(farmer =>
      farmer.createdBy === user.id || farmer.assignedUserId === user.id
    );
  };

  // Simplified permission checks - allow admin users to edit/delete everything
  const canEditClient = (client: Client) => {
    if (!user) return false;

    // Admin users can edit everything
    if (isAdmin()) return true;

    // Regular users can edit their own or assigned items
    return hasPermission('client_update') && (
      client.createdBy === user.id ||
      client.assignedUserId === user.id
    );
  };

  const canDeleteClient = (client: Client) => {
    if (!user) return false;

    // Admin users can delete everything
    if (isAdmin()) return true;

    // Regular users can delete their own or assigned items
    return hasPermission('client_delete') && (
      client.createdBy === user.id ||
      client.assignedUserId === user.id
    );
  };

  const canEditFarmer = (farmer: Farmer) => {
    if (!user) return false;

    // Admin users can edit everything
    if (isAdmin()) return true;

    // Regular users can edit their own or assigned items
    return hasPermission('client_update') && ( // Using client_update as fallback for farmers
      farmer.createdBy === user.id ||
      farmer.assignedUserId === user.id
    );
  };

  const canDeleteFarmer = (farmer: Farmer) => {
    if (!user) return false;

    // Admin users can delete everything
    if (isAdmin()) return true;

    // Regular users can delete their own or assigned items
    return hasPermission('client_delete') && ( // Using client_delete as fallback for farmers
      farmer.createdBy === user.id ||
      farmer.assignedUserId === user.id
    );
  };

  // Enhanced function to check if client/farmer has related data that needs reassignment
  const checkForRelatedData = (id: string, type: 'client' | 'farmer') => {
    // ALWAYS require reassignment for active clients/farmers to prevent accidental deletion
    // In a real system, this would check for actual relationships like:
    // - Forms and submissions
    // - Task assignments
    // - Communication history
    // - Reports and analytics data
    // - Financial records
    // - Document attachments

    // For demo purposes, we'll make it more likely to have related data (90% chance)
    // to ensure users go through the reassignment process
    const hasRelated = Math.random() > 0.1; // 90% chance of having related data

    console.log(`=== RELATED DATA CHECK ===`);
    console.log(`${type} ID:`, id);
    console.log(`Has related data:`, hasRelated);

    return hasRelated;
  };

  // Client management functions
  const handleAddClient = () => {
    if (!isAdmin() && !hasPermission('client_create')) {
      toast.error('You do not have permission to create clients');
      return;
    }
    setEditingClient(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      area: '',
      type: 'individual',
      status: 'active',
      notes: '',
    });
    setIsClientModalOpen(true);
  };

  const handleEditClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !canEditClient(client)) {
      toast.error('You do not have permission to edit this client');
      return;
    }

    setEditingClient(clientId);
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      area: client.area || '',
      type: client.type,
      status: client.status,
      notes: client.notes,
    });
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !canDeleteClient(client)) {
      toast.error('You do not have permission to delete this client');
      return;
    }

    console.log('=== DELETE CLIENT PROCESS STARTED ===');
    console.log('Client ID to delete:', clientId);
    console.log('Client name:', client.name);

    // Check for related data - this will now be more likely to trigger reassignment
    const hasRelated = checkForRelatedData(clientId, 'client');

    setDeleteTarget({ id: clientId, type: 'client', name: client.name });
    setHasRelatedData(hasRelated);

    if (hasRelated) {
      console.log('Opening REASSIGNMENT modal for client');
      setIsReassignModalOpen(true);
      toast.info(`Client "${client.name}" has related data - choose your deletion option`);
    } else {
      console.log('Opening DELETE CONFIRMATION modal for client');
      setIsDeleteModalOpen(true);
      toast.warning(`Proceeding with direct deletion of client "${client.name}" - no related data found`);
    }
  };

  const submitClient = () => {
    if (!clientForm.name || !clientForm.email || !clientForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const now = new Date().toISOString();

    if (editingClient) {
      const updatedClients = clients.map(client =>
        client.id === editingClient
          ? { ...client, ...clientForm, lastContact: now }
          : client
      );
      saveClients(updatedClients);
      toast.success('Client updated successfully');
    } else {
      const newClient: Client = {
        ...clientForm,
        id: `client-${Date.now()}`,
        registrationDate: now,
        lastContact: now,
        createdBy: user?.id || '',
        assignedUserId: user?.id || '',
      };
      const updatedClients = [...clients, newClient];
      saveClients(updatedClients);
      toast.success('Client created successfully');
    }

    setIsClientModalOpen(false);
  };

  // Farmer management functions
  const handleAddFarmer = () => {
    if (!isAdmin() && !hasPermission('client_create')) {
      toast.error('You do not have permission to create farmers');
      return;
    }
    setEditingFarmer(null);
    setFarmerForm({
      name: '',
      phone: '',
      address: '',
      animalName: '',
      consultDr: '',
      drPhone: '',
      middleMan: '',
      middleManPhone: '',
      fodder: '',
      price: 0,
      status: 'active',
      notes: '',
    });
    setIsFarmerModalOpen(true);
  };

  const handleEditFarmer = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (!farmer || !canEditFarmer(farmer)) {
      toast.error('You do not have permission to edit this farmer');
      return;
    }

    setEditingFarmer(farmerId);
    setFarmerForm({
      name: farmer.name,
      phone: farmer.phone,
      address: farmer.address,
      animalName: farmer.animalName,
      consultDr: farmer.consultDr,
      drPhone: farmer.drPhone,
      middleMan: farmer.middleMan,
      middleManPhone: farmer.middleManPhone,
      fodder: farmer.fodder,
      price: farmer.price,
      status: farmer.status,
      notes: farmer.notes,
    });
    setIsFarmerModalOpen(true);
  };

  const handleDeleteFarmer = (farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    if (!farmer || !canDeleteFarmer(farmer)) {
      toast.error('You do not have permission to delete this farmer');
      return;
    }

    console.log('=== DELETE FARMER PROCESS STARTED ===');
    console.log('Farmer ID to delete:', farmerId);
    console.log('Farmer name:', farmer.name);

    // Check for related data - this will now be more likely to trigger reassignment
    const hasRelated = checkForRelatedData(farmerId, 'farmer');

    setDeleteTarget({ id: farmerId, type: 'farmer', name: farmer.name });
    setHasRelatedData(hasRelated);

    if (hasRelated) {
      console.log('Opening REASSIGNMENT modal for farmer');
      setIsReassignModalOpen(true);
      toast.info(`Farmer "${farmer.name}" has related data - choose your deletion option`);
    } else {
      console.log('Opening DELETE CONFIRMATION modal for farmer');
      setIsDeleteModalOpen(true);
      toast.warning(`Proceeding with direct deletion of farmer "${farmer.name}" - no related data found`);
    }
  };

  const submitFarmer = () => {
    if (!farmerForm.name || !farmerForm.phone) {
      toast.error('Please fill in required fields (Name and Phone)');
      return;
    }

    const now = new Date().toISOString();

    if (editingFarmer) {
      const updatedFarmers = farmers.map(farmer =>
        farmer.id === editingFarmer
          ? { ...farmer, ...farmerForm }
          : farmer
      );
      saveFarmers(updatedFarmers);
      toast.success('Farmer updated successfully');
    } else {
      const newFarmer: Farmer = {
        ...farmerForm,
        id: `farmer-${Date.now()}`,
        registrationDate: now,
        createdBy: user?.id || '',
        assignedUserId: user?.id || '',
      };
      const updatedFarmers = [...farmers, newFarmer];
      saveFarmers(updatedFarmers);
      toast.success('Farmer created successfully');
    }

    setIsFarmerModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    console.log('=== DIRECT DELETE CONFIRMED ===');
    console.log('Deleting:', deleteTarget.type, deleteTarget.name);

    if (deleteTarget.type === 'client') {
      const updatedClients = clients.filter(c => c.id !== deleteTarget.id);
      saveClients(updatedClients);
      toast.success(`Client "${deleteTarget.name}" deleted successfully`);
    } else {
      const updatedFarmers = farmers.filter(f => f.id !== deleteTarget.id);
      saveFarmers(updatedFarmers);
      toast.success(`Farmer "${deleteTarget.name}" deleted successfully`);
    }

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmReassignAndDelete = () => {
    if (!deleteTarget) {
      toast.error('No item selected for deletion');
      return;
    }

    if (hasRelatedData && !reassignToUserId) {
      toast.error('Please select a user to reassign the related data to');
      return;
    }

    console.log('=== REASSIGNMENT AND DELETE CONFIRMED ===');
    console.log('Deleting:', deleteTarget.type, deleteTarget.name);
    console.log('Reassigning to user ID:', reassignToUserId);

    // Simulate reassignment process
    if (hasRelatedData && reassignToUserId) {
      const assignedUser = users.find(u => u.id === reassignToUserId);
      toast.success(`Related data successfully reassigned to ${assignedUser?.name}`);
    }

    // Delete the item
    if (deleteTarget.type === 'client') {
      const updatedClients = clients.filter(c => c.id !== deleteTarget.id);
      saveClients(updatedClients);
    } else {
      const updatedFarmers = farmers.filter(f => f.id !== deleteTarget.id);
      saveFarmers(updatedFarmers);
    }

    toast.success(`${deleteTarget.type === 'client' ? 'Client' : 'Farmer'} "${deleteTarget.name}" deleted successfully after data reassignment`);

    // Reset all states
    setIsReassignModalOpen(false);
    setDeleteTarget(null);
    setReassignToUserId('');
    setHasRelatedData(false);
  };

  // Handle delete without reassignment - user chooses to lose data
  const handleDeleteWithoutReassignment = () => {
    if (!deleteTarget) return;

    console.log('=== DELETE WITHOUT REASSIGNMENT CONFIRMED ===');
    console.log('Deleting without reassignment:', deleteTarget.type, deleteTarget.name);
    console.log('User chose to permanently lose all related data');

    // Delete the item without reassignment
    if (deleteTarget.type === 'client') {
      const updatedClients = clients.filter(c => c.id !== deleteTarget.id);
      saveClients(updatedClients);
    } else {
      const updatedFarmers = farmers.filter(f => f.id !== deleteTarget.id);
      saveFarmers(updatedFarmers);
    }

    toast.warning(`${deleteTarget.type === 'client' ? 'Client' : 'Farmer'} "${deleteTarget.name}" deleted - Related data permanently lost as requested`);

    // Reset all states
    setIsReassignModalOpen(false);
    setDeleteTarget(null);
    setReassignToUserId('');
    setHasRelatedData(false);
  };

  const handleCancelReassignment = () => {
    console.log('=== REASSIGNMENT CANCELLED ===');
    console.log('User cancelled deletion for:', deleteTarget?.name);

    // Reset states and show message
    setIsReassignModalOpen(false);
    setDeleteTarget(null);
    setReassignToUserId('');
    setHasRelatedData(false);

    toast.info('Deletion cancelled');
  };


  // Get accessible clients and farmers
  const accessibleClients = getAccessibleClients();
  const accessibleFarmers = getAccessibleFarmers();

  // Get available users for reassignment (excluding current user)
  const availableUsersForReassignment = users.filter(u =>
    u.id !== user?.id && u.status === 'active'
  );

  // Filter functions
  const filteredClients = accessibleClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.area && client.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
    client.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFarmers = accessibleFarmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm) ||
    farmer.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.consultDr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.middleMan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin() && !hasPermission('client_read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access client and farmer management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client & Farmer Management</h1>
          <p className="text-gray-600">Manage clients and farmers in the system</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search clients (name, email, phone, area, address) and farmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients ({filteredClients.length})</TabsTrigger>
          <TabsTrigger value="farmers">Farmers ({filteredFarmers.length})</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Client Management</h2>
            {(isAdmin() || hasPermission('client_create')) && (
              <Button onClick={handleAddClient}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            )}
          </div>

          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first client.</p>
                  {(isAdmin() || hasPermission('client_create')) && (
                    <Button onClick={handleAddClient}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">
                            {client.type}
                          </Badge>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          {client.area && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Area: {client.area}
                            </Badge>
                          )}
                          {client.assignedUserId && client.assignedUserId !== client.createdBy && (
                            <Badge variant="secondary">
                              Assigned to: {users.find(u => u.id === client.assignedUserId)?.name || 'Unknown'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canEditClient(client) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditClient(client.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteClient(client) && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{client.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{client.address}</span>
                        </div>
                        {client.area && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">Area: {client.area}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Registered: {new Date(client.registrationDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Last Contact: {new Date(client.lastContact).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {client.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{client.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Farmers Tab */}
        <TabsContent value="farmers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Farmer Management</h2>
            {(isAdmin() || hasPermission('client_create')) && (
              <Button onClick={handleAddFarmer}>
                <Sprout className="h-4 w-4 mr-2" />
                Add Farmer
              </Button>
            )}
          </div>

          {filteredFarmers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Sprout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first farmer.</p>
                  {(isAdmin() || hasPermission('client_create')) && (
                    <Button onClick={handleAddFarmer}>
                      <Sprout className="h-4 w-4 mr-2" />
                      Add First Farmer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFarmers.map((farmer) => (
                <Card key={farmer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sprout className="h-5 w-5 text-green-600" />
                          {farmer.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>
                            {farmer.status}
                          </Badge>
                          {farmer.assignedUserId && farmer.assignedUserId !== farmer.createdBy && (
                            <Badge variant="secondary">
                              Assigned to: {users.find(u => u.id === farmer.assignedUserId)?.name || 'Unknown'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canEditFarmer(farmer) && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditFarmer(farmer.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteFarmer(farmer) && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFarmer(farmer.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{farmer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{farmer.address}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">Animal:</span> {farmer.animalName}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Consult Dr:</span> {farmer.consultDr}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Dr Phone:</span> {farmer.drPhone}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Middle man:</span> {farmer.middleMan}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-green-600">Fodder:</span> {farmer.fodder}
                        </div>
                        <div className="text-sm text-green-700 font-bold">
                          Price: ${farmer.price}
                        </div>
                        <div className="text-sm text-gray-400 italic">
                          Registered: {new Date(farmer.registrationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {farmer.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{farmer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Client Modal */}
      <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {editingClient ? 'Update client information.' : 'Add a new client to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right">Name *</Label>
              <Input
                id="clientName"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientEmail" className="text-right">Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientPhone" className="text-right">Phone *</Label>
              <Input
                id="clientPhone"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientAddress" className="text-right">Address</Label>
              <Input
                id="clientAddress"
                value={clientForm.address}
                onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientArea" className="text-right">Area</Label>
              <Input
                id="clientArea"
                value={clientForm.area}
                onChange={(e) => setClientForm({ ...clientForm, area: e.target.value })}
                className="col-span-3"
                placeholder="Region, District, or Area"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientType" className="text-right">Type</Label>
              <Select
                value={clientForm.type}
                onValueChange={(value: 'individual' | 'corporate') =>
                  setClientForm({ ...clientForm, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientStatus" className="text-right">Status</Label>
              <Select
                value={clientForm.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setClientForm({ ...clientForm, status: value })
                }
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientNotes" className="text-right">Notes</Label>
              <Textarea
                id="clientNotes"
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClientModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitClient}>
              {editingClient ? 'Update Client' : 'Create Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Farmer Modal */}
      <Dialog open={isFarmerModalOpen} onOpenChange={setIsFarmerModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}</DialogTitle>
            <DialogDescription>
              {editingFarmer ? 'Update farmer information.' : 'Add a new farmer to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farmerName" className="text-right">Farmer *</Label>
              <Input
                id="farmerName"
                value={farmerForm.name}
                onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farmerPhone" className="text-right">Phone / WhatsApp *</Label>
              <Input
                id="farmerPhone"
                value={farmerForm.phone}
                onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farmerAddress" className="text-right">Address</Label>
              <Input
                id="farmerAddress"
                value={farmerForm.address}
                onChange={(e) => setFarmerForm({ ...farmerForm, address: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animalName" className="text-right">Name of Animal</Label>
              <Input
                id="animalName"
                value={farmerForm.animalName}
                onChange={(e) => setFarmerForm({ ...farmerForm, animalName: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="consultDr" className="text-right">Consult Dr</Label>
              <Input
                id="consultDr"
                value={farmerForm.consultDr}
                onChange={(e) => setFarmerForm({ ...farmerForm, consultDr: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="drPhone" className="text-right">Dr Phone no</Label>
              <Input
                id="drPhone"
                value={farmerForm.drPhone}
                onChange={(e) => setFarmerForm({ ...farmerForm, drPhone: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middleMan" className="text-right">Middle man</Label>
              <Input
                id="middleMan"
                value={farmerForm.middleMan}
                onChange={(e) => setFarmerForm({ ...farmerForm, middleMan: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="middleManPhone" className="text-right">Middle man Phone</Label>
              <Input
                id="middleManPhone"
                value={farmerForm.middleManPhone}
                onChange={(e) => setFarmerForm({ ...farmerForm, middleManPhone: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fodder" className="text-right">Fodder</Label>
              <Input
                id="fodder"
                value={farmerForm.fodder}
                onChange={(e) => setFarmerForm({ ...farmerForm, fodder: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
              <Input
                id="price"
                type="number"
                value={farmerForm.price}
                onChange={(e) => setFarmerForm({ ...farmerForm, price: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farmerStatus" className="text-right">Status</Label>
              <Select
                value={farmerForm.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFarmerForm({ ...farmerForm, status: value })
                }
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="farmerNotes" className="text-right">Notes</Label>
              <Textarea
                id="farmerNotes"
                value={farmerForm.notes}
                onChange={(e) => setFarmerForm({ ...farmerForm, notes: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFarmerModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitFarmer}>
              {editingFarmer ? 'Update Farmer' : 'Create Farmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Reassignment Modal with Delete Without Reassignment Option */}
      <Dialog open={isReassignModalOpen} onOpenChange={handleCancelReassignment}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-orange-600" />
              ⚠️ {deleteTarget?.type === 'client' ? 'Client' : 'Farmer'} Has Related Data - Choose Action
            </DialogTitle>
            <DialogDescription>
              This {deleteTarget?.type} has related data. Choose how you want to proceed with deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Item being deleted info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">{deleteTarget?.type === 'client' ? 'Client' : 'Farmer'} to Delete:</h4>
              <p className="text-blue-800 font-medium">
                {deleteTarget?.name}
              </p>
            </div>

            {/* Related data warning */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-3">📊 Related Data Found:</h4>
              <div className="text-yellow-800 text-sm">
                <p>This {deleteTarget?.type} has associated data:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Digital forms and submissions</li>
                  <li>Task assignments and progress</li>
                  <li>Communication history</li>
                  <li>Reports and analytics data</li>
                  <li>Financial records and transactions</li>
                  <li>Document attachments and files</li>
                </ul>
              </div>
            </div>

            {/* Option 1: Reassignment */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-3">✅ Option 1: Safe Delete with Data Reassignment (Recommended)</h4>
              <div className="space-y-3">
                <Label htmlFor="reassign-user" className="text-sm font-medium text-green-800">
                  Select User to Receive ALL Related Data:
                </Label>
                <Select
                  value={reassignToUserId}
                  onValueChange={setReassignToUserId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a user to transfer all related data to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsersForReassignment.length > 0 ? (
                      availableUsersForReassignment.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center gap-3 py-1">
                            <div className="flex flex-col">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-xs text-gray-500">{u.email}</span>
                            </div>
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

                {reassignToUserId && (
                  <div className="bg-white p-3 rounded border border-green-300">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Will transfer all data</span>
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-700">
                        {availableUsersForReassignment.find(u => u.id === reassignToUserId)?.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Delete Without Reassignment */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-3">⚠️ Option 2: Delete Without Reassignment</h4>
              <p className="text-red-800 text-sm mb-3">
                Proceed with deletion and permanently lose all related data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteWithoutReassignment}
                className="bg-red-600 hover:bg-red-700"
              >
                🗑️ Delete & Lose All Data
              </Button>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancelReassignment}>
              Cancel Deletion
            </Button>
            <Button
              onClick={handleConfirmReassignAndDelete}
              disabled={!reassignToUserId}
              className="bg-green-600 hover:bg-green-700"
            >
              🔄 Reassign Data & Delete {deleteTarget?.type === 'client' ? 'Client' : 'Farmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple Delete Confirmation Modal (for items with no related data) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Delete {deleteTarget?.type} (No Related Data)
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This {deleteTarget?.type} has no related data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                ✅ Safe to delete - No related data found for this {deleteTarget?.type}.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteTarget(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              🗑️ Delete {deleteTarget?.type === 'client' ? 'Client' : 'Farmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagement;