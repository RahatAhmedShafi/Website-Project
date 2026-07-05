import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token to API requests header
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, university, district) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, university, district })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (name, email, googleId, imageUrl) => {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, googleId, imageUrl })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Google Login failed');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Profile update failed');
    }

    setUser(data);
    return data;
  };

  const followUser = async (targetId) => {
    const response = await fetch(`/api/auth/users/${targetId}/follow`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Follow user failed');
    }

    // Refresh current user to update following array
    const userMeResponse = await fetch('/api/auth/me', { headers: getHeaders() });
    if (userMeResponse.ok) {
      const u = await userMeResponse.json();
      setUser(u);
    }
    return data.followed;
  };

  const sendFriendRequest = async (targetId) => {
    const response = await fetch(`/api/auth/users/${targetId}/friend-request`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Friend request failed');
    }

    // Refresh current user
    const userMeResponse = await fetch('/api/auth/me', { headers: getHeaders() });
    if (userMeResponse.ok) {
      const u = await userMeResponse.json();
      setUser(u);
    }
    return data.status;
  };

  const acceptFriendRequest = async (targetId) => {
    const response = await fetch(`/api/auth/users/${targetId}/accept-friend`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Accept friend request failed');
    }

    // Refresh current user
    const userMeResponse = await fetch('/api/auth/me', { headers: getHeaders() });
    if (userMeResponse.ok) {
      const u = await userMeResponse.json();
      setUser(u);
    }
    return data.status;
  };

  const declineFriendRequest = async (targetId) => {
    const response = await fetch(`/api/auth/users/${targetId}/decline-friend`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Decline friend request failed');
    }

    // Refresh current user
    const userMeResponse = await fetch('/api/auth/me', { headers: getHeaders() });
    if (userMeResponse.ok) {
      const u = await userMeResponse.json();
      setUser(u);
    }
    return data.status;
  };

  const unfriendUser = async (targetId) => {
    const response = await fetch(`/api/auth/users/${targetId}/unfriend`, {
      method: 'POST',
      headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unfriend operation failed');
    }

    // Refresh current user
    const userMeResponse = await fetch('/api/auth/me', { headers: getHeaders() });
    if (userMeResponse.ok) {
      const u = await userMeResponse.json();
      setUser(u);
    }
    return data.status;
  };

  const getFriends = async () => {
    const response = await fetch('/api/auth/friends', { headers: getHeaders() });
    if (response.ok) {
      return await response.json();
    }
    return [];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, updateProfile, followUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest, unfriendUser, getFriends, getHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};
