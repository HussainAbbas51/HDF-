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
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Send, Phone, Settings, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppMessage {
  id: string;
  to: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  type: 'text' | 'template' | 'media';
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'marketing' | 'utility' | 'authentication';
  status: 'approved' | 'pending' | 'rejected';
}

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookUrl: string;
  verifyToken: string;
  businessAccountId: string;
  isEnabled: boolean;
}

const WhatsAppModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumberId: '',
    accessToken: '',
    webhookUrl: '',
    verifyToken: '',
    businessAccountId: '',
    isEnabled: false,
  });

  // Message sending states
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    to: '',
    message: '',
    templateId: '',
    variables: {} as Record<string, string>,
  });

  // Template management states
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    category: 'utility' as 'marketing' | 'utility' | 'authentication',
  });

  // Configuration states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadMessages();
    loadTemplates();
    loadConfiguration();
  }, []);

  const loadMessages = () => {
    // Simulate loading messages from API
    const mockMessages: WhatsAppMessage[] = [
      {
        id: '1',
        to: '+1234567890',
        message: 'Welcome to HDF Management System!',
        status: 'delivered',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
      },
      {
        id: '2',
        to: '+0987654321',
        message: 'Your appointment is confirmed for tomorrow at 2 PM.',
        status: 'read',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'template',
      },
    ];
    setMessages(mockMessages);
  };

  const loadTemplates = () => {
    // Simulate loading templates from API
    const mockTemplates: WhatsAppTemplate[] = [
      {
        id: '1',
        name: 'welcome_message',
        content: 'Welcome {{name}} to HDF Management System! Your account is now active.',
        variables: ['name'],
        category: 'utility',
        status: 'approved',
      },
      {
        id: '2',
        name: 'appointment_reminder',
        content: 'Hi {{name}}, your appointment is scheduled for {{date}} at {{time}}. Please confirm.',
        variables: ['name', 'date', 'time'],
        category: 'utility',
        status: 'approved',
      },
    ];
    setTemplates(mockTemplates);
  };

  const loadConfiguration = () => {
    // Load configuration from localStorage or API
    const savedConfig = localStorage.getItem('whatsapp_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const saveConfiguration = () => {
    localStorage.setItem('whatsapp_config', JSON.stringify(config));
    toast.success('WhatsApp configuration saved successfully');
    setIsConfigModalOpen(false);
  };

  const sendMessage = async () => {
    if (!config.isEnabled) {
      toast.error('WhatsApp API is not configured or enabled');
      return;
    }

    if (!messageForm.to || (!messageForm.message && !messageForm.templateId)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Simulate API call to WhatsApp Business API
      const newMessage: WhatsAppMessage = {
        id: Date.now().toString(),
        to: messageForm.to,
        message: messageForm.templateId ? 
          templates.find(t => t.id === messageForm.templateId)?.content || messageForm.message :
          messageForm.message,
        status: 'pending',
        timestamp: new Date().toISOString(),
        type: messageForm.templateId ? 'template' : 'text',
      };

      setMessages(prev => [newMessage, ...prev]);
      
      // Simulate message status updates
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        ));
      }, 1000);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        ));
      }, 3000);

      toast.success('Message sent successfully');
      setIsMessageModalOpen(false);
      setMessageForm({ to: '', message: '', templateId: '', variables: {} });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const createTemplate = () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    const variables = templateForm.content.match(/\{\{(\w+)\}\}/g)?.map(v => v.slice(2, -2)) || [];
    
    const newTemplate: WhatsAppTemplate = {
      id: Date.now().toString(),
      name: templateForm.name,
      content: templateForm.content,
      variables,
      category: templateForm.category,
      status: 'pending',
    };

    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template created successfully');
    setIsTemplateModalOpen(false);
    setTemplateForm({ name: '', content: '', category: 'utility' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      sent: 'default',
      delivered: 'default',
      read: 'default',
      failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!hasPermission('customer_care_access')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access WhatsApp module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business API</h1>
          <p className="text-gray-600">Send messages and manage WhatsApp communication</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
            {config.isEnabled ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Message History</h2>
            <Button onClick={() => setIsMessageModalOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>

          <div className="grid gap-4">
            {messages.map((message) => (
              <Card key={message.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{message.to}</span>
                        {getStatusIcon(message.status)}
                        {getStatusBadge(message.status)}
                      </div>
                      <p className="text-gray-700 mb-2">{message.message}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                        <Badge variant="outline">{message.type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Message Templates</h2>
            <Button onClick={() => setIsTemplateModalOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant={template.status === 'approved' ? 'default' : 'secondary'}>
                        {template.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">{template.content}</p>
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">247</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.3%</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Message Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Send a message or use a template to communicate with clients.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={messageForm.to}
                onChange={(e) => setMessageForm({ ...messageForm, to: e.target.value })}
                placeholder="+1234567890"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right">
                Template
              </Label>
              <Select
                value={messageForm.templateId}
                onValueChange={(value) => setMessageForm({ ...messageForm, templateId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.status === 'approved').map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={messageForm.message}
                onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                placeholder="Enter your message..."
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Message Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for WhatsApp messages. Use {`{{variable}}`} for dynamic content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">
                Name
              </Label>
              <Input
                id="templateName"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="template_name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={templateForm.category}
                onValueChange={(value: 'marketing' | 'utility' | 'authentication') => 
                  setTemplateForm({ ...templateForm, category: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateContent" className="text-right">
                Content
              </Label>
              <Textarea
                id="templateContent"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder="Hello {{name}}, your appointment is on {{date}}..."
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>WhatsApp API Configuration</DialogTitle>
            <DialogDescription>
              Configure your WhatsApp Business API settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.isEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
              />
              <Label>Enable WhatsApp API</Label>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumberId" className="text-right">
                Phone Number ID
              </Label>
              <Input
                id="phoneNumberId"
                value={config.phoneNumberId}
                onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accessToken" className="text-right">
                Access Token
              </Label>
              <Input
                id="accessToken"
                type="password"
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessAccountId" className="text-right">
                Business Account ID
              </Label>
              <Input
                id="businessAccountId"
                value={config.businessAccountId}
                onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="webhookUrl" className="text-right">
                Webhook URL
              </Label>
              <Input
                id="webhookUrl"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="verifyToken" className="text-right">
                Verify Token
              </Label>
              <Input
                id="verifyToken"
                value={config.verifyToken}
                onChange={(e) => setConfig({ ...config, verifyToken: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfiguration}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppModule;