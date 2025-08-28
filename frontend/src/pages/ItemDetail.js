import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../state/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";

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

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-10 w-48 mb-4" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate("/")} variant="outline" className="mt-4 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Items
                </Button>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="container mx-auto p-6 text-center">
                <p className="text-muted-foreground">Item not found.</p>
                <Button onClick={() => navigate("/")} variant="outline" className="mt-4 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Items
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <Button onClick={() => navigate("/")} variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Items
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{item.name}</CardTitle>
                    <CardDescription>
                        <Badge variant="secondary">{item.category}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">Details</h3>
                            <p className="text-muted-foreground">
                                <strong>Price:</strong> ${item.price}
                            </p>
                            {item.description && <p className="text-muted-foreground">{item.description}</p>}
                        </div>

                        {item.id && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Item ID</h3>
                                <p className="text-muted-foreground font-mono text-sm bg-muted p-2 rounded-md">{item.id}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ItemDetail;
