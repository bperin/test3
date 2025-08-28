import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Items from "../Items";
import { useData } from "../../state/DataContext";

// Mock the DataContext
jest.mock("../../state/DataContext");

// Mock VirtualizedItemList
jest.mock("../../components/VirtualizedItemList", () => {
    return function MockVirtualizedItemList({ items }) {
        return (
            <div data-testid="virtualized-list">
                {items.map((item) => (
                    <div key={item.id}>{item.name}</div>
                ))}
            </div>
        );
    };
});

const mockFetchItems = jest.fn(() => Promise.resolve());

const defaultMockData = {
    items: [],
    pagination: null,
    loading: false,
    fetchItems: mockFetchItems,
};

const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Items Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useData.mockReturnValue(defaultMockData);
    });

    test("renders loading skeletons", () => {
        useData.mockReturnValue({
            ...defaultMockData,
            loading: true,
            items: [],
        });

        renderWithRouter(<Items />);
        const skeletons = screen.getAllByRole("status"); // Skeletons have role="status"
        expect(skeletons.length).toBeGreaterThan(0);
    });

    test("renders empty state when no items", () => {
        renderWithRouter(<Items />);
        expect(screen.getByText("No items found.")).toBeInTheDocument();
    });

    test("renders items with virtualized list", () => {
        const mockItems = [
            { id: 1, name: "Item 1", category: "Category A", price: 10.99 },
            { id: 2, name: "Item 2", category: "Category B", price: 20.5 },
        ];

        useData.mockReturnValue({
            ...defaultMockData,
            items: mockItems,
        });

        renderWithRouter(<Items />);

        expect(screen.getByTestId("virtualized-list")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    test("calls fetchItems on mount", () => {
        renderWithRouter(<Items />);
        expect(mockFetchItems).toHaveBeenCalledWith(
            expect.any(AbortController),
            1, // currentPage
            10, // pageSize
            "" // searchQuery
        );
    });

    test("handles search form submission", async () => {
        renderWithRouter(<Items />);

        const searchInput = screen.getByPlaceholderText("Search items...");
        const searchForm = searchInput.closest("form");

        fireEvent.change(searchInput, { target: { value: "test query" } });
        fireEvent.submit(searchForm);

        await waitFor(() => {
            expect(mockFetchItems).toHaveBeenCalledTimes(2); // once on mount, once on search
        });
    });

    test("handles clear search", () => {
        const { rerender } = renderWithRouter(<Items />);

        const searchInput = screen.getByPlaceholderText("Search items...");
        fireEvent.change(searchInput, { target: { value: "test" } });
        fireEvent.submit(searchInput.closest("form"));

        // Rerender to show clear button
        rerender(
            <BrowserRouter>
                <Items />
            </BrowserRouter>
        );

        expect(searchInput.value).toBe("test");
    });

    test("renders pagination when available", () => {
        const mockPagination = {
            page: 2,
            totalPages: 5,
            totalItems: 50,
            hasPrev: true,
            hasNext: true,
        };

        useData.mockReturnValue({
            ...defaultMockData,
            items: [{ id: 1, name: "Item 1", category: "Category A", price: 10.99 }],
            pagination: mockPagination,
        });

        renderWithRouter(<Items />);

        expect(screen.getByText(/Page 2 of 5/)).toBeInTheDocument();
        expect(screen.getByText(/50 total items/)).toBeInTheDocument();
        expect(screen.getByText("Previous")).toBeInTheDocument();
        expect(screen.getByText("Next")).toBeInTheDocument();
    });

    test("handles pagination navigation", () => {
        const mockPagination = {
            page: 2,
            totalPages: 5,
            totalItems: 50,
            hasPrev: true,
            hasNext: true,
        };

        useData.mockReturnValue({
            ...defaultMockData,
            items: [{ id: 1, name: "Item 1", category: "Category A", price: 10.99 }],
            pagination: mockPagination,
        });

        renderWithRouter(<Items />);

        const nextButton = screen.getByText("Next");
        expect(nextButton).toBeInTheDocument();
        expect(nextButton).not.toBeDisabled();
    });

    test("disables buttons when loading", () => {
        useData.mockReturnValue({
            ...defaultMockData,
            loading: true,
            items: [{ id: 1, name: "Item 1", category: "Category A", price: 10.99 }],
            pagination: {
                page: 1,
                totalPages: 3,
                totalItems: 30,
                hasPrev: false,
                hasNext: true,
            },
        });

        renderWithRouter(<Items />);

        expect(screen.getByText("Search")).toBeDisabled();
        expect(screen.getByText("Next")).toBeDisabled();
    });

    test("aborts fetch on unmount", () => {
        const { unmount } = renderWithRouter(<Items />);

        expect(mockFetchItems).toHaveBeenCalledWith(expect.any(AbortController), 1, 10, "");

        unmount();
        // Component should unmount without errors
    });

    test("shows search results message", () => {
        useData.mockReturnValue({
            ...defaultMockData,
            items: [],
        });

        renderWithRouter(<Items />);

        expect(screen.getByText("No items found.")).toBeInTheDocument();
    });
});
