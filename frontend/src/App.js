import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import 'react-toastify/dist/ReactToastify.minimal.css';
import AppRouter from './routes/AppRouter';
import { selectIsAuthenticated, selectAuthRole, checkAuth } from './redux/slices/authSlice';
import sessionMonitor from './services/sessionMonitor.service';
import { isProtectedRoute } from './utils/secureLogout';
import { ThemeProvider } from './context/ThemeContext';
import './i18n'; // Initialize i18n
import './App.css';

// Public routes that don't require authentication check
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/superadmin/login',
  '/hotel/login',
  '/hotel/forgot-password',
  '/hotel/reset-password',
  '/serviceprovider/login',
  '/',
  '/hotels',
  '/services',
  '/about',
  '/contact',
  '/guest/payment-success',
  '/guest/payment-failed',
  '/payment-method',
  '/forbidden' // Add forbidden page as public route to prevent loops
];

// Route guard component
const AuthGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);

  useEffect(() => {
    // Check if current path is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (route === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(route);
    });

    // Special handling for forbidden page - redirect authenticated users with proper roles
    if (location.pathname === '/forbidden') {
      if (isAuthenticated && role) {
        // Redirect based on role
        switch (role) {
          case 'service':
            navigate('/service/dashboard');
            break;
          case 'hotel':
            navigate('/hotel/dashboard');
            break;
          case 'superadmin':
            navigate('/superadmin/dashboard');
            break;
          case 'superHotel':
            navigate('/super-hotel-admin/dashboard');
            break;
          default:
            navigate('/');
            break;
        }
        return;
      }
    }

    // Skip auth logic for other public routes
    if (isPublicRoute && location.pathname !== '/forbidden') {
      return;
    }

    // If not authenticated, don't check roles
    if (!isAuthenticated) {
      return;
    }

    // If authenticated but no role yet, wait for role to be loaded
    if (!role) {
      return;
    }



    // Now check role-based access with enhanced protection
    if (location.pathname.startsWith('/service/') && role !== 'service') {
      toast.error(
        `Access Denied: You need Service Provider role to access this area. Your role: ${role}`,
        { duration: 5000, position: 'top-center' }
      );
      setTimeout(() => navigate('/forbidden'), 500);
      return;
    }

    if (location.pathname.startsWith('/hotel/') && role !== 'hotel') {
      toast.error(
        `Access Denied: You need Hotel Admin role to access this area. Your role: ${role}`,
        { duration: 5000, position: 'top-center' }
      );
      setTimeout(() => navigate('/forbidden'), 500);
      return;
    }

    if (location.pathname.startsWith('/superadmin/') && role !== 'superadmin') {
      toast.error(
        `Access Denied: You need Super Admin role to access this area.\n\nYour role: ${role}\n\nPlease check:\n1. Did you log in with correct Super Admin credentials?\n2. Is your account role "superadmin" in database?`,
        { duration: 6000, position: 'top-center' }
      );
      setTimeout(() => navigate('/forbidden'), 500);
      return;
    }

    if (location.pathname.startsWith('/super-hotel-admin/') && role !== 'superHotel') {
      toast.error(
        `Access Denied: You need Super Hotel Admin role to access this area. Your role: ${role}`,
        { duration: 5000, position: 'top-center' }
      );
      setTimeout(() => navigate('/forbidden'), 500);
      return;
    }

    // Additional check for guest-specific routes ONLY (not admin routes)
    // This checks routes like /hotels/:id/services, /my-bookings, etc.
    // We need to exclude admin routes from this check
    const isGuestRoute = isProtectedRoute(location.pathname) &&
                        !location.pathname.startsWith('/service/') &&
                        !location.pathname.startsWith('/hotel/') &&
                        !location.pathname.startsWith('/superadmin/') &&
                        !location.pathname.startsWith('/super-hotel-admin/');

    if (isGuestRoute && role !== 'guest') {
      toast.error(
        `Access Denied: You need Guest role to access this area. Your role: ${role}`,
        { duration: 5000, position: 'top-center' }
      );
      setTimeout(() => navigate('/forbidden'), 500);
      return;
    }

    // Log successful access

  }, [isAuthenticated, role, location.pathname, navigate]);

  return <AppRouter />;
};

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error, role } = useSelector(state => state.auth);

  // Track if we've already attempted initial auth check to prevent loops
  const [initialAuthChecked, setInitialAuthChecked] = React.useState(false);

  // Get current location to check if it's a public route
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  // Update current path when location changes
  React.useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  // Log app initialization and check auth state from cookie
  useEffect(() => {
    // Only run initial auth check once
    if (initialAuthChecked) return;

    // Check if current path is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (route === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(route);
    });

    // Skip auth check for public routes
    if (isPublicRoute) {
      setInitialAuthChecked(true);
      return;
    }

    // Only check auth if we don't already have an auth error or if we're not already loading
    if (!error && !isLoading) {

      // Dispatch checkAuth and log the result
      dispatch(checkAuth()).then((result) => {
        setInitialAuthChecked(true);
      }).catch((error) => {
        setInitialAuthChecked(true);
        // Don't continue making requests if auth failed
      });
    } else {
      setInitialAuthChecked(true);
    }
  }, [dispatch, error, isLoading, initialAuthChecked, user, isAuthenticated, currentPath]);

  // Also log whenever auth state changes
  useEffect(() => {

  }, [user, isAuthenticated, isLoading, error, role]);

  // Session monitoring for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      sessionMonitor.startMonitoring();
    } else {
      sessionMonitor.stopMonitoring();
    }

    // Cleanup function to stop monitoring when component unmounts
    return () => {
      sessionMonitor.stopMonitoring();
    };
  }, [isAuthenticated, user]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background-default">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <BrowserRouter>
          <AuthGuard />
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
