import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, pagination, loading, fetchItems } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const abortController = new AbortController();

    fetchItems(abortController, currentPage, 10, searchQuery).catch(err => {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    });

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

  if (loading && !items.length) return <p>Loading...</p>;

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search items..."
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button type="submit" disabled={loading}>Search</button>
        {searchQuery && (
          <button 
            type="button" 
            onClick={() => {
              setSearchQuery('');
              setSearchInput('');
              setCurrentPage(1);
            }}
            style={{ marginLeft: '10px' }}
          >
            Clear
          </button>
        )}
      </form>

      {loading && <p>Loading...</p>}

      {!loading && items.length === 0 && (
        <p>No items found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
      )}

      {items.length > 0 && (
        <>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <Link to={'/items/' + item.id}>
                  {item.name} - {item.category} (${item.price})
                </Link>
              </li>
            ))}
          </ul>

          {pagination && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p>
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.totalItems} total items)
              </p>
              
              <div>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                  style={{ marginRight: '10px' }}
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      style={{
                        margin: '0 2px',
                        fontWeight: pageNum === currentPage ? 'bold' : 'normal',
                        backgroundColor: pageNum === currentPage ? '#007bff' : 'white',
                        color: pageNum === currentPage ? 'white' : 'black'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                  style={{ marginLeft: '10px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Items;