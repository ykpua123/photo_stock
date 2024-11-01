"use client";

import React, { useState, useEffect, useRef } from 'react';
import DetailCards from './DetailCards';
import Popup from './Popup';
import { MdCheckCircle, MdContentCopy, MdDeleteForever } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { CiCirclePlus, CiCircleMinus } from "react-icons/ci";
import Collapse from '@mui/material/Collapse'; // Import MUI's Collapse component
import { ToastContainer, toast, Slide, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    rowsPerPageDropdown?: JSX.Element;
    resultsLength?: JSX.Element;
}
interface PopupMessage {
    message: string;
    type: 'success' | 'error';
    id: number;
}

const TableRows: React.FC<TableRowsProps> = ({ results, onDelete, totalResults, searchedResults, expandedRow, rowsPerPageDropdown, resultsLength }) => {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<{ [invNumber: string]: string }>({}); // Use invNumber as key
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedInvoiceIndex, setCopiedInvoiceIndex] = useState<number | null>(null); // For Invoice Number
    const [copiedNasLocationIndex, setCopiedNasLocationIndex] = useState<number | null>(null); // For NAS Location
    // const [popupMessage, setPopupMessage] = useState<string | null>(null);
    // const [popupType, setPopupType] = useState<'success' | 'error'>('success');
    // const [messages, setMessages] = useState<PopupMessage[]>([]);
    const [localResults, setLocalResults] = useState<Result[]>(results);
    const [isBulkSelect, setIsBulkSelect] = useState(false);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState("");

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        });
    };

    // Check if there's a popup message in localStorage after reload
    // useEffect(() => {
    //     const message = localStorage.getItem('popupMessage');
    //     const type = localStorage.getItem('popupType');

    //     if (message && type) {
    //         setPopupMessage(message);
    //         setPopupType(type as 'success' | 'error');

    //         // Remove the message from localStorage so it doesn't persist on further reloads
    //         localStorage.removeItem('popupMessage');
    //         localStorage.removeItem('popupType');

    //         // Automatically hide the popup after a few seconds
    //         setTimeout(() => {
    //             setPopupMessage(null);
    //         }, 3000); // 3 seconds duration
    //     }
    // }, []);

    // Set the initial statuses state based on the `results` prop
    useEffect(() => {
        const initialStatuses = results.reduce((acc, result) => {
            acc[result.invNumber] = result.status || 'Ready'; // Default to 'Ready' if status is missing
            return acc;
        }, {} as { [invNumber: string]: string });
        setStatuses(initialStatuses);
    }, [results]);

    // Handle row toggle expansion/collapse
    const toggleRow = (invNumber: string) => {
        if (expandedRows.includes(invNumber)) {
            setExpandedRows(expandedRows.filter(row => row !== invNumber)); // Collapse the row if it is already expanded

        } else {
            setExpandedRows([...expandedRows, invNumber]); // Expand the row while keeping other rows expanded
        }
    };

    useEffect(() => {
        if (expandedRow) {
            const rowExists = results.some(result => result.invNumber === expandedRow);
            if (rowExists) {
                // If the row is found in the current page's results, expand it
                setExpandedRows([expandedRow]);
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
                // setPopupMessage('Status updated successfully');
                // setPopupType('success');
                toast.success(`[${invNumber}] Status updated to "${status}"`);
            } else {
                // setPopupMessage('Failed to update status');
                // setPopupType('error');
                toast.error(`[${invNumber}] Error updating status`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // setPopupMessage('Error updating status');
            // setPopupType('error');
        }

        // Ensure the popup message appears every time by resetting the message after a delay
        // setTimeout(() => {
        //     setPopupMessage(null); // Hide the popup after 3 seconds
        // }, 3000);

        // Optionally save scroll position or other settings as needed
        localStorage.setItem('scrollPosition', String(scrollPosition));
        localStorage.setItem('currentPage', currentPage);
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

    useEffect(() => {
        setLocalResults(results);
    }, [results]);

    // Function to handle deletion
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
                    // Update localResults by filtering out the deleted item
                    setLocalResults(prevResults => prevResults.filter(r => r.invNumber !== result.invNumber));

                    // Show success toast notification
                    toast.success(`[${result.invNumber}] Entry is deleted successfully`);
                } else {
                    // Display error toast if deletion fails
                    toast.error(`[${result.invNumber}] Error deleting entry`);
                }
            } catch (error) {
                console.error('Error deleting result:', error);
                toast.error('An error occurred while deleting the entry');
            }
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

    const handleBulkStatusChange = async (status: string) => {
        if (selectedRows.length === 0) {
            toast.info("Select at least 1 row to update status");
            return; // Exit early if no rows are selected
        }

        try {
            await Promise.all(selectedRows.map(async (invNumber) => {
                await handleStatusChange(invNumber, status);
            }));


        } catch {
            toast.error("Error updating status for selected rows");
        }
        // Clear all selected checkboxes
        setSelectedRows([]);
    };

    const toggleBulkSelect = () => {
        setIsBulkSelect(!isBulkSelect);
        setSelectedRows([]);
    };

    const handleSelectAll = (e: { target: { checked: any; }; }) => {
        setSelectedRows(e.target.checked ? results.map(result => result.invNumber) : []);
    };

    const handleRowSelection = (invNumber: string) => {
        setSelectedRows(selectedRows.includes(invNumber)
            ? selectedRows.filter(row => row !== invNumber)
            : [...selectedRows, invNumber]);
    };


    return (

        <div className="container mx-auto mt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2 mb-2">
                {/* First Row: Rows Dropdown and Expand/Collapse - Inline on both mobile and desktop */}
                <div className="flex space-x-2 mb-6 sm:mb-0">
                    {rowsPerPageDropdown}
                    <button
                        className="bg-black border border-white/60 hover:bg-white hover:text-black text-white/60 px-3 py-1 rounded-lg font-mono"
                        onClick={() => {
                            if (expandedRows.length > 0) {
                                setExpandedRows([]); // Collapse all rows if all are expanded
                            } else {
                                setExpandedRows(results.map((result) => result.invNumber)); // Expand all rows
                            }
                        }}
                    >
                        {expandedRows.length > 0 ? 'Collapse All' : 'Expand All'}
                    </button>
                </div>

                {/* Second Row: Bulk Select Toggle and Set Status - Stacks only on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 font-mono">
                    <div className="flex items-center space-x-2">
                        <label>Bulk Select: </label>
                        <div
                            className={`relative inline-block w-10 h-5 transition duration-200 ease-linear rounded-full cursor-pointer ${isBulkSelect ? 'bg-green-500' : 'bg-red-500'}`}
                            onClick={toggleBulkSelect}
                            title="Toggle checkbox"
                        >
                            <span
                                className={`absolute left-1 top-1 w-3 h-3 bg-black rounded-full transition-transform transform ${isBulkSelect ? 'translate-x-5' : 'translate-x-0'}`}
                            ></span>
                        </div>
                    </div>

                    <div className={`flex items-center space-x-2 ${!isBulkSelect ? 'opacity-50' : 'opacity-100'}`}>
                        <label>Set: </label>
                        <select
                            className="text-white p-2 border border-white/60 rounded-lg bg-black cursor-pointer"
                            value={bulkStatus}
                            onClick={() => setBulkStatus("")} // Temporarily reset to allow reselecting
                            onChange={(e) => {
                                const selectedValue = e.target.value;
                                setBulkStatus(e.target.value);
                                handleBulkStatusChange(selectedValue);
                            }}
                            disabled={!isBulkSelect} // Disable when Bulk Select is off
                        >
                            <option value="" disabled hidden>Status</option>
                            <option value="Ready">Ready</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Posted">Posted</option>
                        </select>
                    </div>
                </div>

                {/* Third Row: Total Results Count - Centered on mobile, inline on desktop */}
                <div className="flex items-center justify-end sm:justify-start">
                    {resultsLength}
                </div>
            </div>


            {/* Make the table scrollable on mobile */}
            <div className="overflow-x-auto">
                <table className="table-auto w-full text-left font-mono">
                    <thead>
                        <tr className="text-white/50">
                            {/* Checkbox column, always present */}
                            <th className="w-4 px-1 py-1 font-bold">
                                <div className={`checkbox-wrapper ${isBulkSelect ? 'visible' : 'hidden'}`}>
                                    {isBulkSelect ? (
                                        <input
                                            type="checkbox"
                                            className="custom-checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedRows.length === results.length}
                                            title="Select / Deselect all"
                                        />
                                    ) : (
                                        // Placeholder element to keep column width
                                        <div className="w-4 h-4"></div>
                                    )}
                                </div>
                            </th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">Date</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">Invoice ID</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">NAS Location</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">Total</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">Status</th>
                            <th className="px-2 py-2 w-auto font-light sm:px-4 border-b border-white/20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localResults.map((result, index) => (
                            <React.Fragment key={index}>
                                <tr id={`row-${result.invNumber}`} className="border-white/20 border-b border-t hover:bg-white/10">
                                    {/* Checkbox cell, always present */}
                                    <td className="w-4 px-1 py-1 font-bold">
                                        <div className={`checkbox-wrapper ${isBulkSelect ? 'visible' : 'hidden'} `}>
                                            {isBulkSelect ? (
                                                <input
                                                    type="checkbox"
                                                    className="custom-checkbox"
                                                    checked={selectedRows.includes(result.invNumber)}
                                                    onChange={() => handleRowSelection(result.invNumber)}
                                                />
                                            ) : (
                                                // Placeholder element to maintain space when checkbox is hidden
                                                <div className="w-4 h-4"></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4" onClick={() => toggleRow(result.invNumber)}>
                                        {result.created_at ? formatDate(result.created_at) : 'Unknown'}
                                    </td>
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4 group relative" onClick={() => toggleRow(result.invNumber)}>
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
                                    <td className="px-2 py-1 w-full cursor-pointer border-r border-white/20 sm:px-4 group relative" onClick={() => toggleRow(result.invNumber)}>
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
                                    <td className="px-2 py-1 w-auto cursor-pointer border-r border-white/20 sm:px-4" onClick={() => toggleRow(result.invNumber)}>
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
                                    <td className="px-2 py-1 w-auto sm:px-4">
                                        <div className="flex items-center space-x-2 pr-4">
                                            <button onClick={() => toggleRow(result.invNumber)} title={expandedRows.includes(result.invNumber) ? 'Collapse this row' : 'Expand this row'}>
                                                {expandedRows.includes(result.invNumber) ? (
                                                    <CiCircleMinus size={24} className="text-blue-400 hover:text-blue-500" />
                                                ) : (
                                                    <CiCirclePlus size={24} className="text-blue-400 hover:text-blue-500" />
                                                )}
                                            </button>
                                            <button
                                                className="px-2 py-1 text-amber-300 hover:text-amber-500"
                                                onClick={() => handleCopySpecs(`${result.originalContent}`, index, true)}
                                                title="Copy specs list"
                                            >
                                                {copiedIndex === index ? <MdCheckCircle className="text-green-500" size={19} /> : <MdContentCopy size={19} />}
                                            </button>
                                            <button onClick={() => handleDelete(result)} title="Delete entry">
                                                <MdDeleteForever size={22} className="text-red-500 hover:text-red-700" />
                                            </button>
                                        </div>
                                    </td>

                                </tr>

                                {/* Expanded Row with DetailCards */}
                                <tr>
                                    <td colSpan={6} className="px-4 py-0">
                                        <Collapse in={expandedRows.includes(result.invNumber)} unmountOnExit sx={{ width: '110%', height: '36', lineHeight: 2 }}>

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

            {/* <Popup messages={messages} onRemove={removePopupMessage} /> */}
            {/* {popupMessage && <Popup message={popupMessage} type={popupType} />} */}
            <ToastContainer style={{ width: "400px" }}
                position="bottom-center"
                autoClose={3000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                pauseOnHover
                theme="dark"
                transition={Bounce}
                stacked
            />
        </div>

    );
};

export default TableRows;
