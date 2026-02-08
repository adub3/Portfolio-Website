
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
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, var(--theme-text-rgb, 255,255,255), 0.06), transparent 40%)`, // Using fallback, but CSS var would be better handled via class or style
        }}
      >
          {/* Note: Radial gradient with CSS var requires specific syntax or simple opacity. Using a simpler white/black overlay via class is easier for tailwind. */}
          <div className="absolute inset-0 bg-theme-text/10" style={{
               maskImage: `radial-gradient(300px circle at ${position.x}px ${position.y}px, black, transparent)`,
               WebkitMaskImage: `radial-gradient(300px circle at ${position.x}px ${position.y}px, black, transparent)`
          }}></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 h-full">
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
            className="p-6 md:p-8 hover:bg-theme-text/5 transition-colors group cursor-crosshair border-r border-theme-border/10 last:border-r-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="text-xs font-mono text-theme-text/30 uppercase tracking-widest mb-4 group-hover:text-theme-text/60 transition-colors flex justify-between">
                <span>{label}</span>
                <span className={`opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500`}>●</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-theme-text mb-2 font-mono tracking-tighter tabular-nums">
                {display}
            </div>
            <div className="text-xs text-theme-text/40 font-mono">{sub}</div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const HomePage = ({ scrollY, setPage, startAnimations }: { scrollY: number, setPage: (p: Page) => void, startAnimations: boolean }) => {
  
  // Animation delay utility
  const getDelay = (base: number) => startAnimations ? `delay-${base}` : '';
  const animClass = startAnimations ? "animate-fade-in" : "opacity-0";

  // System Time for "Live" feel
  const [time, setTime] = useState("");
  useEffect(() => {
      const updateTime = () => {
          const now = new Date();
          setTime(now.toISOString().split('T')[1].split('.')[0] + " UTC");
      };
      updateTime();
      const i = setInterval(updateTime, 1000);
      return () => clearInterval(i);
  }, []);

  return (
    <div className="relative min-h-screen w-full text-theme-text pb-20 selection:bg-theme-text/20 selection:text-theme-text bg-transparent">
      
      {/* --- GRID LINES --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute left-6 md:left-12 top-0 bottom-0 w-[1px] bg-theme-border/10"></div>
          <div className="absolute right-6 md:right-12 top-0 bottom-0 w-[1px] bg-theme-border/10"></div>
          <div className="absolute top-24 left-0 right-0 h-[1px] bg-theme-border/10"></div>
      </div>

      {/* --- MAIN CONTENT LAYER --- */}
      <div className="relative z-10 pt-32 px-6 md:px-12 max-w-[1800px] mx-auto">

        {/* 1. HEADER / METADATA STRIP */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-32 ${animClass} ${getDelay(100)}`}>
            <div>
                <h1 className="text-6xl md:text-9xl font-serif font-light tracking-tight leading-[0.85] mb-4 mix-blend-difference">
                    Andrew<br/>Wang
                </h1>
                <div className="flex items-center gap-4 text-xs font-mono text-theme-text/50 tracking-widest uppercase">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span>System Online</span>
                    <span className="text-theme-text/20">///</span>
                    <span>{time}</span>
                </div>
            </div>
            
            <div className="mt-8 md:mt-0 text-right group cursor-default">
                <div className="text-xs font-mono text-theme-text/30 uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Current Focus</div>
                <div className="text-lg md:text-xl font-light border-l-2 border-theme-border/20 pl-4 group-hover:border-emerald-500/50 transition-colors">
                    Stochastic Modeling<br/>& High-Performance Compute
                </div>
            </div>
        </div>

        {/* 2. THE "ABSTRACT" (Interactive Spotlight) */}
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 mb-32 ${animClass} ${getDelay(500)}`}>
            <div className="md:col-span-4 lg:col-span-3">
                 <span className="text-xs font-mono text-theme-text/50 uppercase tracking-widest block mb-4 border-b border-theme-border/10 pb-2">01 — Abstract</span>
            </div>
            <div className="md:col-span-8 lg:col-span-9">
                <SpotlightCard className="p-8 md:p-12 group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                        <Activity size={24} className="animate-pulse text-theme-text" />
                    </div>
                    <p className="text-2xl md:text-4xl font-serif italic leading-relaxed text-theme-text/90 mb-8 relative z-10">
                        "Bridging the gap between mathematical theory and production reality."
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base text-theme-text/60 font-mono leading-relaxed relative z-10">
                        <p className="hover:text-theme-text/90 transition-colors duration-300">
                            I build systems that translate abstract complexity into tangible results. 
                            From optimizing poker strategies with CFR to parallelizing Brownian motion 
                            on the GPU, my work focuses on precision, performance, and interpretability.
                        </p>
                        <p className="hover:text-theme-text/90 transition-colors duration-300">
                            Currently researching at UNC, aiming to solve high-dimensional problems 
                            where standard libraries fail and custom architecture is required.
                        </p>
                    </div>
                </SpotlightCard>
            </div>
        </div>

        {/* 3. METRICS / PERFORMANCE (Interactive Decryption) */}
        <div className={`mb-32 ${animClass} ${getDelay(700)}`}>
            <div className="border-t border-b border-theme-border/10">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-theme-border/10">
                    <DecryptedStat label="Optimization" value="40x" sub="Speedup via Rust/C++" />
                    <DecryptedStat label="Accuracy" value="99.8%" sub="ROC AUC (Forecasting)" />
                    <DecryptedStat label="Scale" value="100k+" sub="Simulated Paths" />
                    <DecryptedStat label="Latency" value="12ms" sub="Inference Time" />
                </div>
            </div>
        </div>

        {/* 4. NAVIGATION MODULES (Interactive Spotlight + Hover) */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${animClass} ${getDelay(1000)}`}>
            
            {/* Work Module */}
            <SpotlightCard 
                onClick={() => setPage('work')}
                className="h-[300px] cursor-pointer group"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 group-hover:opacity-10 transition-opacity duration-500 invert dark:invert-0"></div>
                
                <div className="absolute top-6 left-6 text-xs font-mono text-theme-text/40 uppercase tracking-widest z-10 group-hover:text-theme-text transition-colors">
                    02 — Directory
                </div>
                <div className="absolute top-6 right-6 z-10">
                    <ArrowUpRight className="text-theme-text/40 group-hover:text-theme-text group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>

                <div className="absolute bottom-6 left-6 z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-theme-text mb-2 tracking-tight group-hover:translate-x-2 transition-transform duration-300">Selected Work</h2>
                    <p className="text-theme-text/50 font-mono text-sm group-hover:text-emerald-400/80 transition-colors">Simulations, Algorithms, & Models</p>
                </div>

                <div className="absolute bottom-6 right-6 w-12 h-[1px] bg-theme-text/20 group-hover:w-24 group-hover:bg-emerald-500 transition-all duration-300"></div>
            </SpotlightCard>

            {/* Writing Module */}
            <SpotlightCard 
                onClick={() => setPage('writing')}
                className="h-[300px] cursor-pointer group"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 group-hover:opacity-10 transition-opacity duration-500 invert dark:invert-0"></div>

                 <div className="absolute top-6 left-6 text-xs font-mono text-theme-text/40 uppercase tracking-widest z-10 group-hover:text-theme-text transition-colors">
                    03 — Field Notes
                </div>
                 <div className="absolute top-6 right-6 z-10">
                    <ArrowUpRight className="text-theme-text/40 group-hover:text-theme-text group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </div>

                <div className="absolute bottom-6 left-6 z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-theme-text mb-2 tracking-tight group-hover:translate-x-2 transition-transform duration-300">Writing</h2>
                    <p className="text-theme-text/50 font-mono text-sm group-hover:text-emerald-400/80 transition-colors">Technical Essays & Thoughts</p>
                </div>

                <div className="absolute bottom-6 right-6 w-12 h-[1px] bg-theme-text/20 group-hover:w-24 group-hover:bg-emerald-500 transition-all duration-300"></div>
            </SpotlightCard>

        </div>

        {/* 5. FOOTER / CONTACT STRIP */}
        <div className={`mt-4 pt-4 border-t border-theme-border/10 flex justify-between items-center ${animClass} ${getDelay(1200)}`}>
             <div className="flex gap-6">
                <a href="mailto:anzwan@unc.edu" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-2 py-1 -ml-2 rounded">Email</a>
                <a href="#" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-2 py-1 rounded">GitHub</a>
                <a href="#" className="text-xs font-mono text-theme-text/40 hover:text-theme-text uppercase tracking-widest transition-colors hover:bg-theme-text/10 px-2 py-1 rounded">LinkedIn</a>
             </div>
             <div className="text-xs font-mono text-theme-text/20 uppercase flex items-center gap-2">
                <span>v2.5.0-beta</span>
                <span className="w-1 h-1 bg-theme-text/20 rounded-full"></span>
                <span>React 19</span>
             </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;
