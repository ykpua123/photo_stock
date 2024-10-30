"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import TableRows from '@/components/TableRows';
import PreviewCarousel from '@/components/PreviewCarousel';
import { FaSearch } from 'react-icons/fa';
import BackToTopButton from '@/components/BackToTopButton';
import BackToBotttomButton from './BackToBottomButton';

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
    const [tableKey, setTableKey] = useState(0);
    const [allResults, setAllResults] = useState<Result[]>([]);
    const [filteredResults, setFilteredResults] = useState<Result[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [resultsPerPage, setResultsPerPage] = useState<number>(10);
    const [loading, setLoading] = useState(true);
    const [carouselImages, setCarouselImages] = useState<string[]>([]);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);


    const fetchResults = async (page = 1, perPage = 10, query = '') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/getResults?page=${page}&perPage=${perPage}&search=${encodeURIComponent(query)}`);
            const data = await response.json();
            setAllResults(data.results || []);
            setTotalCount(data.totalCount);
        } catch (error) {
            console.error("Error fetching results:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        // Fetch results whenever currentPage, resultsPerPage, or debouncedSearchQuery changes
        fetchResults(currentPage, resultsPerPage, debouncedSearchQuery);
    }, [currentPage, resultsPerPage, debouncedSearchQuery]);

    useEffect(() => {
        localStorage.setItem('currentPage', String(currentPage));
    }, [currentPage]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
        setTableKey(prevKey => prevKey + 1);
        setCurrentPage(1); // Reset to page 1 on new search query
    };

    const handlePageChange = (newPage: number) => {
        const scrollPosition = window.scrollY;
        if (newPage > 0 && newPage <= Math.ceil(totalCount / resultsPerPage)) {
            setCurrentPage(newPage);
            localStorage.setItem('scrollPosition', String(scrollPosition));
            setExpandedRow(null);
        }
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = parseInt(e.target.value, 10);
        setResultsPerPage(newPerPage);
        setCurrentPage(1); // Reset to page 1 only on row count change
    };

    useEffect(() => {
        if (expandedRow) {
            const rowElement = document.getElementById(`row-${expandedRow}`);
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentPage, expandedRow]);

    useEffect(() => {
        const applySearchFilters = () => {
            setExpandedRow(null);

            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const searchTerms = query.split(' ').filter(term => term);

                const filtered = allResults.filter(result => {
                    const fields = [
                        result.invNumber.toLowerCase(),
                        result.total.toLowerCase(),
                        result.originalContent.toLowerCase(),
                        result.imagePath.toLowerCase(),
                        result.nasLocation.toLowerCase(),
                        result.status.toLowerCase()
                    ];

                    return searchTerms.every(term =>
                        fields.some(field => field.includes(term))
                    );
                });

                setFilteredResults(filtered);
                setCarouselImages(filtered.map(result => result.imagePath));
            } else {
                setFilteredResults(allResults);
                setCarouselImages([]);
            }
        };

        applySearchFilters();
    }, [debouncedSearchQuery, allResults]);


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

    const totalPages = Math.ceil(totalCount / resultsPerPage);

    useEffect(() => {
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage) {
            setCurrentPage(Number(savedPage));
        }
    }, []);

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

            <div className="mt-8">
                <div className="w-full flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white-800 font-inter">Results</h2>
                </div>

                {filteredResults.length > 0 ? (
                    <TableRows
                        key={tableKey}
                        results={filteredResults.map(result => ({
                            ...result,
                            image: result.imagePath,
                            isSaved: true,
                        }))}
                        totalResults={totalCount}
                        searchedResults={filteredResults.length}
                        onDelete={(result) => {
                            setFilteredResults(prevResults => prevResults.filter(r => r.invNumber !== result.invNumber));
                        }}
                        expandedRow={expandedRow}
                        rowsPerPageDropdown={(
                            <select
                                value={resultsPerPage}
                                onChange={handleRowsPerPageChange}
                                className="p-2 border border-white/60 rounded-lg bg-black text-white/60 font-mono cursor-pointer"
                            >
                                <option value="10">10 Rows</option>
                                <option value="20">20 Rows</option>
                                <option value="50">50 Rows</option>
                                <option value="100">100 Rows</option>
                            </select>)}
                        resultsLength={(
                            <div className="flex items-center space-x-6">
                                <p className="text-s text-white font-mono">
                                    {debouncedSearchQuery
                                        ? `Showing ${allResults.length} of ${totalCount} results` : `Total ${totalCount} results`}
                                </p>
                            </div>
                        )}
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
            <div>
                <BackToTopButton />
                <BackToBotttomButton />
            </div>

        </div>

    );
};

export default ResultsPage;
