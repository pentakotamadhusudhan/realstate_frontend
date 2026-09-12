const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            <div className="flex flex-col items-center">

                {/* Animated Logo / Loader */}
                <div className="relative flex items-center justify-center w-20 h-20">

                    {/* Outer rotating ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100" />

                    <div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-indigo-500 animate-spin"
                    />

                    {/* Center gradient circle */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
                        <span className="text-white text-lg font-bold">
                            E
                        </span>
                    </div>
                </div>

                {/* Loading text */}
                <div className="mt-5 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Loading
                    </h3>

                    {/* Animated dots */}
                    <div className="flex justify-center gap-1 mt-1">
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
