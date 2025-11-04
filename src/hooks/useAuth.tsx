import React, { useState, useEffect, createContext } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType, UserProfile } from '../types/auth';
import { determineRole, generatePlayerId, hasPermission, type Permission } from '../config/roles';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let sessionChecked = false;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;
        sessionChecked = true;

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch {
        console.error('Auth initialization error:');
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setError(null);

      if (session?.user) {
        (async () => {
          await loadUserProfile(session.user);
        })();
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
      console.log('Loading user profile for:', supabaseUser.email);

      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('uid', supabaseUser.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', fetchError);
        throw new Error('Failed to load user profile');
      }

      let userProfile: UserProfile;

      if (!existingProfile) {
        console.log('Creating new user profile for:', supabaseUser.email);

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
          .maybeSingle();

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
          console.error('Error creating user profile:', createError);
          throw new Error('Failed to create user profile');
        }

        console.log('User profile created successfully:', createdProfile);
        userProfile = createdProfile;
      } else {
        console.log('Using existing user profile:', existingProfile);
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

      console.log('User profile loaded successfully:', appUser);
      setUser(appUser);
      setLoading(false);
    } catch (error) {
      console.error('Profile loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      setUser(null);
      setLoading(false);
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    setError(null);
    
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
          .maybeSingle();

        if (userProfile) {
          result = await supabase.auth.signInWithPassword({
            email: userProfile.email,
            password,
          });
        }
      }

      if (result.error) {
        return { error: result.error.message };
      }

      return { data: result.data };
    } catch {
      return { error: 'An unexpected error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setError(null);
    
    try {
      if (!email || !password || !username) {
        return { error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
      }

      if (username.length < 3) {
        return { error: 'Username must be at least 3 characters long' };
      }

      if (username.includes(' ')) {
        return { error: 'Username cannot contain spaces. Use underscores instead.' };
      }

      // Check if username is unique
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
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
        return { error: error.message };
      }

      return { data };
    } catch {
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
    } catch {
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
        .maybeSingle();

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
    } catch {
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
    } catch {
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