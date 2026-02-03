import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
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
  status: string;
  fields: FormField[];
  isPublic: boolean;
  submissionCount?: number;
}

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submittedBy: string;
  submitterEmail: string;
  submissionData: Record<string, string | string[]>;
  submittedAt: string;
  ipAddress: string;
  userAgent: string;
}

const PublicFormView: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<DigitalForm | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!formId) {
      navigate('/');
      return;
    }

    // Load form from localStorage
    const savedForms = localStorage.getItem('hdf_forms');
    if (savedForms) {
      const forms = JSON.parse(savedForms);
      const foundForm = forms.find((f: DigitalForm) => f.id === formId);
      
      if (!foundForm) {
        toast.error('Form not found');
        navigate('/');
        return;
      }

      if (foundForm.status !== 'published') {
        toast.error('This form is not available');
        navigate('/');
        return;
      }

      setForm(foundForm);
      
      // Initialize form data
      const initialData: Record<string, string | string[]> = {};
      foundForm.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          initialData[field.id] = [];
        } else {
          initialData[field.id] = '';
        }
      });
      setFormData(initialData);
    } else {
      toast.error('No forms available');
      navigate('/');
    }
  }, [formId, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    form?.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.id];
        
        if (!value || (Array.isArray(value) && value.length === 0) || 
            (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }

      // Email validation
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.id]))) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      // Number validation
      if (field.type === 'number' && formData[field.id]) {
        if (isNaN(Number(formData[field.id]))) {
          newErrors[field.id] = 'Please enter a valid number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }));
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = Array.isArray(prev[fieldId]) ? prev[fieldId] as string[] : [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter((val: string) => val !== option)
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create submission object
      const submission: FormSubmission = {
        id: `submission-${Date.now()}`,
        formId: form!.id,
        formTitle: form!.title,
        submittedBy: String(formData.name || formData.fullName || 'Anonymous'),
        submitterEmail: String(formData.email || 'no-email@provided.com'),
        submissionData: { ...formData },
        submittedAt: new Date().toISOString(),
        ipAddress: 'N/A', // In a real app, this would be captured server-side
        userAgent: navigator.userAgent,
      };

      // Save submission to localStorage
      const savedSubmissions = localStorage.getItem('hdf_form_submissions');
      const submissions = savedSubmissions ? JSON.parse(savedSubmissions) : [];
      submissions.push(submission);
      localStorage.setItem('hdf_form_submissions', JSON.stringify(submissions));

      // Update form submission count
      const savedForms = localStorage.getItem('hdf_forms');
      if (savedForms) {
        const forms = JSON.parse(savedForms);
        const updatedForms = forms.map((f: DigitalForm) => 
          f.id === form!.id 
            ? { ...f, submissionCount: (f.submissionCount || 0) + 1 }
            : f
        );
        localStorage.setItem('hdf_forms', JSON.stringify(updatedForms));
      }

      setIsSubmitted(true);
      toast.success('Form submitted successfully!');
      
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your form has been submitted successfully. We'll get back to you soon.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <Badge variant="outline">{form.category}</Badge>
            </div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            <CardDescription className="text-base">
              {form.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>

                  {/* Text Input */}
                  {field.type === 'text' && (
                    <Input
                      value={String(formData[field.id] || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Email Input */}
                  {field.type === 'email' && (
                    <Input
                      type="email"
                      value={String(formData[field.id] || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Number Input */}
                  {field.type === 'number' && (
                    <Input
                      type="number"
                      value={String(formData[field.id] || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === 'textarea' && (
                    <Textarea
                      value={String(formData[field.id] || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Date Input */}
                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={String(formData[field.id] || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* File Input */}
                  {field.type === 'file' && (
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleInputChange(field.id, file ? file.name : '');
                      }}
                      className={errors[field.id] ? 'border-red-500' : ''}
                    />
                  )}

                  {/* Select Dropdown */}
                  {field.type === 'select' && (
                    <Select
                      value={String(formData[field.id] || '')}
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      <SelectTrigger className={errors[field.id] ? 'border-red-500' : ''}>
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

                  {/* Radio Buttons */}
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${field.id}-${idx}`}
                            name={field.id}
                            value={option}
                            checked={formData[field.id] === option}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <Label htmlFor={`${field.id}-${idx}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Checkboxes */}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${field.id}-${idx}`}
                            checked={Array.isArray(formData[field.id]) && (formData[field.id] as string[]).includes(option)}
                            onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <Label htmlFor={`${field.id}-${idx}`} className="text-sm">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error Message */}
                  {errors[field.id] && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {errors[field.id]}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Powered by HDF Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicFormView;