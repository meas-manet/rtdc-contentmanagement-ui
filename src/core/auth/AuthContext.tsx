import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function parseJwtPayload(token: string): Record<string, string> {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return {};
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'));

    const login = useCallback((t: string) => {
        localStorage.setItem('jwt', t);
        setToken(t);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('jwt');
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

/** Returns the decoded JWT payload as a plain object, memoised by token value. */
export function useJwtClaims(): Record<string, string> {
    const { token } = useAuth();
    return useMemo(() => (token ? parseJwtPayload(token) : {}), [token]);
}
