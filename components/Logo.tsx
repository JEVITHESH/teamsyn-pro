import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Minimalist SaaS Bolt/Sync Logo */}
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
                </linearGradient>
            </defs>

            {/* Background Geometric Shape */}
            <rect 
                x="15" 
                y="15" 
                width="70" 
                height="70" 
                rx="20" 
                fill="currentColor" 
                fillOpacity="0.05" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeOpacity="0.1"
            />

            {/* Central Bolt Icon */}
            <path 
                d="M58 15L25 55H45L42 85L75 45L55 45L58 15Z" 
                fill="url(#logoGradient)" 
                stroke="var(--accent)" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Sub-geometric Accents */}
            <circle cx="85" cy="15" r="4" fill="var(--accent)" fillOpacity="0.4" />
            <circle cx="15" cy="85" r="4" fill="var(--accent)" fillOpacity="0.4" />
        </svg>
    );
};

export default Logo;
