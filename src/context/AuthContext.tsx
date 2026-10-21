import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useClerk } from '@clerk/react';
import { apiClient, setAuthTokenGetter } from '../services/apiClient';
import { InternalUser, ApprovedRole } from '../types';

interface AuthContextType {
  isClerkLoaded: boolean;
  isSignedIn: boolean;
  isLoadingInternal: boolean;
  isUnauthorized: boolean;
  internalUser: InternalUser | null;
  role: ApprovedRole | null;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: isClerkLoaded, isSignedIn, getToken } = useAuth();
  const { signOut: clerkSignOut } = useClerk();

  const [isLoadingInternal, setIsLoadingInternal] = useState<boolean>(false);
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synchronize token getter with apiClient
  useEffect(() => {
    if (getToken) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [getToken]);

  const fetchInternalProfile = useCallback(async () => {
    if (!isSignedIn) {
      setInternalUser(null);
      setIsUnauthorized(false);
      setAuthError(null);
      return;
    }

    setIsLoadingInternal(true);
    setIsUnauthorized(false);
    setAuthError(null);

    try {
      const response = await apiClient.getMe();
      if (response && response.user) {
        setInternalUser(response.user);
        setIsUnauthorized(false);
        setAuthError(null);
      } else {
        throw new Error('Invalid response structure from authentication service');
      }
    } catch (err: any) {
      console.error('Failed to resolve internal AgentHub user:', err);
      setInternalUser(null);
      setIsUnauthorized(true);
      setAuthError(
        err?.data?.message || err?.message || 'عذراً، هذا الحساب غير مسجل كمستخدم مصرح به في AgentHub.'
      );
    } finally {
      setIsLoadingInternal(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isClerkLoaded && isSignedIn) {
      fetchInternalProfile();
    } else if (isClerkLoaded && !isSignedIn) {
      setInternalUser(null);
      setIsUnauthorized(false);
      setAuthError(null);
      setIsLoadingInternal(false);
    }
  }, [isClerkLoaded, isSignedIn, fetchInternalProfile]);

  const signOut = async () => {
    setInternalUser(null);
    setIsUnauthorized(false);
    setAuthError(null);
    await clerkSignOut();
  };

  const value: AuthContextType = {
    isClerkLoaded,
    isSignedIn: Boolean(isSignedIn),
    isLoadingInternal,
    isUnauthorized,
    internalUser,
    role: internalUser?.role ?? null,
    authError,
    signOut,
    refreshProfile: fetchInternalProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAgentHubAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAgentHubAuth must be used within an AuthProvider');
  }
  return context;
}
