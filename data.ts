/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Project, Post } from './types';

export const projects: Project[] = [
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

export const posts: Post[] = [
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
