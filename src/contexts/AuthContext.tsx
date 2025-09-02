import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/services/api';

interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getThreads: () => Promise<Thread[]>;
  createThread: (title: string) => Promise<Thread>;
  initializeBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Initialize backend for the user
          initializeBackend(currentSession.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Initialize backend for the user
        initializeBackend(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeBackend = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) return;
    
    try {
      await ApiService.initialize(id);
      console.log('Backend initialized for user:', id);
    } catch (error) {
      console.error('Failed to initialize backend:', error);
      toast({
        title: "Warning",
        description: "Backend initialization failed. Some features may not work properly.",
        variant: "destructive"
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred while signing in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({
        title: "Account created",
        description: "Check your email for the confirmation link",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred while signing up",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  const getThreads = async (): Promise<Thread[]> => {
    if (!user) return [];
    
    try {
      // Get threads from backend
      const response = await ApiService.initialize(user.id);
      if (response.chat_history) {
        return response.chat_history.map(thread => ({
          id: thread.session_id,
          title: thread.thread_title || thread.session_id,
          created_at: thread.timestamp,
          updated_at: thread.timestamp,
          user_id: user.id
        }));
      }
      return [];
    } catch (error: any) {
      toast({
        title: "Error fetching threads",
        description: error.message || "Could not retrieve threads",
        variant: "destructive",
      });
      return [];
    }
  };

  const createThread = async (title: string): Promise<Thread> => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Create session via backend
      const sessionResponse = await ApiService.createSession(user.id);
      
      return {
        id: sessionResponse.session_id,
        title: title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };
    } catch (error: any) {
      toast({
        title: "Error creating thread",
        description: error.message || "Could not create thread",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      getThreads,
      createThread,
      initializeBackend
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};