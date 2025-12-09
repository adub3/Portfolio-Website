/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowUpRight, ArrowLeft, Terminal, ImageIcon, Menu, X, ExternalLink, Cpu, Layers, Activity } from 'lucide-react';

// Fix for missing R3F Intrinsic Elements in TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      dodecahedronGeometry: any;
      meshBasicMaterial: any;
      group: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      lineSegments: any;
      lineBasicMaterial: any;
      mesh: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
    }
  }
}

// --- TYPES ---

type Page = 'home' | 'work' | 'writing';

type ContentBlock = 
  | { type: 'paragraph'; text: string }
  | { type: 'header'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; caption: string };

interface Post {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tag: string;
    content: ContentBlock[];
}

interface Project {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    year: string;
    month: string;
    tags: string[];
    type: string;
    stats: { label: string; value: string }[];
    role: string;
}

// --- DATA ---

const projects: Project[] = [
  {
    id: "brownian",
    title: "Brownian Motion Webapp",
    description: "Interactive stochastic dynamics visualizer with parallelized Euler-Maruyama solver.",
    longDescription: "A high-performance educational tool designed to build intuition for stochastic calculus. By visualizing the convergence of random walks to continuous Wiener processes, users can interactively explore concepts like Ito's Lemma and geometric volatility. The engine runs a parallelized Euler-Maruyama solver on the GPU via custom WebGL shaders, handling 100,000+ simultaneous paths at 60fps.",
    year: "2025",
    month: "MAR",
    tags: ["WebGL", "Physics", "React", "GLSL"],
    type: "Simulation",
    role: "Full Stack Engineer",
    stats: [
        { label: "Paths", value: "100k+" },
        { label: "FPS", value: "60" },
        { label: "Error", value: "<0.5%" }
    ]
  },
  {
    id: "poker",
    title: "HUNL Poker CFR",
    description: "Monte Carlo CFR engine for optimal poker strategy. 95% convergence.",
    longDescription: "A C++ implementation of Monte Carlo Counterfactual Regret Minimization (MCCFR) for solving Heads-Up No-Limit Texas Hold'em. The solver uses information abstraction clustering to reduce the game state space by 90% while maintaining Nash Equilibrium approximation. Includes a custom hand evaluator optimized with AVX2 instructions.",
    year: "2025",
    month: "FEB",
    tags: ["C++", "Game Theory", "AI", "OpenMP"],
    type: "Algorithm",
    role: "Systems Engineer",
    stats: [
        { label: "Convergence", value: "95%" },
        { label: "State Redux", value: "90%" },
        { label: "Speedup", value: "40x" }
    ]
  },
  {
    id: "gas",
    title: "Gas Price Forecasting",
    description: "ARIMA-GARCH model for prediction markets. Competition winner.",
    longDescription: "Developed a hybrid ARIMA-GARCH statistical model to forecast European natural gas prices for a quantitative trading competition. The model captures both the mean reversion of price levels and the volatility clustering inherent in energy markets. It achieved a ROC AUC of 0.998 on out-of-sample data, significantly outperforming standard time-series baselines.",
    year: "2025",
    month: "JAN",
    tags: ["Python", "TimeSeries", "ML", "Pandas"],
    type: "Research",
    role: "Quant Researcher",
    stats: [
        { label: "ROC AUC", value: "0.998" },
        { label: "Calibration", value: "+23%" },
        { label: "Rank", value: "#1" }
    ]
  },
  {
    id: "earthscope",
    title: "EarthScope-AI",
    description: "3D UNet disaster classification pipeline. CDC finalist.",
    longDescription: "An end-to-end deep learning pipeline for rapid disaster assessment using satellite imagery. The core architecture is a modified 3D U-Net that fuses RGB optical data, Digital Elevation Models (DEM), and historical climate data to segment flood zones in real-time. The system was optimized for edge deployment on limited hardware.",
    year: "2024",
    month: "DEC",
    tags: ["PyTorch", "Computer Vision", "Geo", "Docker"],
    type: "Deep Learning",
    role: "ML Engineer",
    stats: [
        { label: "Accuracy", value: "94.2%" },
        { label: "Inference", value: "120ms" },
        { label: "Award", value: "Finalist" }
    ]
  }
];

