import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import eventService from "../services/eventService";
import { safeStorage } from "../utils/storage";
import { useAuth } from "./AuthContext";

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentEventId, setCurrentEventIdState] = useState(() => safeStorage.getItem("eventId"));
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const res = await eventService.getAllEvents();
      const list = res?.data?.events || res?.data || res || [];
      const arr = Array.isArray(list) ? list : [];
      setEvents(arr);

      const savedId = safeStorage.getItem("eventId");
      const exists = arr.some((e) => (e._id || e.id) === savedId);

      if (arr.length > 0) {
        if (!savedId || !exists) {
          const firstId = arr[0]._id || arr[0].id;
          safeStorage.setItem("eventId", firstId);
          setCurrentEventIdState(firstId);
          window.dispatchEvent(
            new CustomEvent("clubops:event-changed", { detail: { eventId: firstId } })
          );
        } else {
          setCurrentEventIdState(savedId);
        }
      } else {
        safeStorage.removeItem("eventId");
        setCurrentEventIdState(null);
      }
    } catch (err) {
      console.warn("Failed to fetch events in EventContext:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Synchronize if event changes via external or custom events
  useEffect(() => {
    const handleGlobalEventChange = (e) => {
      const newId = e.detail?.eventId;
      if (newId && newId !== currentEventId) {
        safeStorage.setItem("eventId", newId);
        setCurrentEventIdState(newId);
      }
    };
    window.addEventListener("clubops:event-changed", handleGlobalEventChange);
    return () => window.removeEventListener("clubops:event-changed", handleGlobalEventChange);
  }, [currentEventId]);

  const setCurrentEventId = useCallback((id) => {
    if (!id) return;
    safeStorage.setItem("eventId", id);
    setCurrentEventIdState(id);
    window.dispatchEvent(
      new CustomEvent("clubops:event-changed", { detail: { eventId: id } })
    );
  }, []);

  const currentEvent =
    events.find((e) => (e._id || e.id) === currentEventId) || events[0] || null;

  return (
    <EventContext.Provider
      value={{
        events,
        currentEventId,
        currentEvent,
        setCurrentEventId,
        refreshEvents: fetchEvents,
        loading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return ctx;
}
