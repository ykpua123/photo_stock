"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@mui/material';
import { MdDeleteForever, MdContentCopy, MdCheckCircle } from "react-icons/md"; // Import Delete, Copy, Check icons

interface Result {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    image?: File | string | null; // Image can be either File (in TextAnalyzer) or a string (imagePath in ResultsPage)
    isSaved?: boolean; // Boolean flag to distinguish between saved and unsaved results
    errorMessage?: string | null;  // Optional errorMessage to store validation errors
    onDelete?: (result: Result) => void;
}

interface DetailCardsProps {
    results: Result[];
    onDelete: (result: Result) => void; // Function for deleting
    totalResults: number; // Total number of results in the system
    searchedResults: number; // Number of results matching the search query
}

const DetailCards: React.FC<DetailCardsProps> = ({ results, onDelete, totalResults, searchedResults }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // To track copied state
    const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: boolean }>({}); // Track preloaded images

    // Preload all images in the results array
    useEffect(() => {
        const preloadImages = async () => {
            const newPreloadedImages: { [key: string]: boolean } = {};
            await Promise.all(
                results.map((result) => {
                    const imageUrl =
                        result.image && typeof result.image !== 'string'
                            ? URL.createObjectURL(result.image as File)
                            : result.image;

                    if (imageUrl && !preloadedImages[result.invNumber]) {
                        return new Promise<void>((resolve) => {
                            const img = new Image();
                            img.src = imageUrl;
                            img.onload = () => {
                                newPreloadedImages[result.invNumber] = true;
                                resolve();
                            };
                        });
                    }
                })
            );
            setPreloadedImages((prev) => ({ ...prev, ...newPreloadedImages }));
        };

        preloadImages();
    }, [results]);

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
                    body: JSON.stringify({ invNumber: result.invNumber }), // Send invNumber to the API
                });

                if (response.ok) {
                    window.location.reload(); // Refresh the page after deletion
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting result: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error deleting result:', error);
                alert('Error deleting result');
            }
        } else {
            // For unsaved results, simply remove the entry with no alerts
            onDelete(result); // Call the parent component's onDelete method to remove the entry
        }
    };

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset icon after 2 seconds
    };

    return (
        <ul className="list-none">
            {results.map((result, index) => {
                // Memoize the image URL for File objects
                const imageURL = useMemo(
                    () =>
                        result.image && typeof result.image !== 'string'
                            ? URL.createObjectURL(result.image as File)
                            : result.image,
                    [result.image]
                );

                return (
                    <li key={index} className="mb-6 flex flex-wrap rounded-lg pt-4 pb-4">
                        {/* Details */}
                        <div className="w-full flex justify-between">
                            <h3 className="text-lg font-mono font-semibold text-blue-500">
                                {result.total}_{result.invNumber}
                                <button
                                    className="text-amber-300 hover:text-amber-400 ml-2 align-middle"
                                    title="Copy invoice name"
                                    onClick={() => handleCopy(`${result.total}_${result.invNumber}`, index)}
                                >
                                    {copiedIndex === index ? <MdCheckCircle className="text-green-500" size={18} /> : <MdContentCopy size={18} />}
                                </button>
                            </h3>
                        </div>

                        {/* NAS Location */}
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center">
                                <p className="text-white font-mono text-base">
                                    {result.nasLocation}
                                    <button
                                        className="text-amber-300 hover:text-amber-400 ml-2 align-middle"
                                        title="Copy NAS location"
                                        onClick={() => handleCopy(result.nasLocation, index + results.length)}
                                    >
                                        {copiedIndex === index + results.length ? <MdCheckCircle className="text-green-500" size={18} /> : <MdContentCopy size={18} />}
                                    </button>
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDelete(result)}
                                    title="Delete"
                                >
                                    <MdDeleteForever size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Flex container for content and image */}
                        <div className="flex w-full md:flex-row flex-col rounded-lg p-4 mt-5 bg-neutral-900 border border-white/60 flex-col-reverse text-white">
                            {/* Content */}
                            <div className="md:w-1/2 w-full p-2 md:px-10 flex items-center">
                                <pre className="mt-2 w-full overflow-x-auto">
                                    {result.originalContent}
                                </pre>
                            </div>

                            {/* Image */}
                            <div className="md:w-1/2 w-full p-2 flex justify-center items-center relative">
                                {preloadedImages[result.invNumber] ? (
                                    <img
                                        src={imageURL || ''}
                                        alt={`Preview for ${result.invNumber}`}
                                        className="w-full h-auto rounded-lg transition-opacity duration-300"
                                    />
                                ) : (
                                    <Skeleton
                                        variant="rectangular"
                                        width="100%"
                                        height="100%"
                                        className="absolute w-full h-auto rounded-lg"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Error Message */}
                        {result.errorMessage && (
                            <div className="w-full bg-red-900/10 mt-4 rounded-lg">
                                <p className="text-red-500 font-mono text-sm px-4 py-2">
                                    {result.errorMessage
                                        .split('\n')
                                        .filter((line) => line.trim() !== '')
                                        .map((line, index) => (
                                            <div key={index} className="flex items-center space-x-2 py-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="py-1 icon-triangle-exclamation" width="24" height="24">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
                                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                                    <line x1="12" y1="17" x2="12" y2="17.01"></line>
                                                </svg>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                </p>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default DetailCards;