const posts: Post[] = [
  {
    id: "stochastic",
    title: "The Unreasonable Effectiveness of Stochastic Calculus",
    excerpt: "Exploring why Ito integrals map so perfectly to market mechanics, and where the analogy breaks down in high-volatility regimes.",
    date: "2025.02.14",
    readTime: "8 min",
    tag: "Math",
    content: [
      { type: 'paragraph', text: "The mapping between heat diffusion and option pricing is one of the most beautiful coincidences in mathematical physics. When Black and Scholes derived their famous equation, they effectively treated money as a particle undergoing Brownian motion." },
      { type: 'header', text: "The Diffusion Equation" },
      { type: 'paragraph', text: "But why does this work? The central limit theorem does a lot of the heavy lifting. In a market with sufficient liquidity and independent actors, price movements tend to aggregate into normal distributions over logarithmic scales." },
      { type: 'code', lang: 'python', code: `import numpy as np\n\ndef geometric_brownian_motion(S0, mu, sigma, T, dt):\n    N = int(T / dt)\n    t = np.linspace(0, T, N)\n    W = np.random.standard_normal(size=N)\n    W = np.cumsum(W) * np.sqrt(dt)\n    \n    # Ito's Lemma application\n    X = (mu - 0.5 * sigma**2) * t + sigma * W\n    return S0 * np.exp(X)` },
      { type: 'paragraph', text: "However, the map is not the territory. In high-volatility regimes, the assumptions of continuous paths break down. We see jumps. We see heavy tails. The market behaves less like a diffusing particle and more like a turbulent flow." },
      { type: 'image', caption: "Figure 1: Volatility clustering during the 2020 crash vs. Log-Normal prediction." },
      { type: 'paragraph', text: "In this post, we'll implement a jump-diffusion model in Python and compare its calibration to standard Geometric Brownian Motion." }
    ]
  },
  {
    id: "react-perf",
    title: "Optimizing React for High-Frequency Data",
    excerpt: "Techniques for rendering 60fps visualizations without blocking the main thread. Using WebWorkers and OffscreenCanvas.",
    date: "2025.01.20",
    readTime: "12 min",
    tag: "Engineering",
    content: [
      { type: 'paragraph', text: "React's reconciliation engine is a marvel of engineering, but it wasn't built for the firehose of data that comes from a real-time order book or a particle physics simulation." },
      { type: 'header', text: "The Render Loop Problem" },
      { type: 'paragraph', text: "When you're receiving 1000 updates per second, causing a re-render on every state change is a death sentence for your frame rate. The main thread chokes, scroll becomes jagged, and users leave." },
      { type: 'code', lang: 'tsx', code: `// The naive approach (Do not do this)\nuseEffect(() => {\n  socket.on('price', (p) => setPrice(p)); // Triggers render\n}, []);\n\n// The performant approach\nuseFrame(() => {\n  // Direct mutation of the ref\n  meshRef.current.position.y = mutableState.price;\n});` },
      { type: 'paragraph', text: "The solution? Bypass the virtual DOM for the heavy lifting. We can use a ref to hold mutable state and an animation loop to update a Canvas element directly." }
    ]
  },
  {
    id: "rust-sim",
    title: "From Python to Rust: A Simulation Engine Story",
    excerpt: "Rewriting my Monte Carlo solver. Dealing with the borrow checker, but gaining 40x performance in the process.",
    date: "2024.12.05",
    readTime: "15 min",
    tag: "Systems",
    content: [
      { type: 'paragraph', text: "I love Python. It's the lingua franca of data science. But when I tried to scale my poker solver to millions of iterations, the GIL (Global Interpreter Lock) became my enemy." },
      { type: 'paragraph', text: "Rust promised memory safety without garbage collection and C++ level speeds. It sounded too good to be true. The learning curve was vertical—fighting the borrow checker felt like arguing with a strict bureaucrat." },
      { type: 'header', text: "Zero Cost Abstractions" },
      { type: 'paragraph', text: "But once it clicked, the results were staggering. My Monte Carlo simulation went from 45 minutes in Python to just over 60 seconds in Rust. This speed difference isn't just about waiting less; it changes how you can iterate on your research." }
    ]
  }
];

// --- VISUAL EFFECTS ---

