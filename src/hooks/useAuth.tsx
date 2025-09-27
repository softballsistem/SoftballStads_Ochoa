import React, { useState, useEffect, createContext, useContext } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType, UserProfile } from '../types/auth';
import { determineRole, generatePlayerId, hasPermission, type Permission } from '../config/roles';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to load session');
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Auth initialization error:', err);
          setError('Failed to initialize authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initialized) return;

      setError(null);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      setLoading(true);
      
      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('uid', supabaseUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Failed to load user profile');
      }

      let userProfile: UserProfile;

      if (!existingProfile) {
        // Create new user profile
        const role = determineRole(supabaseUser.email || '');
        const playerId = generatePlayerId();
        
        let username = supabaseUser.email?.split('@')[0] || 'user';
        
        // Special handling for super user
        if (supabaseUser.email === 'hedrichdev@gmail.com') {
          username = 'HedrichDev';
        }
        
        // Ensure username is unique
        const { data: existingUsername } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('username', username)
          .single();
          
        if (existingUsername) {
          username = `${username}_${Date.now().toString().slice(-4)}`;
        }
        
        const newProfile = {
          uid: supabaseUser.id,
          email: supabaseUser.email || '',
          username,
          role,
          player_id: playerId,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          throw new Error('Failed to create user profile');
        }

        userProfile = createdProfile;
      } else {
        userProfile = existingProfile;
      }

      // Convert to app format
      const appUser: User = {
        uid: userProfile.uid,
        email: userProfile.email,
        username: userProfile.username,
        role: userProfile.role as User['role'],
        playerId: userProfile.player_id,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at,
      };

      setUser(appUser);
    } catch (error) {
      console.error('Profile loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    setError(null);
    setLoading(true);
    
    try {
      // Try to sign in with email first
      let result = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });

      // If failed and input doesn't contain @, try to find user by username
      if (result.error && !emailOrUsername.includes('@')) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .single();

        if (userProfile) {
          result = await supabase.auth.signInWithPassword({
            email: userProfile.email,
            password,
          });
        }
      }

      if (result.error) {
        setLoading(false);
        return { error: result.error.message };
      }

      // Don't set loading to false here - let the auth state change handle it
      return { data: result.data };
    } catch (error) {
      setLoading(false);
      return { error: 'An unexpected error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setError(null);
    setLoading(true);
    
    try {
      if (!email || !password || !username) {
        setLoading(false);
        return { error: 'All fields are required' };
      }

      if (password.length < 6) {
        setLoading(false);
        return { error: 'Password must be at least 6 characters long' };
      }

      if (username.length < 3) {
        setLoading(false);
        return { error: 'Username must be at least 3 characters long' };
      }

      if (username.includes(' ')) {
        setLoading(false);
        return { error: 'Username cannot contain spaces. Use underscores instead.' };
      }

      // Check if username is unique
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        setLoading(false);
        return { error: 'Username already exists' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      setLoading(false);
      return { data };
    } catch (error) {
      setLoading(false);
      return { error: 'An unexpected error occurred during sign up' };
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      return { error: 'An unexpected error occurred with Google sign in' };
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return { error: 'Not authenticated' };

    setError(null);
    
    try {
      if (newUsername.includes(' ')) {
        return { error: 'Username cannot contain spaces. Use underscores instead.' };
      }

      if (newUsername.length < 3) {
        return { error: 'Username must be at least 3 characters long' };
      }

      // Check if username is unique
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', newUsername)
        .neq('uid', user.uid)
        .single();

      if (existingUser) {
        return { error: 'Username already exists' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          username: newUsername, 
          updated_at: new Date().toISOString() 
        })
        .eq('uid', user.uid);

      if (error) {
        return { error: error.message };
      }

      setUser({ ...user, username: newUsername });
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      } else {
        setUser(null);
      }
    } catch (error) {
      setError('An unexpected error occurred during sign out');
    }
  };

  const checkPermission = (requiredPermission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user.role, requiredPermission);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUsername,
    hasPermission: checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}