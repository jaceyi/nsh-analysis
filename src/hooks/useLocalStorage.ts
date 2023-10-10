import { useState } from 'react';
import config from '@/config.json';

const useLocalStorage = <T = any>(key: string, initialValue?: T) => {
  const _key = `LOCAL_${config.localStorageVersion}_${key}`;
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(_key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });
  const setValue = (value: T | ((value: T) => T)) => {
    try {
      if (value instanceof Function) {
        setStoredValue(prevValue => {
          console.log(prevValue);
          const valueToStore = value(prevValue);
          window.localStorage.setItem(_key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } else {
        window.localStorage.setItem(_key, JSON.stringify(value));
        setStoredValue(value);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return [storedValue, setValue] as [T, typeof setValue];
};

export default useLocalStorage;
