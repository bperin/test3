import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Items from "./Items";
import ItemDetail from "./ItemDetail";
import Stats from "./Stats";
import { DataProvider } from "../state/DataContext";
import ThemeToggle from "../components/ThemeToggle";

function App() {
    return (
        <DataProvider>
            <nav className="flex items-center justify-between p-4 border-b border-border bg-background">
                <Link to="/" className="text-foreground hover:text-primary transition-colors">
                    Items
                </Link>
                <Link to="/stats" className="text-foreground hover:text-primary transition-colors">
                    Stats
                </Link>
                <ThemeToggle />
            </nav>
            <Routes>
                <Route path="/" element={<Items />} />
                <Route path="/items/:id" element={<ItemDetail />} />
                <Route path="/stats" element={<Stats />} />
            </Routes>
        </DataProvider>
    );
}

export default App;
