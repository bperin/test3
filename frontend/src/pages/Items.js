import React, { useEffect, useState, useCallback } from "react";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";
import VirtualizedItemList from "../components/VirtualizedItemList";
import AddItemForm from "../components/AddItemForm";
import { Button } from "../components/ui/button.jsx";
import { Input } from "../components/ui/input.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Skeleton } from "../components/ui/skeleton.jsx";
import { Search, X, Plus } from "lucide-react";

function Items() {
    const { items, pagination, loading, fetchItems } = useData();
    const [allItems, setAllItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isNextPageLoading, setIsNextPageLoading] = useState(false);

    // Update allItems when new items are fetched
    useEffect(() => {
        if (items && items.length > 0) {
            if (currentPage === 1) {
                // First page or new search - replace all items
                setAllItems(items);
            } else {
                // Subsequent pages - append to existing items
                setAllItems(prev => [...prev, ...items]);
            }
        }
        
        // Update pagination state
        if (pagination) {
            setHasNextPage(pagination.hasNext);
        }
        
        setIsNextPageLoading(false);
    }, [items, pagination, currentPage]);

    useEffect(() => {
        const abortController = new AbortController();

        const fetchData = async () => {
            try {
                await fetchItems(abortController, 1, 20, searchQuery);
                setCurrentPage(1);
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
    }, [searchQuery, fetchItems]);

    // Load next page for infinite scroll
    const loadNextPage = useCallback(async () => {
        if (hasNextPage && !isNextPageLoading) {
            setIsNextPageLoading(true);
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            
            try {
                await fetchItems(new AbortController(), nextPage, 20, searchQuery);
            } catch (err) {
                console.error(err);
                setIsNextPageLoading(false);
            }
        }
    }, [hasNextPage, isNextPageLoading, currentPage, searchQuery, fetchItems]);

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
                <Button onClick={() => setShowAddForm((prev) => !prev)} className="gap-2">
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

                    {!loading && allItems.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">No items found{searchQuery ? ` for "${searchQuery}"` : ""}.</p>
                        </div>
                    )}

                    {allItems.length > 0 && (
                        <VirtualizedItemList 
                            items={allItems}
                            hasNextPage={hasNextPage}
                            isNextPageLoading={isNextPageLoading}
                            loadNextPage={loadNextPage}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default Items;
