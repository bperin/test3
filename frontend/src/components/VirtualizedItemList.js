import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

const ItemRow = ({ item }) => (
    <Link to={`/items/${item.id}`} className="block text-primary hover:text-primary/80 font-medium text-base no-underline">
        <div className="p-3 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors h-full">
            <div className="flex items-center gap-3">
                <span className="font-semibold">{item.name}</span>
                <Badge variant="secondary" className="text-xs">
                    {item.category}
                </Badge>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-muted-foreground font-mono">${item.price}</span>
                {item.created_at && <span className="text-xs text-muted-foreground/70">{new Date(item.created_at).toLocaleDateString()}</span>}
            </div>
        </div>
    </Link>
);

const VirtualizedItemList = ({ items }) => {
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
                    {items.map((item) => (
                        <ItemRow key={item.id} item={item} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default VirtualizedItemList;
