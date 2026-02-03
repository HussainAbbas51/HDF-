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
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, AlertTriangle, Plus, FileText, Eye, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: string;
}

interface DigitalForm {
  id: string;
  title: string;
  description: string;
  category: 'registration' | 'feedback' | 'application' | 'survey' | 'other';
  status: 'draft' | 'published' | 'archived';
  fields: FormField[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  submissionCount: number;
}

const FormManagement: React.FC = () => {
  const { users, hasPermission, user } = useAuth();
  const [forms, setForms] = useState<DigitalForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<DigitalForm | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as 'registration' | 'feedback' | 'application' | 'survey' | 'other',
    status: 'draft' as 'draft' | 'published' | 'archived',
    isPublic: false,
    fields: [] as FormField[],
  });

  const [newField, setNewField] = useState({
    type: 'text' as FormField['type'],
    label: '',
    placeholder: '',
    required: false,
    options: [''],
  });

  // Load forms from localStorage
  useEffect(() => {
    const savedForms = localStorage.getItem('hdf_forms');
    if (savedForms) {
      setForms(JSON.parse(savedForms));
    }
  }, []);

  // Save forms to localStorage
  const saveForms = (updatedForms: DigitalForm[]) => {
    setForms(updatedForms);
    localStorage.setItem('hdf_forms', JSON.stringify(updatedForms));
  };

  const filteredForms = useMemo(() => {
    let filtered = forms;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(form => 
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by user permissions
    if (!hasPermission('form_manage')) {
      filtered = filtered.filter(form => 
        form.createdBy === user?.id || form.isPublic
      );
    }

    return filtered;
  }, [forms, searchTerm, hasPermission, user]);

  const handleAddForm = () => {
    if (!hasPermission('form_create')) {
      toast.error('You do not have permission to create forms');
      return;
    }
    setEditingForm(null);
    setFormData({
      title: '',
      description: '',
      category: 'other',
      status: 'draft',
      isPublic: false,
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
        isPublic: form.isPublic,
        fields: form.fields,
      });
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteForm = (formId: string) => {
    if (!hasPermission('form_delete')) {
      toast.error('You do not have permission to delete forms');
      return;
    }
    setFormToDelete(formId);
    setIsDeleteModalOpen(true);
  };

  const handlePreviewForm = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (form) {
      setPreviewForm(form);
      setIsPreviewModalOpen(true);
    }
  };

  const handleSubmitForm = () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Please add at least one form field');
      return;
    }

    const now = new Date().toISOString();

    if (editingForm) {
      const updatedForms = forms.map(form =>
        form.id === editingForm
          ? {
              ...form,
              ...formData,
              updatedAt: now,
            }
          : form
      );
      saveForms(updatedForms);
      toast.success('Form updated successfully');
    } else {
      const newForm: DigitalForm = {
        id: `form-${Date.now()}`,
        ...formData,
        createdBy: user?.id || '',
        createdAt: now,
        updatedAt: now,
        submissionCount: 0,
      };
      saveForms([...forms, newForm]);
      toast.success('Form created successfully');
    }
    setIsFormModalOpen(false);
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

  const addField = () => {
    if (!newField.label) {
      toast.error('Please enter a field label');
      return;
    }

    const field: FormField = {
      id: `field-${Date.now()}`,
      type: newField.type,
      label: newField.label,
      placeholder: newField.placeholder,
      required: newField.required,
      options: ['select', 'radio', 'checkbox'].includes(newField.type) 
        ? newField.options.filter(opt => opt.trim() !== '') 
        : undefined,
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, field],
    });

    setNewField({
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [''],
    });

    toast.success('Field added successfully');
  };

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(field => field.id !== fieldId),
    });
  };

  const duplicateForm = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    if (form) {
      const duplicatedForm: DigitalForm = {
        ...form,
        id: `form-${Date.now()}`,
        title: `${form.title} (Copy)`,
        status: 'draft',
        createdBy: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submissionCount: 0,
      };
      saveForms([...forms, duplicatedForm]);
      toast.success('Form duplicated successfully');
    }
  };

  const getCreatedByName = (userId: string) => {
    const creator = users.find(u => u.id === userId);
    return creator ? creator.name : 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'registration': return 'default';
      case 'feedback': return 'secondary';
      case 'application': return 'default';
      case 'survey': return 'outline';
      case 'other': return 'outline';
      default: return 'outline';
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Form Title',
      width: '20%',
    },
    {
      key: 'category',
      title: 'Category',
      width: '12%',
      render: (category: unknown) => (
        <Badge variant={getCategoryColor(String(category))}>
          {String(category).charAt(0).toUpperCase() + String(category).slice(1)}
        </Badge>
      ),
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
      key: 'fields',
      title: 'Fields',
      width: '8%',
      render: (fields: unknown) => (
        <span className="text-sm font-medium">
          {Array.isArray(fields) ? fields.length : 0}
        </span>
      ),
    },
    {
      key: 'submissionCount',
      title: 'Submissions',
      width: '10%',
      render: (count: unknown) => (
        <span className="text-sm font-medium">{String(count)}</span>
      ),
    },
    {
      key: 'isPublic',
      title: 'Visibility',
      width: '10%',
      render: (isPublic: unknown) => (
        <Badge variant={isPublic ? 'default' : 'secondary'}>
          {isPublic ? 'Public' : 'Private'}
        </Badge>
      ),
    },
    {
      key: 'createdBy',
      title: 'Created By',
      width: '12%',
      render: (createdBy: unknown) => (
        <span className="text-sm">{getCreatedByName(String(createdBy))}</span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Created',
      width: '10%',
      render: (createdAt: unknown) => (
        <span className="text-sm">
          {new Date(String(createdAt)).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '8%',
      render: (_: unknown, record: DigitalForm) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreviewForm(record.id)}
            title="Preview Form"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => duplicateForm(record.id)}
            title="Duplicate Form"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditForm(record.id)}
            disabled={!hasPermission('form_update')}
            title="Edit Form"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteForm(record.id)}
            disabled={!hasPermission('form_delete')}
            className="text-red-600 hover:text-red-700"
            title="Delete Form"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!hasPermission('form_view') && !hasPermission('form_read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view forms.</p>
      </div>
    );
  }

  const formStats = {
    total: filteredForms.length,
    published: filteredForms.filter(f => f.status === 'published').length,
    draft: filteredForms.filter(f => f.status === 'draft').length,
    archived: filteredForms.filter(f => f.status === 'archived').length,
    myForms: filteredForms.filter(f => f.createdBy === user?.id).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Form Management</h1>
          <p className="text-gray-600">Create, manage, and deploy digital forms for data collection</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.total}</div>
            <p className="text-xs text-muted-foreground">All forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.published}</div>
            <p className="text-xs text-muted-foreground">Live forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.draft}</div>
            <p className="text-xs text-muted-foreground">In development</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.archived}</div>
            <p className="text-xs text-muted-foreground">Archived forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Forms</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.myForms}</div>
            <p className="text-xs text-muted-foreground">Created by me</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={filteredForms}
        columns={columns}
        searchPlaceholder="Search forms..."
        onSearch={setSearchTerm}
        onAdd={handleAddForm}
        addButtonText="Create Form"
        showAddButton={hasPermission('form_create')}
        emptyMessage="No forms found. Create your first form to get started."
      />

      {/* Form Creation/Edit Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingForm ? 'Edit Form' : 'Create New Form'}
            </DialogTitle>
            <DialogDescription>
              {editingForm ? 'Update form information and fields.' : 'Create a new digital form for data collection.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formTitle">Form Title *</Label>
                  <Input
                    id="formTitle"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter form title"
                  />
                </div>
                <div>
                  <Label htmlFor="formCategory">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'registration' | 'feedback' | 'application' | 'survey' | 'other') => 
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registration">Registration</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="application">Application</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="formDescription">Description *</Label>
                <Textarea
                  id="formDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this form"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formStatus">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published' | 'archived') => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                  <Label htmlFor="isPublic">Public Form</Label>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Form Fields</h3>
              
              {/* Existing Fields */}
              {formData.fields.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Current Fields:</h4>
                  {formData.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field.type}</Badge>
                          <span className="font-medium">{field.label}</span>
                          {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        {field.placeholder && (
                          <p className="text-sm text-gray-500 mt-1">Placeholder: {field.placeholder}</p>
                        )}
                        {field.options && (
                          <p className="text-sm text-gray-500 mt-1">
                            Options: {field.options.join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Field */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Add New Field:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldType">Field Type</Label>
                    <Select
                      value={newField.type}
                      onValueChange={(value: FormField['type']) => 
                        setNewField({ ...newField, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="select">Select Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="radio">Radio Buttons</SelectItem>
                        <SelectItem value="date">Date Picker</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fieldLabel">Field Label</Label>
                    <Input
                      id="fieldLabel"
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      placeholder="Enter field label"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldPlaceholder">Placeholder (Optional)</Label>
                    <Input
                      id="fieldPlaceholder"
                      value={newField.placeholder}
                      onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="fieldRequired"
                      checked={newField.required}
                      onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                    />
                    <Label htmlFor="fieldRequired">Required Field</Label>
                  </div>
                </div>

                {/* Options for select, radio, checkbox */}
                {['select', 'radio', 'checkbox'].includes(newField.type) && (
                  <div>
                    <Label>Options (one per line)</Label>
                    <Textarea
                      value={newField.options.join('\n')}
                      onChange={(e) => setNewField({ 
                        ...newField, 
                        options: e.target.value.split('\n').filter(opt => opt.trim() !== '') 
                      })}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      rows={3}
                    />
                  </div>
                )}

                <Button onClick={addField} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
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

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Form Preview: {previewForm?.title}
            </DialogTitle>
            <DialogDescription>
              This is how your form will appear to users.
            </DialogDescription>
          </DialogHeader>
          
          {previewForm && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold">{previewForm.title}</h3>
                <p className="text-gray-600">{previewForm.description}</p>
              </div>
              
              <div className="space-y-4">
                {previewForm.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input placeholder={field.placeholder} disabled />
                    )}
                    {field.type === 'email' && (
                      <Input type="email" placeholder={field.placeholder} disabled />
                    )}
                    {field.type === 'number' && (
                      <Input type="number" placeholder={field.placeholder} disabled />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea placeholder={field.placeholder} disabled rows={3} />
                    )}
                    {field.type === 'date' && (
                      <Input type="date" disabled />
                    )}
                    {field.type === 'file' && (
                      <Input type="file" disabled />
                    )}
                    {field.type === 'select' && (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, idx) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'radio' && (
                      <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input type="radio" disabled />
                            <Label>{option}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="space-y-2">
                        {field.options?.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input type="checkbox" disabled />
                            <Label>{option}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Button className="w-full" disabled>
                Submit Form (Preview Mode)
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewModalOpen(false)}>
              Close Preview
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
              Are you sure you want to delete this form? This action cannot be undone and all form submissions will be lost.
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

export default FormManagement;