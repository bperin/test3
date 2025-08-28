import React, { createContext, useCallback, useContext, useState } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);

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

    const postItem = useCallback(async (itemData, abortController) => {
        setPosting(true);
        try {
            const res = await fetch(`http://localhost:3001/api/items`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(itemData),
                signal: abortController?.signal,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create item");
            }

            const newItem = await res.json();

            // Add the new item to the current items list
            if (!abortController?.signal.aborted) {
                setItems((prevItems) => [newItem, ...prevItems]);
            }

            return newItem;
        } finally {
            if (!abortController?.signal.aborted) {
                setPosting(false);
            }
        }
    }, []);

    const fetchStats = useCallback(async (abortController) => {
        try {
            const res = await fetch(`http://localhost:3001/api/stats`, {
                signal: abortController?.signal,
            });
            const statsData = await res.json();

            if (!abortController?.signal.aborted) {
                setStats(statsData);
            }

            return statsData;
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            throw error;
        }
    }, []);

    return (
        <DataContext.Provider
            value={{
                items,
                pagination,
                stats,
                loading,
                posting,
                fetchItems,
                postItem,
                fetchStats,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
