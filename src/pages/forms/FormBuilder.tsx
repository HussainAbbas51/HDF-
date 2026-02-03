import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Copy, 
  FormInput, 
  FileText, 
  BarChart3, 
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface DigitalForm {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  fields: FormField[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
}

const FormBuilder: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [forms, setForms] = useState<DigitalForm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    isPublic: boolean;
    fields: FormField[];
  }>({
    title: '',
    description: '',
    category: 'general',
    status: 'draft',
    isPublic: true,
    fields: []
  });

  const [currentField, setCurrentField] = useState<FormField>({
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: []
  });

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

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

  const categories = ['general', 'registration', 'feedback', 'application', 'survey', 'contact'];
  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' }
  ];

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || form.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddForm = () => {
    if (!hasPermission('form_create')) {
      toast.error('You do not have permission to create forms');
      return;
    }
    setEditingForm(null);
    setFormData({
      title: '',
      description: '',
      category: 'general',
      status: 'draft',
      isPublic: true,
      fields: []
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
        fields: form.fields
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

  const handleConfirmDelete = () => {
    if (formToDelete) {
      const updatedForms = forms.filter(f => f.id !== formToDelete);
      saveForms(updatedForms);
      toast.success('Form deleted successfully');
      setIsDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  const handleDuplicateForm = (formId: string) => {
    if (!hasPermission('form_create')) {
      toast.error('You do not have permission to create forms');
      return;
    }
    const form = forms.find(f => f.id === formId);
    if (form) {
      const duplicatedForm: DigitalForm = {
        ...form,
        id: `form-${Date.now()}`,
        title: `${form.title} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submissionCount: 0
      };
      const updatedForms = [...forms, duplicatedForm];
      saveForms(updatedForms);
      toast.success('Form duplicated successfully');
    }
  };

  const handleSubmitForm = () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.fields.length === 0) {
      toast.error('Please add at least one field to the form');
      return;
    }

    const now = new Date().toISOString();
    
    if (editingForm) {
      const updatedForms = forms.map(form =>
        form.id === editingForm
          ? {
              ...form,
              ...formData,
              updatedAt: now
            }
          : form
      );
      saveForms(updatedForms);
      toast.success('Form updated successfully');
    } else {
      const newForm: DigitalForm = {
        id: `form-${Date.now()}`,
        ...formData,
        createdBy: user?.id || 'unknown',
        createdAt: now,
        updatedAt: now,
        submissionCount: 0
      };
      const updatedForms = [...forms, newForm];
      saveForms(updatedForms);
      toast.success('Form created successfully');
    }
    setIsFormModalOpen(false);
  };

  const handleAddField = () => {
    setCurrentField({
      id: '',
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: []
    });
    setEditingFieldIndex(null);
    setIsFieldModalOpen(true);
  };

  const handleEditField = (index: number) => {
    setCurrentField({ ...formData.fields[index] });
    setEditingFieldIndex(index);
    setIsFieldModalOpen(true);
  };

  const handleDeleteField = (index: number) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: updatedFields });
  };

  const handleSubmitField = () => {
    if (!currentField.label) {
      toast.error('Please enter a field label');
      return;
    }

    if ((currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && 
        (!currentField.options || currentField.options.length === 0)) {
      toast.error('Please add at least one option for this field type');
      return;
    }

    const fieldWithId = {
      ...currentField,
      id: currentField.id || `field-${Date.now()}`
    };

    if (editingFieldIndex !== null) {
      const updatedFields = [...formData.fields];
      updatedFields[editingFieldIndex] = fieldWithId;
      setFormData({ ...formData, fields: updatedFields });
    } else {
      setFormData({ ...formData, fields: [...formData.fields, fieldWithId] });
    }
    setIsFieldModalOpen(false);
  };

  const handleAddOption = () => {
    setCurrentField({
      ...currentField,
      options: [...(currentField.options || []), '']
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const updatedOptions = [...(currentField.options || [])];
    updatedOptions[index] = value;
    setCurrentField({ ...currentField, options: updatedOptions });
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = (currentField.options || []).filter((_, i) => i !== index);
    setCurrentField({ ...currentField, options: updatedOptions });
  };

  const getPublicFormUrl = (formId: string) => {
    return `${window.location.origin}/form/${formId}`;
  };

  const copyFormUrl = (formId: string) => {
    const url = getPublicFormUrl(formId);
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  if (!hasPermission('form_view') && !hasPermission('form_read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view forms.</p>
      </div>
    );
  }

  const formStats = {
    total: forms.length,
    published: forms.filter(f => f.status === 'published').length,
    draft: forms.filter(f => f.status === 'draft').length,
    totalSubmissions: forms.reduce((sum, form) => sum + (form.submissionCount || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Forms</h1>
          <p className="text-gray-600">Create and manage digital forms for data collection</p>
        </div>
        <Button onClick={handleAddForm} disabled={!hasPermission('form_create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FormInput className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.total}</div>
            <p className="text-xs text-muted-foreground">All forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.published}</div>
            <p className="text-xs text-muted-foreground">Live forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.draft}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formStats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Total responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <CardDescription className="mt-1">{form.description}</CardDescription>
                </div>
                <Badge variant={getStatusColor(form.status)}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Category: {form.category}</span>
                  <span>{form.fields.length} fields</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Submissions: {form.submissionCount || 0}</span>
                  <span>{form.isPublic ? 'Public' : 'Private'}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(form.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditForm(form.id)}
                    disabled={!hasPermission('form_update')}
                    title="Edit Form"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateForm(form.id)}
                    disabled={!hasPermission('form_create')}
                    title="Duplicate Form"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {form.status === 'published' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyFormUrl(form.id)}
                      title="Copy Form URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteForm(form.id)}
                    disabled={!hasPermission('form_delete')}
                    className="text-red-600 hover:text-red-700"
                    title="Delete Form"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredForms.length === 0 && (
        <div className="text-center py-12">
          <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
          <p className="text-gray-600 mb-4">
            {forms.length === 0 
              ? "Get started by creating your first form"
              : "Try adjusting your search or filter criteria"
            }
          </p>
          {hasPermission('form_create') && (
            <Button onClick={handleAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FormInput className="h-5 w-5" />
              {editingForm ? 'Edit Form' : 'Create New Form'}
            </DialogTitle>
            <DialogDescription>
              {editingForm ? 'Update form details and fields.' : 'Create a new digital form for data collection.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
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
                <Label htmlFor="formDescription">Description *</Label>
                <Textarea
                  id="formDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this form is for"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formCategory">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="formPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
                <Label htmlFor="formPublic">Make form publicly accessible</Label>
              </div>
            </div>

            {/* Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Form Fields</Label>
                <Button onClick={handleAddField} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              
              {formData.fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FormInput className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No fields added yet</p>
                  <Button onClick={handleAddField} variant="outline" size="sm" className="mt-2">
                    Add Your First Field
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        <div className="text-sm text-gray-500">
                          Type: {fieldTypes.find(t => t.value === field.type)?.label}
                          {field.placeholder && ` • Placeholder: ${field.placeholder}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Field Modal */}
      <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFieldIndex !== null ? 'Edit Field' : 'Add New Field'}
            </DialogTitle>
            <DialogDescription>
              Configure the field properties and options.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fieldLabel">Field Label *</Label>
              <Input
                id="fieldLabel"
                value={currentField.label}
                onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                placeholder="Enter field label"
              />
            </div>
            <div>
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={currentField.type}
                onValueChange={(value: FormField['type']) => 
                  setCurrentField({ ...currentField, type: value, options: [] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fieldPlaceholder">Placeholder Text</Label>
              <Input
                id="fieldPlaceholder"
                value={currentField.placeholder || ''}
                onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="fieldRequired"
                checked={currentField.required}
                onCheckedChange={(checked) => setCurrentField({ ...currentField, required: checked })}
              />
              <Label htmlFor="fieldRequired">Required field</Label>
            </div>

            {/* Options for select, radio, checkbox */}
            {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button onClick={handleAddOption} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                {(currentField.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      onClick={() => handleRemoveOption(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(!currentField.options || currentField.options.length === 0) && (
                  <p className="text-sm text-gray-500">No options added yet. Click "Add Option" to get started.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitField}>
              {editingFieldIndex !== null ? 'Update Field' : 'Add Field'}
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

export default FormBuilder;