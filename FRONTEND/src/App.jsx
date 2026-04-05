import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Products from './pages/Products';
import NovaAssistant from './pages/NovaAssistant';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import Login from './pages/Login';
import { AuthProvider } from './utils/AuthContext';
import { ToastProvider } from './utils/ToastContext';
import ProtectedRoute from './utils/ProtectedRoute';
import NovaFloatingButton from './components/NovaFloatingButton';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleAuthConfigured =
    typeof googleClientId === 'string' &&
    googleClientId.trim().endsWith('.apps.googleusercontent.com');

  const appContent = (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/nova" element={<NovaAssistant />} />

            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                  <Orders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <NovaFloatingButton />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );

  if (!googleAuthConfigured) {
    return appContent;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{appContent}</GoogleOAuthProvider>;
}

export default App;
