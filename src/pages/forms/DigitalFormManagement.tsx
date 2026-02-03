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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, AlertTriangle, Plus, FileText, Users, CheckCircle, Clock, Eye, FilePenLine } from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date';
  required: boolean;
  options?: string[]; // for select, radio
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

const DigitalFormManagement: React.FC = () => {
  const { users, hasPermission, currentUser } = useAuth();
  
  const [forms, setForms] = useState<DigitalForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'forms' | 'submissions'>('forms');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFillFormModalOpen, setIsFillFormModalOpen] = useState(false);
  const [isViewSubmissionModalOpen, setIsViewSubmissionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [fillingForm, setFillingForm] = useState<DigitalForm | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'draft' as 'draft' | 'active' | 'inactive',
    assignedUserIds: [] as string[],
    fields: [] as FormField[],
  });

  const [fillFormData, setFillFormData] = useState<Record<string, any>>({});

  // Load forms and submissions from localStorage
  useEffect(() => {
    try {
      const savedForms = localStorage.getItem('hdf_forms');
      if (savedForms) {
        const parsedForms = JSON.parse(savedForms);
        // Ensure all forms have proper structure
        const validForms = parsedForms.map((form: any) => ({
          ...form,
          assignedUserIds: Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [],
          fields: Array.isArray(form.fields) ? form.fields : [],
        }));
        setForms(validForms);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    }
    
    try {
      const savedSubmissions = localStorage.getItem('hdf_form_submissions');
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      setSubmissions([]);
    }
  }, []);

  // Save forms to localStorage
  const saveForms = (updatedForms: DigitalForm[]) => {
    try {
      localStorage.setItem('hdf_forms', JSON.stringify(updatedForms));
      setForms(updatedForms);
    } catch (error) {
      console.error('Error saving forms:', error);
    }
  };

  // Save submissions to localStorage
  const saveSubmissions = (updatedSubmissions: FormSubmission[]) => {
    try {
      localStorage.setItem('hdf_form_submissions', JSON.stringify(updatedSubmissions));
      setSubmissions(updatedSubmissions);
    } catch (error) {
      console.error('Error saving submissions:', error);
    }
  };

  // Filter forms based on permissions and search
  const filteredForms = useMemo(() => {
    let filtered = forms;

    // Filter by permissions
    if (!hasPermission('form_view_all')) {
      // Users can only see forms assigned to them or created by them
      filtered = forms.filter(form => {
        const assignedUserIds = Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [];
        const currentUserId = currentUser?.id || '';
        return assignedUserIds.includes(currentUserId) || form.createdBy === currentUserId;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(form =>
        (form.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [forms, searchTerm, hasPermission, currentUser]);

  // Filter submissions based on permissions and search
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Filter by permissions
    if (!hasPermission('form_view_all')) {
      // Users can only see submissions they made or forms they're assigned to
      const userFormIds = forms
        .filter(form => {
          const assignedUserIds = Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [];
          const currentUserId = currentUser?.id || '';
          return assignedUserIds.includes(currentUserId) || form.createdBy === currentUserId;
        })
        .map(form => form.id);
      
      filtered = submissions.filter(submission => 
        submission.submittedBy === currentUser?.id || 
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

  const handleAddForm = () => {
    if (!hasPermission('form_create')) {
      toast.error('You do not have permission to create forms');
      return;
    }
    setEditingForm(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      status: 'draft',
      assignedUserIds: [],
      fields: [],
    });
    setIsFormModalOpen(true);
  };

  const handleEditForm = (formId: string) => {
    if (!hasPermission('form_update')) {
      toast.error('You do not have permission to edit forms');
      return;
    }
    
    const form = forms.find(f => f.id === formId);
    if (form) {
      setEditingForm(formId);
      setFormData({
        title: form.title,
        description: form.description,
        category: form.category,
        status: form.status,
        assignedUserIds: Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [],
        fields: Array.isArray(form.fields) ? form.fields : [],
      });
      setIsFormModalOpen(true);
    }
  };

  const handleFillForm = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (form) {
      // Check if user is assigned to this form
      const assignedUserIds = Array.isArray(form.assignedUserIds) ? form.assignedUserIds : [];
      const currentUserId = currentUser?.id || '';
      
      if (!assignedUserIds.includes(currentUserId) && form.createdBy !== currentUserId && !hasPermission('form_fill_all')) {
        toast.error('You are not assigned to fill this form');
        return;
      }

      setFillingForm(form);
      setFillFormData({});
      setIsFillFormModalOpen(true);
    }
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setViewingSubmission(submission);
    setIsViewSubmissionModalOpen(true);
  };

  const handleDeleteForm = (formId: string) => {
    if (!hasPermission('form_delete')) {
      toast.error('You do not have permission to delete forms');
      return;
    }

    const form = forms.find(f => f.id === formId);
    if (form && !hasPermission('form_manage') && form.createdBy !== currentUser?.id) {
      toast.error('You can only delete forms you created');
      return;
    }

    setFormToDelete(formId);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitForm = () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();
    
    if (editingForm) {
      const updatedForms = forms.map(form =>
        form.id === editingForm
          ? {
              ...form,
              ...formData,
              assignedUserIds: Array.isArray(formData.assignedUserIds) ? formData.assignedUserIds : [],
              fields: Array.isArray(formData.fields) ? formData.fields : [],
              updatedAt: now
            }
          : form
      );
      saveForms(updatedForms);
      toast.success('Form updated successfully');
    } else {
      const newForm: DigitalForm = {
        id: `form_${Date.now()}`,
        ...formData,
        assignedUserIds: Array.isArray(formData.assignedUserIds) ? formData.assignedUserIds : [],
        fields: Array.isArray(formData.fields) ? formData.fields : [],
        createdBy: currentUser?.id || '',
        createdAt: now,
        updatedAt: now,
      };
      saveForms([...forms, newForm]);
      toast.success('Form created successfully');
    }
    setIsFormModalOpen(false);
  };

  const handleSubmitFilledForm = () => {
    if (!fillingForm) return;

    // Validate required fields
    const formFields = Array.isArray(fillingForm.fields) ? fillingForm.fields : [];
    const missingFields = formFields
      .filter(field => field.required && !fillFormData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const newSubmission: FormSubmission = {
      id: `submission_${Date.now()}`,
      formId: fillingForm.id,
      formTitle: fillingForm.title,
      submittedBy: currentUser?.id || '',
      submittedAt: new Date().toISOString(),
      responses: fillFormData,
      status: 'submitted',
    };

    saveSubmissions([...submissions, newSubmission]);
    toast.success('Form submitted successfully');
    setIsFillFormModalOpen(false);
    setActiveTab('submissions'); // Switch to submissions tab to show the result
  };

  const handleConfirmDelete = () => {
    if (formToDelete) {
      const updatedForms = forms.filter(form => form.id !== formToDelete);
      saveForms(updatedForms);
      toast.success('Form deleted successfully');
      setIsDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Unknown User';
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'inactive': return 'outline';
      case 'submitted': return 'secondary';
      case 'reviewed': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setFormData({ ...formData, fields: [...formData.fields, newField] });
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    const updatedFields = formData.fields.map((f, i) => 
      i === index ? { ...f, ...field } : f
    );
    setFormData({ ...formData, fields: updatedFields });
  };

  const removeField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const formColumns = [
    {
      key: 'title',
      title: 'Form Title',
      width: '25%',
    },
    {
      key: 'category',
      title: 'Category',
      width: '15%',
    },
    {
      key: 'status',
      title: 'Status',
      width: '10%',
      render: (status: unknown) => (
        <Badge variant={getStatusColor(String(status))}>
          {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
        </Badge>
      ),
    },
    {
      key: 'assignedUserIds',
      title: 'Assigned Users',
      width: '20%',
      render: (assignedUserIds: unknown) => {
        const userIds = Array.isArray(assignedUserIds) ? assignedUserIds : [];
        return (
          <span className="text-sm">
            {userIds.length > 0 ? `${userIds.length} user(s)` : 'None'}
          </span>
        );
      },
    },
    {
      key: 'createdBy',
      title: 'Created By',
      width: '15%',
      render: (createdBy: unknown) => (
        <span className="text-sm">
          {getUserName(String(createdBy))}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '15%',
      render: (_: unknown, record: DigitalForm) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFillForm(record.id)}
            disabled={record.status !== 'active'}
            title="Fill Form"
          >
            <FilePenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditForm(record.id)}
            disabled={
              !hasPermission('form_update') ||
              (!hasPermission('form_manage') && record.createdBy !== currentUser?.id)
            }
            title="Edit Form"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteForm(record.id)}
            disabled={
              !hasPermission('form_delete') ||
              (!hasPermission('form_manage') && record.createdBy !== currentUser?.id)
            }
            className="text-red-600 hover:text-red-700"
            title="Delete Form"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
      width: '15%',
      render: (submittedAt: unknown) => (
        <span className="text-sm">
          {new Date(String(submittedAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      width: '12%',
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
    totalForms: filteredForms.length,
    activeForms: filteredForms.filter(f => f.status === 'active').length,
    totalSubmissions: filteredSubmissions.length,
    mySubmissions: filteredSubmissions.filter(s => s.submittedBy === currentUser?.id).length,
  };

  if (!hasPermission('form_view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access form management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Form Management</h1>
          <p className="text-gray-600">Create, assign, and manage digital forms and submissions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalForms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeForms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Submissions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mySubmissions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'forms' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('forms')}
        >
          Forms
        </Button>
        <Button
          variant={activeTab === 'submissions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('submissions')}
        >
          Submissions
        </Button>
      </div>

      {/* Forms Tab */}
      {activeTab === 'forms' && (
        <DataTable
          data={filteredForms}
          columns={formColumns}
          searchPlaceholder="Search forms..."
          onSearch={setSearchTerm}
          onAdd={handleAddForm}
          addButtonText="Create Form"
          showAddButton={hasPermission('form_create')}
          emptyMessage="No forms found"
        />
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <DataTable
          data={filteredSubmissions}
          columns={submissionColumns}
          searchPlaceholder="Search submissions..."
          onSearch={setSearchTerm}
          emptyMessage="No form submissions found"
        />
      )}

      {/* Form Creation/Edit Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingForm ? 'Edit Form' : 'Create New Form'}
            </DialogTitle>
            <DialogDescription>
              {editingForm ? 'Update form information and fields.' : 'Create a new digital form with custom fields.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="Enter form title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Enter form description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="col-span-3"
                placeholder="Enter form category"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'active' | 'inactive') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Form Fields */}
            <div className="col-span-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium">Form Fields</Label>
                <Button type="button" variant="outline" size="sm" onClick={addField}>
                  Add Field
                </Button>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Field {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Field label"
                          size="sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Field placeholder"
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="rounded"
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm}>
              {editingForm ? 'Update Form' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill Form Modal */}
      <Dialog open={isFillFormModalOpen} onOpenChange={setIsFillFormModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePenLine className="h-5 w-5" />
              Fill Form: {fillingForm?.title}
            </DialogTitle>
            <DialogDescription>
              {fillingForm?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fillingForm && Array.isArray(fillingForm.fields) && fillingForm.fields.map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                
                {field.type === 'text' && (
                  <Input
                    id={field.id}
                    value={fillFormData[field.id] || ''}
                    onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
                
                {field.type === 'email' && (
                  <Input
                    id={field.id}
                    type="email"
                    value={fillFormData[field.id] || ''}
                    onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
                
                {field.type === 'number' && (
                  <Input
                    id={field.id}
                    type="number"
                    value={fillFormData[field.id] || ''}
                    onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                )}
                
                {field.type === 'date' && (
                  <Input
                    id={field.id}
                    type="date"
                    value={fillFormData[field.id] || ''}
                    onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.value })}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <Textarea
                    id={field.id}
                    value={fillFormData[field.id] || ''}
                    onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                )}
                
                {field.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={field.id}
                      checked={fillFormData[field.id] || false}
                      onChange={(e) => setFillFormData({ ...fillFormData, [field.id]: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={field.id} className="text-sm">
                      {field.placeholder || 'Check this box'}
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFillFormModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFilledForm}>
              Submit Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Submission Modal */}
      <Dialog open={isViewSubmissionModalOpen} onOpenChange={setIsViewSubmissionModalOpen}>
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
            {viewingSubmission && Object.entries(viewingSubmission.responses).map(([fieldId, value]) => {
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
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewSubmissionModalOpen(false)}>
              Close
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
              Delete Form
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot be undone and will also delete all associated submissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalFormManagement;