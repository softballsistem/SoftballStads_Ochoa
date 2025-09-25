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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setError('Failed to load session');
      }
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setSession(session);
      setError(null);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Loading profile for user:', supabaseUser.email);
      
      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('uid', supabaseUser.id)
        .single();

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
        
        // Generate username from email or use default
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
          console.error('Error creating user profile:', createError);
          throw new Error('Failed to create user profile');
        }

        userProfile = createdProfile;
        console.log('Created new profile:', userProfile);
      } else {
        // Verify and update role if necessary
        const expectedRole = determineRole(supabaseUser.email || '');
        
        if (existingProfile.role !== expectedRole) {
          console.log('Updating role from', existingProfile.role, 'to', expectedRole);
          
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              role: expectedRole, 
              updated_at: new Date().toISOString() 
            })
            .eq('uid', supabaseUser.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user role:', updateError);
            userProfile = existingProfile;
          } else {
            userProfile = updatedProfile;
          }
        } else {
          userProfile = existingProfile;
        }
      }

      // Convert database format to app format
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
      console.log('User profile loaded successfully:', appUser);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Attempting sign in for:', emailOrUsername);
      
      // Try to sign in with email first
      let result = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });

      // If failed and input doesn't contain @, try to find user by username
      if (result.error && !emailOrUsername.includes('@')) {
        console.log('Trying to find user by username:', emailOrUsername);
        
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .single();

        if (userProfile) {
          console.log('Found user by username, trying email:', userProfile.email);
          result = await supabase.auth.signInWithPassword({
            email: userProfile.email,
            password,
          });
        }
      }

      if (result.error) {
        console.error('Sign in error:', result.error);
        return { error: result.error.message };
      }

      console.log('Sign in successful');
      return { data: result.data };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error: 'An unexpected error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Attempting sign up for:', email, username);
      
      // Validate inputs
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
        .single();

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
        console.error('Sign up error:', error);
        return { error: error.message };
      }

      console.log('Sign up successful');
      return { data };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error: 'An unexpected error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected Google sign in error:', error);
      return { error: 'An unexpected error occurred with Google sign in' };
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return { error: 'Not authenticated' };

    setError(null);
    
    try {
      // Validate username format
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
        console.error('Update username error:', error);
        return { error: error.message };
      }

      setUser({ ...user, username: newUsername });
      return {};
    } catch (error) {
      console.error('Unexpected update username error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        console.log('Sign out successful');
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
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