import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'safe-harbor-tax-';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const fullKey = `${STORAGE_KEY_PREFIX}${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${fullKey}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${fullKey}":`, error);
    }
  }, [fullKey]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === fullKey && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing storage event for key "${fullKey}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fullKey]);

  return [storedValue, setValue];
}

export function clearTaxCalculatorStorage() {
  try {
    const keysToRemove = Object.keys(window.localStorage).filter(
      (key) => key.startsWith(STORAGE_KEY_PREFIX)
    );
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
  }
}
