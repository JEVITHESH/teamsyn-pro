import React from 'react';

interface LogoProps {
    className?: string; // For sizing like w-12 h-12
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="logoGradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2563EB" /> {/* Blue-600 */}
                    <stop offset="100%" stopColor="#9333EA" /> {/* Purple-600 */}
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Abstract "T" / Connection Shape */}
            <path
                d="M30 65C30 73.2843 36.7157 80 45 80H70C78.2843 80 85 73.2843 85 65V35C85 26.7157 78.2843 20 70 20H45C36.7157 20 30 26.7157 30 35"
                stroke="url(#logoGradient)"
                strokeWidth="12"
                strokeLinecap="round"
            />

            {/* Interlocking Element */}
            <path
                d="M70 35C70 26.7157 63.2843 20 55 20H30C21.7157 20 15 26.7157 15 35V65C15 73.2843 21.7157 80 30 80H55C63.2843 80 70 73.2843 70 65"
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="12"
                strokeLinecap="round"
                className="dark:stroke-white/20 stroke-black/10"
            />
            <path
                d="M70 35C70 26.7157 63.2843 20 55 20H30C21.7157 20 15 26.7157 15 35V65C15 73.2843 21.7157 80 30 80H55C63.2843 80 70 73.2843 70 65"
                stroke="url(#logoGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                transform="rotate(180 50 50)"
            />

            {/* Center Dot for "Sync" */}
            <circle cx="50" cy="50" r="8" fill="url(#logoGradient)" />
        </svg>
    );
};

export default Logo;
