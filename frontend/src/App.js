import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-toastify/dist/ReactToastify.minimal.css';
import AppRouter from './routes/AppRouter';
import { selectIsAuthenticated, selectAuthRole, checkAuth, clearLoading } from './redux/slices/authSlice';
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
  '/contact'
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

    // Skip auth logic for public routes
    if (isPublicRoute) {
      console.log(`🌐 Public route accessed: ${location.pathname}`);
      return;
    }

    // Temporarily disable automatic redirects to debug the component error
    /*
    // If authenticated, at root path, and has a role, redirect to appropriate dashboard
    if (isAuthenticated && location.pathname === '/') {
      switch (role) {
        case 'superadmin':
          console.log('AuthGuard: Redirecting superadmin to dashboard');
          navigate('/superadmin/dashboard');
          break;
        case 'hotel':
          navigate('/hotel/dashboard');
          break;
        case 'service':
          navigate('/service/dashboard');
          break;
        default:
          // For guests, stay on homepage
          break;
      }
    }
    */
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
        {/* <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        /> */}
      </BrowserRouter>
    </div>
  );
}

export default App;
