import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  MapPin, 
  CheckSquare, 
  MessageSquare, 
  Plus,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertCircle,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  totalFarmers: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
}

interface Activity {
  id: string;
  type: 'task' | 'complaint' | 'client' | 'farmer' | 'user';
  action: string;
  user: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    totalFarmers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    totalComplaints: 0,
    openComplaints: 0,
    resolvedComplaints: 0
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-time chart data based on actual localStorage data
  const [chartData, setChartData] = useState({
    tasks: 0,
    clients: 0,
    farmers: 0,
    complaints: 0
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const loadDashboardData = () => {
    try {
      // Load data from localStorage
      const tasks = JSON.parse(localStorage.getItem('hdf_tasks') || '[]');
      const complaints = JSON.parse(localStorage.getItem('hdf_complaints') || '[]');
      const clients = JSON.parse(localStorage.getItem('hdf_clients') || '[]');
      const farmers = JSON.parse(localStorage.getItem('hdf_farmers') || '[]');
      const users = JSON.parse(localStorage.getItem('hdf_users') || '[]');

      // Calculate stats
      const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
      const pendingTasks = tasks.filter((task: any) => task.status === 'pending').length;
      const inProgressTasks = tasks.filter((task: any) => task.status === 'in_progress' || task.status === 'in-progress').length;
      const openComplaints = complaints.filter((complaint: any) => complaint.status === 'open').length;
      const resolvedComplaints = complaints.filter((complaint: any) => complaint.status === 'resolved').length;
      const activeUsers = users.filter((user: any) => user.status === 'active').length;

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalClients: clients.length,
        totalFarmers: farmers.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalComplaints: complaints.length,
        openComplaints,
        resolvedComplaints
      });

      // Update real-time chart data
      setChartData({
        tasks: tasks.length,
        clients: clients.length,
        farmers: farmers.length,
        complaints: complaints.length
      });

      // Generate recent activities
      generateRecentActivities(tasks, complaints, clients, farmers, users);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const generateRecentActivities = (tasks: any[], complaints: any[], clients: any[], farmers: any[], users: any[]) => {
    const allActivities: Activity[] = [];

    // Add task activities
    (tasks || []).slice(-5).forEach((task: any) => {
      allActivities.push({
        id: `task-${task.id.toString()}`,
        type: 'task',
        action: `Task "${task.title}" was ${task.status}`,
        user: task.assignedTo || 'System',
        timestamp: new Date(task.createdAt || Date.now()),
        icon: <CheckSquare className="h-4 w-4" />,
        color: 'text-blue-600'
      });
    });

    // Add complaint activities
    complaints.slice(-3).forEach((complaint: any) => {
      allActivities.push({
        id: `complaint-${complaint.id}`,
        type: 'complaint',
        action: `Complaint "${complaint.subject}" was ${complaint.status}`,
        user: complaint.assignedTo || 'Support Team',
        timestamp: new Date(complaint.createdAt || Date.now()),
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'text-red-600'
      });
    });

    // Add client activities
    (clients || []).slice(-3).forEach((client: any) => {
      allActivities.push({
        id: `client-${client.id}`,
        type: 'client',
        action: `Client "${client.name}" was added`,
        user: user?.name || 'Admin',
        timestamp: new Date(client.createdAt || Date.now()),
        icon: <Building2 className="h-4 w-4" />,
        color: 'text-green-600'
      });
    });

    // Add farmer activities
    farmers.slice(-3).forEach((farmer: any) => {
      allActivities.push({
        id: `farmer-${farmer.id}`,
        type: 'farmer',
        action: `Farmer "${farmer.name}" was registered`,
        user: user?.name || 'Admin',
        timestamp: new Date(farmer.createdAt || Date.now()),
        icon: <MapPin className="h-4 w-4" />,
        color: 'text-purple-600'
      });
    });

    // Sort by timestamp and take latest 10
    allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivities(allActivities.slice(0, 10));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Task Distribution Pie Chart Component
  const TaskDistributionPieChart = () => {
    const taskData = [
      { status: 'Completed', count: stats.completedTasks, color: '#10B981' },
      { status: 'In Progress', count: stats.inProgressTasks, color: '#3B82F6' },
      { status: 'Pending', count: stats.pendingTasks, color: '#F59E0B' }
    ].filter(item => item.count > 0); // Only show segments with data

    const total = taskData.reduce((sum, item) => sum + item.count, 0);
    
    if (total === 0) {
      return (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks available</p>
              <p className="text-sm text-gray-400">Create tasks to see distribution</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Calculate angles for each segment
    let cumulativePercentage = 0;
    const segments = taskData.map((item) => {
      const percentage = (item.count / total) * 100;
      const startAngle = cumulativePercentage * 3.6;
      const endAngle = (cumulativePercentage + percentage) * 3.6;
      cumulativePercentage += percentage;
      
      return {
        ...item,
        percentage,
        startAngle,
        endAngle
      };
    });

    const createPieSlice = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(centerX, centerY, radius, endAngle);
      const end = polarToCartesian(centerX, centerY, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", centerX, centerY,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
      ].join(" ");
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };
    
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Task Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-40 h-40" viewBox="0 0 160 160">
                {segments.map((segment, index) => (
                  <g key={index}>
                    <path
                      d={createPieSlice(80, 80, 70, segment.startAngle, segment.endAngle)}
                      fill={segment.color}
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    />
                    <title>{`${segment.status}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}</title>
                  </g>
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{total}</div>
                  <div className="text-sm text-gray-500">Total Tasks</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {taskData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: item.color }}>
                      {item.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((item.count / total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Real-time Interactive Chart Component
  const RealTimeChart = () => {
    const maxValue = Math.max(chartData.tasks, chartData.clients, chartData.farmers, chartData.complaints, 1);
    
    const chartItems = [
      { label: 'Tasks', value: chartData.tasks, color: '#3B82F6', icon: CheckSquare },
      { label: 'Clients', value: chartData.clients, color: '#10B981', icon: Building2 },
      { label: 'Farmers', value: chartData.farmers, color: '#8B5CF6', icon: MapPin },
      { label: 'Complaints', value: chartData.complaints, color: '#EF4444', icon: MessageSquare }
    ];

    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Real-Time Data Overview
          </CardTitle>
          <p className="text-sm text-gray-500">Live counts updated automatically</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="flex items-end justify-between h-48 gap-4">
              {chartItems.map((item, index) => {
                const Icon = item.icon;
                const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                
                return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center gap-1 flex-1 justify-end">
                      <div className="text-sm font-bold text-gray-700 mb-1">
                      {item.value}
                      </div>
                      <div 
                      className="w-full rounded-t-lg min-h-[20px] transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                      style={{ 
                        height: `${Math.max(heightPercentage, 10)}%`,
                        backgroundColor: item.color
                      }}
                      title={`${item.label}: ${item.value}`}
                      >
                      {/* Hover tooltip */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {item.label}: {item.value}
                      </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                      <div className="text-xs font-medium text-center">
                      {item.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend with live indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full animate-pulse" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-lg font-bold" style={{ color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Real-time indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Data - Updates automatically when you add/delete items</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your business today.
            </p>
          </div>
          <Button onClick={() => setRefreshTrigger(prev => prev + 1)}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-blue-100">
                    {stats.activeUsers} active
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Clients</p>
                  <p className="text-3xl font-bold">{stats.totalClients}</p>
                  <p className="text-sm text-green-100">
                    Active partnerships
                  </p>
                </div>
                <Building2 className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Farmers</p>
                  <p className="text-3xl font-bold">{stats.totalFarmers}</p>
                  <p className="text-sm text-purple-100">
                    Registered farmers
                  </p>
                </div>
                <MapPin className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Tasks</p>
                  <p className="text-3xl font-bold">{stats.totalTasks}</p>
                  <p className="text-sm text-orange-100">
                    {stats.completedTasks} completed
                  </p>
                </div>
                <CheckSquare className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Distribution Pie Chart */}
          <TaskDistributionPieChart />
          
          {/* Recent Activities */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`${activity.color} mt-1`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.action}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            by {activity.user}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Chart - Full Width */}
        <RealTimeChart />

        {/* Task and Complaint Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Task Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Tasks</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-lg font-semibold text-green-600">{stats.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-lg font-semibold text-blue-600">{stats.inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-lg font-semibold text-orange-600">{stats.pendingTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: stats.totalTasks > 0 ? `${(stats.completedTasks / stats.totalTasks) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Complaint Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Complaints</span>
                  <span className="text-2xl font-bold text-red-600">{stats.totalComplaints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open</span>
                  <span className="text-lg font-semibold text-red-600">{stats.openComplaints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resolved</span>
                  <span className="text-lg font-semibold text-green-600">{stats.resolvedComplaints}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: stats.totalComplaints > 0 ? `${(stats.resolvedComplaints / stats.totalComplaints) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}% resolution rate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;