import React, { useEffect, useState } from "react";
import { useData } from "../state/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { DollarSign, Tag, Package, BarChart, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

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
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </CardHeader>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-2/3" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => window.location.reload()} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="container mx-auto p-6 text-center">
                <p className="text-muted-foreground">No stats available.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Statistics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <Package className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalItems || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                        <Tag className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCategories || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Average Price</CardTitle>
                        <DollarSign className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.averagePrice ? stats.averagePrice.toFixed(2) : "0.00"}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart /> Items by Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between">
                                    <span className="text-muted-foreground capitalize">{category}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-muted rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${(count / stats.totalItems) * 100}%` }} />
                                        </div>
                                        <span className="font-semibold w-8">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {stats.minPrice !== undefined && stats.maxPrice !== undefined && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Price Range</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-around items-center">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                    <TrendingDown className="text-green-500" /> Minimum
                                </div>
                                <p className="text-2xl font-bold">${stats.minPrice.toFixed(2)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                    <TrendingUp className="text-red-500" /> Maximum
                                </div>
                                <p className="text-2xl font-bold">${stats.maxPrice.toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default Stats;
