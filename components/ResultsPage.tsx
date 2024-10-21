"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import TableRows from '@/components/TableRows';
import PreviewCarousel from '@/components/PreviewCarousel'; // Import PreviewCarousel
import { FaSearch } from 'react-icons/fa';
import BackToTopButton from '@/components/BackToTopButton'; 

interface Result {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    imagePath: string;
    created_at: string;
    status: string;
}

const ResultsPage = () => {
    const [allResults, setAllResults] = useState<Result[]>([]);
    const [filteredResults, setFilteredResults] = useState<Result[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [resultsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    

    const fetchResults = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/getResults');
            const data = await response.json();
            setAllResults(data.results || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching results:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedPage = localStorage.getItem('currentPage');
        const savedSearchQuery = localStorage.getItem('searchQuery');
        if (savedPage) {
            setCurrentPage(Number(savedPage));
        }
        if (savedSearchQuery) {
            setSearchQuery(savedSearchQuery);
        }
        fetchResults();
    }, []);

    useEffect(() => {
        const applySearchFilters = () => {
            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const searchTerms = query.split(' ').filter(term => term);

                const filtered = allResults.filter(result => {
                    const invNumber = result.invNumber.toLowerCase();
                    const total = result.total.toLowerCase();
                    const originalContent = result.originalContent.toLowerCase();
                    const imagePath = result.imagePath.toLowerCase();
                    const nasLocation = result.nasLocation.toLowerCase();
                    const status = result.status.toLowerCase();

                    return searchTerms.every(term =>
                        invNumber.includes(term) ||
                        total.includes(term) ||
                        originalContent.includes(term) ||
                        imagePath.includes(term) ||
                        nasLocation.includes(term) ||
                        status.includes(term)
                    );
                });

                setFilteredResults(filtered);

                const images = filtered.map(result => result.imagePath);
                setCarouselImages(images);
            } else {
                setFilteredResults(allResults);
                setCarouselImages([]); // Clear carousel when no search query
            }
        };

        applySearchFilters();
    }, [debouncedSearchQuery, allResults]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
        setCurrentPage(1);
        localStorage.setItem('searchQuery', newQuery);
    };

    // **Handler for clicking an image in the carousel**
    const handleImageClick = (imagePath: string) => {
        const matchedResult = allResults.find(result => result.imagePath === imagePath);
    
        if (matchedResult) {
            const resultIndex = allResults.findIndex(result => result.invNumber === matchedResult.invNumber);
            const newPage = Math.floor(resultIndex / resultsPerPage) + 1;
    
            setExpandedRow(matchedResult.invNumber);
    
            if (newPage !== currentPage) {
                setCurrentPage(newPage);
                localStorage.setItem('currentPage', String(newPage));
            }
        }
    };

    const indexOfLastResult = currentPage * resultsPerPage;
    const indexOfFirstResult = indexOfLastResult - resultsPerPage;

    const currentResults = debouncedSearchQuery 
        ? filteredResults // If there is a query, show all filtered results
        : filteredResults.slice(indexOfFirstResult, indexOfLastResult); // Otherwise, use pagination

    const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

    const handlePageChange = async (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
        setCurrentPage(newPage);
        localStorage.setItem('currentPage', String(newPage));

    }
};

    useEffect(() => {
        if (expandedRow) {
            const rowElement = document.getElementById(`row-${expandedRow}`);
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentPage, expandedRow]);

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold text-white-800 mt-10 mb-14 font-inter text-center">PC Photo Stock Details</h2>
            <h2 className="text-xl font-bold text-white-800 font-inter">Search</h2>
            <div className="mb-4">
                <div className="relative">
                    <input
                        type="text"
                        className="w-full p-2 border border-white/60 rounded-lg mt-4 font-mono text-amber-300 bg-black"
                        placeholder="Search by invoice ID, invoice #, specs, total, image name, NAS location..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <FaSearch className="absolute right-3 top-9 transform -translate-y-1/2 text-white" />
                </div>
            </div>

            {loading && <p className="font-mono text-s">Loading results...</p>}

            {/* Display the carousel if images are found */}
            {carouselImages.length > 0 && (
                <div className="mb-8 mt-12">
                    <PreviewCarousel images={carouselImages} onImageClick={handleImageClick} />
                </div>
            )}

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

                {currentResults.length > 0 ? (
                    <TableRows
                        results={currentResults.map(result => ({
                            ...result,
                            image: result.imagePath,
                            isSaved: true,
                        }))}
                        totalResults={allResults.length}
                        searchedResults={filteredResults.length}
                        onDelete={(result) => {
                            setFilteredResults(prevResults => prevResults.filter(r => r.invNumber !== result.invNumber));
                        }}
                        expandedRow={expandedRow}
                    />
                ) : (
                    <p className="text-white font-mono text-s">No results found</p>
                )}

                {/* Pagination only shows if there is no search query */}
                {!debouncedSearchQuery && (
                    <div className="mt-4 flex justify-center items-center space-x-2 font-mono">
                        <a
                            className={`cursor-pointer ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-white'}`}
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        >
                            Prev
                        </a>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <a
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`cursor-pointer rounded px-2 py-1 ${currentPage === page ? 'font-mono text-white font-bold underline' : 'text-white'}`}
                            >
                                {page}
                            </a>
                        ))}

                        <a
                            className={`cursor-pointer ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-white'}`}
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        >
                            Next
                        </a>
                    </div>
                )}
            </div>
            {/* BackToTopButton */}
        <BackToTopButton /> {/* Add this at the end of the component */}
        </div>
    );
};

export default ResultsPage;
