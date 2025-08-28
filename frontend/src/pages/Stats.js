import React, { useEffect, useState } from "react";
import { useData } from "../state/DataContext";

function Stats() {
    const { stats, fetchStats } = useData();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const abortController = new AbortController();
        
        const loadStats = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchStats(abortController);
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

        loadStats();

        return () => abortController.abort();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                        Error Loading Stats
                    </h2>
                    <p className="text-red-600 dark:text-red-300">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <p className="text-gray-600 dark:text-gray-400">No stats available</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                Statistics Dashboard
            </h1>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Items
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalItems || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                            <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Categories
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.totalCategories || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Average Price
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${stats.averagePrice ? stats.averagePrice.toFixed(2) : '0.00'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                        Items by Category
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300 capitalize">
                                    {category}
                                </span>
                                <div className="flex items-center">
                                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ 
                                                width: `${(count / stats.totalItems) * 100}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                                        {count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range */}
            {(stats.minPrice !== undefined && stats.maxPrice !== undefined) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                        Price Range
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Minimum Price
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${stats.minPrice.toFixed(2)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Maximum Price
                            </p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                ${stats.maxPrice.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Stats;
