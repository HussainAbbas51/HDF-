import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Building,
  MapPin,
  ClipboardList,
  PieChart,
  HeadphonesIcon,
  MessageCircle,
  Phone,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Administration',
    href: '/admin',
    icon: Shield,
    permission: 'user_read',
    children: [
      {
        name: 'User Management',
        href: '/admin/users',
        icon: Users,
        permission: 'user_read',
      },
      {
        name: 'Role Management',
        href: '/admin/roles',
        icon: Shield,
        permission: 'role_read',
      },
    ],
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Building,
    permission: 'client_read',
  },
  {
    name: 'Field Visits',
    href: '/field-visits',
    icon: MapPin,
  },
  {
    name: 'Forms',
    href: '/forms',
    icon: ClipboardList,
    permission: 'form_view',
    children: [
      {
        name: 'Form Management',
        href: '/forms',
        icon: ClipboardList,
        permission: 'form_view',
      },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: PieChart,
    permission: 'reports_view',
  },
  {
    name: 'Customer Care',
    href: '/customer-care',
    icon: HeadphonesIcon,
    permission: 'customer_care_access',
  },
  {
    name: 'Communication',
    href: '/communication',
    icon: MessageCircle,
    permission: 'communication_access',
    children: [
      {
        name: 'WhatsApp',
        href: '/communication/whatsapp',
        icon: MessageCircle,
        permission: 'communication_access',
      },
      {
        name: 'SIP Call',
        href: '/communication/sip-trunk',
        icon: Phone,
        permission: 'communication_access',
      },
    ],
  },
];

const DashboardLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleItem = (itemName: string) => {
    setOpenItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const hasAccessToItem = (item: NavigationItem) => {
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    if (item.children) {
      return item.children.some(child => !child.permission || hasPermission(child.permission));
    }
    
    return true;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    if (!hasAccessToItem(item)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isItemOpen = openItems.includes(item.name);
    const itemIsActive = isActive(item.href);

    if (hasChildren) {
      return (
        <div key={item.name} className="mb-1">
          <button
            onClick={() => toggleItem(item.name)}
            className={cn(
              'flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100',
              itemIsActive && 'bg-blue-50 text-blue-700'
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
            {isItemOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isItemOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => 
                hasAccessToItem(child) ? (
                  <Link
                    key={child.name}
                    to={child.href}
                    className={cn(
                      'flex items-center px-4 py-2 text-sm rounded-md transition-colors hover:bg-gray-50',
                      isActive(child.href)
                        ? 'text-blue-600 font-medium bg-blue-50'
                        : 'text-gray-600'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <child.icon className="mr-3 h-4 w-4" />
                    {child.name}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 mb-1',
          itemIsActive && 'bg-blue-50 text-blue-700'
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">HDF System</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <div className="space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>
        </nav>

        {/* User Info - Fixed at bottom */}
        <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.roleId?.replace('-role', '')}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {navigationItems
                .flatMap(item => [item, ...(item.children || [])])
                .find(item => isActive(item.href))?.name || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Online
            </Badge>
          </div>
        </header>

        {/* Page Content - Takes remaining space */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;