import React, { useState, useEffect } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useDebouncedCallback } from 'use-debounce';

interface PreviewCarouselProps {
    images: string[]; // Array of image URLs
    onImageClick: (image: string) => void; // Function to handle image click
}

// Memoized Image Component
const MemoizedImage = React.memo(({ image, onImageClick }: { image: string; onImageClick: (image: string) => void }) => (
    <img
        loading="lazy"
        src={image}
        alt="Preview"
        className="w-full h-auto cursor-pointer rounded-lg border-transparent border-2 hover:border-white/60 transition-all duration-300 ease-in-out"
        onClick={() => onImageClick(image)}
    />
));

const PreviewCarousel: React.FC<PreviewCarouselProps> = ({ images, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0); // Default to 0 on component mount

    const imagesPerPage = 3;

    // Calculate the maximum index that allows showing 3 images
    const maxIndex = Math.max(0, images.length - imagesPerPage);

    // Preload adjacent images
    useEffect(() => {
        const preloadImages = () => {
            const adjacentImages = [
                images[currentIndex - 1],
                images[currentIndex],
                images[currentIndex + 1],
            ].filter(Boolean); // Avoid undefined entries

            adjacentImages.forEach((image) => {
                const img = new Image();
                img.src = image;
            });
        };
        preloadImages();
    }, [currentIndex, images]);

    // Function to handle scrolling to the next set of images
    const handleNext = useDebouncedCallback(() => {
        const newIndex = Math.min(currentIndex + imagesPerPage, maxIndex);
        setCurrentIndex(newIndex);
    }, 200);

    // Function to handle scrolling to the previous set of images
    const handlePrev = useDebouncedCallback(() => {
        const newIndex = Math.max(currentIndex - imagesPerPage, 0);
        setCurrentIndex(newIndex);
    }, 200);

    // Reset currentIndex only if the images array changes significantly
    useEffect(() => {
        setCurrentIndex(0); // Reset the index whenever the component re-renders
    }, [images]);

    // Calculate the active page
    const activePage = Math.floor(currentIndex / imagesPerPage);

    return (
        <div className="relative w-full mx-auto flex flex-col items-center">
            <div className="w-full overflow-hidden flex items-center">
                {/* Carousel Container with sliding animation */}
                <div className="w-full overflow-hidden">
                    <div
                        className="flex transition-transform duration-500"
                        style={{
                            transform: `translateX(-${currentIndex * 100 / imagesPerPage}%)`,
                        }}
                    >
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className="w-1/3 flex-shrink-0 px-2" // Set overflow-visible to prevent image clipping
                            >
                                <MemoizedImage image={image} onImageClick={onImageClick} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex mt-6 space-x-4">
                {/* Previous Button */}
                <button
                    onClick={handlePrev}
                    className={`rounded-full border-2 border-gray-700 p-2 ${currentIndex === 0 ? 'text-gray-700 cursor-pointer' : 'text-white cursor-pointer'}`}
                    disabled={currentIndex === 0} // Disable if at the beginning
                >
                    <IoIosArrowBack size={20} className="" />
                </button>
                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className={`rounded-full border-2 border-gray-700 p-2 ${currentIndex < maxIndex ? 'text-white cursor-pointer' : 'text-gray-700 cursor-pointer'}`}
                >
                    <IoIosArrowForward size={20} className="" />
                </button>
            </div>
        </div>
    );
};

export default PreviewCarousel;
