import React, { useState, useEffect } from 'react';
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from "react-icons/io";

interface PreviewCarouselProps {
    images: string[]; // Array of image URLs
    onImageClick: (image: string) => void; // Function to handle image click
}

const PreviewCarousel: React.FC<PreviewCarouselProps> = ({ images, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const imagesPerPage = 3;

    // Calculate the maximum index that allows showing 3 images
    const maxIndex = Math.max(0, images.length - imagesPerPage);

    //Calculate the number of pages
    const totalPages = Math.ceil(images.length / imagesPerPage);

    // Function to handle scrolling to the next set of images
    const handleNext = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 3, maxIndex)); // Scroll by 3 images, but stop at the end
    };

    // Function to handle scrolling to the previous set of images
    const handlePrev = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 3, 0)); // Scroll back by 3 images, but stop at the beginning
    };

    // Reset currentIndex to 0 whenever the images array changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    // Calculate the active page
    const activePage = Math.floor(currentIndex / imagesPerPage);

    // Function to handle dot click
    const handleDotClick = (pageIndex: number) => {
        setCurrentIndex(pageIndex * imagesPerPage);
    };

    return (
        <div className="relative w-full mx-auto flex flex-col items-center">
            <div className="w-full overflow-hidden flex items-center">
                {/* Previous Button */}
                {currentIndex > 0 && (
                    <button
                        onClick={handlePrev}
                        className="absolute left-[-35px] rounded-full text-white z-10 cursor-pointer"
                        disabled={currentIndex === 0} // Disable if at the beginning
                    >
                        <IoIosArrowDropleftCircle size={26} className="hover:animate-bounceLeftRight" />
                    </button>
                )}

                {/* Carousel Container with sliding animation */}
                <div className="w-full overflow-hidden">
                    <div
                        className="flex transition-transform duration-500"
                        style={{
                            transform: `translateX(-${currentIndex * 100 / 3}%)`,
                        }}
                    >
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className="w-1/3 flex-shrink-0 px-2" // Set overflow-visible to prevent image clipping
                            >
                                <img
                                    src={image}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-auto cursor-pointer rounded-lg border-transparent border-2 hover:border-white/60 transition-all duration-300 ease-in-out"
                                    onClick={() => onImageClick(image)} // Call the handler on image click
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Button */}
                {currentIndex < maxIndex && (
                    <button
                        onClick={handleNext}
                        className="absolute right-[-35px] rounded-full text-white z-10 cursor-pointer"
                    >
                        <IoIosArrowDroprightCircle size={26} className="hover:animate-bounceRightLeft" />
                    </button>
                )}
            </div>
            {/* Dotted Pagination */}
            <div className="flex mt-4 space-x-4 hover:bg-white/5 py-2 px-3 rounded-full cursor-pointer transition-all duration-300 ease-in-out">
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                    <button onClick={() => handleDotClick(pageIndex)} key={pageIndex} className={`hover:bg-white w-2 h-2 rounded-full transition-colors ${pageIndex === activePage ? 'bg-white' : 'bg-gray-500'}`} />
                ))}
            </div>
        </div>
    );
};

export default PreviewCarousel;
