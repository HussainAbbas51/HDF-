import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, User, Calendar, Navigation, CheckCircle, AlertCircle, Users, Building2, Eye, Plus, Search, Filter, Phone, Mail, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  type: 'individual' | 'corporate';
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  registrationDate?: string;
  status?: string;
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
}

interface FieldVisit {
  id: string;
  visitType: 'client' | 'farmer';
  targetId: string;
  targetName: string;
  targetPhone?: string;
  targetAddress?: string;
  assignedUserId: string;
  assignedUserName: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
  };
  liveLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    isTracking: boolean;
  };
  startPhoto?: string;
  notes: string;
  purpose: string;
  duration?: number;
  createdAt: string;
  completedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  roleId?: string;
  status?: string;
}

export default function FieldVisitModule() {
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('visits');

  // Camera support
  const [showCamera, setShowCamera] = useState(false);
  const [visitToStart, setVisitToStart] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string>('');

  const [formData, setFormData] = useState({
    visitType: 'client' as 'client' | 'farmer',
    targetId: '',
    assignedUserId: '',
    scheduledDate: '',
    purpose: '',
    notes: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
    startLocationTracking();
  }, []);

  const loadData = () => {
    try {
      // Load clients from localStorage
      const savedClients = localStorage.getItem('hdf_clients');
      if (savedClients) {
        const clientData = JSON.parse(savedClients);
        setClients(clientData);
      }

      // Load farmers from localStorage
      const savedFarmers = localStorage.getItem('hdf_farmers');
      if (savedFarmers) {
        const farmerData = JSON.parse(savedFarmers);
        setFarmers(farmerData);
      }

      // Load users from localStorage
      const savedUsers = localStorage.getItem('hdf_users');
      if (savedUsers) {
        const userData = JSON.parse(savedUsers);
        setUsers(userData);
      }

      // Load visits from localStorage
      const savedVisits = localStorage.getItem('hdf_field_visits');
      if (savedVisits) {
        const visitData = JSON.parse(savedVisits);
        setVisits(visitData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          // Update live location for in-progress visits
          setVisits(prev => prev.map(visit => {
            if (visit.status === 'in-progress' && selectedVisit === visit.id) {
              return {
                ...visit,
                liveLocation: {
                  latitude,
                  longitude,
                  timestamp: new Date().toISOString(),
                  isTracking: true
                }
              };
            }
            return visit;
          }));
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  };

  const getTargetOptions = () => {
    if (formData.visitType === 'client') {
      return clients.filter(client => !client.status || client.status === 'active');
    } else {
      return farmers.filter(farmer => !farmer.status || farmer.status === 'active');
    }
  };

  const handleCreateVisit = () => {
    if (!formData.targetId || !formData.assignedUserId || !formData.scheduledDate || !formData.purpose) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const target = formData.visitType === 'client'
      ? clients.find(c => c.id === formData.targetId)
      : farmers.find(f => f.id === formData.targetId);

    const assignedUser = users.find(u => u.id === formData.assignedUserId);

    if (!target || !assignedUser) {
      toast.error('Invalid target or assigned user.');
      return;
    }

    const newVisit: FieldVisit = {
      id: `V${Date.now()}`,
      visitType: formData.visitType,
      targetId: formData.targetId,
      targetName: target.name,
      targetPhone: target.phone || '',
      targetAddress: target.address || '',
      assignedUserId: formData.assignedUserId,
      assignedUserName: assignedUser.name,
      scheduledDate: formData.scheduledDate,
      status: 'scheduled',
      purpose: formData.purpose,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updatedVisits = [newVisit, ...visits];
    setVisits(updatedVisits);
    localStorage.setItem('hdf_field_visits', JSON.stringify(updatedVisits));

    setShowCreateForm(false);
    setFormData({
      visitType: 'client',
      targetId: '',
      assignedUserId: '',
      scheduledDate: '',
      purpose: '',
      notes: ''
    });

    toast.success('Field visit scheduled successfully!');
  };

  const initiateVisitStart = (visitId: string) => {
    if (!currentLocation) {
      toast.error('Unable to get current location. Please enable location services.');
      return;
    }
    setVisitToStart(visitId);
    setShowCamera(true);
    setCameraError('');
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (showCamera) {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraError('');
        } catch (err) {
          console.error("Camera error:", err);
          setCameraError('Unable to access camera. Please ensure permissions are granted.');
          // Fallback if camera fails? For now, we enforce it as per user request.
        }
      };
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const captureAndStartVisit = () => {
    if (!visitToStart || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);

      // Proceed to start visit with photo
      startVisit(visitToStart, photoData);

      // Close camera
      setShowCamera(false);
      setVisitToStart(null);
    }
  };

  const startVisit = (visitId: string, startPhoto?: string) => {
    if (!currentLocation) {
      toast.error('Unable to get current location.');
      return;
    }

    setSelectedVisit(visitId);
    setIsTracking(true);

    const updatedVisits = visits.map(visit =>
      visit.id === visitId
        ? {
          ...visit,
          status: 'in-progress' as const,
          startPhoto: startPhoto,
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: `Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}`,
            timestamp: new Date().toISOString()
          }
        }
        : visit
    );

    setVisits(updatedVisits);
    localStorage.setItem('hdf_field_visits', JSON.stringify(updatedVisits));
    toast.success('Visit started! Photo captured & location tracking enabled.');
  };

  const completeVisit = (visitId: string) => {
    if (!currentLocation) {
      toast.error('Unable to get current location.');
      return;
    }

    const visit = visits.find(v => v.id === visitId);
    if (!visit || !visit.location) {
      toast.error('Visit location not found.');
      return;
    }

    const startTime = new Date(visit.location.timestamp);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes

    const updatedVisits = visits.map(v =>
      v.id === visitId
        ? {
          ...v,
          status: 'completed' as const,
          duration,
          completedAt: new Date().toISOString(),
          liveLocation: undefined
        }
        : v
    );

    setVisits(updatedVisits);
    localStorage.setItem('hdf_field_visits', JSON.stringify(updatedVisits));
    setSelectedVisit(null);
    setIsTracking(false);
    toast.success('Visit completed successfully!');
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.assignedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <Navigation className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden max-w-lg w-full relative">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Take Visit Photo
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCamera(false)}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
              {cameraError ? (
                <div className="text-red-500 p-4 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-4 bg-gray-100 flex justify-center">
              <Button
                onClick={captureAndStartVisit}
                disabled={!!cameraError}
                className="w-full max-w-xs py-6 text-lg"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">Capture & Start Visit</span>
                  <span className="text-xs opacity-90 font-normal">Photo required to proceed</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Visit Management</h1>
          <p className="text-gray-600 mt-2">Manage field visits with live location tracking and easy scheduling</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule New Visit
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visits">Field Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
          <TabsTrigger value="farmers">Farmers ({farmers.length})</TabsTrigger>
          <TabsTrigger value="users">Field Agents ({users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search visits by client, agent, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Visit Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule New Field Visit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visitType">Visit Type *</Label>
                    <Select
                      value={formData.visitType}
                      onValueChange={(value: 'client' | 'farmer') =>
                        setFormData(prev => ({ ...prev, visitType: value, targetId: '' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2" />
                            Client Visit
                          </div>
                        </SelectItem>
                        <SelectItem value="farmer">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Farmer Visit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target">Select {formData.visitType === 'client' ? 'Client' : 'Farmer'} *</Label>
                    <Select
                      value={formData.targetId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, targetId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Choose ${formData.visitType}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getTargetOptions().length === 0 ? (
                          <SelectItem value="no-options" disabled>
                            No {formData.visitType}s available. Please add {formData.visitType}s first.
                          </SelectItem>
                        ) : (
                          getTargetOptions().map((target) => (
                            <SelectItem key={target.id} value={target.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{target.name}</span>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {target.phone && (
                                    <span className="flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {target.phone}
                                    </span>
                                  )}
                                  {'email' in target && target.email && (
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {target.email}
                                    </span>
                                  )}
                                </div>
                                {target.address && (
                                  <span className="text-xs text-gray-400 truncate">{target.address}</span>
                                )}
                                {formData.visitType === 'farmer' && (target as Farmer).animalName && (
                                  <span className="text-xs text-blue-600">🐄 {(target as Farmer).animalName}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assignedUser">Assign Field Agent *</Label>
                    <Select
                      value={formData.assignedUserId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedUserId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(user => !user.status || user.status === 'active').length === 0 ? (
                          <SelectItem value="no-users" disabled>
                            No field agents available. Please add users first.
                          </SelectItem>
                        ) : (
                          users.filter(user => !user.status || user.status === 'active').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{user.name}</span>
                                <span className="text-xs text-gray-500">{user.role || 'Field Agent'} • {user.email}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date & Time *</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Visit Purpose *</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Product demonstration, Contract discussion, Equipment consultation"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information or special instructions"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCreateVisit}>Schedule Visit</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visits List */}
          <div className="grid gap-4">
            {filteredVisits.map((visit) => (
              <Card key={visit.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className={getStatusColor(visit.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(visit.status)}
                            <span className="capitalize">{visit.status.replace('-', ' ')}</span>
                          </div>
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {visit.visitType === 'client' ? <Building2 className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                          {visit.visitType}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {visit.targetName}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Agent: {visit.assignedUserName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(visit.scheduledDate).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {visit.targetPhone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{visit.targetPhone}</span>
                            </div>
                          )}
                          {visit.targetAddress && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{visit.targetAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Purpose:</p>
                        <p className="text-sm text-gray-600">{visit.purpose}</p>
                      </div>

                      {visit.liveLocation && visit.liveLocation.isTracking && (
                        <div className="bg-green-50 p-3 rounded-lg mb-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium text-green-700">Live Location:</span>
                            <span className="text-green-600">
                              Lat: {visit.liveLocation.latitude.toFixed(4)}, Lng: {visit.liveLocation.longitude.toFixed(4)}
                            </span>
                          </div>
                          <div className="text-xs text-green-500 mt-1">
                            Last updated: {new Date(visit.liveLocation.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      )}

                      {visit.location && visit.status === 'completed' && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700">Visit Completed:</span>
                            <span className="text-blue-600">{visit.location.address}</span>
                          </div>
                          <div className="text-xs text-blue-500 mt-1">
                            Duration: {visit.duration} minutes • Completed: {visit.completedAt ? new Date(visit.completedAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      )}

                      {visit.notes && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                          <span className="font-medium">Notes:</span> {visit.notes}
                        </p>
                      )}

                      {visit.startPhoto && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Visit Start Photo:</p>
                          <img
                            src={visit.startPhoto}
                            alt="Visit Start"
                            className="h-24 w-auto rounded-md border border-gray-200 object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {visit.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => initiateVisitStart(visit.id)}
                          className="whitespace-nowrap"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Start Visit
                        </Button>
                      )}

                      {visit.status === 'in-progress' && selectedVisit === visit.id && (
                        <Button
                          size="sm"
                          onClick={() => completeVisit(visit.id)}
                          className="whitespace-nowrap bg-green-600 hover:bg-green-700"
                        >
                          Complete Visit
                        </Button>
                      )}

                      {(visit.location || visit.liveLocation) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const location = visit.liveLocation || visit.location;
                            if (location) {
                              const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                              window.open(url, '_blank');
                            }
                          }}
                          className="whitespace-nowrap"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Location
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVisits.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Field Visits Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No visits match your current filters.'
                    : 'Schedule your first field visit to get started.'
                  }
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Schedule Visit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4">
            {clients.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                  <p className="text-gray-600 mb-4">Add clients through the Client Management module first.</p>
                  <Button onClick={() => window.location.href = '/clients'}>
                    Go to Client Management
                  </Button>
                </CardContent>
              </Card>
            ) : (
              clients.map((client) => (
                <Card key={client.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <Badge variant="outline" className="mb-2 capitalize">
                          <Building2 className="h-3 w-3 mr-1" />
                          {client.type}
                        </Badge>
                        <div className="space-y-1 text-sm text-gray-600">
                          {client.phone && <p>📞 {client.phone}</p>}
                          {client.email && <p>✉️ {client.email}</p>}
                          {client.address && <p>📍 {client.address}</p>}
                          {client.area && <p>🗺️ Area: {client.area}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, visitType: 'client', targetId: client.id }));
                          setShowCreateForm(true);
                          setActiveTab('visits');
                        }}
                      >
                        Schedule Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="farmers" className="space-y-4">
          <div className="grid gap-4">
            {farmers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Farmers Found</h3>
                  <p className="text-gray-600 mb-4">Add farmers through the Client Management module first.</p>
                  <Button onClick={() => window.location.href = '/clients'}>
                    Go to Client Management
                  </Button>
                </CardContent>
              </Card>
            ) : (
              farmers.map((farmer) => (
                <Card key={farmer.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{farmer.name}</h3>
                        {farmer.animalName && (
                          <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                            🐄 {farmer.animalName}
                          </Badge>
                        )}
                        <div className="space-y-1 text-sm text-gray-600">
                          {farmer.phone && <p>📞 {farmer.phone}</p>}
                          {farmer.address && <p>📍 {farmer.address}</p>}
                          {farmer.fodder && <p>🌾 Fodder: {farmer.fodder}</p>}
                          {farmer.price > 0 && <p className="font-medium text-green-700">💰 Price: ${farmer.price}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, visitType: 'farmer', targetId: farmer.id }));
                          setShowCreateForm(true);
                          setActiveTab('visits');
                        }}
                      >
                        Schedule Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {users.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Field Agents Found</h3>
                  <p className="text-gray-600 mb-4">Add users through the User Management module first.</p>
                  <Button onClick={() => window.location.href = '/admin/users'}>
                    Go to User Management
                  </Button>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge variant="outline" className="mb-2">
                          {user.role || 'Field Agent'}
                        </Badge>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>✉️ {user.email}</p>
                          <p>📊 Active Visits: {visits.filter(v => v.assignedUserId === user.id && v.status !== 'completed').length}</p>
                          <p>✅ Completed Visits: {visits.filter(v => v.assignedUserId === user.id && v.status === 'completed').length}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}