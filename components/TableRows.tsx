"use client";

import React, { useState, useEffect, useRef } from 'react';
import DetailCards from './DetailCards'; // Assuming DetailCards is in the same folder or update the path accordingly
import Popup from './Popup';
import { MdCheckCircle, MdContentCopy, MdDeleteForever } from "react-icons/md";
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";
import Collapse from '@mui/material/Collapse'; // Import MUI's Collapse component

interface Result {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    image?: File | string | null;
    isSaved?: boolean;
    errorMessage?: string;
    created_at?: string;
    status?: string;
}

interface TableRowsProps {
    results: Result[];
    totalResults: number;
    searchedResults: number;
    onDelete: (result: Result) => void;
}

const TableRows: React.FC<TableRowsProps> = ({ results, onDelete, totalResults, searchedResults }) => {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [statuses, setStatuses] = useState<{ [invNumber: string]: string }>({}); // Use invNumber as key
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
    }, [results]); // Re-run every time `results` changes

    // Handle row expand/collapse
    const toggleRow = (index: number) => {
        if (expandedRows.includes(index)) {
            setExpandedRows(expandedRows.filter(row => row !== index)); // Collapse row
        } else {
            setExpandedRows([...expandedRows, index]); // Expand row
        }
    };
    const handleStatusChange = async (invNumber: string, status: string) => {
        // Save the current scroll position
        const scrollPosition = window.scrollY;
    
        // Save the current page (assuming currentPage is your pagination state)
        const currentPage = localStorage.getItem('currentPage') || "1";
    
        // Update the state immediately for the specific entry's status
        setStatuses(prevStatuses => ({
            ...prevStatuses,
            [invNumber]: status,
        }));
    
        setIsStatusMenuOpen(null); // Close the dropdown after selection
    
        try {
            // Send the updated status to the backend API to save it
            const response = await fetch('/api/updateStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ invNumber, status }),
            });
    
            if (response.ok) {
                // Save the success message and its type to localStorage
                localStorage.setItem('popupMessage', 'Status updated successfully');
                localStorage.setItem('popupType', 'success');
    
                // Store the scroll position and the current page before refreshing
                localStorage.setItem('scrollPosition', String(scrollPosition));
                localStorage.setItem('currentPage', String(currentPage));
    
                // Reload the page after a successful update
                window.location.reload();
            } else {
                const errorData = await response.json();
                // Save the failure message and its type to localStorage
                localStorage.setItem('popupMessage', 'Failed to update status');
                localStorage.setItem('popupType', 'error');
    
                window.location.reload(); // Reload page on failure to maintain UI consistency
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };


    // Restore the scroll position after the page reloads
    useEffect(() => {
        const savedScrollPosition = localStorage.getItem('scrollPosition');
        if (savedScrollPosition) {
            window.scrollTo(0, Number(savedScrollPosition));
            localStorage.removeItem('scrollPosition'); // Remove after restoring
        }
    }, []);



    // Close dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusMenuOpen(null); // Close the dropdown when clicking outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDelete = async (result: Result) => {
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
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting result: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error deleting result:', error);
                alert('Error deleting result');
            }
        } else {
            onDelete(result);
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="container mx-auto mt-6">
            <table className="table-auto w-full text-left font-mono">
                <thead>
                    <tr className="border-b border-white/20 text-white/50">
                        <th className="rounded-l-lg px-4 py-2 w-max font-light">Date</th>
                        <th className="px-4 py-2 w-max font-light">Invoice Name</th>
                        <th className="px-4 py-2 w-max font-light">NAS Location</th>
                        <th className="px-4 py-2 w-max font-light">Total</th>
                        <th className="px-4 py-2 w-max font-light">Status</th>
                        <th className="rounded-r-lg px-4 py-2 w-max font-light">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((result, index) => (
                        <React.Fragment key={index}>
                            <tr className="border-b border-t border-white/20 hover:bg-white/10">
                                <td className="px-4 py-1 w-auto cursor-pointer border-r border-white/20" onClick={() => toggleRow(index)}>
                                    {result.created_at ? formatDate(result.created_at) : 'Unknown'}
                                </td>
                                <td className="px-4 py-1 w-auto cursor-pointer border-r border-white/20" onClick={() => toggleRow(index)}>
                                    {result.total}_{result.invNumber}
                                </td>
                                <td className="px-4 py-1 w-full cursor-pointer border-r border-white/20" onClick={() => toggleRow(index)}>
                                    {result.nasLocation}
                                </td>
                                <td className="px-4 py-1 w-auto cursor-pointer border-r border-white/20" onClick={() => toggleRow(index)}>
                                    {result.total}
                                </td>
                                <td className="px-2 py-1 w-12 border-r border-white/20">
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
                                <td className="text-center px-4 py-1 w-auto flex items-center space-x-2">
                                    <button onClick={() => toggleRow(index)} title={expandedRows.includes(index) ? 'Collapse this row' : 'Expand this row'}>
                                        {expandedRows.includes(index) ? (
                                            <CiCircleMinus size={24} className="text-blue-400 hover:text-blue-500" />
                                        ) : (
                                            <CiCirclePlus size={24} className="text-blue-400 hover:text-blue-500" />
                                        )}
                                    </button>
                                    <button
                                        className="px-2 py-1 flex items-center text-amber-300 hover:text-amber-500"
                                        onClick={() => handleCopy(`${result.originalContent}`, index)}
                                        title="Copy specs list"
                                    >
                                        {copiedIndex === index ? <MdCheckCircle className="text-green-500" size={20} /> : <MdContentCopy size={20} />}
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
                                        <DetailCards
                                            results={[result]}
                                            onDelete={onDelete}
                                            totalResults={totalResults}
                                            searchedResults={searchedResults}
                                        />
                                    </Collapse>
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
             {/* PopupMessage Component */}
             {popupMessage && <Popup message={popupMessage} type={popupType} />}
        </div>
    );
};

export default TableRows;
