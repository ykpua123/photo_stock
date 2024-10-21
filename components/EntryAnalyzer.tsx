"use client";  // Required for client-side interaction
import DetailCards from '@/components/DetailCards';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'; // Import Circular Progress styles


const EntryAnalyzer = () => {
    const [inputText, setInputText] = useState<string>('');
    const [nasLocation, setNasLocation] = useState<string>(''); // State for NAS Location
    const [analyzedResults, setAnalyzedResults] = useState<Entry[]>([]);
    const [images, setImages] = useState<File[]>([]); // State to store uploaded images
    const [imageCount, setImageCount] = useState<number>(0); // Dynamic image count
    const [uploadingProgress, setUploadingProgress] = useState<number>(0); // Track the uploading percentage
    const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0); // Track current image being uploaded
    const [isUploading, setIsUploading] = useState(false); // Track if uploading is in progress
    // const [totalResults, setTotalResults] = useState<number>(0); // Track total results count
    // const [searchQuery, setSearchQuery] = useState<string>(''); // Track search query


    // Function to handle image conversion to .webp
    const convertToWebP = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const webpFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
                                resolve(webpFile);
                            }
                        }, 'image/webp');
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    };

    // Function to handle image upload progress and simulation
    const handleUpload = async (acceptedFiles: File[]) => {
        const totalFiles = acceptedFiles.length;
        setImageCount(totalFiles);
        setIsUploading(true); // Start uploading progress
        setCurrentUploadIndex(0); // Reset upload index

        const webpImages: File[] = []; // Store converted webp images

        for (let i = 0; i < totalFiles; i++) {
            setCurrentUploadIndex(i);
            setUploadingProgress(0);

            const progressInterval = setInterval(() => {
                setUploadingProgress((prevProgress) => {
                    const nextProgress = prevProgress + 20; // Increment progress by 20% at a time
                    if (nextProgress >= 100) {
                        clearInterval(progressInterval); // Clear interval when reaching 100%
                    }
                    return nextProgress;
                });
            }, 500); // Adjust time for each progress step

            const webpFile = await convertToWebP(acceptedFiles[i]); // Convert image to .webp
            webpImages.push(webpFile); // Store the converted file
        }

        setImages(webpImages); // Set the state with the converted .webp images
        setIsUploading(false); // Stop uploading progress after all uploads
    };



    // Function to scan and analyze multiple INV# and Total pairs along with corresponding data
    const analyzeText = async () => {
        // Ensure required fields are filled
        if (!inputText || !nasLocation || images.length === 0) {
            alert('Please fill in all fields and upload images.');
            return;
        }

        // Updated regex to account for an optional space after RM
        const entryRegex = /INV#:\s*(\S+)[\s\S]*?Total:\s*(RM\s?[0-9,]+)/g;

        const matches = [...inputText.matchAll(entryRegex)];

        // Fetch existing results from the database to check for duplicates
        const existingResultsResponse = await fetch('/api/getResults', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const { results: existingResults } = await existingResultsResponse.json();

        // Extract all invNumbers from existing results for easy comparison
        const existingInvNumbers = existingResults.map((result: { invNumber: any; }) => result.invNumber);

        const results = await Promise.all(matches.map(async (match) => {
            // Extract INV# and sanitize it (remove hyphens)
            const invNumber = match[1].replace(/-/g, ''); // Remove any hyphens from INV#

            // Extract Total, remove commas and ensure there is no space between RM and the number
            const total = match[2].replace(/\s+(?=\d)|,/g, '').replace(' ', ''); // Remove spaces between RM and number

            const originalContent = match[0]; // Extract full original content (including details)

            // Build the {total}_{invNumber} format for matching (with sanitized INV#)
            const formattedName = `${total}_${invNumber}`;

            // Try to find a matching image for the current INV# by filename, ignoring (1) or similar
            const assignedImage = images.find((file) => {
                const regex = new RegExp(`${invNumber}(?:\\s*\\(\\d+\\))?`, 'i'); // Regex to match filenames with or without (1)
                return regex.test(file.name);
            });

            // Initialize an empty error message
            let errorMessage = '';

            // **NEW**: Check if INV# exists in the fetched results
            if (existingInvNumbers.includes(invNumber)) {
                errorMessage += `INV#: ${invNumber} is already in the database.\n`;
            }

            // Check for missing image and append error message if necessary
            if (!assignedImage) {
                errorMessage += `Missing image, ensure image filename matches INV#.\n`;
            }

            // Check if required specs are present in the original content
            const requiredSpecs = ['INV#', 'CPU', 'GPU', 'CASE', 'MOBO', 'RAM', 'PSU'];
            const missingSpecs = requiredSpecs.filter(spec => !originalContent.includes(spec));
            if (missingSpecs.length > 0) {
                errorMessage += `Missing ${missingSpecs.join(', ')}. Ensure spec list format is correct.\n`;
            }

            // Return the entry with the potential error message
            return {
                invNumber,
                total,
                originalContent: originalContent.trim(), // Keep original content, trimmed
                nasLocation, // Store the NAS Location provided by the user
                image: assignedImage || null, // Assign the matching image or null if no match found
                errorMessage: errorMessage || null, // Attach error message if any, otherwise null
            };
        }));

        // Set analyzed results (with potential error messages)
        setAnalyzedResults(results);
    };



    // Handle dropped images
    const onDrop = (acceptedFiles: File[]) => {
        handleUpload(acceptedFiles); // Handle upload and conversion to webp
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
        }, // Accept .jpeg, .jpg, and .png files
    });

    // Function to save results to the database, including image
    const saveResults = async (results: Entry[]) => {
        // Check if any result has an error before attempting to save
        const hasErrors = results.some(result => result.errorMessage);

        // If there are errors, alert the user and stop the save process
        if (hasErrors) {
            alert("Please fix errors before saving");
            return;
        }

        const confirmSave = window.confirm("Are you sure you want to save it?");
        if (!confirmSave) return;

        try {
            const formData = new FormData();

            results.forEach((result) => {
                formData.append('invNumber', result.invNumber);
                formData.append('total', result.total);
                formData.append('originalContent', result.originalContent);
                formData.append('nasLocation', result.nasLocation);

                if (result.image) {
                    formData.append('image', result.image);
                }
            });

            const response = await fetch('/api/saveResults', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Results saved successfully!');
                window.location.reload();
            } else {
                const errorData = await response.json();

                if (errorData.errors) {
                    const updatedResults = results.map(result => {
                        const error = errorData.errors.find((err: { invNumber: string; }) => err.invNumber === result.invNumber);
                        return error ? { ...result, errorMessage: error.message } : result;
                    });

                    setAnalyzedResults(updatedResults); // Update results with error messages

                    // Show alert with all error messages
                    alert("Entries were unable to save due to errors");
                }
            }
        } catch (error) {
            console.error('Error saving results', error);
        }
    };


    return (
        <div className="container mx-auto p-4 mt-12">
            <h2 className="text-2xl font-bold text-white-800 font-inter text-center mb-14">Upload</h2>
            <label className="block text-l font-bold text-white font-inter">
                Images Upload:
            </label>
            {/* Image Drag-and-Drop Area */}
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-white/50 p-6 rounded-lg text-center mb-4 bg-neutral-900 mt-4 cursor-pointer"
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-white/40 font-mono">Drop the images here...</p>
                ) : (
                    <p className="text-white font-mono">
                        Drag & drop / click to upload images in batch.<br />
                        <strong>{imageCount} images uploaded.</strong> {/* Dynamic image count */}
                    </p>
                )}
                {/* Show progress bar if uploading */}
                {isUploading && (
                    <div className="mt-4 text-center font-mono">
                        <div style={{ width: '10%', height: '10%', margin: '0 auto' }}>
                            <CircularProgressbar
                                value={(currentUploadIndex / imageCount) * 100 + (uploadingProgress / imageCount)} // Calculate overall progress
                                text={`${Math.floor((currentUploadIndex / imageCount) * 100 + (uploadingProgress / imageCount))}%`} // Display cumulative percentage
                                styles={{
                                    path: { stroke: `rgba(255, 194, 0, ${(currentUploadIndex / imageCount) * 100 + (uploadingProgress / imageCount) / 100})` },
                                    text: { fill: '#fff', fontSize: '14px' },
                                }}
                            />
                        </div>
                        <p className="mt-2 text-white text-sm">
                            {currentUploadIndex + 1}/{imageCount} images uploading in progress
                        </p>
                    </div>
                )}

            </div>



            {/* Text Input Area */}
            <div className="flex items-center mt-10">
                <label className="block text-l font-bold text-white font-inter">
                    Insert Batch Data:
                </label>

                {/* Information Icon with Tooltip */}
                <div className="relative group ml-2">
                    {/* Info Icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-400 cursor-pointer"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                        />
                    </svg>

                    {/* Tooltip */}
                    <div className="font-mono absolute bottom-full left-1/2 transform -translate-x-1/2 ml-2 mb-2 hidden group-hover:block bg-black text-white text-s rounded py-3 px-4 w-96">
                        <ul>
                            <li>1. Ensure image filename & INV# match the same invoice number, e.g.: "RM10360_AG49724" & "AG497-24"</li><br />
                            <li>2. Ensure specs list is in correct format</li>
                        </ul>
                    </div>
                </div>
            </div>
            <textarea
                className="w-full p-4 border border-white/60 rounded-lg text-amber-300 font-mono mt-4 bg-black"
                rows={14}
                placeholder={
                    `INV#: SE532-24\nCPU: INTEL I7-14700F\nACCESSORIES: PALADIN BCF INTEL 12GEN CONTACT FRAME\nCOOLER: PC COOLER RZ620\nMOBO: GIGABYTE B760M AORUS PRO AX DDR5\nRAM: GSKILL RIPJAWS S5 2x16GB DDR5 5200MHz (BLACK)\nGPU: MSI GEFORCE RTX4070 VENTUS 2X E 12GB OC\nPSU: ANTEC CSK650 GB 80+ BRONZE\nCASE: JONSBO D41 MESH SCREEN BLACK\nSSD: T-FORCE G70 PRO M.2 PCIe SSD 1TB (DRAM CACHE)\nHDD: SEAGATE 2TB BARACUDA HDD\n\nTotal: RM7,660`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required
            />

            {/* NAS Location input */}
            <div className="mt-10">
                <label htmlFor="nas-location" className="block text-l font-bold text-white font-inter">
                    NAS Location:
                </label>
                <input
                    type="text"
                    id="nas-location"
                    className="w-full mt-4 p-2 border border-white/60 rounded-lg font-mono text-amber-300 bg-black"
                    placeholder="W:\2024\2410_October Projects\241004_Photo"
                    value={nasLocation}
                    onChange={(e) => setNasLocation(e.target.value)}
                    required
                />
            </div>

            {/* Analyze Button */}
            <div className="text-right">
                <button
                    onClick={analyzeText}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded font-inter hover:bg-cyan-600"
                >
                    Submit
                </button>
            </div>

            {/* Display the Results */}
            {analyzedResults.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-xl font-bold text-white-800 font-inter">Preview Results</h2>
                    {/* Pass results to DetailCards */}
                    <DetailCards
                        results={analyzedResults.map(result => ({
                            ...result,
                            isSaved: false, // Mark these as unsaved entries (previews)
                        }))}
                        onDelete={(result) => setAnalyzedResults(prevResults => prevResults.filter(r => r.invNumber !== result.invNumber))} totalResults={0} searchedResults={0}
                    // totalResults={totalResults} // Pass total result count here
                    // searchQuery={searchQuery}   // Pass search query here
                    />

                    {/* Save Button and Result Count */}
                    <div className="text-right flex justify-between items-center mt-4">
                        {/* Show result count */}
                        <span className="text-white font-mono text-sm">
                            Previewing {analyzedResults.length} {analyzedResults.length === 1 ? "result" : "results"}, click "Save Results" to store into database.
                        </span>

                        <button
                            onClick={() => saveResults(analyzedResults)}
                            className="px-4 py-2 bg-green-600 text-white rounded font-inter"
                        >
                            Save Results
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

export interface Entry {
    invNumber: string;
    total: string;
    originalContent: string;
    nasLocation: string;
    image?: File | string | null; // Optional image assigned based on filename
    errorMessage?: string | null;  // Optional errorMessage to store validation errors
}

export default EntryAnalyzer;