import {
  createContext,
  useContext,
  useState,
} from "react";
import { safeStorage } from "../utils/storage";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

const DEFAULT_DEV_USER = {
  id: "user-1",
  name: "Karan Panchal",
  email: "karan@clubops.org",
  role: "organizer",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = safeStorage.getItem("token");
    if (saved) return saved;
    // In dev mode, auto-provide mock token so cold runs never get stuck on empty/redirect loops
    if (DEV_MODE) {
      safeStorage.setItem("token", "dev-mock-token");
      return "dev-mock-token";
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = safeStorage.getJSON("user");
    if (savedUser) return savedUser;
    // In dev mode, auto-provide mock user
    if (DEV_MODE) {
      safeStorage.setItem("user", DEFAULT_DEV_USER);
      return DEFAULT_DEV_USER;
    }
    return null;
  });

  const login = (newToken, userData) => {
    safeStorage.setItem("token", newToken);

    if (userData) {
      safeStorage.setItem("user", userData);
    }

    setToken(newToken);
    setUser(userData || null);
  };

  const logout = () => {
    safeStorage.removeItem("token");
    safeStorage.removeItem("user");
    safeStorage.removeItem("eventId");
    safeStorage.removeItem("aiResult");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}