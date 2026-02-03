import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Shield, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { requestLocation } = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    // First request location access
    if (!locationRequested) {
      setIsLoading(true);
      const locationGranted = await requestLocation();
      setLocationRequested(true);
      
      if (!locationGranted) {
        toast.error('Location access is required to login. Please enable location services.');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        toast.success('Login successful!');
      } else {
        toast.error('Invalid email or password. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Administrator',
      email: 'admin@hdf.com',
      password: 'admin123',
      description: 'Full system access with all permissions'
    },
    {
      role: 'Manager',
      email: 'manager@hdf.com',
      password: 'manager123',
      description: 'Management level access'
    },
    {
      role: 'User',
      email: 'user@hdf.com',
      password: 'user123',
      description: 'Basic user access'
    }
  ];

  const fillDemoAccount = async (email: string, password: string) => {
    setFormData({ email, password });
    
    // Request location when demo account is selected
    if (!locationRequested) {
      const locationGranted = await requestLocation();
      setLocationRequested(locationGranted);
      
      if (!locationGranted) {
        toast.error('Location access is required to login. Please enable location services.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Location Requirement Alert */}
        {!locationRequested && (
          <Alert className="bg-amber-50 border-amber-200">
            <MapPin className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Location access is required for login. You'll be prompted to share your location when you attempt to login.
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">
              Click on any account to auto-fill the login form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account, index) => (
              <div 
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fillDemoAccount(account.email, account.password)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{account.role}</div>
                    <div className="text-xs text-gray-500">{account.email}</div>
                    <div className="text-xs text-gray-400">{account.description}</div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    Click to use
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Help Text */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Use any of the demo accounts above or create new users through the User Management system.
            <br />
            <span className="font-medium text-amber-600">
              Note: Location services must be enabled to maintain your login session.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Login;