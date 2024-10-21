import React, { useState } from 'react';
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle  } from "react-icons/io";

interface PreviewCarouselProps {
    images: string[]; // Array of image URLs
    onImageClick: (image: string) => void; // Function to handle image click
}

const PreviewCarousel: React.FC<PreviewCarouselProps> = ({ images, onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Calculate the maximum index that allows showing 3 images
    const maxIndex = Math.max(0, images.length - 3);

    // Function to handle scrolling to the next set of images
    const handleNext = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 3, maxIndex)); // Scroll by 3 images, but stop at the end

    };

    // Function to handle scrolling to the previous set of images
    const handlePrev = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 3, 0)); // Scroll back by 3 images, but stop at the beginning
    };
    

    return (
        <div className="relative w-full mx-auto flex items-center">
            {/* Previous Button */}
            <button
                onClick={handlePrev}
                className="absolute left-[-35px] rounded-full text-white z-10 cursor-pointer"
                disabled={currentIndex === 0} // Disable if at the beginning
            >
                 <IoIosArrowDropleftCircle size={26} className="hover:animate-bounceLeftRight" />
            </button>

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
                            className="w-1/3 flex-shrink-0 px-2" // Ensures each image takes 1/3 of the container's width
                        >
                            <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-auto cursor-pointer rounded-lg"
                                onClick={() => onImageClick(image)} // Call the handler on image click
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Next Button */}
            <button
                onClick={handleNext}
                className="absolute right-[-35px] rounded-full text-white z-10 cursor-pointer"
                disabled={currentIndex >= maxIndex} // Disable if at the end
            >
                <IoIosArrowDroprightCircle size={26} className="hover:animate-bounceRightLeft"/>
            </button>
        </div>
    );
};

export default PreviewCarousel;