import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const missingApiUrlMessage = 'Backend API URL is missing. Set VITE_API_URL in FRONTEND/.env.local.';
  const missingGoogleClientIdMessage = 'Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in FRONTEND/.env.local.';

  const getApiUrlOrError = useCallback(() => {
    if (!API_URL) {
      return { error: missingApiUrlMessage };
    }
    return { url: API_URL };
  }, [API_URL]);

  const getRequestError = useCallback((error, fallback) => {
    if (error.response?.data?.error) return error.response.data.error;
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the server. Start the backend API on http://localhost:4000 and try again.';
    }
    return fallback;
  }, []);

  const isGoogleAuthConfigured =
    typeof GOOGLE_CLIENT_ID === 'string' &&
    GOOGLE_CLIENT_ID.trim().endsWith('.apps.googleusercontent.com');

  // ── Set token in state, localStorage, and axios defaults ──────────────────
  const applyToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
    }
    setToken(newToken);
  }, []);

  // ── Fetch current user from /api/auth/me ───────────────────────────────
  const fetchUser = useCallback(async (accessToken) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(response.data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        const refreshed = await attemptRefresh();
        if (!refreshed) {
          applyToken(null);
          setUser(null);
        }
      } else {
        applyToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  // ── Attempt token refresh ───────────────────────────────────────────────
  async function attemptRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken || !API_URL) return false;

    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
      const { token: newAccess, refreshToken: newRefresh, user: freshUser } = response.data;
      applyToken(newAccess);
      localStorage.setItem('refreshToken', newRefresh);
      setUser(freshUser);
      return true;
    } catch {
      return false;
    }
  }

  // ── On mount / token change ─────────────────────────────────────────────
  useEffect(() => {
    if (token && API_URL) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, API_URL, fetchUser]);

  // ── Register (email + password) ─────────────────────────────────────────
  const register = async (name, email, password, phone) => {
    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError, redirectToLogin: false };

    try {
      const response = await axios.post(`${url}/api/auth/register`, { name, email, password, phone });
      const { token: accessToken, refreshToken, user: newUser } = response.data;
      applyToken(accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      const data = error.response?.data;
      return {
        success: false,
        error: data?.error || getRequestError(error, 'Registration failed.'),
        redirectToLogin: data?.redirectToLogin || false,
      };
    }
  };

  // ── Login (email + password) ────────────────────────────────────────────
  const login = async (email, password) => {
    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError };

    try {
      const response = await axios.post(`${url}/api/auth/login`, { email, password });
      const { token: accessToken, refreshToken, user: loggedInUser } = response.data;
      applyToken(accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      return { success: false, error: getRequestError(error, 'Login failed.') };
    }
  };

  // ── Login (phone + password) ────────────────────────────────────────────
  const loginWithPhone = async (phone, password) => {
    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError };

    try {
      const response = await axios.post(`${url}/api/auth/login-phone`, { phone, password });
      const { token: accessToken, refreshToken, user: loggedInUser } = response.data;
      applyToken(accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      return { success: false, error: getRequestError(error, 'Login failed.') };
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────
  const googleLogin = async (credential) => {
    if (!isGoogleAuthConfigured) {
      return { success: false, error: missingGoogleClientIdMessage };
    }

    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError };

    try {
      const response = await axios.post(`${url}/api/auth/google`, {
        credential,
        clientId: GOOGLE_CLIENT_ID,
      });
      const { token: accessToken, refreshToken, user: loggedInUser } = response.data;
      applyToken(accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      return { success: false, error: getRequestError(error, 'Google login failed.') };
    }
  };

  // ── Send Phone OTP ──────────────────────────────────────────────────────
  const sendOtp = async (phone) => {
    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError };

    try {
      const response = await axios.post(`${url}/api/auth/send-otp`, { phone });
      return { success: true, message: response.data.message, dev_otp: response.data.dev_otp };
    } catch (error) {
      return { success: false, error: getRequestError(error, 'Failed to send OTP.') };
    }
  };

  // ── Verify Phone OTP ────────────────────────────────────────────────────
  const verifyOtp = async (phone, otp) => {
    const { url, error: urlError } = getApiUrlOrError();
    if (urlError) return { success: false, error: urlError };

    try {
      const response = await axios.post(`${url}/api/auth/verify-otp`, { phone, otp });
      const { token: accessToken, refreshToken, user: loggedInUser } = response.data;
      applyToken(accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      return { success: false, error: getRequestError(error, 'OTP verification failed.') };
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = () => {
    applyToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithPhone,
        register,
        googleLogin,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
