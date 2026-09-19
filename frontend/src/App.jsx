import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Tasks from "./pages/Tasks";
import Volunteers from "./pages/Volunteers";
import Risks from "./pages/Risks";
import Meetings from "./pages/Meetings";
import Notifications from "./pages/Notifications";
import AIResults from "./pages/AIResults";
import Agent from "./pages/Agent";

import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes — auth guard wraps the dashboard shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/volunteers" element={<Volunteers />} />
                <Route path="/risks" element={<Risks />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/ai-results" element={<AIResults />} />
                <Route path="/agent" element={<Agent />} />
                <Route path="/documents" element={<Navigate to="/events/mock-event-1?tab=documents" replace />} />
              </Route>
            </Route>

            {/* Redirect root → dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
