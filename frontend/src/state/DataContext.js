import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async (abortController) => {
    const res = await fetch('http://localhost:3001/api/items?limit=500', {
      signal: abortController?.signal
    });
    const json = await res.json();
    if (!abortController?.signal.aborted) {
      setItems(json);
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);