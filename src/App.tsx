import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import UserManagement from '@/pages/admin/UserManagement';
import RoleManagement from '@/pages/admin/RoleManagement';
import ClientManagement from '@/pages/clients/ClientManagement';
import FormBuilder from '@/pages/forms/FormBuilder';
import FormSubmissions from '@/pages/forms/FormSubmissions';
import DigitalFormManagement from '@/pages/forms/DigitalFormManagement';
import PublicFormView from '@/pages/forms/PublicFormView';
import CustomerCareModule from '@/pages/customer-care/CustomerCareModule';
import ReportsModule from '@/pages/reports/ReportsModule';
import WhatsAppModule from '@/pages/communication/WhatsAppModule';
import SIPTrunkModule from '@/pages/communication/SIPTrunkModule';
import FieldVisitModule from '@/pages/field-visits/FieldVisitModule';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Protected Route Component - Must be inside AuthProvider
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component - Must be inside AuthProvider
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

// App Routes - Must be inside AuthProvider
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Public Form Route - No authentication required */}
      <Route path="/form/:formId" element={<PublicFormView />} />
      
      {/* Protected Routes with Dashboard Layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/roles" element={<RoleManagement />} />
        
        {/* Client Routes */}
        <Route path="clients" element={<ClientManagement />} />
        
        {/* Field Visits Routes */}
        <Route path="field-visits" element={<FieldVisitModule />} />
        
        {/* Form Routes */}
        <Route path="forms" element={<DigitalFormManagement />} />
        <Route path="forms/builder" element={<FormBuilder />} />
        <Route path="forms/submissions" element={<FormSubmissions />} />
        
        {/* Customer Care Routes */}
        <Route path="customer-care" element={<CustomerCareModule />} />
        
        {/* Reports Routes */}
        <Route path="reports" element={<ReportsModule />} />
        
        {/* Communication Routes */}
        <Route path="communication/whatsapp" element={<WhatsAppModule />} />
        <Route path="communication/sip-trunk" element={<SIPTrunkModule />} />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Main App Component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;