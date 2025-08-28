import React, { useEffect, useState } from "react";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";
import VirtualizedItemList from "../components/VirtualizedItemList";
import AddItemForm from "../components/AddItemForm";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Search, X, Plus } from "lucide-react";

function Items() {
    const { items, pagination, loading, fetchItems } = useData();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchData = async () => {
            try {
                await fetchItems(abortController, currentPage, 10, searchQuery);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err);
                }
            }
        };

        fetchData();

        return () => {
            abortController.abort();
        };
    }, [fetchItems, currentPage, searchQuery]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleItemAdded = (newItem) => {
        // Refresh the items list after adding a new item
        fetchItems(new AbortController(), currentPage, 10, searchQuery);
        setShowAddForm(false);
    };

    if (loading && !items.length) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Items</h1>
                    <p className="text-muted-foreground">Browse and search through your items collection</p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {showAddForm ? "Cancel" : "Add Item"}
                </Button>
            </div>

            {showAddForm && <AddItemForm onItemAdded={handleItemAdded} isLoading={loading} />}

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Search & Browse</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search items..." className="pl-10" />
                        </div>
                        <Button type="submit" disabled={loading}>
                            Search
                        </Button>
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchInput("");
                                    setCurrentPage(1);
                                }}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </form>

                    {loading && (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    )}

                    {!loading && items.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">No items found{searchQuery ? ` for "${searchQuery}"` : ""}.</p>
                        </div>
                    )}

                    {items.length > 0 && (
                        <>
                            <VirtualizedItemList items={items} height={400} />

                            {pagination && (
                                <div className="mt-6 space-y-4">
                                    <div className="text-center text-sm text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total items)
                                    </div>

                                    <div className="flex justify-center items-center gap-2">
                                        <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={!pagination.hasPrev || loading}>
                                            Previous
                                        </Button>

                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, currentPage - 2) + i;
                                            if (pageNum > pagination.totalPages) return null;

                                            return (
                                                <Button key={pageNum} variant={pageNum === currentPage ? "default" : "outline"} onClick={() => handlePageChange(pageNum)} disabled={loading} size="sm">
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}

                                        <Button variant="outline" onClick={() => handlePageChange(currentPage + 1)} disabled={!pagination.hasNext || loading}>
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default Items;
