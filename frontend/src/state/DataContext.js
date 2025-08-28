import React, { createContext, useCallback, useContext, useState } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchItems = useCallback(async (abortController, page = 1, limit = 10, search = "") => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { q: search }),
            });

            const res = await fetch(`http://localhost:3001/api/items?${params}`, {
                signal: abortController?.signal,
            });
            const json = await res.json();

            if (!abortController?.signal.aborted) {
                setItems(json.items || json); // Handle both old and new API response formats
                setPagination(json.pagination || null);
            }
        } finally {
            if (!abortController?.signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    return <DataContext.Provider value={{ items, pagination, loading, fetchItems }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
