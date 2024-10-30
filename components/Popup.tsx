import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdError } from 'react-icons/md';

interface PopupMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface PopupProps {
    messages: PopupMessage[];
    onRemove: (id: number) => void;
    duration?: number;
}

const Popup: React.FC<PopupProps> = ({ messages, onRemove, duration = 1000 }) => {
    const [visibleMessages, setVisibleMessages] = useState<PopupMessage[]>([]);

    useEffect(() => {
        // Limit the stack to 3 messages
        const newMessages = messages.slice(-3);
        setVisibleMessages(newMessages);

        // Set up a timer to remove the oldest message if the stack exceeds 3
        if (messages.length > 3) {
            const oldestMessage = messages[messages.length - 4];
            const timer = setTimeout(() => handleRemove(oldestMessage.id), duration);
            return () => clearTimeout(timer); // Clean up the timer on unmount
        }
    }, [messages, duration]);

    const handleRemove = (id: number) => {
        setVisibleMessages((prev) => prev.filter((msg) => msg.id !== id));
        setTimeout(() => onRemove(id), 400); // Delay for fade-out animation sync
    };

    return (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col space-y-2">
            {visibleMessages.map((msg, index) => (
                <div
                    key={msg.id}
                    className={`max-w-fit w-full p-4 rounded-lg shadow-lg text-white transition-all duration-500 ease-out
                        ${msg.type === 'success' ? 'bg-green-800' : 'bg-red-700'}
                        ${index === visibleMessages.length - 1 ? 'animate-slideUp' : ''}
                        ${index === 0 && visibleMessages.length === 3 ? 'animate-slideLeftFadeOut' : ''}
                    `}
                    style={{
                        minWidth: '250px',
                        transitionDelay: `${index * 100}ms`,
                    }}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            {msg.type === 'success' ? (
                                <MdCheckCircle size={20} className="text-white" />
                            ) : (
                                <MdError size={20} className="text-white" />
                            )}
                            <span className="font-inter font-sm">{msg.message}</span>
                        </div>
                        <button
                            onClick={() => handleRemove(msg.id)}
                            className="ml-4 text-white focus:outline-none hover:text-gray-300"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Popup;
