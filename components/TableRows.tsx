"use client";

import React, { useState, useEffect, useRef } from 'react';
import DetailCards from './DetailCards';
import Popup from './Popup';
import { MdCheckCircle, MdContentCopy, MdDeleteForever } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";
import Collapse from '@mui/material/Collapse'; // Import MUI's Collapse component
import { Divider } from '@mui/material';

interface Result {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    image?: File | string | null;
    isSaved?: boolean;
    errorMessage?: string | null;  // Optional errorMessage to store validation errors
    created_at?: string;
    status?: string;
}

interface TableRowsProps {
    results: Result[];
    totalResults: number;
    searchedResults: number;
    onDelete: (result: Result) => void;
    expandedRow?: string | null; // Prop to handle external row expansion based on invNumber
}

const TableRows: React.FC<TableRowsProps> = ({ results, onDelete, totalResults, searchedResults, expandedRow }) => {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [statuses, setStatuses] = useState<{ [invNumber: string]: string }>({}); // Use invNumber as key
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedInvoiceIndex, setCopiedInvoiceIndex] = useState<number | null>(null); // For Invoice Number
    const [copiedNasLocationIndex, setCopiedNasLocationIndex] = useState<number | null>(null); // For NAS Location
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [popupType, setPopupType] = useState<'success' | 'error'>('success');


    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        });
    };

    // Check if there's a popup message in localStorage after reload
    useEffect(() => {
        const message = localStorage.getItem('popupMessage');
        const type = localStorage.getItem('popupType');

        if (message && type) {
            setPopupMessage(message);
            setPopupType(type as 'success' | 'error');

            // Remove the message from localStorage so it doesn't persist on further reloads
            localStorage.removeItem('popupMessage');
            localStorage.removeItem('popupType');

            // Automatically hide the popup after a few seconds
            setTimeout(() => {
                setPopupMessage(null);
            }, 3000); // 3 seconds duration
        }
    }, []);

    // Set the initial statuses state based on the `results` prop
    useEffect(() => {
        const initialStatuses = results.reduce((acc, result) => {
            acc[result.invNumber] = result.status || 'Ready'; // Default to 'Ready' if status is missing
            return acc;
        }, {} as { [invNumber: string]: string });
        setStatuses(initialStatuses);
    }, [results]);

    // Handle row toggle expansion/collapse
    const toggleRow = (index: number) => {
        if (expandedRows.includes(index)) {
            setExpandedRows(expandedRows.filter(row => row !== index)); // Collapse the row if it is already expanded
        } else {
            setExpandedRows([...expandedRows, index]); // Expand the row while keeping other rows expanded
        }
    };

    useEffect(() => {
        if (expandedRow) {
            const rowIndex = results.findIndex(result => result.invNumber === expandedRow);
            if (rowIndex !== -1) {
                // If the row is found in the current page's results, expand it
                setExpandedRows([rowIndex]);
                const rowElement = document.getElementById(`row-${expandedRow}`);
                if (rowElement) {
                    rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                setExpandedRows([]); // If no match on this page, collapse rows
            }
        }
    }, [expandedRow, results]);

    const handleStatusChange = async (invNumber: string, status: string) => {
        const scrollPosition = window.scrollY;
        const currentPage = localStorage.getItem('currentPage') || "1";

        setStatuses(prevStatuses => ({
            ...prevStatuses,
            [invNumber]: status,
        }));

        setIsStatusMenuOpen(null);

        try {
            const response = await fetch('/api/updateStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invNumber, status }),
            });

            if (response.ok) {
                localStorage.setItem('popupMessage', 'Status updated successfully');
                localStorage.setItem('popupType', 'success');
                localStorage.setItem('scrollPosition', String(scrollPosition));
                localStorage.setItem('currentPage', String(currentPage));
                window.location.reload();
            } else {
                const errorData = await response.json();
                localStorage.setItem('popupMessage', 'Failed to update status');
                localStorage.setItem('popupType', 'error');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    useEffect(() => {
        const savedScrollPosition = localStorage.getItem('scrollPosition');
        if (savedScrollPosition) {
            window.scrollTo(0, Number(savedScrollPosition));
            localStorage.removeItem('scrollPosition');
        }
    }, []);

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsStatusMenuOpen(null);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDelete = async (result: Result) => {
        const scrollPosition = window.scrollY;
        const currentPage = localStorage.getItem('currentPage') || "1";

        if (result.isSaved) {
            const confirmDelete = window.confirm(`Are you sure you want to delete ${result.invNumber}?`);
            if (!confirmDelete) return;

            try {
                const response = await fetch('/api/deleteResults', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ invNumber: result.invNumber }),
                });

                if (response.ok) {
                    localStorage.setItem('popupMessage', 'Entry is deleted successfully');
                    localStorage.setItem('popupType', 'success');
                    localStorage.setItem('scrollPosition', String(scrollPosition));
                    localStorage.setItem('currentPage', String(currentPage));
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    localStorage.setItem('popupMessage', 'Failed to delete entry');
                    localStorage.setItem('popupType', 'error');
                }
            } catch (error) {
                console.error('Error deleting result:', error);
                alert('Error deleting result');
            }
        } else {
            onDelete(result);
        }
    };

    // Normal copy function and copy function without inv# for spec list
    const handleCopySpecs = (content: string, index: number, isSpecsOnly: boolean = false) => {
        let textToCopy = content;

        if (isSpecsOnly) {
            // If isSpecsOnly is true, remove the INV# line
            textToCopy = content
                .split('\n') // Split the content into an array of lines
                .filter(line => !line.startsWith('INV#:')) // Filter out the line that starts with 'INV#:'
                .join('\n'); // Join the remaining lines back into a single string
        }

        // Copy the text to clipboard
        navigator.clipboard.writeText(textToCopy);

        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Copy function for Invoice Number
    const handleCopyInvoice = (content: string, index: number) => {
        navigator.clipboard.writeText(content);
        setCopiedInvoiceIndex(index);
        setTimeout(() => setCopiedInvoiceIndex(null), 2000); // Reset after 2 seconds
    };

    // Copy function for NAS Location
    const handleCopyNasLocation = (content: string, index: number) => {
        navigator.clipboard.writeText(content);
        setCopiedNasLocationIndex(index);
        setTimeout(() => setCopiedNasLocationIndex(null), 2000); // Reset after 2 seconds
    };


    return (
        <div className="container mx-auto mt-6">
            <div className="flex justify-start mb-2">
                <button
                    className="bg-transparent border border-white/30 hover:bg-white hover:text-black text-white/50 px-3 py-1 rounded-lg mr-2 font-mono"
                    onClick={() => {
                        if (expandedRows.length > 0) {
                            setExpandedRows([]); // Collapse all rows if all are expanded
                        } else {
                            setExpandedRows(results.map((_, index) => index)); // Expand all rows
                        }
                    }}
                >
                    {expandedRows.length > 0 ? 'Collapse All' : 'Expand All'}
                </button>
            </div>

            {/* Make the table scrollable on mobile */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full text-left font-mono">
                    <thead>
                        <tr className="border-b border-white/20 text-white/50">
                            <th className="rounded-l-lg px-2 py-2 w-auto font-light sm:px-4">Date</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4">Invoice ID</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4">NAS Location</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4">Total</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4">Status</th>
                            <th className="rounded-r-lg px-2 py-2 w-auto font-light sm:px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, index) => (
                            <React.Fragment key={index}>
                                <tr id={`row-${result.invNumber}`} className="border-b border-t border-white/20 hover:bg-white/10">
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4" onClick={() => toggleRow(index)}>
                                        {result.created_at ? formatDate(result.created_at) : 'Unknown'}
                                    </td>
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4 group relative" onClick={() => toggleRow(index)}>
                                        {result.total}_{result.invNumber}
                                        <button
                                            className="absolute right-0 top-0 text-black bg-slate-100 ml-2 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100 p-0.5 rounded-lg mt-1 mr-1 drop-shadow-xl"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyInvoice(`${result.total}_${result.invNumber}`, index);
                                            }}
                                            title="Copy invoice ID"
                                        >
                                            {copiedInvoiceIndex === index ? (
                                                <FaCheck className="text-green-700 p-1" size={22} />
                                            ) : (
                                                <div className="hover:bg-gray-300 rounded-full">
                                                    <MdContentCopy className="p-1" size={22} />
                                                </div>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-2 py-1 w-full cursor-pointer border-r border-white/20 sm:px-4 group relative" onClick={() => toggleRow(index)}>
                                        {result.nasLocation}
                                        <button
                                            className="absolute right-0 top-0 text-black bg-slate-100 ml-2 transition-opacity duration-200 ease-in-out opacity-0 group-hover:opacity-100 p-0.5 rounded-lg mt-1 mr-1 drop-shadow-xl"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyNasLocation(result.nasLocation, index);
                                            }}
                                            title="Copy NAS location"
                                        >
                                            {copiedNasLocationIndex === index ? (
                                                <FaCheck className="text-green-700 p-1" size={22} />
                                            ) : (
                                                <div className="hover:bg-gray-300 rounded-full">
                                                    <MdContentCopy className="p-1" size={22} />
                                                </div>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4" onClick={() => toggleRow(index)}>
                                        {result.total}
                                    </td>
                                    <td className="px-2 py-1 w-auto border-r border-white/20 sm:px-4 relative sm:static">
                                        <button
                                            onClick={() => setIsStatusMenuOpen(isStatusMenuOpen === index ? null : index)}
                                            className={`rounded-full py-0 px-2 flex items-center space-x-1 ${statuses[result.invNumber] === 'Scheduled'
                                                ? 'bg-purple-900'
                                                : statuses[result.invNumber] === 'Posted'
                                                    ? 'bg-green-700'
                                                    : 'bg-gray-600'
                                                } text-white`}
                                        >
                                            <div className="flex items-center space-x-1">
                                                <div
                                                    className={`mr-1 rounded-full h-2 w-2 ${statuses[result.invNumber] === 'Scheduled'
                                                        ? 'bg-purple-400'
                                                        : statuses[result.invNumber] === 'Posted'
                                                            ? 'bg-green-400'
                                                            : 'bg-gray-400'
                                                        } flex-shrink-0`}
                                                ></div>
                                                <span>{statuses[result.invNumber] || 'Ready'}</span>
                                            </div>
                                        </button>

                                        {isStatusMenuOpen === index && (
                                            <div
                                                ref={dropdownRef}
                                                className="absolute mt-2 w-max rounded-lg shadow-lg z-50 p-2 glassmorphisms"
                                            >
                                                <button
                                                    onClick={() => handleStatusChange(result.invNumber, 'Ready')}
                                                    className="block text-left py-0 px-2 bg-gray-600 text-white hover:bg-gray-500 rounded-full mb-2"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <div className="mr-1 rounded-full h-2 w-2 bg-gray-400 flex-shrink-0"></div>
                                                        <span>Ready</span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(result.invNumber, 'Scheduled')}
                                                    className="block text-left py-0 px-2 bg-purple-900 text-white hover:bg-purple-700 rounded-full mb-2"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <div className="mr-1 rounded-full h-2 w-2 bg-purple-400 flex-shrink-0"></div>
                                                        <span>Scheduled</span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(result.invNumber, 'Posted')}
                                                    className="block text-left py-0 px-2 bg-green-700 text-white hover:bg-green-600 rounded-full mb-1"
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <div className="mr-1 rounded-full h-2 w-2 bg-green-400 flex-shrink-0"></div>
                                                        <span>Posted</span>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-center px-2 py-1 w-auto flex items-center space-x-2 sm:px-4">
                                        <button onClick={() => toggleRow(index)} title={expandedRows.includes(index) ? 'Collapse this row' : 'Expand this row'}>
                                            {expandedRows.includes(index) ? (
                                                <CiCircleMinus size={24} className="text-blue-400 hover:text-blue-500" />
                                            ) : (
                                                <CiCirclePlus size={24} className="text-blue-400 hover:text-blue-500" />
                                            )}
                                        </button>
                                        <button
                                            className="px-2 py-1 flex items-center text-amber-300 hover:text-amber-500"
                                            onClick={() => handleCopySpecs(`${result.originalContent}`, index, true)}
                                            title="Copy specs list"
                                        >
                                            {copiedIndex === index ? <MdCheckCircle className="text-green-500" size={19} /> : <MdContentCopy size={19} />}
                                        </button>
                                        <button onClick={() => handleDelete(result)} title="Delete entry">
                                            <MdDeleteForever size={22} className="text-red-500 hover:text-red-700" />
                                        </button>
                                    </td>
                                </tr>

                                {/* Expanded Row with DetailCards */}
                                <tr>
                                    <td colSpan={6} className="px-4 py-0">
                                        <Collapse in={expandedRows.includes(index)} unmountOnExit sx={{ height: '36', lineHeight: 2 }}>

                                            <div className="max-[437px]:w-1/2 max-[638px]:w-3/5 sm:w-2/3 md:w-10/12 lg:w-full sticky top-0 left-0 z-1">
                                                <DetailCards
                                                    results={[result]}
                                                    onDelete={onDelete}
                                                    totalResults={totalResults}
                                                    searchedResults={searchedResults}
                                                />
                                            </div>

                                        </Collapse>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {popupMessage && <Popup message={popupMessage} type={popupType} />}
        </div>

    );
};

export default TableRows;
