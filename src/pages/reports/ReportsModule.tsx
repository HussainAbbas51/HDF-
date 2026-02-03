import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity,
  MapPin,
  Wheat,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'individual' | 'corporate';
  status: 'active' | 'inactive';
  registrationDate: string;
  lastContact: string;
  notes: string;
  createdBy?: string;
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
  createdBy?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

interface FieldVisit {
  id: string;
  visitType: 'client' | 'farmer';
  assignedUserId: string;
  assignedUserName: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  completedAt?: string;
}

const ReportsModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // User Report State
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [reportMonth, setReportMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Load data from localStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load clients
    const savedClients = localStorage.getItem('hdf_clients');
    if (savedClients) {
      try {
        const parsed = JSON.parse(savedClients);
        setClients(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading clients:', error);
        setClients([]);
      }
    } else {
      setClients([]);
    }

    // Load farmers
    const savedFarmers = localStorage.getItem('hdf_farmers');
    if (savedFarmers) {
      try {
        const parsed = JSON.parse(savedFarmers);
        setFarmers(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading farmers:', error);
        setFarmers([]);
      }
    } else {
      setFarmers([]);
    }

    // Load users
    const savedUsers = localStorage.getItem('hdf_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        setUsers(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
    } else {
      setUsers([]);
    }

    // Load visits
    const savedVisits = localStorage.getItem('hdf_field_visits');
    if (savedVisits) {
      try {
        const parsed = JSON.parse(savedVisits);
        setVisits(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Error loading visits:', error);
        setVisits([]);
      }
    } else {
      setVisits([]);
    }
  };

  const getAvailableMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const value = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value, label });
    }
    return months;
  };

  const getUserStats = () => {
    // Current date range for the selected month
    if (!reportMonth) return [];
    const parts = reportMonth.split('-');
    if (parts.length < 2) return [];

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const safeUsers = Array.isArray(users) ? users : [];
    const safeVisits = Array.isArray(visits) ? visits : [];
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeFarmers = Array.isArray(farmers) ? farmers : [];

    // Filter which users we are looking at (either all or a specific one)
    const targetUsers = selectedUser === 'all' ? safeUsers : safeUsers.filter(u => u.id === selectedUser);

    return targetUsers.map(user => {
      // Metrics for the selected month
      const userVisits = safeVisits.filter(v => {
        if (!v.scheduledDate) return false;
        const vDate = new Date(v.scheduledDate);
        return v.assignedUserId === user.id && vDate >= startDate && vDate <= endDate;
      });

      const totalVisits = userVisits.length;
      const completedVisits = userVisits.filter(v => v.status === 'completed').length;
      const cancelledVisits = userVisits.filter(v => v.status === 'cancelled').length;

      const clientsAdded = safeClients.filter(c => {
        if (!c.registrationDate) return false;
        const cDate = new Date(c.registrationDate);
        return c.createdBy === user.id && cDate >= startDate && cDate <= endDate;
      }).length;

      const farmersAdded = safeFarmers.filter(f => {
        if (!f.registrationDate) return false;
        const fDate = new Date(f.registrationDate);
        return f.createdBy === user.id && fDate >= startDate && fDate <= endDate;
      }).length;

      return {
        user,
        totalVisits,
        completedVisits,
        cancelledVisits,
        completionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
        clientsAdded,
        farmersAdded,
        totalAcquisitions: clientsAdded + farmersAdded
      };
    }).sort((a, b) => b.totalAcquisitions - a.totalAcquisitions || b.totalVisits - a.totalVisits);
  };

  const userStats = getUserStats();

  // Calculate statistics
  const getClientStats = () => {
    const safeClients = Array.isArray(clients) ? clients : [];
    const totalClients = safeClients.length;
    const activeClients = safeClients.filter(c => c && c.status === 'active').length;
    const inactiveClients = safeClients.filter(c => c && c.status === 'inactive').length;
    const individualClients = safeClients.filter(c => c && c.type === 'individual').length;
    const corporateClients = safeClients.filter(c => c && c.type === 'corporate').length;

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClients = safeClients.filter(c =>
      c && c.registrationDate && new Date(c.registrationDate) >= thirtyDaysAgo
    ).length;

    return {
      total: totalClients,
      active: activeClients,
      inactive: inactiveClients,
      individual: individualClients,
      corporate: corporateClients,
      recent: recentClients,
    };
  };

  const getFarmerStats = () => {
    const safeFarmers = Array.isArray(farmers) ? farmers : [];
    const totalFarmers = safeFarmers.length;
    const activeFarmers = safeFarmers.filter(f => f && f.status === 'active').length;
    const inactiveFarmers = safeFarmers.filter(f => f && f.status === 'inactive').length;
    const totalValue = safeFarmers.reduce((sum, f) => sum + (f ? f.price || 0 : 0), 0);
    const avgPrice = totalFarmers > 0 ? totalValue / totalFarmers : 0;

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentFarmers = safeFarmers.filter(f =>
      f && f.registrationDate && new Date(f.registrationDate) >= thirtyDaysAgo
    ).length;

    return {
      total: totalFarmers,
      active: activeFarmers,
      inactive: inactiveFarmers,
      totalValue: totalValue,
      avgPrice: avgPrice,
      recent: recentFarmers,
    };
  };


  const getRegistrationTrend = () => {
    const months = [];
    const clientData = [];
    const farmerData = [];

    const safeClients = Array.isArray(clients) ? clients : [];
    const safeFarmers = Array.isArray(farmers) ? farmers : [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(monthName);

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const clientCount = safeClients.filter(c => {
        if (!c || !c.registrationDate) return false;
        const regDate = new Date(c.registrationDate);
        return regDate >= monthStart && regDate <= monthEnd;
      }).length;

      const farmerCount = safeFarmers.filter(f => {
        if (!f || !f.registrationDate) return false;
        const regDate = new Date(f.registrationDate);
        return regDate >= monthStart && regDate <= monthEnd;
      }).length;

      clientData.push(clientCount);
      farmerData.push(farmerCount);
    }

    return { months, clientData, farmerData };
  };

  const exportReport = (type: string) => {
    const clientStats = getClientStats();
    const farmerStats = getFarmerStats();
    const curUserStats = getUserStats();

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `Last ${selectedPeriod} days`,
      clientStats,
      farmerStats,
      userStats: curUserStats,
      clients: clients.length > 0 ? clients : [],
      farmers: farmers.length > 0 ? farmers : [],
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hdf-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!hasPermission('reports_view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access reports.</p>
      </div>
    );
  }

  const clientStats = getClientStats();
  const farmerStats = getFarmerStats();
  const registrationTrend = getRegistrationTrend();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">View system statistics and generate reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportReport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{clientStats.recent} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmerStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{farmerStats.recent} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${farmerStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              cumulative amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${farmerStats.avgPrice.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Reports</TabsTrigger>
          <TabsTrigger value="farmers">Farmer Reports</TabsTrigger>
          <TabsTrigger value="users">User Report</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Client Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Clients</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-green-200 h-2 rounded">
                        <div
                          className="bg-green-500 h-2 rounded"
                          style={{ width: `${clientStats.total > 0 ? (clientStats.active / clientStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{clientStats.active}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inactive Clients</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-red-200 h-2 rounded">
                        <div
                          className="bg-red-500 h-2 rounded"
                          style={{ width: `${clientStats.total > 0 ? (clientStats.inactive / clientStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{clientStats.inactive}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Individual</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-blue-200 h-2 rounded">
                        <div
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${clientStats.total > 0 ? (clientStats.individual / clientStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{clientStats.individual}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Corporate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-purple-200 h-2 rounded">
                        <div
                          className="bg-purple-500 h-2 rounded"
                          style={{ width: `${clientStats.total > 0 ? (clientStats.corporate / clientStats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{clientStats.corporate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Crop Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    Animal data distribution coming soon
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active</span>
                    <Badge variant="default">{clientStats.active}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive</span>
                    <Badge variant="secondary">{clientStats.inactive}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Individual</span>
                    <Badge variant="outline">{clientStats.individual}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Corporate</span>
                    <Badge variant="outline">{clientStats.corporate}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>New Clients (30d)</span>
                    <Badge variant="default">{clientStats.recent}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Clients</span>
                    <Badge variant="outline">{clientStats.total}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Farmer Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active</span>
                    <Badge variant="default">{farmerStats.active}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive</span>
                    <Badge variant="secondary">{farmerStats.inactive}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Farmer Financials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Value</span>
                    <Badge variant="outline">${farmerStats.totalValue.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Price</span>
                    <Badge variant="outline">${farmerStats.avgPrice.toFixed(0)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Farmers</span>
                    <Badge variant="default">{farmerStats.total}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>New Farmers (30d)</span>
                    <Badge variant="outline">{farmerStats.recent}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-64">
              <label className="text-sm font-medium mb-1 block">Select Month</label>
              <Select value={reportMonth} onValueChange={setReportMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-64">
              <label className="text-sm font-medium mb-1 block">Select User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {userStats.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No user activity data found for the selected period.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {/* Summary Cards (If Single User Selected) */}
              {selectedUser !== 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-800">Field Visits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-900">{userStats[0]?.totalVisits || 0}</div>
                      <p className="text-xs text-blue-700">
                        {userStats[0]?.completedVisits || 0} completed ({userStats[0]?.completionRate || 0}%)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-800">New Acquisitions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-900">{userStats[0]?.totalAcquisitions || 0}</div>
                      <p className="text-xs text-green-700">
                        {userStats[0]?.clientsAdded || 0} Clients, {userStats[0]?.farmersAdded || 0} Farmers
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-800">Task Efficacy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-900">
                        {userStats[0]?.cancelledVisits > 0 ? (
                          <span className="text-red-600 flex items-center gap-1">
                            {userStats[0]?.cancelledVisits} <span className="text-xs font-normal">Cancelled</span>
                          </span>
                        ) : (
                          <span className="text-green-600">100%</span>
                        )}
                      </div>
                      <p className="text-xs text-purple-700">
                        Reliability Score
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Table */}
              <Card>
                <CardHeader>
                  <CardTitle>User Performance Report</CardTitle>
                  <CardDescription>
                    Activity summary for {reportMonth && !isNaN(new Date(reportMonth).getTime())
                      ? new Date(reportMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : 'Selected Period'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Total Visits</TableHead>
                        <TableHead className="text-center">Completed</TableHead>
                        <TableHead className="text-center">Completion Rate</TableHead>
                        <TableHead className="text-center">Clients Added</TableHead>
                        <TableHead className="text-center">Farmers Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((stat) => (
                        <TableRow key={stat.user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                {stat.user.name.charAt(0)}
                              </div>
                              {stat.user.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 capitalize">
                            {stat.user.roleId?.replace(/_/g, ' ') || 'User'}
                          </TableCell>
                          <TableCell className="text-center font-medium">{stat.totalVisits}</TableCell>
                          <TableCell className="text-center text-green-600">{stat.completedVisits}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={stat.completionRate >= 80 ? 'default' : stat.completionRate >= 50 ? 'secondary' : 'outline'}>
                              {stat.completionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{stat.clientsAdded}</TableCell>
                          <TableCell className="text-center">{stat.farmersAdded}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Registration Trends (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrationTrend.months.length > 0 ? (
                <div className="space-y-4">
                  {registrationTrend.months.map((month, index) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-medium w-20">{month}</span>
                      <div className="flex-1 mx-4">
                        <div className="flex gap-1">
                          <div className="flex-1 bg-blue-100 rounded">
                            <div
                              className="bg-blue-500 h-6 rounded flex items-center justify-center text-white text-xs"
                              style={{ width: `${Math.max(registrationTrend.clientData[index] * 10, 20)}px` }}
                            >
                              {registrationTrend.clientData[index] > 0 && registrationTrend.clientData[index]}
                            </div>
                          </div>
                          <div className="flex-1 bg-green-100 rounded">
                            <div
                              className="bg-green-500 h-6 rounded flex items-center justify-center text-white text-xs"
                              style={{ width: `${Math.max(registrationTrend.farmerData[index] * 10, 20)}px` }}
                            >
                              {registrationTrend.farmerData[index] > 0 && registrationTrend.farmerData[index]}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-blue-600">C: {registrationTrend.clientData[index]}</div>
                        <div className="text-green-600">F: {registrationTrend.farmerData[index]}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Clients</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Farmers</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No registration data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsModule;