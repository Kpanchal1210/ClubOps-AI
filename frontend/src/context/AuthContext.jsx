import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { safeStorage } from "../utils/storage";
import clubService from "../services/clubService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeStorage.getItem("token"));
  const [user, setUser] = useState(() => safeStorage.getJSON("user"));
  const [club, setClub] = useState(() => safeStorage.getJSON("club"));

  const refreshClub = async () => {
    try {
      const res = await clubService.getMyClub();
      const clubData = res?.data?.club || res?.data || res;
      if (clubData) {
        setClub(clubData);
        safeStorage.setItem("club", clubData);
      }
    } catch {
      // User might not belong to a club yet
    }
  };

  useEffect(() => {
    if (token) {
      refreshClub();
    } else {
      setClub(null);
    }
  }, [token]);

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
    safeStorage.removeItem("club");
    safeStorage.removeItem("eventId");
    safeStorage.removeItem("aiResult");

    setToken(null);
    setUser(null);
    setClub(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        club,
        refreshClub,
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