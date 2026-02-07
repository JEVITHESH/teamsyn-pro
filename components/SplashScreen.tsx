import React from 'react';
import Logo from './Logo';

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
            <div className="relative flex items-center justify-center">
                {/* Glow/Pulse effect - Absolute centered */}
                <div className="absolute w-40 h-40 bg-blue-500/20 dark:bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>

                {/* Logo Container - Clean, No Box */}
                <div className="relative z-10 transform hover:scale-105 transition-transform duration-700">
                    <Logo className="w-24 h-24 drop-shadow-2xl" />
                </div>
            </div>

            <div className="mt-8 space-y-2 text-center">
                <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white pb-2 selection:bg-blue-500/20">
                    TeamSync <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Pro</span>
                </h1>
                <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
