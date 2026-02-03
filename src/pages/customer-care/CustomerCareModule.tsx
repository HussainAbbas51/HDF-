import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckSquare,
  Clock,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Search,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  category?: string;
  estimatedHours?: string;
  notes?: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  customer: string;
  reportedBy: string;
  assignedTo: string;
  createdAt: string;
  resolvedAt?: string;
}

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  content?: string;
}

const CustomerCareModule: React.FC = () => {
  const { hasPermission, user, users } = useAuth();
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingType, setViewingType] = useState<'task' | 'complaint' | 'report'>('task');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  
  // Form data
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignedTo: '',
    dueDate: '',
    category: '',
    estimatedHours: '',
    notes: ''
  });
  
  const [complaintData, setComplaintData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    customer: '',
    reportedBy: '',
    assignedTo: ''
  });

  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    type: 'weekly' as const,
    assignedTo: '',
    dueDate: '',
    content: ''
  });

  // Check permissions
  const canAccessCustomerCare = hasPermission('customer_care_access');
  const canViewAllTasks = hasPermission('task_view_all');
  const canViewTasks = hasPermission('task_view');
  const canCreateTasks = hasPermission('task_create');
  const canUpdateTasks = hasPermission('task_update');
  const canDeleteTasks = hasPermission('task_delete');
  
  const canViewAllComplaints = hasPermission('complaint_view_all');
  const canViewComplaints = hasPermission('complaint_view');
  const canCreateComplaints = hasPermission('complaint_create');
  const canUpdateComplaints = hasPermission('complaint_update');
  const canDeleteComplaints = hasPermission('complaint_delete');
  const canResolveComplaints = hasPermission('complaint_resolve');

  // Load data
  useEffect(() => {
    if (canAccessCustomerCare) {
      loadTasks();
      loadComplaints();
      loadReports();
    }
  }, [canAccessCustomerCare]);

  const loadTasks = () => {
    try {
      const savedTasks = localStorage.getItem('hdf_tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
      } else {
        const sampleTasks: Task[] = [
          {
            id: 'task-1',
            title: 's',
            description: 'Contact client regarding their recent inquiry about product features and provide detailed information about our services',
            status: 'pending',
            priority: 'medium',
            assignedTo: users.length > 0 ? users[0].id : 'Regular User',
            createdBy: user?.name || 'System',
            createdAt: new Date().toISOString(),
            dueDate: '',
            category: 'Customer Support',
            estimatedHours: '2',
            notes: 'High priority client - needs immediate attention'
          }
        ];
        localStorage.setItem('hdf_tasks', JSON.stringify(sampleTasks));
        setTasks(sampleTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  const loadComplaints = () => {
    try {
      const savedComplaints = localStorage.getItem('hdf_complaints');
      if (savedComplaints) {
        const parsedComplaints = JSON.parse(savedComplaints);
        setComplaints(Array.isArray(parsedComplaints) ? parsedComplaints : []);
      } else {
        const sampleComplaints: Complaint[] = [
          {
            id: 'complaint-1',
            title: 'as',
            description: 'Customer complaining about delayed delivery of their order and requesting immediate resolution',
            status: 'open',
            priority: 'medium',
            customer: 'John Doe',
            reportedBy: 'Customer Service',
            assignedTo: users.length > 0 ? users[0].id : 'Regular User',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('hdf_complaints', JSON.stringify(sampleComplaints));
        setComplaints(sampleComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
    }
  };

  const loadReports = () => {
    try {
      const savedReports = localStorage.getItem('hdf_reports');
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);
        setReports(Array.isArray(parsedReports) ? parsedReports : []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  // Helper functions
  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? foundUser.name : userId;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'No due date';
      return date.toLocaleDateString();
    } catch {
      return 'No due date';
    }
  };

  // View handlers
  const handleViewItem = (item: any, type: 'task' | 'complaint' | 'report') => {
    setViewingItem(item);
    setViewingType(type);
    setIsViewModalOpen(true);
  };

  // Task handlers
  const handleCreateTask = () => {
    if (!canCreateTasks) {
      toast.error('You do not have permission to create tasks');
      return;
    }
    setEditingTask(null);
    setTaskData({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      category: '',
      estimatedHours: '',
      notes: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    if (!canUpdateTasks) {
      toast.error('You do not have permission to update tasks');
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setTaskData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        category: task.category || '',
        estimatedHours: task.estimatedHours || '',
        notes: task.notes || ''
      });
      setIsTaskModalOpen(true);
    }
  };

  const handleSubmitTask = () => {
    if (!taskData.title || !taskData.description || !taskData.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();
    let dueDateISO = '';
    if (taskData.dueDate) {
      try {
        const dueDate = new Date(taskData.dueDate);
        if (!isNaN(dueDate.getTime())) {
          dueDateISO = dueDate.toISOString();
        }
      } catch (error) {
        console.error('Invalid due date:', error);
      }
    }
    
    if (editingTask) {
      const updatedTasks = tasks.map(task =>
        task.id === editingTask
          ? {
              ...task,
              ...taskData,
              dueDate: dueDateISO
            }
          : task
      );
      localStorage.setItem('hdf_tasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      toast.success('Task updated successfully');
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
        status: 'pending',
        createdBy: user?.name || 'Unknown',
        createdAt: now,
        dueDate: dueDateISO
      };
      const updatedTasks = [...tasks, newTask];
      localStorage.setItem('hdf_tasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      toast.success('Task created and assigned successfully');
    }
    setIsTaskModalOpen(false);
  };

  // Complaint handlers
  const handleCreateComplaint = () => {
    if (!canCreateComplaints) {
      toast.error('You do not have permission to create complaints');
      return;
    }
    setEditingComplaint(null);
    setComplaintData({
      title: '',
      description: '',
      priority: 'medium',
      customer: '',
      reportedBy: '',
      assignedTo: ''
    });
    setIsComplaintModalOpen(true);
  };

  const handleSubmitComplaint = () => {
    if (!complaintData.title || !complaintData.description || !complaintData.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();
    
    if (editingComplaint) {
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === editingComplaint
          ? { ...complaint, ...complaintData }
          : complaint
      );
      localStorage.setItem('hdf_complaints', JSON.stringify(updatedComplaints));
      setComplaints(updatedComplaints);
      toast.success('Complaint updated successfully');
    } else {
      const newComplaint: Complaint = {
        id: `complaint-${Date.now()}`,
        ...complaintData,
        status: 'open',
        createdAt: now
      };
      const updatedComplaints = [...complaints, newComplaint];
      localStorage.setItem('hdf_complaints', JSON.stringify(updatedComplaints));
      setComplaints(updatedComplaints);
      toast.success('Complaint created successfully');
    }
    setIsComplaintModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!canDeleteTasks) {
      toast.error('You do not have permission to delete tasks');
      return;
    }
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('hdf_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
    toast.success('Task deleted successfully');
  };

  const handleDeleteComplaint = (complaintId: string) => {
    if (!canDeleteComplaints) {
      toast.error('You do not have permission to delete complaints');
      return;
    }
    const updatedComplaints = complaints.filter(c => c.id !== complaintId);
    localStorage.setItem('hdf_complaints', JSON.stringify(updatedComplaints));
    setComplaints(updatedComplaints);
    toast.success('Complaint deleted successfully');
  };

  // Status change handler - works for all users
  const handleStatusChange = (id: string, newStatus: string, type: 'task' | 'complaint') => {
    const now = new Date().toISOString();
    
    if (type === 'task') {
      const updatedTasks = tasks.map(task =>
        task.id === id
          ? { ...task, status: newStatus as Task['status'] }
          : task
      );
      localStorage.setItem('hdf_tasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      toast.success('Task status updated');
    } else {
      const updatedComplaints = complaints.map(complaint =>
        complaint.id === id
          ? { 
              ...complaint, 
              status: newStatus as Complaint['status'],
              ...(newStatus === 'resolved' ? { resolvedAt: now } : {})
            }
          : complaint
      );
      localStorage.setItem('hdf_complaints', JSON.stringify(updatedComplaints));
      setComplaints(updatedComplaints);
      toast.success('Complaint status updated');
    }
  };

  // Filter data based on permissions and search
  const getVisibleTasks = () => {
    let visibleTasks = tasks;
    
    // Apply permission-based filtering
    if (canViewAllTasks) {
      // User can see all tasks
      visibleTasks = tasks;
    } else if (canViewTasks) {
      // User can only see tasks assigned to them
      visibleTasks = tasks.filter(task => task.assignedTo === user?.id);
    } else {
      // User has no task viewing permissions
      visibleTasks = [];
    }
    
    // Apply search filter
    return visibleTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getVisibleComplaints = () => {
    let visibleComplaints = complaints;
    
    // Apply permission-based filtering
    if (canViewAllComplaints) {
      // User can see all complaints
      visibleComplaints = complaints;
    } else if (canViewComplaints) {
      // User can only see complaints assigned to them
      visibleComplaints = complaints.filter(complaint => complaint.assignedTo === user?.id);
    } else {
      // User has no complaint viewing permissions
      visibleComplaints = [];
    }
    
    // Apply search filter
    return visibleComplaints.filter(complaint =>
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTasks = getVisibleTasks();
  const filteredComplaints = getVisibleComplaints();

  // Statistics based on filtered data
  const taskStats = {
    total: filteredTasks.length,
    pending: filteredTasks.filter(t => t.status === 'pending').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    myTasks: filteredTasks.filter(t => t.assignedTo === user?.id).length
  };

  const complaintStats = {
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'in_progress').length,
    resolved: filteredComplaints.filter(c => c.status === 'resolved').length,
    myComplaints: filteredComplaints.filter(c => c.assignedTo === user?.id).length
  };

  const reportStats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    approved: reports.filter(r => r.status === 'approved').length,
    myReports: reports.filter(r => r.assignedTo === user?.id).length
  };

  if (!canAccessCustomerCare) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access Customer Care.</p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-gray-800 text-white',
      high: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Care Management</h1>
            <p className="text-gray-600 mt-1">Manage tasks, complaints, and reports efficiently</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            {(canViewTasks || canViewAllTasks) && (
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </TabsTrigger>
            )}
            {(canViewComplaints || canViewAllComplaints) && (
              <TabsTrigger value="complaints" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Complaints
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          {(canViewTasks || canViewAllTasks) && (
            <TabsContent value="tasks" className="space-y-6">
              {/* Task Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold">{taskStats.total}</p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold">{taskStats.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold">{taskStats.completed}</p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">My Tasks</p>
                        <p className="text-2xl font-bold">{taskStats.myTasks}</p>
                      </div>
                      <User className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Create */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {canCreateTasks && (
                  <Button onClick={handleCreateTask} className="bg-gray-800 hover:bg-gray-900">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>

              {/* Permission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {canViewAllTasks 
                    ? "You can view all tasks in the system." 
                    : "You can only view tasks assigned to you."
                  }
                </p>
              </div>

              {/* Tasks Table */}
              <Card className="bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-600">Task Title</th>
                          <th className="text-left p-4 font-medium text-gray-600">Priority</th>
                          <th className="text-left p-4 font-medium text-gray-600">Status</th>
                          <th className="text-left p-4 font-medium text-gray-600">Assigned To</th>
                          <th className="text-left p-4 font-medium text-gray-600">Due Date</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr key={task.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{task.title}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              {getPriorityBadge(task.priority)}
                            </td>
                            <td className="p-4">
                              <Select
                                value={task.status}
                                onValueChange={(value) => handleStatusChange(task.id, value, 'task')}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-4 text-gray-600">{getUserName(task.assignedTo)}</td>
                            <td className="p-4 text-gray-600">{formatDate(task.dueDate)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewItem(task, 'task')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canUpdateTasks && (
                                  <Button variant="ghost" size="sm" onClick={() => handleEditTask(task.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDeleteTasks && (
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {canViewAllTasks 
                          ? "No tasks found" 
                          : "No tasks assigned to you"
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Complaints Tab */}
          {(canViewComplaints || canViewAllComplaints) && (
            <TabsContent value="complaints" className="space-y-6">
              {/* Complaint Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Complaints</p>
                        <p className="text-2xl font-bold">{complaintStats.total}</p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Open</p>
                        <p className="text-2xl font-bold">{complaintStats.open}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold">{complaintStats.inProgress}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Resolved</p>
                        <p className="text-2xl font-bold">{complaintStats.resolved}</p>
                      </div>
                      <CheckSquare className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">My Complaints</p>
                        <p className="text-2xl font-bold">{complaintStats.myComplaints}</p>
                      </div>
                      <User className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Create */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                {canCreateComplaints && (
                  <Button onClick={handleCreateComplaint} className="bg-gray-800 hover:bg-gray-900">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Complaint
                  </Button>
                )}
              </div>

              {/* Permission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {canViewAllComplaints 
                    ? "You can view all complaints in the system." 
                    : "You can only view complaints assigned to you."
                  }
                </p>
              </div>

              {/* Complaints Table */}
              <Card className="bg-white">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-600">Complaint Title</th>
                          <th className="text-left p-4 font-medium text-gray-600">Customer</th>
                          <th className="text-left p-4 font-medium text-gray-600">Priority</th>
                          <th className="text-left p-4 font-medium text-gray-600">Status</th>
                          <th className="text-left p-4 font-medium text-gray-600">Assigned To</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredComplaints.map((complaint) => (
                          <tr key={complaint.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">{complaint.title}</p>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{complaint.customer}</td>
                            <td className="p-4">
                              {getPriorityBadge(complaint.priority)}
                            </td>
                            <td className="p-4">
                              <Select
                                value={complaint.status}
                                onValueChange={(value) => handleStatusChange(complaint.id, value, 'complaint')}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-4 text-gray-600">{getUserName(complaint.assignedTo)}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewItem(complaint, 'complaint')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canUpdateComplaints && (
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canDeleteComplaints && (
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteComplaint(complaint.id)} className="text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredComplaints.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {canViewAllComplaints 
                          ? "No complaints found" 
                          : "No complaints assigned to you"
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Report Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Reports</p>
                      <p className="text-2xl font-bold">{reportStats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Draft</p>
                      <p className="text-2xl font-bold">{reportStats.draft}</p>
                    </div>
                    <Edit className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="text-2xl font-bold">{reportStats.submitted}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-bold">{reportStats.approved}</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">My Reports</p>
                      <p className="text-2xl font-bold">{reportStats.myReports}</p>
                    </div>
                    <User className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Coming Soon</h3>
                <p className="text-gray-600">Report management functionality will be available in the next update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingType === 'task' ? 'Task Details' : 
               viewingType === 'complaint' ? 'Complaint Details' : 'Report Details'}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this {viewingType}.
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium">Title</Label>
                <p className="text-gray-900">{viewingItem.title}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Description</Label>
                <p className="text-gray-700">{viewingItem.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">Priority</Label>
                  {getPriorityBadge(viewingItem.priority)}
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Status</Label>
                  <Badge variant="outline" className="capitalize">
                    {viewingItem.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium">
                    {viewingType === 'complaint' ? 'Customer' : 'Assigned To'}
                  </Label>
                  <p className="text-gray-700">
                    {viewingType === 'complaint' ? viewingItem.customer : getUserName(viewingItem.assignedTo)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-medium">Created At</Label>
                  <p className="text-gray-700">{formatDate(viewingItem.createdAt)}</p>
                </div>
              </div>
              {viewingType === 'task' && viewingItem.dueDate && (
                <div className="space-y-2">
                  <Label className="font-medium">Due Date</Label>
                  <p className="text-gray-700">{formatDate(viewingItem.dueDate)}</p>
                </div>
              )}
              {viewingType === 'task' && viewingItem.category && (
                <div className="space-y-2">
                  <Label className="font-medium">Category</Label>
                  <p className="text-gray-700">{viewingItem.category}</p>
                </div>
              )}
              {viewingType === 'task' && viewingItem.estimatedHours && (
                <div className="space-y-2">
                  <Label className="font-medium">Estimated Hours</Label>
                  <p className="text-gray-700">{viewingItem.estimatedHours}</p>
                </div>
              )}
              {viewingType === 'task' && viewingItem.notes && (
                <div className="space-y-2">
                  <Label className="font-medium">Notes</Label>
                  <p className="text-gray-700">{viewingItem.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update task information.' : 'Create a new task and assign it to a team member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description *</Label>
              <Textarea
                id="task-description"
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assigned-to">Assign To *</Label>
              <Select value={taskData.assignedTo} onValueChange={(value) => setTaskData({ ...taskData, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={taskData.priority} onValueChange={(value: any) => setTaskData({ ...taskData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-category">Category</Label>
              <Input
                id="task-category"
                value={taskData.category}
                onChange={(e) => setTaskData({ ...taskData, category: e.target.value })}
                placeholder="Enter task category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-estimated-hours">Estimated Hours</Label>
              <Input
                id="task-estimated-hours"
                value={taskData.estimatedHours}
                onChange={(e) => setTaskData({ ...taskData, estimatedHours: e.target.value })}
                placeholder="Enter estimated hours"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={taskData.notes}
                onChange={(e) => setTaskData({ ...taskData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTask}>
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Modal */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingComplaint ? 'Edit Complaint' : 'Create Complaint'}</DialogTitle>
            <DialogDescription>
              {editingComplaint ? 'Update complaint information.' : 'Create a new complaint and assign it to a team member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-title">Title *</Label>
              <Input
                id="complaint-title"
                value={complaintData.title}
                onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })}
                placeholder="Enter complaint title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-description">Description *</Label>
              <Textarea
                id="complaint-description"
                value={complaintData.description}
                onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                placeholder="Enter complaint description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-customer">Customer</Label>
              <Input
                id="complaint-customer"
                value={complaintData.customer}
                onChange={(e) => setComplaintData({ ...complaintData, customer: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-assigned-to">Assign To *</Label>
              <Select value={complaintData.assignedTo} onValueChange={(value) => setComplaintData({ ...complaintData, assignedTo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user to assign" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complaint-priority">Priority</Label>
                <Select value={complaintData.priority} onValueChange={(value: any) => setComplaintData({ ...complaintData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint-reported-by">Reported By</Label>
                <Input
                  id="complaint-reported-by"
                  value={complaintData.reportedBy}
                  onChange={(e) => setComplaintData({ ...complaintData, reportedBy: e.target.value })}
                  placeholder="Enter reporter name"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComplaintModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitComplaint}>
              {editingComplaint ? 'Update Complaint' : 'Create Complaint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerCareModule;