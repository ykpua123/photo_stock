import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdError } from 'react-icons/md'; // Import success and error icons

interface PopupMessageProps {
    message: string;
    type: 'success' | 'error';
    duration?: number; // Optional prop for specifying the duration of the popup
}

const Popup: React.FC<PopupMessageProps> = ({ message, type, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);  // To trigger fade-out transition

    useEffect(() => {
        // Trigger fade-in when the component is mounted
        setVisible(true);

        // Automatically fade-out after the specified duration
        const timeout = setTimeout(() => {
            setClosing(true);  // Start fade-out
            setTimeout(() => setVisible(false), 500);  // Hide after fade-out completes
        }, duration);

        return () => clearTimeout(timeout); // Cleanup the timeout
    }, [duration]);

    // Handle manual close via close button
    const handleClose = () => {
        setClosing(true);  // Start fade-out
        setTimeout(() => setVisible(false), 500);  // Hide after fade-out completes
    };

    return (
        <div
            className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 max-w-fit w-full p-4 rounded-lg shadow-lg text-white transition-opacity duration-500 ease-in-out
        ${visible ? 'opacity-100' : 'opacity-0'} 
        ${type === 'success' ? 'bg-green-800' : 'bg-red-700'}`}
            style={{
                minWidth: '250px',
                pointerEvents: visible ? 'auto' : 'none' // Prevent interaction during fade-out
            }}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    {type === 'success' ? (
                        <MdCheckCircle size={20} className="text-white" />
                    ) : (
                        <MdError size={20} className="text-white" />
                    )}
                    <span className="font-inter font-sm">{message}</span>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-4 text-white focus:outline-none hover:text-gray-300"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default Popup;
