import { useState, useEffect } from 'react';

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const getItem = () => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(getItem);

  useEffect(() => {
    setValue(getItem());
  }, [key]);

  const setStored = (v: T | ((val: T) => T)) => {
    try {
      const newValue = v instanceof Function ? v(value) : v;
      setValue(newValue);
      if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch {}
  };

  const remove = () => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      setValue(initialValue);
    } catch {}
  };

  return [value, setStored, remove] as const;
};
