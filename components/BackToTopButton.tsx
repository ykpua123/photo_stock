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
                <div className="opacity-60 hover:opacity-100 fixed bottom-1/2 right-1/4 transform translate-x-16 flex justify-center items-center space-x-2">
                    <button
                        onClick={scrollToTop}
                        className=" px-2 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-full shadow-lg transition-all duration-300"
                        title="Scroll to Top"
                    >
                        <FaArrowUp size={16} />

                    </button>
                
                </div>
                
            )}
        </div>
    );
};

export default BackToTopButton;
