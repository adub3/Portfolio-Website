
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';
import { Page } from './types';

// --- LOCAL INTERACTIVE COMPONENTS ---

const SpotlightCard = ({ 
    children, 
    className = "", 
    onClick 
}: { 
    children?: React.ReactNode, 
    className?: string,
    onClick?: () => void
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative overflow-hidden bg-theme-text/5 border border-theme-border/10 ${className}`}
    >
      {/* Spotlight Gradient */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, var(--theme-text-rgb, 255,255,255), 0.06), transparent 40%)`,
        }}
      >
          <div className="absolute inset-0 bg-theme-text/10" style={{
               maskImage: `radial-gradient(300px circle at ${position.x}px ${position.y}px, black, transparent)`,
               WebkitMaskImage: `radial-gradient(300px circle at ${position.x}px ${position.y}px, black, transparent)`
          }}></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
};

const DecryptedStat = ({ label, value, sub }: { label: string, value: string, sub: string }) => {
    const [display, setDisplay] = useState(value);
    const [isHovered, setIsHovered] = useState(false);
    const chars = "0123456789XY#%";

    useEffect(() => {
        if (!isHovered) {
            setDisplay(value);
            return;
        }

        let frame = 0;
        const interval = setInterval(() => {
            setDisplay(prev => 
                value.split('').map((char, i) => {
                    if (char === '.' || char === '%' || char === 'x') return char;
                    if (frame > i * 2 + 5) return char;
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('')
            );
            frame++;
            if (frame > 20) clearInterval(interval);
        }, 50);

        return () => clearInterval(interval);
    }, [isHovered, value]);

    return (
        <div 
            className="p-8 flex flex-col items-center justify-center text-center hover:bg-theme-text/5 transition-colors group cursor-crosshair border-r border-theme-border/10 last:border-r-0 border-b md:border-b-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-xs font-mono text-theme-text/30 uppercase tracking-widest mb-4 group-hover:text-theme-text/60 transition-colors">
                {label}
            </div>
            <div className="text-5xl md:text-6xl font-bold text-theme-text mb-2 font-mono tracking-tighter tabular-nums">
                {display}
            </div>
            <div className="text-xs text-theme-text/40 font-mono">{sub}</div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const HomePage = ({ scrollY, setPage, startAnimations, theme }: { scrollY: number, setPage: (p: Page) => void, startAnimations: boolean, theme: 'light' | 'dark' }) => {
  
  // Animation delay utility
  const getDelay = (base: number) => startAnimations ? `delay-${base}` : '';
  const animClass = startAnimations ? "animate-fade-in" : "opacity-0";

  return (
    <div className="relative w-full text-theme-text pb-20 selection:bg-theme-text/20 selection:text-theme-text bg-transparent">
      
      {/* --- MAIN CONTENT LAYER --- */}
      <div className="relative z-10 px-6 max-w-[1400px] mx-auto">

        {/* 1. HERO SECTION (Full Height) */}
        <div className="min-h-screen flex flex-col items-center justify-center mb-24 text-center">
            <div className={`${animClass} ${getDelay(100)}`}>
                <h1 className="text-7xl md:text-[10rem] font-serif font-light tracking-tight leading-[0.85] mb-8 mix-blend-difference">
                    Andrew<br/>Wang
                </h1>
                
                <div className={`group cursor-default flex flex-col items-center gap-2 mt-4 ${animClass} ${getDelay(300)}`}>
                    <div className="text-xs font-mono text-theme-text/30 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Current Focus</div>
                    <div className="text-lg md:text-xl font-light group-hover:text-theme-text transition-colors max-w-lg">
                        Stochastic Modeling & High-Performance Compute
                    </div>
                </div>
            </div>
        </div>

        {/* 2. THE "ABSTRACT" */}
        <div className={`flex flex-col items-center mb-32 ${animClass} ${getDelay(500)}`}>
            <div className="mb-12">
                 <span className="text-xs font-mono text-theme-text/50 uppercase tracking-widest border border-theme-border/10 rounded-full px-4 py-2 hover:bg-theme-text/5 transition-colors cursor-default">01 — Abstract</span>
            </div>
            
            <div className="max-w-4xl text-center relative">
                <div className="relative z-10 mb-8 flex justify-center opacity-40">
                    <Activity size={48} strokeWidth={1} />
                </div>

                <p className="text-3xl md:text-5xl font-serif italic leading-tight text-theme-text mb-10 relative z-10">
                    "Bridging the gap between mathematical theory and production reality."
                </p>
                
                <div className="h-px w-24 bg-theme-border/20 mx-auto mb-10"></div>

                <div className="grid grid-cols-1 gap-6 text-base md:text-lg text-theme-text/70 font-mono leading-relaxed relative z-10 max-w-2xl mx-auto">
                    <p>
                        I build systems that translate abstract complexity into tangible results. 
                        From optimizing poker strategies with CFR to parallelizing Brownian motion 
                        on the GPU, my work focuses on precision, performance, and interpretability.
                    </p>
                    <p>
                        Currently researching at UNC, aiming to solve high-dimensional problems 
                        where standard libraries fail and custom architecture is required.
                    </p>
                </div>
            </div>
        </div>

        {/* 3. METRICS / PERFORMANCE */}
        <div className={`mb-32 ${animClass} ${getDelay(700)}`}>
            <div className="border-t border-b border-theme-border/10 bg-theme-bg/50 backdrop-blur-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-theme-border/10">
                    <DecryptedStat label="Optimization" value="40x" sub="Speedup via Rust/C++" />
                    <DecryptedStat label="Accuracy" value="99.8%" sub="ROC AUC (Forecasting)" />
                    <DecryptedStat label="Scale" value="100k+" sub="Simulated Paths" />
                    <DecryptedStat label="Latency" value="12ms" sub="Inference Time" />
                </div>
            </div>
        </div>

        {/* 4. NAVIGATION MODULES */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${animClass} ${getDelay(1000)}`}>
            
            {/* Work Module */}
            <SpotlightCard 
                onClick={() => setPage('work')}
                className="h-[350px] cursor-pointer group"
            >
                <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 relative">
                    <div className="absolute top-6 w-full text-center text-xs font-mono text-theme-text/40 uppercase tracking-widest z-10 group-hover:text-theme-text transition-colors">
                        02 — Directory
                    </div>
                    
                    <div className="absolute top-6 right-6 z-10">
                    <ArrowUpRight className="text-theme-text/40 group-hover:text-theme-text group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                        <h2 className="text-4xl md:text-6xl font-bold text-theme-text mb-4 tracking-tight">Selected Work</h2>
                        <p className="text-theme-text/50 font-mono text-sm group-hover:text-emerald-400/80 transition-colors">Simulations, Algorithms, & Models</p>
                    </div>

                    <div className="absolute bottom-8 w-12 h-[1px] bg-theme-text/20 group-hover:w-24 group-hover:bg-emerald-500 transition-all duration-300"></div>
                </div>
            </SpotlightCard>

            {/* Writing Module */}
            <SpotlightCard 
                onClick={() => setPage('writing')}
                className="h-[350px] cursor-pointer group"
            >
                <div className="flex flex-col items-center justify-center h-full w-full text-center p-8 relative">
                    <div className="absolute top-6 w-full text-center text-xs font-mono text-theme-text/40 uppercase tracking-widest z-10 group-hover:text-theme-text transition-colors">
                        03 — Field Notes
                    </div>
                    
                    <div className="absolute top-6 right-6 z-10">
                        <ArrowUpRight className="text-theme-text/40 group-hover:text-theme-text group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                    </div>

                    <div className="relative z-10 transform group-hover:-translate-y-2 transition-transform duration-500">
                        <h2 className="text-4xl md:text-6xl font-bold text-theme-text mb-4 tracking-tight">Writing</h2>
                        <p className="text-theme-text/50 font-mono text-sm group-hover:text-emerald-400/80 transition-colors">Technical Essays & Thoughts</p>
                    </div>

                    <div className="absolute bottom-8 w-12 h-[1px] bg-theme-text/20 group-hover:w-24 group-hover:bg-emerald-500 transition-all duration-300"></div>
                </div>
            </SpotlightCard>

        </div>

        {/* 5. FOOTER */}
        <div className={`mt-24 pt-12 border-t border-theme-border/10 flex flex-col items-center gap-6 ${animClass} ${getDelay(1200)}`}>
             <div className="flex gap-8">
                <a href="mailto:anzwan@unc.edu" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-3 py-1 rounded-full border border-transparent hover:border-theme-border/20">Email</a>
                <a href="#" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-3 py-1 rounded-full border border-transparent hover:border-theme-border/20">GitHub</a>
                <a href="#" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-3 py-1 rounded-full border border-transparent hover:border-theme-border/20">LinkedIn</a>
             </div>
             <div className="text-[10px] font-mono text-theme-text/20 uppercase flex items-center gap-3">
                <span>v2.5.0-beta</span>
                <span className="w-1 h-1 bg-theme-text/20 rounded-full"></span>
                <span>React 19</span>
                <span className="w-1 h-1 bg-theme-text/20 rounded-full"></span>
                <span>UNC Chapel Hill</span>
             </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
