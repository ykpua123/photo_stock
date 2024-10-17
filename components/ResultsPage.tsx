"use client"; // For client-side interactivity

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Import useDebounce from 'use-debounce'
import TableRows from '@/components/TableRows'; // Import the TableRows component
import { FaSearch } from 'react-icons/fa'; // Import the search icon

interface Result {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    imagePath: string;
    created_at: string;
    status: string; // Include status here
}

const ResultsPage = () => {
    const [allResults, setAllResults] = useState<Result[]>([]); // Store all fetched results
    const [filteredResults, setFilteredResults] = useState<Result[]>([]); // Store filtered results
    const [searchQuery, setSearchQuery] = useState(''); // Search query state
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500); // Debounce search query by 500ms
    const [currentPage, setCurrentPage] = useState<number>(1); // Pagination state
    const [resultsPerPage] = useState(10); // Set results per page
    const [loading, setLoading] = useState(false);

    // Fetch all results when the component loads
    const fetchResults = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/getResults');
            const data = await response.json();
            setAllResults(data.results || []); // Store all results
            setLoading(false);
        } catch (error) {
            console.error("Error fetching results:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Restore the current page and search query from localStorage if they exist
        const savedPage = localStorage.getItem('currentPage');
        const savedSearchQuery = localStorage.getItem('searchQuery');
        if (savedPage) {
            setCurrentPage(Number(savedPage)); // Restore the saved page
        }
        if (savedSearchQuery) {
            setSearchQuery(savedSearchQuery); // Restore the saved search query
        }
        fetchResults(); // Fetch data on page load
    }, []);

    // Apply search filters to the fetched results
    useEffect(() => {
        const applySearchFilters = () => {
            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const searchTerms = query.split(' ').filter(term => term); // Split by space and remove empty strings

                const filtered = allResults.filter(result => {
                    // Convert all searchable fields to lower case for case-insensitive matching
                    const invNumber = result.invNumber.toLowerCase();
                    const total = result.total.toLowerCase();
                    const originalContent = result.originalContent.toLowerCase();
                    const imagePath = result.imagePath.toLowerCase();
                    const nasLocation = result.nasLocation.toLowerCase();
                    const status = result.status.toLowerCase();

                    // Check if all search terms are found in any of the fields
                    return searchTerms.every(term =>
                        invNumber.includes(term) ||
                        total.includes(term) ||
                        originalContent.includes(term) ||
                        imagePath.includes(term) ||
                        nasLocation.includes(term) ||
                        status.includes(term)
                    );
                });

                setFilteredResults(filtered); // Update filtered results based on search query
            } else {
                setFilteredResults(allResults); // Show all results if search query is cleared
            }
        };

        applySearchFilters(); // Apply filters every time the search query or results change
    }, [debouncedSearchQuery, allResults]);

    // Function to handle the search input change and filter results client-side
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery); // Update search query with user input
        setCurrentPage(1); // Reset to first page when a new search query is entered
        // Save search query to localStorage
        localStorage.setItem('searchQuery', newQuery);
    };

    // Calculate pagination
    const indexOfLastResult = currentPage * resultsPerPage;
    const indexOfFirstResult = indexOfLastResult - resultsPerPage;
    const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);

    const totalPages = Math.ceil(filteredResults.length / resultsPerPage); // Calculate total pages

    // Function to handle pagination change
    const handlePageChange = async (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Save the current page to localStorage
            localStorage.setItem('currentPage', String(newPage));
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-white-800 mt-10 mb-14 font-inter text-center">PC Photo Stock Details</h2>
            <h2 className="text-xl font-bold text-white-800 font-inter">Search</h2>
            {/* Search bar */}
            <div className="mb-4">
                <div className="relative">
                    {/* Input field */}
                    <input
                        type="text"
                        className="w-full p-2 border border-white/60 rounded-lg mt-4 font-mono text-amber-300 bg-black"
                        placeholder="Search by invoice ID, invoice #, specs, total, image name, NAS location..."
                        value={searchQuery}
                        onChange={handleSearchChange} // Handle search change
                    />

                    {/* Search icon */}
                    <FaSearch className="absolute right-3 top-9 transform -translate-y-1/2 text-white" />
                </div>
            </div>

            {/* Loading state */}
            {loading && <p className="font-mono text-s">Loading results...</p>}

            {/* Results */}
            <div className="-mt-4">
                <div className="w-full flex justify-between">
                    <h2 className="text-xl font-bold text-white-800 mt-10 font-inter">Results</h2>
                    <div className="flex items-end space-x-2">
                        <p className="text-sm text-white font-mono">
                            {filteredResults.length === allResults.length
                                ? `Total ${allResults.length} results`
                                : `Showing ${filteredResults.length} of ${allResults.length} results`}
                        </p>
                    </div>
                </div>

                {/* Display paginated results */}
                {currentResults.length > 0 ? (
                    <TableRows
                        results={currentResults.map(result => ({
                            ...result,
                            image: result.imagePath, // Use the imagePath for saved results
                            isSaved: true, // Mark these as saved entries from the database
                        }))}
                        totalResults={allResults.length}
                        searchedResults={filteredResults.length}
                        onDelete={(result) => {
                            setFilteredResults(prevResults => prevResults.filter(r => r.invNumber !== result.invNumber)); // Remove the entry from local state after deletion
                        }}
                    />
                ) : (
                    <p className="text-white font-mono text-s">No results found</p>
                )}

                {/* Pagination */}
                <div className="mt-4 flex justify-center items-center space-x-2 font-mono">
                    {/* Previous Button */}
                    <a
                        className={`cursor-pointer ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-white'}`}
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    >
                        Prev
                    </a>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <a
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`cursor-pointer rounded px-2 py-1 ${currentPage === page ? 'font-mono text-white font-bold underline' : 'text-white'}`}
                        >
                            {page}
                        </a>
                    ))}

                    {/* Next Button */}
                    <a
                        className={`cursor-pointer ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-white'}`}
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    >
                        Next
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
