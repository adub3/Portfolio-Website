/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from './types';
import { DustParticles, NeuralNetworkEffect, LorenzAttractor } from './Visuals';
import HomePage from './Home';
import WorkPage from './Work';
import BlogPage from './Writing';

// --- HELPERS ---

const PAGE_ORDER: Record<Page, number> = {
    'home': 0,
    'work': 1,
    'writing': 2
};

// --- HOOKS ---

const useScramble = (text: string, active: boolean, speed: number = 80) => {
    const [display, setDisplay] = useState(text);
    const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    useEffect(() => {
        if (!active) {
            setDisplay(text);
            return;
        }

        let frame = 0;
        const length = text.length;
        let interval: ReturnType<typeof setInterval>;

        interval = setInterval(() => {
            const scrambled = text.split('').map((char, i) => {
                if (i < frame / 3) return char;
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');

            setDisplay(scrambled);
            frame++;

            if (frame > length * 3 + 5) {
                setDisplay(text);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, active, speed]);

    return display;
};

// --- COMPONENTS ---

const CustomCursor = () => {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const pos = useRef({ x: 0, y: 0 });
    const mouse = useRef({ x: 0, y: 0 });
    const isActive = useRef(false);

    useEffect(() => {
        // Initial position
        mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        pos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const onMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            if (!isActive.current) {
                isActive.current = true;
                if (outerRef.current) outerRef.current.style.opacity = '1';
                if (innerRef.current) innerRef.current.style.opacity = '1';
            }
        };

        const onMouseOver = (e: MouseEvent) => {
             const target = e.target as HTMLElement;
             const isClickable = target.closest('a, button, [role="button"], input, textarea, .cursor-pointer, .group');
             
             if (outerRef.current) {
                 if (isClickable) {
                     outerRef.current.classList.add('scale-[2.5]', 'bg-white/10', 'border-transparent');
                     outerRef.current.classList.remove('border-white');
                 } else {
                     outerRef.current.classList.remove('scale-[2.5]', 'bg-white/10', 'border-transparent');
                     outerRef.current.classList.add('border-white');
                 }
             }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseover', onMouseOver);

        let rafId: number;
        const loop = () => {
            // Smooth lerp: current + (target - current) * factor
            // Factor 0.15 provides a nice weighted feel
            pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
            pos.current.y += (mouse.current.y - pos.current.y) * 0.15;

            if (outerRef.current) {
                outerRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
            }
            if (innerRef.current) {
                // Inner dot follows strictly or with very fast lerp
                innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
            }
            
            rafId = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseover', onMouseOver);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <>
            {/* Outer Ring */}
            <div 
                ref={outerRef} 
                className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9999] mix-blend-difference opacity-0 transition-opacity duration-300 transition-transform ease-out will-change-transform"
            ></div>
            {/* Inner Dot */}
            <div 
                ref={innerRef}
                className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference opacity-0 transition-opacity duration-300 will-change-transform"
            ></div>
        </>
    );
};

const NavButton = ({ 
    label, 
    page, 
    currentPage, 
    onClick 
}: { 
    label: string, 
    page: Page, 
    currentPage: Page, 
    onClick: (p: Page) => void 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = currentPage === page;
    
    // Use scramble effect
    const displayText = useScramble(label, isHovered && !isActive);

    return (
        <button
            onClick={() => onClick(page)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`transition-all hover:scale-105 uppercase relative group font-bold text-xs tracking-[0.2em] ${isActive ? 'opacity-100 text-white' : 'opacity-50 text-white/70 hover:text-white'}`}
        >
            {isActive ? label : displayText}
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
        </button>
    );
};

// --- NEW INTRO OVERLAY (NIGHT SKY ASSEMBLY) ---

const IntroOverlay = ({ onComplete }: { onComplete: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        // Star Particle System
        let stars: { 
            x: number; 
            y: number; 
            targetX: number; 
            targetY: number;
            size: number;
            speedFactor: number;
            twinklePhase: number;
            twinkleSpeed: number;
            isSettled: boolean;
        }[] = [];
        
        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            
            // Generate ~800 stars for a dense sky look
            const starCount = 800;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const screenDiag = Math.sqrt(canvas.width*canvas.width + canvas.height*canvas.height);

            for (let i = 0; i < starCount; i++) {
                // 1. Random Target Position on Screen
                const targetX = Math.random() * canvas.width;
                const targetY = Math.random() * canvas.height;
                
                // 2. Spawn Position (Off-screen, Omnidirectional)
                const angle = Math.random() * Math.PI * 2;
                // Distance must be > screen diagonal / 2 to be offscreen
                const dist = (screenDiag / 2) + Math.random() * 500; 
                
                const startX = cx + Math.cos(angle) * dist;
                const startY = cy + Math.sin(angle) * dist;

                stars.push({
                    x: startX,
                    y: startY,
                    targetX,
                    targetY,
                    size: Math.random() < 0.9 ? Math.random() * 1.5 : Math.random() * 2.5 + 1, // Mostly small, some bright/big
                    speedFactor: 0.03 + Math.random() * 0.04, // Varied arrival times
                    twinklePhase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.05,
                    isSettled: false
                });
            }
        };

        const animate = () => {
            // Slight trails? No, for night sky we want clean background usually, 
            // but for the *arrival* phase, a little trail looks like shooting stars.
            // Using low opacity fillRect creates trails.
            ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(p => {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const distSq = dx*dx + dy*dy;

                if (!p.isSettled) {
                    // Move towards target
                    p.x += dx * p.speedFactor;
                    p.y += dy * p.speedFactor;

                    // Check if arrived
                    if (distSq < 1) {
                        p.isSettled = true;
                        p.x = p.targetX;
                        p.y = p.targetY;
                    }
                }

                // Drawing Logic
                if (p.isSettled) {
                    // --- Twinkling State ---
                    p.twinklePhase += p.twinkleSpeed;
                    // Sine wave for smooth twinkling (0.2 to 1.0 opacity)
                    const alpha = 0.2 + (Math.sin(p.twinklePhase) * 0.5 + 0.5) * 0.8;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); // Slightly smaller when settled for crispness
                    ctx.fill();
                } else {
                    // --- Shooting Star State ---
                    const velocity = Math.sqrt(distSq) * p.speedFactor;
                    
                    // Draw trail
                    const angle = Math.atan2(dy, dx);
                    // Trail length proportional to speed
                    const trailLen = Math.min(velocity * 8, 100); 
                    
                    // Fade in as it gets closer
                    const alpha = Math.min(1, 3000 / (distSq + 100));

                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = p.size;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - Math.cos(angle) * trailLen, p.y - Math.sin(angle) * trailLen);
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();
        window.addEventListener('resize', init);

        // Slightly longer duration to enjoy the sky
        const t1 = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onComplete, 1500); // Slow fade out
        }, 3500);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', init);
            clearTimeout(t1);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[200] bg-[#050505] cursor-none"
                >
                   <canvas ref={canvasRef} className="absolute inset-0 block" />
                   
                   {/* Central Text Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <motion.div 
                           initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} 
                           animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                           transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
                           className="text-center mix-blend-difference z-10"
                       >
                           <div className="text-white text-5xl md:text-7xl font-bold tracking-tighter">AW.</div>
                           <div className="text-white/50 text-xs font-mono tracking-[0.3em] mt-4 uppercase">System Initializing</div>
                       </motion.div>
                   </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- HORIZONTAL SIDE-TO-SIDE TRANSITION OVERLAY ---

const TransitionOverlay = ({ 
    stage, 
    label,
    direction
}: { 
    stage: 'idle' | 'start' | 'middle' | 'end'; 
    label: string;
    direction: 'left' | 'right';
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    if (stage === 'middle') {
        setDisplayedText("");
        timeoutId = setTimeout(() => {
            const textToType = label.toUpperCase();
            let charIndex = 0;
            intervalId = setInterval(() => {
                if (charIndex <= textToType.length) {
                    setDisplayedText(textToType.slice(0, charIndex));
                    charIndex++;
                } else {
                    clearInterval(intervalId);
                }
            }, 100); 
        }, 300);

    } else if (stage === 'idle' || stage === 'start') {
        setDisplayedText("");
    }

    return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
    };
  }, [stage, label]);

  if (stage === 'idle') return null;

  const isRight = direction === 'right';

  // Variants for horizontal wipe
  const animVariants = {
      initial: { x: isRight ? '100%' : '-100%' },
      enter: { 
          x: '0%', 
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      },
      exit: { 
          x: isRight ? '-100%' : '100%', 
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      }
  };

  let animate = "initial";
  if (stage === 'middle') animate = "enter";
  if (stage === 'end') animate = "exit";

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex flex-row items-stretch overflow-hidden">
        <motion.div 
            initial="initial"
            animate={animate}
            variants={animVariants}
            className="absolute inset-0 bg-[#0a0a0a] z-[100] flex items-center justify-center"
        >
             {/* Wave SVG - Rotated based on direction */}
             {/* FLATTENED WAVE SHAPE: More structural/digital, less organic/powerful */}
            <svg 
                className={`absolute w-[15vh] h-[120%] text-[#0a0a0a] fill-current transform ${isRight ? '-left-[14.5vh] rotate-180' : '-right-[14.5vh]'}`} 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                style={{ writingMode: 'vertical-lr' }}
            >
                {/* A subtle curve instead of a deep wave */}
                <path d="M0,0 C30,20 30,80 0,100 L100,100 L100,0 Z"></path>
            </svg>

            {/* Content Container (Title) */}
            <div className="relative z-10 overflow-hidden flex items-baseline">
                <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter uppercase font-sans min-h-[1.2em]">
                {displayedText}
                <span className="animate-pulse text-white/50 ml-1">_</span>
                </h2>
            </div>
        </motion.div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function FluidPortfolio() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [introFinished, setIntroFinished] = useState(false);

  // Transition State
  const [transitionStage, setTransitionStage] = useState<'idle' | 'start' | 'middle' | 'end'>('idle');
  const [transitionLabel, setTransitionLabel] = useState("");
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');

  // Smooth Scroll Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef({ target: 0, current: 0 });
  const touchStart = useRef(0);

  // --- SMOOTH SCROLL LOGIC ---
  useEffect(() => {
    const MAX_SPEED = 60; // Max pixels per wheel event
    const DAMPING = 0.08;

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        
        // Clamp the scroll speed
        const delta = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, e.deltaY));
        
        const maxScroll = (contentRef.current?.scrollHeight || window.innerHeight) - window.innerHeight;
        
        // Update target (with bounds)
        scrollState.current.target = Math.max(0, Math.min(scrollState.current.target + delta, maxScroll));
    };

    const handleTouchStart = (e: TouchEvent) => {
        touchStart.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touchY = e.touches[0].clientY;
        const delta = touchStart.current - touchY;
        touchStart.current = touchY;

        const maxScroll = (contentRef.current?.scrollHeight || window.innerHeight) - window.innerHeight;
        scrollState.current.target = Math.max(0, Math.min(scrollState.current.target + delta, maxScroll));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Animation Loop
    let rafId: number;
    const updateScroll = () => {
        const diff = scrollState.current.target - scrollState.current.current;
        
        if (Math.abs(diff) > 0.1) {
            scrollState.current.current += diff * DAMPING;
            
            // Sync React state for parallax effects (throttling could be added here if needed)
            setScrollY(scrollState.current.current);

            // Direct DOM transform for performance
            if (contentRef.current) {
                contentRef.current.style.transform = `translate3d(0, -${scrollState.current.current}px, 0)`;
            }
        }
        rafId = requestAnimationFrame(updateScroll);
    };
    updateScroll();

    return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        cancelAnimationFrame(rafId);
    };
  }, []);

  // Reset Scroll on Page/Project Change
  useEffect(() => {
    scrollState.current.target = 0;
    scrollState.current.current = 0;
    setScrollY(0);
    if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, 0, 0)`;
    }
  }, [currentPage, selectedProjectId]);


  const handlePageChange = (newPage: Page) => {
      if (currentPage === newPage && !selectedProjectId) {
          setIsMenuOpen(false);
          return;
      }
      if (transitionStage !== 'idle') return;

      // Determine Direction
      // Logic: 
      // Home (0) -> Work (1) = Right
      // Work (1) -> Writing (2) = Right
      // Writing (2) -> Home (0) = Left
      const currIndex = PAGE_ORDER[currentPage];
      const nextIndex = PAGE_ORDER[newPage];
      const direction = nextIndex > currIndex ? 'right' : 'left';
      setTransitionDirection(direction);

      setIsMenuOpen(false);
      setTransitionLabel(newPage);
      setTransitionStage('start');

      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setTransitionStage('middle');
          });
      });

      // Timings
      setTimeout(() => {
          setCurrentPage(newPage);
          if (newPage === 'work') setSelectedProjectId(null); 
          // Scroll reset handled by useEffect

          requestAnimationFrame(() => {
             setTransitionStage('end');
          });
          
      }, 1200);

      setTimeout(() => {
          setTransitionStage('idle');
      }, 2200);
  };

  let canvasOpacity = 1;
  if (typeof document !== 'undefined') {
      if (currentPage === 'writing') {
          canvasOpacity = Math.max(0, 1 - scrollY / 600);
      } else if (currentPage === 'work') {
          if (selectedProjectId) {
              canvasOpacity = Math.max(0, 1 - scrollY / 400);
          } else {
              const topFadeStart = 0;
              const topFadeDist = 400;
              const topOpacity = Math.max(0, 1 - Math.max(0, scrollY - topFadeStart) / topFadeDist);
              const docHeight = contentRef.current ? contentRef.current.scrollHeight : 1000;
              const winHeight = window.innerHeight;
              const distFromBottom = docHeight - (scrollY + winHeight);
              const bottomFadeDist = 300;
              const bottomOpacity = Math.max(0, 1 - Math.max(0, distFromBottom) / bottomFadeDist);
              canvasOpacity = Math.max(topOpacity, bottomOpacity);
          }
      }
  }

  return (
    <div className="bg-[#0a0a0a] text-white h-screen w-screen overflow-hidden fixed inset-0 relative selection:bg-white selection:text-black font-sans cursor-none">
      
      <CustomCursor />

      {!introFinished && <IntroOverlay onComplete={() => setIntroFinished(true)} />}

      <TransitionOverlay 
        stage={transitionStage} 
        label={transitionLabel} 
        direction={transitionDirection}
      />

      <div 
        className="fixed inset-0 pointer-events-none z-30 mix-blend-screen" 
        style={{ 
            pointerEvents: 'none',
            opacity: canvasOpacity,
            maskImage: currentPage === 'writing' ? 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)' : 'none',
            WebkitMaskImage: currentPage === 'writing' ? 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)' : 'none'
        }}
      >
        <Canvas 
            camera={{ position: [0, 0, 5], fov: 60 }} 
            style={{ pointerEvents: 'none' }}
            eventSource={document.body} 
            eventPrefix="client"
        >
            {currentPage === 'writing' ? <NeuralNetworkEffect /> : (currentPage === 'work' ? <LorenzAttractor /> : <DustParticles />)}
        </Canvas>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col justify-center items-center gap-12 animate-fade-in pointer-events-auto">
            {(['home', 'work', 'writing'] as const).map((page) => (
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`text-4xl font-bold tracking-[0.2em] uppercase text-white hover:scale-110 transition-transform ${currentPage === page ? 'opacity-100' : 'opacity-50'}`}
                >
                    {page}
                </button>
            ))}
        </div>
      )}
      
      <nav className={`fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 mix-blend-difference text-white pointer-events-none transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
        <div 
            className="text-2xl font-bold tracking-tighter cursor-pointer border-2 border-white px-2 py-1 pointer-events-auto hover:scale-105 transition-transform duration-200" 
            onClick={() => handlePageChange('home')}
        >
            AW.
        </div>
        
        <div className="hidden md:flex gap-8 md:gap-12 pointer-events-auto">
            <NavButton label="HOME" page="home" currentPage={currentPage} onClick={handlePageChange} />
            <NavButton label="WORK" page="work" currentPage={currentPage} onClick={handlePageChange} />
            <NavButton label="WRITING" page="writing" currentPage={currentPage} onClick={handlePageChange} />
        </div>

        <div className="md:hidden pointer-events-auto">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-white hover:scale-110 transition-transform p-2"
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </nav>

      <div ref={contentRef} className="relative z-10 w-full will-change-transform">
        {currentPage === 'home' && <HomePage scrollY={scrollY} setPage={handlePageChange} startAnimations={introFinished} />}
        {currentPage === 'work' && <WorkPage selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} />}
        {currentPage === 'writing' && <BlogPage />}
      </div>
    </div>
  );
}