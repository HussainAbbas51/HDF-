import React, { useState, useMemo, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, FileText, Users, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submittedBy: string;
  submittedAt: string;
  responses: Record<string, any>;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface DigitalForm {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'inactive';
  fields: FormField[];
  assignedUserIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const FormSubmissions: React.FC = () => {
  const { users, hasPermission, currentUser } = useAuth();
  
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [forms, setForms] = useState<DigitalForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);

  // Load submissions and forms from localStorage
  useEffect(() => {
    try {
      const savedSubmissions = localStorage.getItem('hdf_form_submissions');
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
      
      const savedForms = localStorage.getItem('hdf_forms');
      if (savedForms) {
        setForms(JSON.parse(savedForms));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setSubmissions([]);
      setForms([]);
    }
  }, []);

  // Filter submissions based on permissions and search
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by permissions
    if (!hasPermission('form_view_all') && currentUser?.id) {
      // Users can only see submissions they made or forms they're assigned to
      const userFormIds = forms
        .filter(form => {
          const assignedUserIds = Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [];
          return assignedUserIds.includes(currentUser.id) || form.createdBy === currentUser.id;
        })
        .map(form => form.id);
      
      filtered = submissions.filter(submission => 
        submission.submittedBy === currentUser.id || 
        userFormIds.includes(submission.formId)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        (submission.formTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUserName(submission.submittedBy).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [submissions, searchTerm, hasPermission, currentUser, forms]);

  const handleViewSubmission = (submission: FormSubmission) => {
    setViewingSubmission(submission);
    setIsViewModalOpen(true);
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown User';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'reviewed': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const submissionColumns = [
    {
      key: 'formTitle',
      title: 'Form Title',
      width: '25%',
    },
    {
      key: 'submittedBy',
      title: 'Submitted By',
      width: '20%',
      render: (submittedBy: unknown) => (
        <span className="text-sm">
          {getUserName(String(submittedBy))}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      title: 'Submitted At',
      width: '20%',
      render: (submittedAt: unknown) => (
        <span className="text-sm">
          {new Date(String(submittedAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '15%',
      render: (status: unknown) => (
        <Badge variant={getStatusColor(String(status))}>
          {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '10%',
      render: (_: unknown, record: FormSubmission) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewSubmission(record)}
            title="View Submission"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Statistics
  const stats = {
    totalSubmissions: filteredSubmissions.length,
    submittedCount: filteredSubmissions.filter(s => s.status === 'submitted').length,
    approvedCount: filteredSubmissions.filter(s => s.status === 'approved').length,
    mySubmissions: filteredSubmissions.filter(s => s.submittedBy === currentUser?.id).length,
  };

  if (!hasPermission('form_view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access form submissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600">View and manage form submissions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mySubmissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <DataTable
        data={filteredSubmissions}
        columns={submissionColumns}
        searchPlaceholder="Search submissions..."
        onSearch={setSearchTerm}
        emptyMessage="No form submissions found"
      />

      {/* View Submission Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Submission: {viewingSubmission?.formTitle}
            </DialogTitle>
            <DialogDescription>
              Submitted by {viewingSubmission && getUserName(viewingSubmission.submittedBy)} on{' '}
              {viewingSubmission && new Date(viewingSubmission.submittedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {viewingSubmission && viewingSubmission.responses && Object.entries(viewingSubmission.responses).map(([fieldId, value]) => {
              const form = forms.find(f => f.id === viewingSubmission.formId);
              const formFields = form && Array.isArray(form.fields) ? form.fields : [];
              const field = formFields.find(f => f.id === fieldId);
              
              return (
                <div key={fieldId} className="grid gap-2">
                  <Label className="font-medium">{field?.label || fieldId}</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {field?.type === 'checkbox' 
                      ? (value ? 'Yes' : 'No')
                      : String(value || 'No response')
                    }
                  </div>
                </div>
              );
            })}
            
            {(!viewingSubmission?.responses || Object.keys(viewingSubmission.responses).length === 0) && (
              <div className="text-center text-gray-500 py-4">
                No response data available
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormSubmissions;