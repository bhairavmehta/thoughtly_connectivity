
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-thoughtly">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-thoughtly-accent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to the auth page but save the intended destination
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};