// 1. Dust Motes (Three.js) - Simulates dust floating in light shafts
const DustParticles = () => {
  const count = 1500; // Increased particle count
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Define colors
  const colorLight = useMemo(() => new THREE.Color('#f5f0e1'), []);
  const colorDark = useMemo(() => new THREE.Color('#333333'), []);

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

  useFrame((state) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      const x = (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10;
      const y = (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10;
      const z = (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10;

      // Gentle floating motion
      dummy.position.set(x, y, z);
      
      // Random scale for depth
      const scale = (s + 2) * 0.04; // Visible dust specks
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current!.setMatrixAt(i, dummy.matrix);

      // Color Change Logic based on Boundary
      // The light shaft is rotated approx -15 degrees.
      // Rotated coordinate system: x' = x * cos(theta) - y * sin(theta)
      // theta = -15 deg approx -0.26 rad
      // x' = x * 0.96 + y * 0.26
      // We check if x' > threshold (shifted to right)
      
      const boundaryVal = x * 0.96 + y * 0.26;
      
      // Smooth transition zone around x' = -4
      // Normalize to 0-1 range for lerp
      // The boundary is roughly at x = -4 in world space for the visual diagonal
      const alpha = Math.max(0, Math.min(1, (boundaryVal + 5) / 10)); 
      
      tempColor.lerpColors(colorDark, colorLight, alpha);
      mesh.current!.setColorAt(i, tempColor);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

// 2. Neural Network - Connected nodes for Writing section
const NeuralNetworkEffect = () => {
  const count = 50; // Number of nodes
  const radius = 8; // Spread radius
  
  // Create initial positions
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5; // flatter z
      
      // Slower initial movement
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, []);

  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Buffer for lines (max possible connections)
  const maxConnections = count * count;
  const linePositions = useMemo(() => new Float32Array(maxConnections * 6), []);
  const lineColors = useMemo(() => new Float32Array(maxConnections * 6), []);
  
  // Track when each connection was last broken
  // Initialize with a negative time so they are fully visible at start
  const lastBroken = useMemo(() => new Float32Array(count * count).fill(-1000), [count]);

  useFrame((state) => {
    let vertexIndex = 0;
    const connectionDistance = 3.5;
    const cutRadius = 0.2; 
    const cutRadiusSq = cutRadius * cutRadius;
    const now = state.clock.elapsedTime;
    
    // Boundary return strength
    const boundaryForce = 0.0002;

    const { pointer, viewport } = state;
    // Map normalized pointer (-1 to 1) to view coordinates at z=0 plane
    const mx = (pointer.x * viewport.width) / 2;
    const my = (pointer.y * viewport.height) / 2;

    // Update particles
    for (let i = 0; i < count; i++) {
      let px = positions[i * 3];
      let py = positions[i * 3 + 1];
      let pz = positions[i * 3 + 2];
      
      let vx = velocities[i * 3];
      let vy = velocities[i * 3 + 1];
      let vz = velocities[i * 3 + 2];

      // Soft Boundaries (Steer back to center instead of hard bounce)
      if (px > radius) vx -= boundaryForce;
      else if (px < -radius) vx += boundaryForce;

      if (py > radius * 0.8) vy -= boundaryForce;
      else if (py < -radius * 0.8) vy += boundaryForce;

      if (pz > 2) vz -= boundaryForce;
      else if (pz < -2) vz += boundaryForce;

      // Apply velocity
      px += vx;
      py += vy;
      pz += vz;

      // Save back state
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      velocities[i * 3] = vx;
      velocities[i * 3 + 1] = vy;
      velocities[i * 3 + 2] = vz;

      // Check connections
      for (let j = i + 1; j < count; j++) {
        const px2 = positions[j * 3];
        const py2 = positions[j * 3 + 1];
        const pz2 = positions[j * 3 + 2];

        const ldx = px - px2;
        const ldy = py - py2;
        const ldz = pz - pz2;
        const dist = Math.sqrt(ldx*ldx + ldy*ldy + ldz*ldz);

        if (dist < connectionDistance) {
            const connectionId = i * count + j;

            // Project mouse position onto the line segment to find closest point
            const x1 = px, y1 = py;
            const x2 = px2, y2 = py2;
            const segLenSq = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
            
            // t is the projection factor (0 to 1)
            const t = ((mx - x1) * (x2 - x1) + (my - y1) * (y2 - y1)) / segLenSq;
            
            // Clamp t to segment for accurate distance calculation
            const clampedT = Math.max(0, Math.min(1, t)); 
            
            const closestX = x1 + clampedT * (x2 - x1);
            const closestY = y1 + clampedT * (y2 - y1);
            
            const dxm = mx - closestX;
            const dym = my - closestY;
            const distToMouseSq = dxm*dxm + dym*dym;

            // If mouse cuts the line, update the broken timestamp
            // Check t > 0.1 && t < 0.9 to ensure we don't break lines when hovering over the nodes themselves
            if (distToMouseSq < cutRadiusSq && t > 0.1 && t < 0.9) {
                lastBroken[connectionId] = now;
            }

            // Calculate recovery opacity
            const timeSinceBreak = now - lastBroken[connectionId];
            let recoveryAlpha = 1.0;

            if (timeSinceBreak < 0.3) {
                // Kill for 0.3s
                recoveryAlpha = 0.0;
            } else if (timeSinceBreak < 0.8) {
                // Fade in over 0.5s (0.3s -> 0.8s)
                recoveryAlpha = (timeSinceBreak - 0.3) / 0.5;
                // Optional: Smooth step
                recoveryAlpha = recoveryAlpha * recoveryAlpha * (3 - 2 * recoveryAlpha);
            }

            // Only draw if visible
            if (recoveryAlpha > 0.01) {
                // Calculate base opacity based on node distance
                const alpha = Math.max(0.05, 1.0 - (dist / connectionDistance));
                const brightness = alpha * alpha * recoveryAlpha; // Combine factors

                // Add line segment
                linePositions[vertexIndex] = px;
                linePositions[vertexIndex + 1] = py;
                linePositions[vertexIndex + 2] = pz;
                
                lineColors[vertexIndex] = brightness;
                lineColors[vertexIndex + 1] = brightness;
                lineColors[vertexIndex + 2] = brightness;

                linePositions[vertexIndex + 3] = px2;
                linePositions[vertexIndex + 4] = py2;
                linePositions[vertexIndex + 5] = pz2;

                lineColors[vertexIndex + 3] = brightness;
                lineColors[vertexIndex + 4] = brightness;
                lineColors[vertexIndex + 5] = brightness;

                vertexIndex += 6;
            }
        }
      }
    }

    // Update Points
    if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Update Lines
    if (linesGeometryRef.current) {
        linesGeometryRef.current.setDrawRange(0, vertexIndex / 3);
        linesGeometryRef.current.attributes.position.needsUpdate = true;
        linesGeometryRef.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.08} color="white" transparent opacity={0.8} sizeAttenuation={true} />
        </points>
        <lineSegments>
            <bufferGeometry ref={linesGeometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={maxConnections * 2} // 2 vertices per line
                    array={linePositions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={maxConnections * 2}
                    array={lineColors}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial 
                vertexColors={true} 
                transparent 
                opacity={0.6} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </lineSegments>
    </group>
  );
};

// 3. Optimization Manifold - Work Section (Wireframe Cost Surface)
const OptimizationManifold = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        
        // Access the position attribute
        const position = meshRef.current.geometry.attributes.position;
        const count = position.count;

        // Animate vertices to create a flowing landscape
        for (let i = 0; i < count; i++) {
            // Get original x, y (plane is initialized on x,y, we rotate it later)
            const x = position.getX(i);
            const y = position.getY(i);
            
            // Calculate Z based on optimization landscape metaphors (peaks and valleys)
            // Using a combination of sine waves for liquid motion
            const z = Math.sin(x * 0.3 + time * 0.5) * Math.cos(y * 0.3 + time * 0.3) * 2
                    + Math.sin(x * 1 + time) * 0.5;

            position.setZ(i, z);
        }
        position.needsUpdate = true;
        
        // Slow rotation
        meshRef.current.rotation.z = time * 0.05;
    });

    return (
        <mesh ref={meshRef} position={[0, -2, 0]} rotation={[-Math.PI / 2.5, 0, 0]}>
            <planeGeometry args={[30, 30, 60, 60]} />
            {/* Darker and more transparent for readability */}
            <meshBasicMaterial color="#555" wireframe={true} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
    );
};


// --- SUB-COMPONENTS ---

const HomePage = ({ scrollY, setPage }: { scrollY: number, setPage: (p: Page) => void }) => {
  // Parallax opacities
  const appear1 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 0.4) / 400));
  const appear2 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 1.0) / 400));
  const appear3 = Math.min(1, Math.max(0, (scrollY - window.innerHeight * 1.6) / 400));

  return (
    <div className="relative pb-32">
      
      {/* HERO BACKGROUND - Pure Geometric Light Shaft */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden pointer-events-none bg-[#0a0a0a]">
          
          {/* The "Light Shaft" - No Shadows, Sharp Edges */}
          <div 
            className="absolute overflow-hidden"
            style={{
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              // Rotate and translate based on scroll to "open" the view
              // Rotates negative to swing the vertical edge towards horizontal (upwards)
              transform: `rotate(${-15 - (scrollY * 0.05)}deg) translateX(${35 + (scrollY * 0.05)}%)`,
              willChange: 'transform',
              backgroundColor: '#f5f0e1', // Worn yellowed paper
            }}
          >
            {/* Clean Construction Lines */}
            <div className="absolute top-0 bottom-0 left-[0px] w-[1px] bg-black/10" /> 
            <div className="absolute top-0 bottom-0 left-[12px] w-[1px] bg-black/5" />
          </div>

          {/* Right Side Architectural Lines */}
          <div className="absolute right-[10%] top-0 bottom-0 w-[1px] bg-[#f5f0e1] mix-blend-difference z-10 hidden md:block opacity-30">
            <div className="absolute top-[20%] right-0 w-3 h-[1px] bg-[#f5f0e1]"></div>
            <div className="absolute top-[20.5%] right-0 w-1.5 h-[1px] bg-[#f5f0e1]"></div>
            <div className="absolute top-[21%] right-0 w-1.5 h-[1px] bg-[#f5f0e1]"></div>
            <div className="absolute top-[80%] right-0 w-3 h-[1px] bg-[#f5f0e1]"></div>
            <div className="absolute top-[20%] right-6 text-[10px] text-[#f5f0e1] font-mono tracking-widest origin-top-right rotate-90">
                COORD.SYS.01
            </div>
          </div>
          <div className="absolute right-[5%] top-0 bottom-0 w-[1px] bg-[#f5f0e1] mix-blend-difference z-10 hidden md:block opacity-10"></div>
      </div>

      {/* HERO TEXT */}
      <section className="h-screen flex flex-col justify-center px-6 md:px-24 relative z-10 mix-blend-difference text-white pointer-events-none">
        <div className="max-w-5xl w-full pt-20 pointer-events-auto">
          <h1 className="text-[14vw] md:text-[9rem] font-bold tracking-tighter leading-[0.8] mb-8 text-white">
            Andrew<br/>Wang
          </h1>
          <div className="h-2 w-32 bg-white mb-12"></div>
          <p className="text-xl md:text-3xl text-white font-light max-w-2xl leading-relaxed tracking-wide">
            Math + Stats @ UNC.<br/>
            Creating innovative models for difficult problems.
          </p>
          
          <div className="mt-16 flex flex-wrap gap-8">
            <button
              onClick={(e) => {
                  e.stopPropagation();
                  setPage('work');
                  window.scrollTo(0, 0);
              }}
              className="px-8 py-4 bg-white text-black font-bold tracking-[0.2em] text-sm uppercase hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer relative z-[60] pointer-events-auto shadow-lg hover:shadow-white/20"
            >
              View work
            </button>
            <a
              href="mailto:anzwan@unc.edu"
              className="px-8 py-4 border border-white text-white font-bold tracking-[0.2em] text-sm uppercase hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer relative z-[60] pointer-events-auto"
            >
              Contact
            </a>
          </div>
        </div>
      </section>

      {/* Section 1 */}
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

      {/* Section 2 */}
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

      {/* Section 3 */}
      <section 
        className="min-h-[80vh] flex items-center px-6 md:px-24 z-10 relative mix-blend-difference pointer-events-none"
        style={{ opacity: appear3 }}
      >
        <div className="max-w-3xl pointer-events-auto">
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
            className="text-xl text-white hover:text-white/70 transition-all inline-flex items-center gap-4 group uppercase tracking-widest font-bold cursor-pointer relative z-[60]"
          >
            See the work
            <span className="group-hover:translate-x-4 transition-transform duration-300">→</span>
          </button>
        </div>
      </section>
    </div>
  );
};

const WorkPage = ({ 
    selectedProjectId, 
    setSelectedProjectId 
}: { 
    selectedProjectId: string | null, 
    setSelectedProjectId: (id: string | null) => void 
}) => {
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 animate-fade-in relative z-20 bg-[#0a0a0a]">
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="absolute right-[25%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
          <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
      </div>
      
      <div className="max-w-[1600px] mx-auto">
        
        {selectedProject ? (
            // === PROJECT DETAIL VIEW ===
            <div className="animate-fade-in relative z-50">
                <button 
                    onClick={() => setSelectedProjectId(null)}
                    className="group flex items-center gap-2 text-white/50 hover:text-white mb-12 uppercase tracking-widest text-xs font-bold transition-all cursor-pointer hover:translate-x-[-4px]"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Index
                </button>

                {/* Header */}
                <div className="border-b border-white/20 pb-12 mb-12">
                     <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                         <div>
                            <span className="text-nobel-gold font-mono uppercase tracking-widest text-sm mb-4 block">{selectedProject.type} /// {selectedProject.year}</span>
                            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-none">{selectedProject.title}</h1>
                         </div>
                         <div className="flex flex-wrap gap-2 md:justify-end">
                             {selectedProject.tags.map(tag => (
                                 <span key={tag} className="border border-white/20 px-3 py-1 text-white/60 text-xs uppercase tracking-wider rounded-full">{tag}</span>
                             ))}
                         </div>
                     </div>
                     <p className="text-2xl text-white/80 max-w-3xl font-light leading-relaxed">
                         {selectedProject.description}
                     </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <h3 className="text-white text-lg font-bold uppercase tracking-widest mb-6 border-l-2 border-white pl-4">About the Project</h3>
                            <p className="text-lg text-white/70 leading-relaxed font-serif whitespace-pre-wrap">
                                {selectedProject.longDescription}
                            </p>
                        </div>

                        {/* Visual Placeholder */}
                        <div className="w-full h-[400px] bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center gap-4 group hover:bg-white/10 transition-colors cursor-default">
                             <Layers size={48} className="text-white/20 group-hover:text-white/40 transition-colors" />
                             <span className="font-mono text-white/30 text-sm">Interactive Visualization Component</span>
                        </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-12">
                        <div className="bg-white/5 p-8 border border-white/10 backdrop-blur-sm">
                            <h4 className="text-white/50 text-xs font-mono uppercase tracking-widest mb-8">Key Metrics</h4>
                            <div className="space-y-8">
                                {selectedProject.stats.map((stat, i) => (
                                    <div key={i}>
                                        <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                                        <div className="text-sm text-white/40 font-mono">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white/50 text-xs font-mono uppercase tracking-widest mb-4">Role</h4>
                            <p className="text-white text-lg">{selectedProject.role}</p>
                        </div>

                        <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 group">
                            Launch Case Study <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            // === PROJECT LIST VIEW ===
            <div className="animate-fade-in">
                <div className="mb-32 relative pl-4 md:pl-0">
                    <h1 className="text-7xl md:text-[10rem] font-bold mb-8 tracking-tighter text-white z-10 relative leading-[0.8]">
                    Selected<br/><span className="text-white/50">Index</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 max-w-xl font-light italic font-serif mt-12 border-l border-white/30 pl-6">
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
                        onClick={() => {
                            setSelectedProjectId(project.id);
                            window.scrollTo({top: 0, behavior: 'smooth'});
                        }}
                        className="group cursor-pointer relative border-t border-white/20 py-12 hover:border-white transition-colors duration-500"
                    >
                        {/* Hover Light Effect */}
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
                                <h2 className="text-3xl md:text-5xl font-bold text-white group-hover:text-white transition-colors tracking-tight flex items-center gap-4">
                                    {project.title}
                                    <ArrowUpRight size={24} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white/50" />
                                </h2>
                            </div>
                            <p className="text-lg md:text-xl text-white/60 group-hover:text-white/90 transition-colors leading-relaxed font-light max-w-2xl">
                                {project.description}
                            </p>
                            <span className="inline-block mt-4 text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white border-b border-transparent group-hover:border-white transition-all">View Case Study</span>
                            </div>

                            {/* Tech Specs */}
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

                                {/* Abstract Visual Element */}
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
                    <a href="mailto:anzwan@unc.edu" className="inline-block px-12 py-5 bg-white text-black font-bold text-lg hover:bg-neutral-300 transition-colors uppercase tracking-widest hover:scale-105 active:scale-95 duration-300">
                    Contact Me
                    </a>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const BlogPage = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 animate-fade-in relative z-20 bg-[#0a0a0a]">
        
        {/* Paper texture column on the right for visual interest (Fan Ho style split) */}
        <div className="fixed right-0 top-0 bottom-0 w-[15vw] bg-[#f5f0e1] opacity-5 pointer-events-none hidden md:block"></div>
        <div className="fixed right-[15vw] top-0 bottom-0 w-[1px] bg-white/10 hidden md:block"></div>

        <div className="max-w-[1200px] mx-auto relative z-10">
            
            {selectedPost ? (
                // ARTICLE VIEW
                <div className="animate-fade-in">
                    <button 
                        onClick={() => setSelectedPostId(null)}
                        className="group flex items-center gap-2 text-white/50 hover:text-white mb-12 uppercase tracking-widest text-xs font-bold transition-all cursor-pointer hover:translate-x-[-4px]"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Index
                    </button>
                    
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-4 mb-6 text-sm font-mono text-nobel-gold border-b border-white/10 pb-6">
                             <span className="text-white/50">{selectedPost.date}</span>
                             <span className="text-white/30">/</span>
                             <span className="text-white">{selectedPost.tag}</span>
                             <span className="text-white/30 ml-auto">{selectedPost.readTime}</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-16 leading-tight tracking-tight">
                            {selectedPost.title}
                        </h1>

                        <div className="space-y-12">
                            {selectedPost.content.map((block, idx) => {
                                switch(block.type) {
                                    case 'paragraph':
                                        return (
                                            <p key={idx} className="text-lg md:text-xl text-white/70 font-serif leading-relaxed">
                                                {block.text}
                                            </p>
                                        );
                                    case 'header':
                                        return (
                                            <h3 key={idx} className="text-2xl md:text-3xl font-bold text-white mt-16 mb-6 tracking-tight">
                                                {block.text}
                                            </h3>
                                        );
                                    case 'code':
                                        return (
                                            <div key={idx} className="my-8 rounded-lg overflow-hidden bg-[#111] border border-white/10">
                                                <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
                                                    <span className="text-xs font-mono text-white/40 uppercase">{block.lang}</span>
                                                    <Terminal size={14} className="text-white/20" />
                                                </div>
                                                <pre className="p-6 overflow-x-auto">
                                                    <code className="font-mono text-sm text-white/80 leading-relaxed">
                                                        {block.code}
                                                    </code>
                                                </pre>
                                            </div>
                                        );
                                    case 'image':
                                        return (
                                            <figure key={idx} className="my-12">
                                                <div className="w-full h-80 bg-[#1a1a1a] rounded-sm border border-white/10 flex items-center justify-center flex-col gap-4 group hover:border-white/20 transition-colors">
                                                    <ImageIcon size={32} className="text-white/20" />
                                                    <div className="text-white/20 font-mono text-xs">Image Placeholder</div>
                                                </div>
                                                <figcaption className="mt-4 text-center text-sm font-mono text-white/40 italic">
                                                    {block.caption}
                                                </figcaption>
                                            </figure>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </div>

                        <div className="mt-24 pt-12 border-t border-white/10 flex justify-between items-center">
                            <p className="text-white/30 text-sm font-mono italic">
                                End of transmission.
                            </p>
                            <button 
                                onClick={() => setSelectedPostId(null)}
                                className="text-white text-sm font-bold uppercase tracking-widest hover:underline"
                            >
                                Read Next
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // LIST VIEW
                <>
                    <div className="mb-24">
                        <h1 className="text-7xl md:text-[9rem] font-bold mb-8 tracking-tighter text-white leading-[0.8]">
                            Field<br/><span className="text-white/30">Notes</span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-lg font-mono text-sm uppercase tracking-widest mt-8 border-t border-white/20 pt-4">
                            Thoughts on simulation, systems programming, and model interpretability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-16">
                        {posts.map((post, i) => (
                            <article key={i} className="group relative border-t border-white/10 pt-12 transition-all duration-500 hover:border-white/60">
                                
                                {/* Added Hover Indicator */}
                                <div className="absolute left-0 top-12 h-[calc(100%-3rem)] w-1 bg-white transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 group-hover:translate-x-6 transition-transform duration-500 ease-out pl-4 md:pl-0">
                                    
                                    {/* Meta */}
                                    <div className="md:col-span-3 flex flex-col gap-2">
                                        <time className="text-sm font-mono text-white/50">{post.date}</time>
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">{post.tag}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="md:col-span-6">
                                        <h2 
                                            onClick={() => setSelectedPostId(post.id)}
                                            className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-white/90 group-hover:underline decoration-1 underline-offset-8 transition-all cursor-pointer"
                                        >
                                            {post.title}
                                        </h2>
                                        <p className="text-lg text-white/60 font-light leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                        <button 
                                            onClick={() => setSelectedPostId(post.id)}
                                            className="mt-6 text-sm uppercase tracking-widest text-white/40 group-hover:text-white flex items-center gap-2 transition-colors cursor-pointer group/btn"
                                        >
                                            Read Article <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Status */}
                                    <div className="md:col-span-3 text-right hidden md:block">
                                        <span className="text-xs font-mono text-white/30 border border-white/20 px-2 py-1 rounded-full">
                                            {post.readTime}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    
                    <div className="mt-32 text-center border-t border-white/10 pt-12">
                        <p className="text-white/30 text-sm font-mono">End of Feed</p>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function FluidPortfolio() {
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
        setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate canvas opacity for Work page fade effects
  let canvasOpacity = 1;
  if (typeof document !== 'undefined') {
      if (currentPage === 'writing') {
          canvasOpacity = Math.max(0, 1 - scrollY / 600);
      } else if (currentPage === 'work') {
          if (selectedProjectId) {
              // Fade out quickly on Project Detail Page
              canvasOpacity = Math.max(0, 1 - scrollY / 400);
          } else {
              // Fade out as user scrolls into the project list
              const topFadeStart = 0;
              const topFadeDist = 400;
              const topOpacity = Math.max(0, 1 - Math.max(0, scrollY - topFadeStart) / topFadeDist);

              // Fade back in at the bottom (Contact section)
              const docHeight = document.documentElement.scrollHeight;
              const winHeight = window.innerHeight;
              const distFromBottom = docHeight - (scrollY + winHeight);
              const bottomFadeDist = 300;
              const bottomOpacity = Math.max(0, 1 - Math.max(0, distFromBottom) / bottomFadeDist);

              canvasOpacity = Math.max(topOpacity, bottomOpacity);
          }
      }
  }

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen relative selection:bg-white selection:text-black font-sans overflow-x-hidden">
      
      {/* Three.js Atmosphere (Dust/Network) - z-30 but pointer-events-none ensures clicks pass through */}
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
            {currentPage === 'writing' ? <NeuralNetworkEffect /> : (currentPage === 'work' ? <OptimizationManifold /> : <DustParticles />)}
        </Canvas>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] flex flex-col justify-center items-center gap-12 animate-fade-in pointer-events-auto">
            {(['home', 'work', 'writing'] as const).map((page) => (
                <button
                    key={page}
                    onClick={() => {
                        setCurrentPage(page);
                        setIsMenuOpen(false);
                        window.scrollTo({top: 0, behavior: 'smooth'});
                        if (page === 'work') setSelectedProjectId(null); // Reset when navigating
                    }}
                    className={`text-4xl font-bold tracking-[0.2em] uppercase text-white hover:scale-110 transition-transform ${currentPage === page ? 'opacity-100' : 'opacity-50'}`}
                >
                    {page}
                </button>
            ))}
        </div>
      )}
      
      {/* Nav - z-50 to stay on top */}
      <nav className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 mix-blend-difference text-white pointer-events-none">
        <div 
            className="text-2xl font-bold tracking-tighter cursor-pointer border-2 border-white px-2 py-1 pointer-events-auto hover:scale-105 transition-transform duration-200" 
            onClick={() => {
                setCurrentPage('home');
                setIsMenuOpen(false);
            }}
        >
            AW.
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 md:gap-12 text-xs font-bold tracking-[0.2em] pointer-events-auto">
            <button
            onClick={() => {
                setCurrentPage('home');
                window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className={`transition-all hover:text-white hover:scale-105 uppercase relative group ${currentPage === 'home' ? 'opacity-100' : 'opacity-50'}`}
            >
            Home
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${currentPage === 'home' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
            <button
            onClick={() => {
                setCurrentPage('work');
                setSelectedProjectId(null); // Reset when clicking nav
                window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className={`transition-all hover:text-white hover:scale-105 uppercase relative group ${currentPage === 'work' ? 'opacity-100' : 'opacity-50'}`}
            >
            Work
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${currentPage === 'work' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
            <button
            onClick={() => {
                setCurrentPage('writing');
                window.scrollTo({top: 0, behavior: 'smooth'});
            }}
            className={`transition-all hover:text-white hover:scale-105 uppercase relative group ${currentPage === 'writing' ? 'opacity-100' : 'opacity-50'}`}
            >
            Writing
            <span className={`absolute -bottom-2 left-0 w-full h-[1px] bg-white transform origin-left transition-transform duration-300 ${currentPage === 'writing' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden pointer-events-auto">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="text-white hover:scale-110 transition-transform p-2"
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </nav>

      {/* Main Content - z-10 default, but buttons inside will elevate themselves */}
      <div className="relative z-10">
        {currentPage === 'home' && <HomePage scrollY={scrollY} setPage={setCurrentPage} />}
        {currentPage === 'work' && <WorkPage selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} />}
        {currentPage === 'writing' && <BlogPage />}
      </div>
    </div>
  );
}