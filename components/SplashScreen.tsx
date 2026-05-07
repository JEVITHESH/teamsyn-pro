import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const SplashScreen: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + Math.floor(Math.random() * 5) + 1;
                return next > 100 ? 100 : next;
            });
        }, 80);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background p-10 select-none pointer-events-none">
            
            {/* Minimal SaaS Aesthetic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03),transparent_70%)]" />

            <div className="relative flex flex-col items-center w-full max-w-[280px]">
                
                {/* Clean Logo Brand Mark */}
                <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/20 border border-white/10 mb-10 animate-pulse-slow">
                   <Zap className="w-10 h-10 text-white fill-white" />
                </div>

                <div className="space-y-8 text-center w-full">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold  text-foreground transition-all duration-1000">
                            TeamSync<span className="text-accent"> Pro</span>
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground  tracking-[0.3em]">
                            Initializing Workspace
                        </p>
                    </div>

                    <div className="w-full space-y-3">
                        <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden relative border border-white/5">
                            <div
                                className="absolute inset-y-0 left-0 bg-accent transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[9px] font-bold   text-muted-foreground/40 animate-pulse cursor-default">
                               Secure Uplink Active
                           </span>
                           <span className="text-[10px] font-bold text-accent tabular-nums">
                               {progress}%
                           </span>
                        </div>
                    </div>
                </div>

                {/* Secure Trust Badge */}
                <div className="absolute bottom-[-140px] flex flex-col items-center gap-2 opacity-20">
                    <div className="text-[9px] font-bold  tracking-[0.4em] text-foreground">
                        Corporate Infrastructure Ready
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
