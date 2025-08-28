import React, { useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

const ItemRow = ({ index, style, data }) => {
    const { items, isItemLoaded, loadMoreItems } = data;
    const item = items[index];

    // Show loading placeholder if item hasn't loaded yet
    if (!isItemLoaded(index)) {
        return (
            <div style={style}>
                <div className="p-3 border-b border-border flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={style}>
            <Link to={`/items/${item.id}`} className="block text-primary hover:text-primary/80 font-medium text-base no-underline">
                <div className="p-3 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors h-full">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">
                            {item.name
                                .split(" ")
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                            {item.category
                                .split(" ")
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                        </Badge>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground font-mono">${item.price}</span>
                        {item.created_at && <span className="text-xs text-muted-foreground/70">{new Date(item.created_at).toLocaleDateString()}</span>}
                    </div>
                </div>
            </Link>
        </div>
    );
};

const VirtualizedItemList = forwardRef(({ items = [], height, hasNextPage = false, isNextPageLoading = false, loadNextPage }, ref) => {
    const [listHeight, setListHeight] = useState(600);
    const listRef = useRef();

    useEffect(() => {
        if (height && typeof height === "number") {
            setListHeight(height);
        } else {
            const viewportHeight = window.innerHeight;
            const calculatedHeight = viewportHeight - 300;
            setListHeight(calculatedHeight);
        }
    }, [height]);

    // If there are more items to be loaded then add an extra row to hold a loading indicator.
    const itemCount = hasNextPage ? items.length + 1 : items.length;

    // Only load 1 page of items at a time.
    // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
    const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage;

    // Every row is loaded except for our loading indicator row.
    const isItemLoaded = useCallback((index) => !!items[index], [items]);

    // Expose scroll methods to parent component
    useImperativeHandle(
        ref,
        () => ({
            scrollToBottom: () => {
                if (listRef.current && items.length > 0) {
                    listRef.current.scrollToItem(items.length - 1, "end");
                }
            },
            scrollToTop: () => {
                if (listRef.current) {
                    listRef.current.scrollToItem(0, "start");
                }
            },
        }),
        [items.length]
    );

    if (!items || items.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No items to display</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="border-t">
                    <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems}>
                        {({ onItemsRendered, ref: infiniteLoaderRef }) => (
                            <List
                                ref={(node) => {
                                    listRef.current = node;
                                    infiniteLoaderRef(node);
                                }}
                                height={listHeight}
                                itemCount={itemCount}
                                itemSize={80}
                                itemData={{
                                    items,
                                    isItemLoaded,
                                    loadMoreItems,
                                }}
                                onItemsRendered={onItemsRendered}
                                width="100%"
                            >
                                {ItemRow}
                            </List>
                        )}
                    </InfiniteLoader>
                </div>
            </CardContent>
        </Card>
    );
});

export default VirtualizedItemList;
