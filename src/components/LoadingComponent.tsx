import React from 'react';
import BoxLoader from '@/components/ui/box-loader';

export { BoxLoader };

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <BoxLoader />
                <div className="mt-8 text-center">
                    <h3 className="text-base font-semibold text-gray-800 tracking-wide">
                        Loading
                    </h3>
                    <div className="flex justify-center gap-1.5 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
