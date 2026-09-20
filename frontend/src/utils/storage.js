/**
 * Safe localStorage wrapper with try/catch and fallback support.
 * Prevents DOMException in private/incognito mode or blocked third-party storage.
 */
export const safeStorage = {
  getItem: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      if (val === null || val === undefined || val === "undefined" || val === "null") {
        return fallback;
      }
      return val;
    } catch {
      return fallback;
    }
  },

  setItem: (key, value) => {
    try {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, str);
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  getJSON: (key, fallback = null) => {
    try {
      const val = safeStorage.getItem(key);
      if (!val) return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  },

  setJSON: (key, value) => {
    try {
      const str = JSON.stringify(value);
      localStorage.setItem(key, str);
    } catch (e) {
      console.warn(`localStorage.setJSON failed for key "${key}":`, e);
    }
  },
};
