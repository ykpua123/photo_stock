import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; // Import an arrow icon

const BackToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show the button when the user scrolls down 800px from the top
    const toggleVisibility = () => {
        if (window.scrollY > 800) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 700, // Scroll to top
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <div
            className={`hover:opacity-100 fixed bottom-9 left-2/4 transform transition-all duration-300 ease-in-out flex justify-center items-center space-x-2 -translate-x-10
            ${isVisible ? '-translate-y-10 opacity-60' : 'translate-y-0 opacity-0'}`}
        >
            <button
                onClick={scrollToTop}
                className="px-2 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-full shadow-lg transition-all duration-300"
                title="Scroll to Top"
            >
                <FaArrowUp size={16} />
            </button>
        </div>
    );
};

export default BackToTopButton;
