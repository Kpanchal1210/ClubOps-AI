import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fillDemoCredentials = () => {
    setForm({
      email: "rahul@clubops.org",
      password: "password123",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Dev mode auto-login
    if (DEV_MODE) {
      setTimeout(() => {
        login("dev-mock-token", {
          name: form.email.split("@")[0] || "Rahul Patel",
          email: form.email || "rahul@clubops.org",
          role: "organizer",
        });
        navigate("/dashboard");
      }, 450);
      return;
    }

    try {
      const result = await authService.login(form);
      const data = result?.data || result;
      const token = data?.token || result?.token;
      const user = data?.user || result?.user;

      if (!token) throw new Error("Backend did not return an authentication token.");

      login(token, user);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Invalid credentials. Please verify your email and password."
      );
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Logo */}
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 36, height: 36, fontSize: 18 }}>
            C
          </div>
          <span>ClubOps</span>
        </div>

        <h1>Sign in to your workspace</h1>
        <p className="auth-subtitle">
          {DEV_MODE
            ? "Development Mode: Any email and password will authenticate."
            : "Enter your credentials to access your club operations."}
        </p>

        {error && (
          <div className="error-box">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="email"
                placeholder="name@club.org"
                value={form.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: 38 }}
              />
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "var(--text-muted)",
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ margin: 0 }}>Password</label>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: 38, paddingRight: 38 }}
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "var(--text-muted)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 10,
                  color: "var(--text-muted)",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
            style={{ width: "100%", padding: "11px", marginTop: 6 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Quick Fill Demo Credentials */}
          <button
            type="button"
            className="demo-credentials-btn"
            onClick={fillDemoCredentials}
          >
            Fill Demo Credentials (Rahul Patel)
          </button>

          <p className="auth-footer">
            Don't have an account yet?{" "}
            <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
