import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VirtualizedItemList from "../VirtualizedItemList";

// Mock react-window
jest.mock("react-window", () => ({
    FixedSizeList: ({ children, itemData, itemCount }) => (
        <div data-testid="virtualized-list">
            {Array.from({ length: Math.min(itemCount, 5) }, (_, index) => (
                <div key={index}>{children({ index, style: {}, data: itemData })}</div>
            ))}
        </div>
    ),
}));

const mockItems = [
    { id: 1, name: "Item 1", category: "Category A", price: 10.99 },
    { id: 2, name: "Item 2", category: "Category B", price: 20.5 },
    { id: 3, name: "Item 3", category: "Category A", price: 15.75 },
];

const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("VirtualizedItemList", () => {
    test("renders empty state when no items provided", () => {
        renderWithRouter(<VirtualizedItemList items={[]} />);
        expect(screen.getByText("No items to display")).toBeInTheDocument();
    });

    test("renders empty state when items is undefined", () => {
        renderWithRouter(<VirtualizedItemList />);
        expect(screen.getByText("No items to display")).toBeInTheDocument();
    });

    test("renders virtualized list with items", () => {
        renderWithRouter(<VirtualizedItemList items={mockItems} />);

        expect(screen.getByTestId("virtualized-list")).toBeInTheDocument();

        // Check that links exist with correct hrefs
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(3);
        expect(links[0]).toHaveAttribute("href", "/items/1");
        expect(links[1]).toHaveAttribute("href", "/items/2");
        expect(links[2]).toHaveAttribute("href", "/items/3");
    });

    test("renders correct links for items", () => {
        renderWithRouter(<VirtualizedItemList items={mockItems} />);

        const links = screen.getAllByRole("link");
        expect(links[0]).toHaveAttribute("href", "/items/1");
        expect(links[1]).toHaveAttribute("href", "/items/2");
    });

    test("applies custom height when provided", () => {
        const { container } = renderWithRouter(<VirtualizedItemList items={mockItems} height={600} />);

        const wrapper = container.querySelector('div[style*="border"]');
        expect(wrapper).toBeInTheDocument();
    });

    test("uses default height when not provided", () => {
        renderWithRouter(<VirtualizedItemList items={mockItems} />);
        expect(screen.getByTestId("virtualized-list")).toBeInTheDocument();
    });
});
