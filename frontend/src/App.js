import React, { useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './routes/AppRouter';
import { selectIsAuthenticated, selectAuthRole, hydrateAuth } from './redux/slices/authSlice';
import AuthDebugger from './components/debug/AuthDebugger';
import './App.css';

// Route guard component
const AuthGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectAuthRole);

  useEffect(() => {
    console.log('AuthGuard running with:', { isAuthenticated, role, path: location.pathname });

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

  // Log app initialization and hydrate auth state
  useEffect(() => {
    console.log('Hotel Service Platform initialized');
    console.log('Hydrating authentication state from localStorage...');
    dispatch(hydrateAuth());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-background-default">
      <BrowserRouter>
        <AuthGuard />
        <AuthDebugger />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
