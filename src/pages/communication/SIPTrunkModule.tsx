import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';

interface SIPCall {
  id: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: 'ringing' | 'connected' | 'ended' | 'failed' | 'busy';
  duration: number;
  timestamp: string;
  recording?: string;
}

interface SIPTrunk {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  isEnabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  registrationStatus: 'registered' | 'unregistered' | 'registering';
}

interface SIPExtension {
  id: string;
  extension: string;
  name: string;
  email: string;
  isEnabled: boolean;
  status: 'online' | 'offline' | 'busy' | 'away';
  trunkId: string;
}

const SIPTrunkModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [calls, setCalls] = useState<SIPCall[]>([]);
  const [trunks, setTrunks] = useState<SIPTrunk[]>([]);
  const [extensions, setExtensions] = useState<SIPExtension[]>([]);
  const [activeCall, setActiveCall] = useState<SIPCall | null>(null);

  // Modal states
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isTrunkModalOpen, setIsTrunkModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [editingTrunk, setEditingTrunk] = useState<string | null>(null);
  const [editingExtension, setEditingExtension] = useState<string | null>(null);

  // Form states
  const [callForm, setCallForm] = useState({
    to: '',
    from: '',
  });

  const [trunkForm, setTrunkForm] = useState({
    name: '',
    host: '',
    port: 5060,
    username: '',
    password: '',
    isEnabled: true,
  });

  const [extensionForm, setExtensionForm] = useState({
    extension: '',
    name: '',
    email: '',
    isEnabled: true,
    trunkId: '',
  });

  // Load initial data
  useEffect(() => {
    loadCalls();
    loadTrunks();
    loadExtensions();
  }, []);

  const loadCalls = () => {
    // Simulate loading call history
    const mockCalls: SIPCall[] = [
      {
        id: '1',
        from: '+1234567890',
        to: '101',
        direction: 'inbound',
        status: 'ended',
        duration: 180,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        recording: 'call_recording_1.wav',
      },
      {
        id: '2',
        from: '102',
        to: '+0987654321',
        direction: 'outbound',
        status: 'ended',
        duration: 240,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    setCalls(mockCalls);
  };

  const loadTrunks = () => {
    // Simulate loading SIP trunks
    const mockTrunks: SIPTrunk[] = [
      {
        id: '1',
        name: 'Primary SIP Trunk',
        host: 'sip.provider.com',
        port: 5060,
        username: 'hdf_user',
        password: '********',
        isEnabled: true,
        status: 'connected',
        registrationStatus: 'registered',
      },
      {
        id: '2',
        name: 'Backup SIP Trunk',
        host: 'backup.sip.provider.com',
        port: 5060,
        username: 'hdf_backup',
        password: '********',
        isEnabled: false,
        status: 'disconnected',
        registrationStatus: 'unregistered',
      },
    ];
    setTrunks(mockTrunks);
  };

  const loadExtensions = () => {
    // Simulate loading extensions
    const mockExtensions: SIPExtension[] = [
      {
        id: '1',
        extension: '101',
        name: 'John Manager',
        email: 'manager@hdf.com',
        isEnabled: true,
        status: 'online',
        trunkId: '1',
      },
      {
        id: '2',
        extension: '102',
        name: 'Jane Staff',
        email: 'staff@hdf.com',
        isEnabled: true,
        status: 'away',
        trunkId: '1',
      },
    ];
    setExtensions(mockExtensions);
  };

  const makeCall = () => {
    if (!callForm.to || !callForm.from) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCall: SIPCall = {
      id: Date.now().toString(),
      from: callForm.from,
      to: callForm.to,
      direction: 'outbound',
      status: 'ringing',
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    setCalls(prev => [newCall, ...prev]);
    setActiveCall(newCall);
    
    // Simulate call progression
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
      setCalls(prev => prev.map(call => 
        call.id === newCall.id ? { ...call, status: 'connected' } : call
      ));
    }, 2000);

    toast.success('Call initiated');
    setIsCallModalOpen(false);
    setCallForm({ to: '', from: '' });
  };

  const endCall = () => {
    if (activeCall) {
      const endedCall = { ...activeCall, status: 'ended' as const, duration: 120 };
      setCalls(prev => prev.map(call => 
        call.id === activeCall.id ? endedCall : call
      ));
      setActiveCall(null);
      toast.success('Call ended');
    }
  };

  const createTrunk = () => {
    if (!trunkForm.name || !trunkForm.host || !trunkForm.username) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTrunk: SIPTrunk = {
      id: Date.now().toString(),
      ...trunkForm,
      status: 'disconnected',
      registrationStatus: 'unregistered',
    };

    if (editingTrunk) {
      setTrunks(prev => prev.map(trunk => 
        trunk.id === editingTrunk ? { ...trunk, ...trunkForm } : trunk
      ));
      toast.success('SIP trunk updated successfully');
    } else {
      setTrunks(prev => [...prev, newTrunk]);
      toast.success('SIP trunk created successfully');
    }

    setIsTrunkModalOpen(false);
    setEditingTrunk(null);
    setTrunkForm({
      name: '',
      host: '',
      port: 5060,
      username: '',
      password: '',
      isEnabled: true,
    });
  };

  const createExtension = () => {
    if (!extensionForm.extension || !extensionForm.name || !extensionForm.trunkId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newExtension: SIPExtension = {
      id: Date.now().toString(),
      ...extensionForm,
      status: 'offline',
    };

    if (editingExtension) {
      setExtensions(prev => prev.map(ext => 
        ext.id === editingExtension ? { ...ext, ...extensionForm } : ext
      ));
      toast.success('Extension updated successfully');
    } else {
      setExtensions(prev => [...prev, newExtension]);
      toast.success('Extension created successfully');
    }

    setIsExtensionModalOpen(false);
    setEditingExtension(null);
    setExtensionForm({
      extension: '',
      name: '',
      email: '',
      isEnabled: true,
      trunkId: '',
    });
  };

  const toggleTrunk = (trunkId: string) => {
    setTrunks(prev => prev.map(trunk => 
      trunk.id === trunkId 
        ? { 
            ...trunk, 
            isEnabled: !trunk.isEnabled,
            status: !trunk.isEnabled ? 'connected' : 'disconnected',
            registrationStatus: !trunk.isEnabled ? 'registered' : 'unregistered'
          }
        : trunk
    ));
    toast.success('Trunk status updated');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'online':
      case 'registered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ringing':
      case 'registering':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'error':
      case 'disconnected':
      case 'unregistered':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      online: 'default',
      registered: 'default',
      ringing: 'secondary',
      registering: 'secondary',
      away: 'secondary',
      busy: 'secondary',
      failed: 'destructive',
      error: 'destructive',
      disconnected: 'destructive',
      unregistered: 'destructive',
      offline: 'outline',
      ended: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission('customer_care_access')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to access SIP Trunk module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SIP Trunk Management</h1>
          <p className="text-gray-600">Manage VoIP calls, trunks, and extensions</p>
        </div>
        <div className="flex items-center space-x-2">
          {activeCall && (
            <Button
              variant="destructive"
              onClick={endCall}
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              End Call
            </Button>
          )}
          <Button
            onClick={() => setIsCallModalOpen(true)}
            disabled={!!activeCall}
          >
            <PhoneOutgoing className="h-4 w-4 mr-2" />
            Make Call
          </Button>
        </div>
      </div>

      {activeCall && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <PhoneCall className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Active Call</span>
                </div>
                <div className="text-sm text-gray-600">
                  {activeCall.from} → {activeCall.to}
                </div>
                {getStatusBadge(activeCall.status)}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {formatDuration(activeCall.duration)}
                </span>
                <Button variant="destructive" size="sm" onClick={endCall}>
                  End Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="trunks">SIP Trunks</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-4">
          <div className="grid gap-4">
            {calls.map((call) => (
              <Card key={call.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="h-4 w-4 text-blue-500" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium">
                          {call.direction === 'inbound' ? call.from : call.to}
                        </span>
                      </div>
                      {getStatusIcon(call.status)}
                      {getStatusBadge(call.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDuration(call.duration)}</span>
                      <span>{new Date(call.timestamp).toLocaleString()}</span>
                      {call.recording && (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trunks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">SIP Trunks</h2>
            <Button onClick={() => setIsTrunkModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Add Trunk
            </Button>
          </div>

          <div className="grid gap-4">
            {trunks.map((trunk) => (
              <Card key={trunk.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{trunk.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(trunk.status)}
                      {getStatusBadge(trunk.registrationStatus)}
                      <Switch
                        checked={trunk.isEnabled}
                        onCheckedChange={() => toggleTrunk(trunk.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Host:</span> {trunk.host}
                    </div>
                    <div>
                      <span className="font-medium">Port:</span> {trunk.port}
                    </div>
                    <div>
                      <span className="font-medium">Username:</span> {trunk.username}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {trunk.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Extensions</h2>
            <Button onClick={() => setIsExtensionModalOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Add Extension
            </Button>
          </div>

          <div className="grid gap-4">
            {extensions.map((extension) => (
              <Card key={extension.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{extension.extension}</span>
                      </div>
                      <div>
                        <p className="font-medium">{extension.name}</p>
                        <p className="text-sm text-gray-500">{extension.email}</p>
                      </div>
                      {getStatusIcon(extension.status)}
                      {getStatusBadge(extension.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {trunks.find(t => t.id === extension.trunkId)?.name || 'Unknown Trunk'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3:42</div>
                <p className="text-xs text-muted-foreground">-0.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Extensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{extensions.filter(e => e.status === 'online').length}</div>
                <p className="text-xs text-muted-foreground">of {extensions.length} total</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Make Call Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Make Call</DialogTitle>
            <DialogDescription>
              Initiate a new call through the SIP trunk.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="from" className="text-right">
                From
              </Label>
              <Select
                value={callForm.from}
                onValueChange={(value) => setCallForm({ ...callForm, from: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select extension" />
                </SelectTrigger>
                <SelectContent>
                  {extensions.filter(e => e.isEnabled).map((extension) => (
                    <SelectItem key={extension.id} value={extension.extension}>
                      {extension.extension} - {extension.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="to" className="text-right">
                To
              </Label>
              <Input
                id="to"
                value={callForm.to}
                onChange={(e) => setCallForm({ ...callForm, to: e.target.value })}
                placeholder="+1234567890 or extension"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={makeCall}>
              <PhoneCall className="h-4 w-4 mr-2" />
              Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Trunk Modal */}
      <Dialog open={isTrunkModalOpen} onOpenChange={setIsTrunkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTrunk ? 'Edit' : 'Add'} SIP Trunk</DialogTitle>
            <DialogDescription>
              Configure SIP trunk connection settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trunkName" className="text-right">
                Name
              </Label>
              <Input
                id="trunkName"
                value={trunkForm.name}
                onChange={(e) => setTrunkForm({ ...trunkForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="host" className="text-right">
                Host
              </Label>
              <Input
                id="host"
                value={trunkForm.host}
                onChange={(e) => setTrunkForm({ ...trunkForm, host: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">
                Port
              </Label>
              <Input
                id="port"
                type="number"
                value={trunkForm.port}
                onChange={(e) => setTrunkForm({ ...trunkForm, port: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={trunkForm.username}
                onChange={(e) => setTrunkForm({ ...trunkForm, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={trunkForm.password}
                onChange={(e) => setTrunkForm({ ...trunkForm, password: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={trunkForm.isEnabled}
                onCheckedChange={(checked) => setTrunkForm({ ...trunkForm, isEnabled: checked })}
              />
              <Label>Enable trunk</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrunkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTrunk}>
              {editingTrunk ? 'Update' : 'Create'} Trunk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Extension Modal */}
      <Dialog open={isExtensionModalOpen} onOpenChange={setIsExtensionModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExtension ? 'Edit' : 'Add'} Extension</DialogTitle>
            <DialogDescription>
              Configure extension settings for users.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extension" className="text-right">
                Extension
              </Label>
              <Input
                id="extension"
                value={extensionForm.extension}
                onChange={(e) => setExtensionForm({ ...extensionForm, extension: e.target.value })}
                placeholder="101"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="extName" className="text-right">
                Name
              </Label>
              <Input
                id="extName"
                value={extensionForm.name}
                onChange={(e) => setExtensionForm({ ...extensionForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={extensionForm.email}
                onChange={(e) => setExtensionForm({ ...extensionForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trunk" className="text-right">
                Trunk
              </Label>
              <Select
                value={extensionForm.trunkId}
                onValueChange={(value) => setExtensionForm({ ...extensionForm, trunkId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select trunk" />
                </SelectTrigger>
                <SelectContent>
                  {trunks.filter(t => t.isEnabled).map((trunk) => (
                    <SelectItem key={trunk.id} value={trunk.id}>
                      {trunk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={extensionForm.isEnabled}
                onCheckedChange={(checked) => setExtensionForm({ ...extensionForm, isEnabled: checked })}
              />
              <Label>Enable extension</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtensionModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createExtension}>
              {editingExtension ? 'Update' : 'Create'} Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SIPTrunkModule;