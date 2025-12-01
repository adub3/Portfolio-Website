
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- DATA ---

const projects = [
  {
    title: "Brownian Motion Webapp",
    description: "Interactive stochastic dynamics visualizer with parallelized Euler-Maruyama solver. <0.5% Monte Carlo error, 3× performance gain.",
    year: "2025",
    month: "MAR",
    tags: ["WebGL", "Physics", "React"],
    type: "Simulation"
  },
  {
    title: "HUNL Poker CFR",
    description: "Monte Carlo CFR engine for optimal poker strategy. 95% convergence, 90% memory reduction through abstraction clustering.",
    year: "2025",
    month: "FEB",
    tags: ["C++", "Game Theory", "AI"],
    type: "Algorithm"
  },
  {
    title: "Gas Price Forecasting",
    description: "ARIMA-GARCH model for prediction markets. Competition winner. ROC AUC 0.998, 23% calibration improvement.",
    year: "2025",
    month: "JAN",
    tags: ["Python", "TimeSeries", "ML"],
    type: "Research"
  },
  {
    title: "EarthScope-AI",
    description: "3D UNet disaster classification pipeline. CDC finalist. Fuses satellite, DEM, and climate data with real-time segmentation.",
    year: "2024",
    month: "DEC",
    tags: ["PyTorch", "Computer Vision", "Geo"],
    type: "Deep Learning"
  }
];

// --- VISUAL EFFECTS ---

// 1. Dust Motes (Three.js) - Simulates dust floating in light shafts
const DustParticles = () => {
  const count = 400; 
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // Generate random positions and speeds for dust
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Gentle floating motion
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      // Random scale for depth
      const scale = (s + 2) * 0.04; // Visible dust specks
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </instancedMesh>
  );
};

// --- SUB-COMPONENTS (Defined outside to prevent re-render glitches) ---

