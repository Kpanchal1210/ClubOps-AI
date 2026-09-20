import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "organizer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authService.register(form);
      const data = res?.data || res;
      const token = data?.token || res?.token;
      const user = data?.user || res?.user;
      if (token && user) {
        login(token, user);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo-icon" style={{ width: 36, height: 36, fontSize: 18 }}>
            C
          </div>
          <span>ClubOps</span>
        </div>

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Join ClubOps to coordinate club activities and manage events.
        </p>

        {error && (
          <div className="error-box">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: "relative" }}>
              <input
                name="name"
                placeholder="e.g. Maya Lin"
                value={form.name}
                onChange={handleChange}
                required
                style={{ paddingLeft: 38 }}
              />
              <User
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
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
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

          <div className="form-group">
            <label>Role</label>
            <div style={{ position: "relative" }}>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{ paddingLeft: 38 }}
              >
                <option value="member">Club Member</option>
                <option value="organizer">Event Organizer / Lead</option>
                <option value="admin">Club Executive / Admin</option>
              </select>
              <Briefcase
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
