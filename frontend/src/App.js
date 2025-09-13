import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import 'react-toastify/dist/ReactToastify.minimal.css';
import AppRouter from './routes/AppRouter';
import { selectIsAuthenticated, selectAuthRole, checkAuth } from './redux/slices/authSlice';
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
  '/serviceprovider/login',
  '/',
  '/hotels',
  '/services',
  '/about',
  '/contact',
  '/guest/payment-success',
  '/guest/payment-failed',
  '/forbidden' // Add forbidden page as public route to prevent loops
];

// Route guard component
const AuthGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);

  console.log('🛡️ AuthGuard - Current path:', location.pathname);
  console.log('🛡️ AuthGuard - Auth state:', { isAuthenticated, role });

  useEffect(() => {
    // Check if current path is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      if (route === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(route);
    });

    console.log('🛡️ AuthGuard - Route check:', {
      currentPath: location.pathname,
      isPublicRoute,
      isAuthenticated,
      role
    });

    // Special handling for forbidden page - redirect authenticated users with proper roles
    if (location.pathname === '/forbidden') {
      if (isAuthenticated && role) {
        console.log('🔄 Redirecting authenticated user away from forbidden page');
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
          default:
            navigate('/');
            break;
        }
        return;
      }
    }

    // Skip auth logic for other public routes
    if (isPublicRoute && location.pathname !== '/forbidden') {
      console.log(`🌐 Public route accessed: ${location.pathname}`);
      return;
    }

    // If not authenticated, don't check roles
    if (!isAuthenticated) {
      console.log('⏳ Not authenticated yet, skipping role check');
      return;
    }

    // If authenticated but no role yet, wait for role to be loaded
    if (!role) {
      console.log('⏳ Authenticated but no role yet, waiting...');
      return;
    }

    // Now check role-based access
    if (location.pathname.startsWith('/service/') && role !== 'service') {
      console.log('❌ AuthGuard - Access denied to service route, role:', role);
      navigate('/forbidden');
      return;
    }

    if (location.pathname.startsWith('/hotel/') && role !== 'hotel') {
      console.log('❌ AuthGuard - Access denied to hotel route, role:', role);
      navigate('/forbidden');
      return;
    }

    if (location.pathname.startsWith('/superadmin/') && role !== 'superadmin') {
      console.log('❌ AuthGuard - Access denied to superadmin route, role:', role);
      navigate('/forbidden');
      return;
    }

    console.log('✅ AuthGuard - Route access granted');

  }, [isAuthenticated, role, location.pathname, navigate]);

  return <AppRouter />;
};

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading, error } = useSelector(state => state.auth);

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

    console.log('🚀 Hotel Service Platform initialized');
    console.log('🔍 Initial auth state:', {
      isAuthenticated: isAuthenticated,
      hasUser: !!user,
      isLoading: isLoading,
      hasError: !!error,
      currentPath: currentPath,
      isPublicRoute: isPublicRoute
    });

    // Skip auth check for public routes
    if (isPublicRoute) {
      console.log(`🌐 Skipping auth check for public route: ${currentPath}`);
      setInitialAuthChecked(true);
      return;
    }

    // Only check auth if we don't already have an auth error or if we're not already loading
    if (!error && !isLoading) {
      console.log('🍪 Checking authentication from cookie...');

      // Dispatch checkAuth and log the result
      dispatch(checkAuth()).then((result) => {
        console.log('✅ checkAuth completed successfully');
        setInitialAuthChecked(true);
      }).catch((error) => {
        console.log('❌ checkAuth failed - this is normal for unauthenticated users');
        setInitialAuthChecked(true);
        // Don't continue making requests if auth failed
      });
    } else {
      setInitialAuthChecked(true);
    }
  }, [dispatch, error, isLoading, initialAuthChecked, user, isAuthenticated, currentPath]);

  // Also log whenever auth state changes
  useEffect(() => {
    console.log('🔄 Auth state:', {
      isAuthenticated: isAuthenticated,
      hasUser: !!user,
      userRole: user?.role,
      isLoading: isLoading,
      hasError: !!error
    });
  }, [user, isAuthenticated, isLoading, error]);

  return (
    <div className="min-h-screen bg-background-default">
      <BrowserRouter>
        <AuthGuard />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