const HomePage = ({ scrollY, setPage }: { scrollY: number, setPage: (p: 'home' | 'work') => void }) => {
  // Parallax opacities
  const appear1 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 0.4) / 400));
  const appear2 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 1.0) / 400));
  const appear3 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 1.6) / 400));

  return (
    <div className="relative pb-32">
      
      {/* HERO BACKGROUND - Pure Geometric Light Shaft */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden pointer-events-none bg-[#0a0a0a]">
          
          {/* Deep Shadow Beam - Rendered BEHIND the light shaft */}
          <div 
            className="absolute bg-black opacity-60 blur-3xl"
            style={{
              top: '-50%',
              left: '-52%', // Shifted left to cast shadow on the dark side (underneath the paper)
              width: '200%',
              height: '200%',
              transform: `rotate(-15deg) translateX(${35 + (scrollY * 0.08)}%)`,
            }}
          />

          {/* The "Light Shaft" */}
          <div 
            className="absolute overflow-hidden shadow-2xl"
            style={{
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              // Initial rotation to create diagonal
              // Translate X moves the beam across the screen based on scroll
              transform: `rotate(-15deg) translateX(${35 + (scrollY * 0.08)}%)`,
              willChange: 'transform',
              backgroundColor: '#f5f0e1', // Worn yellowed paper
              boxShadow: '0 0 100px rgba(0,0,0,0.3)' // Dark drop shadow for lift
            }}
          >
            {/* Clean Construction Lines (No Noise) */}
            <div className="absolute top-0 bottom-0 left-[0px] w-[1px] bg-black/10" /> {/* Sharp edge */}
            <div className="absolute top-0 bottom-0 left-[12px] w-[1px] bg-black/5" />  {/* Secondary line */}
            
            {/* Subtle Edge Gradient for Volume - Very faint to keep it bright */}
            <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
          </div>

          {/* Right Side Architectural Lines (Fixed Overlay) - Rendered ON TOP of Light Shaft */}
          {/* Added mix-blend-difference so lines are white on black, and black on white */}
          <div className="absolute right-[10%] top-0 bottom-0 w-[1px] bg-white mix-blend-difference z-10 hidden md:block opacity-30">
            {/* Tick marks */}
            <div className="absolute top-[20%] right-0 w-3 h-[1px] bg-white"></div>
            <div className="absolute top-[20.5%] right-0 w-1.5 h-[1px] bg-white"></div>
            <div className="absolute top-[21%] right-0 w-1.5 h-[1px] bg-white"></div>
            <div className="absolute top-[80%] right-0 w-3 h-[1px] bg-white"></div>
            {/* Floating Label */}
            <div className="absolute top-[20%] right-6 text-[10px] text-white font-mono tracking-widest origin-top-right rotate-90">
                COORD.SYS.01
            </div>
          </div>
          <div className="absolute right-[5%] top-0 bottom-0 w-[1px] bg-white mix-blend-difference z-10 hidden md:block opacity-10"></div>
          
      </div>

      {/* HERO TEXT - Uses mix-blend-mode: difference to invert against the light shaft */}
      <section className="h-screen flex flex-col justify-center px-6 md:px-24 relative z-10 mix-blend-difference text-white">
        <div className="max-w-5xl w-full pt-20">
          <h1 className="text-[14vw] md:text-[9rem] font-bold tracking-tighter leading-[0.8] mb-8">
            Andrew<br/>Wang
          </h1>
          <div className="h-2 w-32 bg-white mb-12"></div>
          <p className="text-xl md:text-3xl text-white font-light max-w-2xl leading-relaxed tracking-wide">
            Math + Stats @ UNC.<br/>
            Creating innovative models for difficult problems.
          </p>
          
          <div className="mt-16 flex flex-wrap gap-8">
            <button
              onClick={() => {
                  setPage('work');
                  window.scrollTo(0, 0);
              }}
              className="px-8 py-4 bg-white text-black font-bold tracking-[0.2em] text-sm uppercase hover:bg-neutral-200 transition-colors"
            >
              View work
            </button>
            <a
              href="mailto:anzwan@unc.edu"
              className="px-8 py-4 border border-white text-white font-bold tracking-[0.2em] text-sm uppercase hover:bg-white hover:text-black transition-all"
            >
              Contact
            </a>
          </div>
        </div>
      </section>

      {/* Section 1 - Text reveal */}
      <section 
        className="min-h-screen flex items-center justify-end px-6 md:px-24 relative z-10"
        style={{ opacity: appear1 }}
      >
        <div className="max-w-2xl text-right mix-blend-difference">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight">
            Theory meets reality
          </h2>
          <div className="w-full h-[1px] bg-white/30 mb-8 transform rotate-12 origin-right translate-y-4"></div>
          <p className="text-2xl md:text-3xl text-white/90 leading-relaxed font-serif italic mb-6">
            "Perceive that which cannot be seen with the eye."
          </p>
          <p className="text-lg md:text-xl text-white/80 leading-relaxed font-light">
            From stochastic calculus to game theory, I translate mathematical theory into 
            tangible results. Whether it's optimizing poker strategies with CFR or 
            forecasting prices with ARIMA-GARCH, precision matters.
          </p>
        </div>
      </section>

      {/* Section 2 - Stats */}
      <section 
        className="min-h-screen flex items-center justify-center px-6 relative z-10 mix-blend-difference"
        style={{ opacity: appear2 }}
      >
        <div className="max-w-6xl w-full">
          <h2 className="text-5xl md:text-9xl font-bold mb-20 text-white/20 text-center tracking-tighter">
            PERFORMANCE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 border-l border-white/20">
              <div className="text-6xl md:text-7xl font-bold text-white mb-4">90%</div>
              <div className="text-white/50 text-sm uppercase tracking-[0.2em]">Memory Reduction</div>
            </div>
            <div className="p-8 border-l border-white/20">
              <div className="text-6xl md:text-7xl font-bold text-white mb-4">3×</div>
              <div className="text-white/50 text-sm uppercase tracking-[0.2em]">Runtime Speedup</div>
            </div>
            <div className="p-8 border-l border-white/20">
              <div className="text-6xl md:text-7xl font-bold text-white mb-4">&lt;0.5%</div>
              <div className="text-white/50 text-sm uppercase tracking-[0.2em]">Error Rates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Call to Action */}
      <section 
        className="min-h-[80vh] flex items-center px-6 md:px-24 z-10 relative mix-blend-difference"
        style={{ opacity: appear3 }}
      >
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
            Research to production
          </h2>
          <p className="text-xl md:text-2xl text-white/70 leading-relaxed mb-12 font-light border-l-2 border-white pl-6">
            From genomic pipelines processing 15K+ participants to competition-winning 
            forecasting models, I build systems that solve real problems.
          </p>
          <button
            onClick={() => {
                setPage('work');
                window.scrollTo(0, 0);
            }}
            className="text-xl text-white hover:text-white/70 transition-all inline-flex items-center gap-4 group uppercase tracking-widest font-bold"
          >
            See the work
            <span className="group-hover:translate-x-4 transition-transform duration-300">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};

const WorkPage = () => {
  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 animate-fade-in relative z-20 bg-[#0a0a0a]">
      
      {/* Work Page Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="absolute right-[25%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
          <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
      </div>

      <div className="max-w-[1600px] mx-auto">
          
        <div className="mb-32 relative pl-4 md:pl-0">
            <h1 className="text-7xl md:text-[10rem] font-bold mb-8 tracking-tighter text-white z-10 relative leading-[0.8]">
              Selected<br/><span className="text-white/30">Index</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 max-w-xl font-light italic font-serif mt-12 border-l border-white/30 pl-6">
              A collection of computational studies in optimization, stochastic dynamics, and machine learning architectures.
            </p>
        </div>

        {/* Project Table Header */}
        <div className="hidden md:flex text-xs font-mono text-white/30 tracking-widest uppercase mb-4 border-b border-white/10 pb-2">
            <div className="w-[15%]">Timeline</div>
            <div className="w-[60%]">Description</div>
            <div className="w-[25%] text-right">Specs</div>
        </div>

        <div className="space-y-12">
          {projects.map((project, i) => {
            return (
              <div
                key={i}
                className="group cursor-pointer relative border-t border-white/20 py-12 hover:border-white transition-colors duration-500"
              >
                {/* Hover Light Effect specific to item */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                
                <div className="flex flex-col md:flex-row gap-8 md:gap-0">
                    
                    {/* Date Column */}
                    <div className="md:w-[15%] flex flex-row md:flex-col gap-2 md:gap-1 items-baseline md:items-start">
                      <span className="text-xs font-bold text-white/50 tracking-widest uppercase">{project.month}</span>
                      <span className="text-3xl md:text-4xl font-light text-white/80 font-mono">{project.year}</span>
                    </div>

                    {/* Main Content */}
                    <div className="md:w-[60%] md:pr-12">
                      <div className="flex items-baseline gap-4 mb-4">
                          <span className="font-mono text-xs text-white/30">0{i + 1}</span>
                          <h2 className="text-3xl md:text-5xl font-bold text-white group-hover:text-white transition-colors tracking-tight">
                              {project.title}
                          </h2>
                      </div>
                      <p className="text-lg md:text-xl text-white/60 group-hover:text-white/90 transition-colors leading-relaxed font-light max-w-2xl">
                          {project.description}
                      </p>
                    </div>

                    {/* Tech Specs / Visual Balance */}
                    <div className="md:w-[25%] flex flex-col justify-between items-start md:items-end border-l md:border-l-0 border-white/10 pl-6 md:pl-0">
                        <div className="text-right mb-4">
                            <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Type</div>
                            <div className="text-white font-medium">{project.type}</div>
                        </div>
                        
                        <div className="flex flex-wrap justify-end gap-2">
                            {project.tags.map(tag => (
                                <span key={tag} className="text-xs border border-white/20 px-2 py-1 text-white/60 group-hover:border-white/40 group-hover:text-white transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Abstract Visual Element for Density */}
                        <div className="mt-6 w-full h-1 bg-white/10 relative overflow-hidden hidden md:block group-hover:bg-white/20 transition-colors">
                            <div className="absolute top-0 left-0 h-full bg-white w-1/3 transform -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out"></div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
        
          <div className="mt-48 py-20 border-t border-white text-center relative overflow-hidden">
            <h3 className="text-4xl md:text-6xl font-bold mb-12 tracking-tight text-white">Visually Loud.<br/>Mathematically Quiet.</h3>
            <a href="mailto:anzwan@unc.edu" className="inline-block px-12 py-5 bg-white text-black font-bold text-lg hover:bg-neutral-300 transition-colors uppercase tracking-widest">
              Contact Me
            </a>
          </div>
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function FluidPortfolio() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState<'home' | 'work'>('home');

  useEffect(() => {
    const handleScroll = () => {
        // Only update scrollY if on home page to avoid unnecessary re-renders when deep in work page
        // But parallax might need it. Optimized to only set state.
        setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen relative selection:bg-white selection:text-black font-sans overflow-x-hidden">
      
      {/* Three.js Atmosphere (Dust) */}
      <div className="fixed inset-0 pointer-events-none z-30 mix-blend-screen">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <DustParticles />
        </Canvas>
      </div>
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 mix-blend-difference text-white">
        <div 
            className="text-2xl font-bold tracking-tighter cursor-pointer border-2 border-white px-2 py-1" 
            onClick={() => setCurrentPage('home')}
        >
            AW.
        </div>
        <div className="flex gap-12 text-xs font-bold tracking-[0.2em]">
            <button
            onClick={() => {
                setCurrentPage('home');
                window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className={`transition-all hover:text-white/80 uppercase relative group ${currentPage === 'home' ? 'opacity-100' : 'opacity-50'}`}
            >
            Home
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${currentPage === 'home' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
            <button
            onClick={() => {
                setCurrentPage('work');
                window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className={`transition-all hover:text-white/80 uppercase relative group ${currentPage === 'work' ? 'opacity-100' : 'opacity-50'}`}
            >
            Work
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${currentPage === 'work' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
        </div>
      </nav>

      <div className="relative z-10">
        {currentPage === 'home' ? <HomePage scrollY={scrollY} setPage={setCurrentPage} /> : <WorkPage />}
      </div>
    </div>
  );
}
