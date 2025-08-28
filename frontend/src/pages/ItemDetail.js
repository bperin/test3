import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../state/DataContext";

function ItemDetail() {
    const { id } = useParams();
    const { fetchItemById } = useData();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const abortController = new AbortController();

        const loadItem = async () => {
            try {
                setLoading(true);
                setError(null);

                const itemData = await fetchItemById(id, abortController);

                if (!abortController.signal.aborted) {
                    setItem(itemData);
                }
            } catch (err) {
                if (!abortController.signal.aborted) {
                    setError(err.message);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadItem();

        return () => abortController.abort();
    }, [id, fetchItemById]);

    if (loading) return <div className="p-4">Loading...</div>;

    if (error) {
        return (
            <div className="p-4">
                <div className="text-red-600 mb-4">Error: {error}</div>
                <button onClick={() => navigate("/")} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Back to Items
                </button>
            </div>
        );
    }

    if (!item) return <div className="p-4">Item not found</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-4">
                <button onClick={() => navigate("/")} className="text-blue-500 hover:text-blue-700 mb-4">
                    ← Back to Items
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{item.name}</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</h3>
                        <div className="space-y-2">
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>Category:</strong> {item.category}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                <strong>Price:</strong> ${item.price}
                            </p>
                            {item.description && (
                                <p className="text-gray-600 dark:text-gray-400">
                                    <strong>Description:</strong> {item.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {item.id && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Item ID</h3>
                            <p className="text-gray-600 dark:text-gray-400 font-mono">{item.id}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ItemDetail;
