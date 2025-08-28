import React from "react";
import { FixedSizeList as List } from "react-window";
import { Link } from "react-router-dom";

const ItemRow = ({ index, style, data }) => {
    const item = data[index];

    return (
        <div style={style}>
            <div
                style={{
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Link
                    to={`/items/${item.id}`}
                    style={{
                        textDecoration: "none",
                        color: "#007bff",
                        fontSize: "16px",
                    }}
                >
                    {item.name} - {item.category} (${item.price})
                </Link>
            </div>
        </div>
    );
};

const VirtualizedItemList = ({ items, height = 400 }) => {
    if (!items || items.length === 0) {
        return <div>No items to display</div>;
    }

    return (
        <div style={{ border: "1px solid #ddd", borderRadius: "4px" }}>
            <List height={height} itemCount={items.length} itemSize={60} itemData={items} width="100%">
                {ItemRow}
            </List>
        </div>
    );
};

export default VirtualizedItemList;
