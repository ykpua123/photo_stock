"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import TableRows from '@/components/TableRows';
import PreviewCarousel from '@/components/PreviewCarousel';
import { FaSearch, FaTimes } from 'react-icons/fa';
import BackToTopButton from '@/components/BackToTopButton';
import BackToBotttomButton from './BackToBottomButton';
import CustomPagination from './Pagination';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

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
    const [loading, setLoading] = useState(false);
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
        const newQuery = e.target.value
        setLoading(true);
        setSearchQuery(newQuery);
        setExpandedRow(null);
        setTableKey(prevKey => prevKey + 1);
        setCurrentPage(1); // Reset to page 1 on new search query

        // Simulate an API call or search processing delay
        setTimeout(() => {
            setLoading(false); // Set loading to false after results are ready
        }, 1000); // Adjust delay as needed

    };

    const clearSearch = () => {
        setSearchQuery('');
        setLoading(false);
        setExpandedRow(null);
        setTableKey(prevKey => prevKey + 1); // This will re-render the component with a new key
    };

    // Add event listener for "Esc" key
    useEffect(() => {
        const handleKeyDown = (e: { key: string; }) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        setExpandedRow(null);
        setTableKey(prevKey => prevKey + 1);

        // Cleanup the event listener on component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };

    }, []);


    const handlePageChange = (newPage: number) => {
        const scrollPosition = window.scrollY;
        if (newPage > 0 && newPage <= Math.ceil(totalCount / resultsPerPage)) {
            setCurrentPage(newPage);
            localStorage.setItem('scrollPosition', String(scrollPosition));
            setExpandedRow(null);
            setTableKey(prevKey => prevKey + 1);
        }
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = parseInt(e.target.value, 10);
        setResultsPerPage(newPerPage);
        setCurrentPage(1); // Reset to page 1 only on row count change
        setExpandedRow(null);
        setTableKey(prevKey => prevKey + 1);
    };

    useEffect(() => {
        if (expandedRow) {
            const rowElement = document.getElementById(`row-${expandedRow}`);
            if (rowElement) {
                rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentPage, expandedRow]);

    const preprocessQuery = (query: string) => {
        return query
            // Remove specific prefixes
            .replace(/\b(speaker|accessories|monitor & accessories|powersupply (psu)|peripherals|gaming chair|gaming desk|software (optional)|optical drive|networking (wifi receiver)|networking (wifi router)|amd ryzen prcessor|intel processor|psu|ram|ssd|hdd|os|powersupplyunit|motherboard (intel)|motherboard (amd)|cooler|graphic card|case):\s*/gi, '')

            // Remove "| RM XX" pattern, case insensitive
            .replace(/\s?\|\s?rm\s?\d+\b/gi, '')

            // Remove "7 YEARS WARRANTY" or similar patterns
            .replace(/\b\d+\s?years?\s?warranty\b/gi, '')

            // Remove anything inside square brackets, including brackets
            .replace(/\s?\[.*?\]\s?/g, '')

            // Replace multiple spaces with a single space
            .replace(/\s+/g, ' ')

            // Remove descriptive words
            .replace(/\b(Dual Chamber|Touchscreen|ATX Case|with|Cooling|Matte)\b/gi, '')

            // Trim any extra whitespace
            .trim();
    };
    useEffect(() => {
        const applySearchFilters = () => {
            setExpandedRow(null);

            if (debouncedSearchQuery) {
                const cleanedQuery = preprocessQuery(debouncedSearchQuery.toLowerCase());

                const quotedTerms = cleanedQuery.match(/"[^"]+"|[^" ]+/g) || [];
                const searchTerms = quotedTerms.map(term =>
                    term.replace(/"/g, '')
                ).filter(term => term && term !== "core");

                const filtered = allResults.filter(result => {
                    // Format created_at to DD/MM/YYYY
                    const formattedDate = new Date(result.created_at).toLocaleDateString('en-MY', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    });

                    const fields = [
                        result.invNumber.toLowerCase(),
                        result.total.toLowerCase(),
                        result.originalContent.toLowerCase(),
                        result.imagePath.toLowerCase(),
                        result.nasLocation.toLowerCase(),
                        result.status.toLowerCase(),
                        formattedDate.toLowerCase(),
                    ];

                    // Adjust filtering to handle both "gskill" and "g.skill" variations
                    return searchTerms.every(term => {
                        return fields.some(field => {
                            if (term === "gskill" || term === "g.skill") {
                                return field.includes("gskill") || field.includes("g.skill");
                            }
                            return field.includes(term);
                        });
                    });
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

            // Collapse the currently expanded row if it matches the clicked imagePath
            if (expandedRow === matchedResult.invNumber) {
                setExpandedRow(null); // Collapse the row first
                setTimeout(() => {
                    setExpandedRow(matchedResult.invNumber); // Re-expand the row after a brief delay
                }, 0); // Use a small timeout to ensure state update
            } else {
                setExpandedRow(matchedResult.invNumber);
            }

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
                        className="w-full py-2 pl-2 pr-16 border border-white/60 rounded-lg mt-4 font-mono text-amber-300 bg-black"
                        placeholder="Search by Invoice, Specs, Total, NAS location..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    {/* Search Icon or Loading Dots */}
                    {loading ? (
                        <span className="absolute right-3 top-9 transform -translate-y-1/2 text-white">
                            <span className="animate-pulse">•••</span> {/* Loading dots */}
                        </span>
                    ) : (
                        <FaSearch className="cursor-pointer absolute right-3 top-9 transform -translate-y-1/2 text-white" />
                    )}

                    {/* Clear "X" Button */}
                    {searchQuery && (
                        <FaTimes
                            className="absolute right-10 top-9 transform -translate-y-1/2 text-white cursor-pointer"
                            onClick={clearSearch}
                        />
                    )}
                </div>
            </div>

            {/* {loading && <p className="font-mono text-s">Loading results...</p>} */}

            {/* Display the carousel if images are found */}
            <div className={`mt-8 transition-opacity duration-300 ease-in-out ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                }`}>
                {carouselImages.length > 0 && (
                    <div className="mb-8 mt-12">
                        <PreviewCarousel images={carouselImages} onImageClick={handleImageClick} />
                    </div>
                )}
            </div>
            <div className="mt-8">
                <div className="w-full flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white-800 font-inter">Results</h2>
                </div>

                <div className="relative">
                    {/* Backdrop for the table */}
                    <Backdrop
                        sx={{
                            backgroundColor: 'transparent',
                            color: '#fff',
                            zIndex: (theme) => theme.zIndex.drawer + 1,
                            position: 'absolute', // Ensure it covers only the table container
                        }}
                        open={loading} // Backdrop is visible when loading is true
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                    <div className={`mt-8 transition-opacity duration-300 ease-in-out ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                        }`}>
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
                                            Displaying {allResults.length} of {totalCount} results
                                        </p>
                                    </div>
                                )}
                            />
                        ) : (
                            <p className="text-white font-mono text-s -mt-6">No results found</p>
                        )}
                    </div>

                    {/* Pagination only shows if there is no search query */}
                    {!debouncedSearchQuery && (
                        <div className="container mx-auto p-4">
                            {/* Use the CustomPagination component */}
                            <CustomPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
                <div>
                    <BackToTopButton />
                    <BackToBotttomButton />
                </div>
            </div>
        </div>

    );
};

export default ResultsPage;
