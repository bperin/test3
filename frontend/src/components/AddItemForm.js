import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const AddItemForm = ({ onItemAdded, isLoading }) => {
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        price: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:3001/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    category: formData.category,
                    price: parseFloat(formData.price),
                }),
            });

            if (response.ok) {
                const newItem = await response.json();
                onItemAdded(newItem);
                setFormData({ name: "", category: "", price: "" });
            }
        } catch (error) {
            console.error("Error adding item:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter item name" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input type="text" id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="Enter item category" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input type="number" id="price" name="price" value={formData.price} onChange={handleChange} step="0.01" min="0" required placeholder="Enter item price" />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Adding..." : "Add Item"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddItemForm;
