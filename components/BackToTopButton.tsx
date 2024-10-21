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
        }7
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 700,
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
        <div>
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className={`transition-opacity duration-500 ease-in-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'} fixed bottom-32 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-blue-600 hover:bg-blue-800 text-white rounded-full shadow-lg transition-all duration-300 flex justify-center items-center space-x-2`}
                    title="Back to Top"
                >
                    <FaArrowUp size={16} />
                    <span className="font-mono">Scroll to top</span>
                </button>
            )}
        </div>
    );
};

export default BackToTopButton;
