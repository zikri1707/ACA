import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom router state
  const [currentPage, setCurrentPage] = useState('landing');
  
  // Toast notifications state
  const [toast, setToast] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    showToast(`Mode ${theme === 'light' ? 'Gelap' : 'Terang'} diaktifkan`, 'info');
  };

  // Fetch user profile on startup
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
          // If on landing/login/register, redirect to dashboard
          if (['landing', 'login', 'register'].includes(currentPage)) {
            setCurrentPage('dashboard');
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login gagal.');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setCurrentPage('dashboard');
      showToast('Selamat datang kembali, ' + data.user.name + '!', 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'danger');
      return false;
    }
  };

  const register = async (name, email, business_name, business_type, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, business_name, business_type, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal.');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setCurrentPage('dashboard');
      showToast('Registrasi berhasil! Selamat datang.', 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'danger');
      return false;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil.');
      }
      setUser(data.user);
      showToast('Profil berhasil diperbarui.', 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'danger');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCurrentPage('landing');
    showToast('Anda berhasil keluar dari sistem.', 'info');
  };

  const navigateTo = (page) => {
    // Auth protection
    if (!token && !['landing', 'login', 'register'].includes(page)) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      currentPage,
      toast,
      theme,
      login,
      register,
      logout,
      updateProfile,
      navigateTo,
      showToast,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
