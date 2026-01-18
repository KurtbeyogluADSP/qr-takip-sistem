import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
    isAdmin: boolean;
    isKiosk: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    // Çalışan seçimi için
    selectedUserId: string | null;
    selectedUserName: string | null;
    setSelectedUser: (id: string | null, name: string | null) => void;
    clearSelectedUser: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sabit admin ve kiosk kredansiyalleri
const CREDENTIALS = {
    admin: {
        username: 'admin',
        password: 'admindtberk123'
    },
    kiosk: {
        username: 'kiosk',
        password: 'Kioskadmindtberk123'
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isKiosk, setIsKiosk] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

    useEffect(() => {
        // Sayfa yüklendiğinde localStorage kontrol et
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const kioskLoggedIn = localStorage.getItem('kioskLoggedIn') === 'true';

        setIsAdmin(adminLoggedIn);
        setIsKiosk(kioskLoggedIn);

        // Çalışan seçimi de localStorage'dan
        const storedUserId = localStorage.getItem('selectedUserId');
        const storedUserName = localStorage.getItem('selectedUserName');
        if (storedUserId) {
            setSelectedUserId(storedUserId);
            setSelectedUserName(storedUserName);
        }

        setIsLoading(false);
    }, []);

    const login = (username: string, password: string): boolean => {
        if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.removeItem('kioskLoggedIn');
            setIsAdmin(true);
            setIsKiosk(false);
            return true;
        }

        if (username === CREDENTIALS.kiosk.username && password === CREDENTIALS.kiosk.password) {
            localStorage.setItem('kioskLoggedIn', 'true');
            localStorage.removeItem('adminLoggedIn');
            setIsKiosk(true);
            setIsAdmin(false);
            return true;
        }

        return false;
    };

    const logout = () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('kioskLoggedIn');
        localStorage.removeItem('selectedUserId');
        localStorage.removeItem('selectedUserName');
        setIsAdmin(false);
        setIsKiosk(false);
        setSelectedUserId(null);
        setSelectedUserName(null);
    };

    const setSelectedUser = (id: string | null, name: string | null) => {
        if (id && name) {
            localStorage.setItem('selectedUserId', id);
            localStorage.setItem('selectedUserName', name);
        }
        setSelectedUserId(id);
        setSelectedUserName(name);
    };

    const clearSelectedUser = () => {
        localStorage.removeItem('selectedUserId');
        localStorage.removeItem('selectedUserName');
        setSelectedUserId(null);
        setSelectedUserName(null);
    };

    return (
        <AuthContext.Provider value={{
            isAdmin,
            isKiosk,
            isLoading,
            login,
            logout,
            selectedUserId,
            selectedUserName,
            setSelectedUser,
            clearSelectedUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
