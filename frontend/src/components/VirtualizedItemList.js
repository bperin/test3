import React from "react";
import { FixedSizeList as List } from "react-window";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

const ItemRow = ({ index, style, data }) => {
    const item = data[index];

    return (
        <div style={style}>
            <div className="p-3 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
                <Link to={`/items/${item.id}`} className="text-primary hover:text-primary/80 font-medium text-base no-underline flex-1">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold">{item.name}</span>
                        <Badge variant="secondary" className="text-xs">
                            {item.category}
                        </Badge>
                        <span className="text-muted-foreground font-mono">${item.price}</span>
                    </div>
                </Link>
            </div>
        </div>
    );
};

const VirtualizedItemList = ({ items, height = 400 }) => {
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
                <List height={height} itemCount={items.length} itemSize={60} itemData={items} width="100%" className="rounded-md">
                    {ItemRow}
                </List>
            </CardContent>
        </Card>
    );
};

export default VirtualizedItemList;
