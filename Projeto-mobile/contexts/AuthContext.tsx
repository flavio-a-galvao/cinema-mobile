import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { login } from '@/services/authService';
import { removeToken, saveToken } from '@/services/authStorage';
import type { AuthState } from '@/types/auth';

type AuthContextValue = {
  authState: AuthState;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const unauthenticatedState: AuthState = {
  status: 'unauthenticated',
  user: null,
  token: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>(unauthenticatedState);
  const operationPending = useRef(false);

  const signIn = useCallback(async (email: string, senha: string): Promise<void> => {
    if (operationPending.current) {
      throw new Error('Uma operação de autenticação já está em andamento.');
    }

    operationPending.current = true;
    try {
      const session = await login(email, senha);
      await saveToken(session.token);
      setAuthState({ status: 'authenticated', ...session });
    } finally {
      operationPending.current = false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (operationPending.current) {
      throw new Error('Uma operação de autenticação já está em andamento.');
    }

    operationPending.current = true;
    try {
      await removeToken();
      setAuthState(unauthenticatedState);
    } finally {
      operationPending.current = false;
    }
  }, []);

  const value = useMemo(() => ({ authState, signIn, signOut }), [authState, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
