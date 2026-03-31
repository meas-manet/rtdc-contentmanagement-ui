import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

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
