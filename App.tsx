
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from './types';
import { StarField, NeuralNetworkEffect, LorenzAttractor, AuroraBorealis } from './Visuals';
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
            pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
            pos.current.y += (mouse.current.y - pos.current.y) * 0.15;
            if (outerRef.current) outerRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
            if (innerRef.current) innerRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) translate(-50%, -50%)`;
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
            <div ref={outerRef} className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9999] mix-blend-difference opacity-0 transition-opacity duration-300 transition-transform ease-out will-change-transform"></div>
            <div ref={innerRef} className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference opacity-0 transition-opacity duration-300 will-change-transform"></div>
        </>
    );
};

const NavButton = ({ label, page, currentPage, onClick }: { label: string, page: Page, currentPage: Page, onClick: (p: Page) => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = currentPage === page;
    const displayText = useScramble(label, isHovered && !isActive);
    return (
        <button
            onClick={() => onClick(page)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`transition-all hover:scale-105 uppercase relative group font-bold text-xs tracking-[0.2em] pointer-events-auto ${isActive ? 'opacity-100 text-theme-text' : 'opacity-50 text-theme-text/70 hover:text-theme-text'}`}
        >
            {isActive ? label : displayText}
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-theme-text transform origin-left transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
        </button>
    );
};

// --- INTRO OVERLAY ---

const IntroOverlay = ({ onComplete }: { onComplete: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; targetX: number; targetY: number; size: number; speedFactor: number; twinklePhase: number; twinkleSpeed: number; isSettled: boolean; }[] = [];
        
        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            const starCount = 800;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const screenDiag = Math.sqrt(canvas.width*canvas.width + canvas.height*canvas.height);

            for (let i = 0; i < starCount; i++) {
                const targetX = Math.random() * canvas.width;
                const targetY = Math.random() * canvas.height;
                const angle = Math.random() * Math.PI * 2;
                const dist = (screenDiag / 2) + Math.random() * 500; 
                stars.push({
                    x: cx + Math.cos(angle) * dist,
                    y: cy + Math.sin(angle) * dist,
                    targetX, targetY,
                    size: Math.random() < 0.9 ? Math.random() * 1.5 : Math.random() * 2.5 + 1,
                    speedFactor: 0.03 + Math.random() * 0.04,
                    twinklePhase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.05,
                    isSettled: false
                });
            }
        };

        const animate = () => {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(p => {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const distSq = dx*dx + dy*dy;
                if (!p.isSettled) {
                    p.x += dx * p.speedFactor;
                    p.y += dy * p.speedFactor;
                    if (distSq < 1) { p.isSettled = true; p.x = p.targetX; p.y = p.targetY; }
                }
                if (p.isSettled) {
                    p.twinklePhase += p.twinkleSpeed;
                    const alpha = 0.2 + (Math.sin(p.twinklePhase) * 0.5 + 0.5) * 0.8;
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    const velocity = Math.sqrt(distSq) * p.speedFactor;
                    const angle = Math.atan2(dy, dx);
                    const trailLen = Math.min(velocity * 8, 100); 
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
        const t1 = setTimeout(() => { setIsExiting(true); setTimeout(onComplete, 1500); }, 3500);
        return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', init); clearTimeout(t1); };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="fixed inset-0 z-[200] bg-[#050505] cursor-none">
                   <canvas ref={canvasRef} className="absolute inset-0 block" />
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <motion.div initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 1.5 }} className="text-center mix-blend-difference z-10">
                           <div className="text-white text-5xl md:text-7xl font-bold tracking-tighter">AW.</div>
                           <div className="text-white/50 text-xs font-mono tracking-[0.3em] mt-4 uppercase">System Initializing</div>
                       </motion.div>
                   </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- TRANSITION OVERLAY ---

const TransitionOverlay = ({ stage, label, direction }: { stage: 'idle' | 'start' | 'middle' | 'end'; label: string; direction: 'left' | 'right'; }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    if (stage === 'middle') {
        const timeoutId = setTimeout(() => {
            const textToType = label.toUpperCase();
            let charIndex = 0;
            setDisplayedText("");
            const intervalId = setInterval(() => {
                if (charIndex <= textToType.length) { 
                    setDisplayedText(textToType.slice(0, charIndex)); 
                    charIndex++; 
                } else {
                    clearInterval(intervalId);
                }
            }, 50); 
            return () => clearInterval(intervalId);
        }, 200);
        return () => clearTimeout(timeoutId);
    } else {
        setDisplayedText("");
    }
  }, [stage, label]);

  if (stage === 'idle') return null;

  const isRight = direction === 'right'; 
  const variants = {
      initial: { x: isRight ? '100%' : '-100%' },
      enter: { x: '0%', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
      exit: { x: isRight ? '-100%' : '100%', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  let animate = "initial";
  if (stage === 'middle') animate = "enter";
  if (stage === 'end') animate = "exit";

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex flex-row items-stretch overflow-hidden">
        <motion.div 
          initial="initial" 
          animate={animate} 
          variants={variants} 
          className="relative w-full h-full bg-theme-bg flex items-center justify-center pointer-events-auto"
        >
            <div className="relative z-10 overflow-hidden flex items-baseline">
                <h2 className="text-4xl md:text-9xl font-bold text-theme-text tracking-tighter uppercase font-sans min-h-[1.2em]">
                    {displayedText}<span className="animate-pulse text-theme-text/50 ml-1">_</span>
                </h2>
            </div>
        </motion.div>
    </div>
  );
};

// --- MAIN APP ---

export default function FluidPortfolio() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Transition State
  const [transitionStage, setTransitionStage] = useState<'idle' | 'start' | 'middle' | 'end'>('idle');
  const [transitionLabel, setTransitionLabel] = useState("");
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
  
  // isOverlayActive tracks UI blocking states like menus or full-screen modals
  const isOverlayActive = isMenuOpen || isGraphExpanded || !introFinished;

  // Handle native scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Cleanup effect: when leaving a detailed view (post or project), reset visual states
  useEffect(() => {
    if (!selectedPostId && !selectedProjectId) {
      setIsGraphExpanded(false);
      // Ensure we're at the top so background doesn't stay faded due to scroll position
      if (introFinished) {
          window.scrollTo(0, 0);
      }
    }
  }, [selectedPostId, selectedProjectId, introFinished]);

  const handlePageChange = (newPage: Page) => {
      if (currentPage === newPage && !selectedProjectId && !selectedPostId) { 
        setIsMenuOpen(false); 
        return; 
      }
      if (transitionStage !== 'idle') return;

      const currIndex = PAGE_ORDER[currentPage];
      const nextIndex = PAGE_ORDER[newPage];
      setTransitionDirection(nextIndex > currIndex ? 'right' : 'left');
      setIsMenuOpen(false);
      setTransitionLabel(newPage);
      
      // Phase 1: Mount component in 'start' position (off-screen)
      setTransitionStage('start');
      
      // Phase 2: Animate to 'middle' (on-screen)
      // Use requestAnimationFrame to ensure the 'start' state is registered before animating to 'middle'
      requestAnimationFrame(() => {
          requestAnimationFrame(() => {
              setTransitionStage('middle');
          });
      });
      
      // Schedule Phase 3
      setTimeout(() => {
          // Perform state updates while hidden
          setCurrentPage(newPage);
          setSelectedProjectId(null); 
          setSelectedPostId(null);
          setIsGraphExpanded(false);
          window.scrollTo(0, 0);

          // Phase 3: Animate to 'end' (exit to other side)
          setTransitionStage('end');
          
          // Cleanup
          setTimeout(() => {
              setTransitionStage('idle');
          }, 850); // Matches exit duration
      }, 1200); // Wait for enter + idle time
  };

  const toggleTheme = () => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  let canvasOpacity = 1;
  const isDetailedView = !!(selectedPostId || selectedProjectId || isGraphExpanded);
  
  if (typeof document !== 'undefined') {
      if (currentPage === 'writing') {
          canvasOpacity = isDetailedView ? 1 : Math.max(0.1, 1 - scrollY / 600);
      } else if (currentPage === 'work') {
          if (isDetailedView) {
              canvasOpacity = 1; 
          } else {
              const topOpacity = Math.max(0.1, 1 - Math.max(0, scrollY) / 400);
              const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
              const distFromBottom = maxScroll - scrollY;
              const bottomOpacity = Math.max(0.1, 1 - Math.max(0, distFromBottom) / 300);
              canvasOpacity = Math.max(topOpacity, bottomOpacity);
          }
      }
  }

  // Explicit opacity calculation for Aurora component on Home page
  let auroraOpacity = 1;
  if (currentPage === 'home' && typeof window !== 'undefined') {
      // Fade starts at 0, ends at 1.2 * viewport height
      auroraOpacity = Math.max(0, 1 - scrollY / (window.innerHeight * 1.2));
  }

  useEffect(() => {
    if (isOverlayActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOverlayActive]);

  return (
    <div 
        className="bg-theme-bg text-theme-text min-h-screen selection:bg-theme-text selection:text-theme-bg font-sans cursor-none relative transition-colors duration-500"
    >
        <CustomCursor />
        {!introFinished && <IntroOverlay onComplete={() => setIntroFinished(true)} />}
        <TransitionOverlay stage={transitionStage} label={transitionLabel} direction={transitionDirection} />

        {/* --- THE BACKGROUND CANVAS --- */}
        <div 
            className="fixed inset-0 pointer-events-auto z-0 transition-opacity duration-700 overflow-hidden" 
            style={{ 
                opacity: canvasOpacity,
                maskImage: (currentPage === 'writing' && !isDetailedView) ? 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)' : 'none',
                WebkitMaskImage: (currentPage === 'writing' && !isDetailedView) ? 'linear-gradient(to bottom, black 0%, black 40%, transparent 95%)' : 'none'
            }}
        >
            <Canvas 
                camera={{ position: [0, 0, 5], fov: 60 }} 
                style={{ pointerEvents: 'none' }}
                eventSource={document.body} 
                eventPrefix="client"
                gl={{ powerPreference: "high-performance", alpha: true, antialias: true }}
            >
                {!isDetailedView && (
                    <group key={currentPage}>
                        {currentPage === 'home' && (
                            <>
                                <StarField theme={theme} />
                                <AuroraBorealis theme={theme} opacity={auroraOpacity} />
                            </>
                        )}
                        {currentPage === 'writing' && <NeuralNetworkEffect theme={theme} />}
                        {currentPage === 'work' && <LorenzAttractor theme={theme} />}
                    </group>
                )}
            </Canvas>
        </div>

        {isMenuOpen && (
            <div className="fixed inset-0 z-[110] bg-theme-bg flex flex-col justify-center items-center gap-12 animate-fade-in pointer-events-auto">
                {(['home', 'work', 'writing'] as const).map((page) => (
                    <button key={page} onClick={() => handlePageChange(page)} className={`text-4xl font-bold tracking-[0.2em] uppercase text-theme-text hover:scale-110 transition-transform ${currentPage === page ? 'opacity-100' : 'opacity-50'}`}>{page}</button>
                ))}
            </div>
        )}
        
        <nav className={`fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 text-theme-text pointer-events-none transition-opacity duration-1000 ${introFinished ? 'opacity-100' : 'opacity-0'}`}>
            <div className="pointer-events-auto">
                <div className="text-2xl font-bold tracking-tighter cursor-pointer border-2 border-theme-text px-2 py-1 hover:scale-105 transition-transform duration-200" onClick={() => handlePageChange('home')}>AW.</div>
            </div>
            
            <div className="flex items-center gap-8 pointer-events-auto">
                <div className="hidden md:flex gap-8 md:gap-12">
                    <NavButton label="HOME" page="home" currentPage={currentPage} onClick={handlePageChange} />
                    <NavButton label="WORK" page="work" currentPage={currentPage} onClick={handlePageChange} />
                    <NavButton label="WRITING" page="writing" currentPage={currentPage} onClick={handlePageChange} />
                </div>
                
                 <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full border border-theme-text/20 hover:bg-theme-text/10 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-theme-text hover:scale-110 transition-transform p-2">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                </div>
            </div>
        </nav>

        <main className="relative z-10 w-full pointer-events-none">
            <div className="pointer-events-auto">
                {currentPage === 'home' && <HomePage scrollY={scrollY} setPage={handlePageChange} startAnimations={introFinished} theme={theme} />}
                {currentPage === 'work' && <WorkPage selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} onGraphExpand={setIsGraphExpanded} />}
                {currentPage === 'writing' && <BlogPage onPostSelect={setSelectedPostId} onGraphExpand={setIsGraphExpanded} theme={theme} />}
            </div>
        </main>
    </div>
  );
}
