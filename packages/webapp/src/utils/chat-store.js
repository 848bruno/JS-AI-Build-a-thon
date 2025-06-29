// Define window fallback for non-browser environments
const window = typeof globalThis !== 'undefined' && globalThis.window ? globalThis.window : undefined;

const STORAGE_KEY = 'chatMessages';

export function loadMessages() {
  if (window === undefined || window.localStorage === undefined) {
    return [];
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  return [];
}

export function saveMessages(messages) {
  if (window === undefined || window.localStorage === undefined) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

export function clearMessages() {
  if (window === undefined || window.localStorage === undefined) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
