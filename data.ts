/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Project, Post } from './types';

export const projects: Project[] = [
  {
    id: "gas",
    title: "Gas Price Forecasting",
    description: "ARIMA-GARCH model for prediction markets. Competition Finalist. ROC AUC 0.998, 23% calibration improvement.",
    longDescription: "Developed a hybrid ARIMA-GARCH statistical model to forecast Gasoline prices (Based on AAA national averages) for a forcasting competition hosted by Kalshi. The model captures both the mean reversion of price levels and the volatility clustering inherent in energy markets. It achieved a ROC AUC of 0.998 on out-of-sample data, significantly outperforming standard time-series baselines.",
    year: "2025",
    month: "OCT",
    tags: ["Python", "TimeSeries", "ML", "Pandas"],
    type: "Research/Competition",
    role: "Researcher",
    stats: [
        { label: "ROC AUC", value: "0.998" },
        { label: "Calibration", value: "+23%" },
        { label: "Rank", value: "Top 3" }
    ]
  },
  {
    id: "brownian",
    title: "Brownian Motion Webapp",
    description: "Interactive stochastic dynamics visualizer with parallelized Euler-Maruyama solver.",
    longDescription: "A high-performance educational tool designed to build intuition for stochastic calculus. By visualizing the convergence of random walks to continuous Wiener processes, users can interactively explore concepts like Ito's Lemma and geometric volatility. The engine runs a parallelized Euler-Maruyama solver on the GPU via custom WebGL shaders, handling 100,000+ simultaneous paths at 60fps.",
    year: "2025",
    month: "SEP",
    tags: ["WebGL", "Physics", "React", "GLSL"],
    type: "Simulation",
    role: "Full Stack Engineer",
    image: "images/Test.png",
    stats: [
        { label: "Paths", value: "100k+" },
        { label: "FPS", value: "60" },
        { label: "Error", value: "<0.5%" }
    ]
  },
  {
    id: "earthscope",
    title: "EarthScope-AI",
    description: "3D UNet disaster classification pipeline. CDC finalist.",
    longDescription: "An end-to-end deep learning pipeline for rapid disaster assessment using satellite imagery. The core architecture is a modified 3D U-Net that fuses RGB optical data, Digital Elevation Models (DEM), and historical climate data to segment flood zones in real-time. The system was optimized for edge deployment on limited hardware.",
    year: "2025",
    month: "AUG",
    tags: ["PyTorch", "Computer Vision", "Geo", "Docker"],
    type: "Deep Learning",
    role: "ML Engineer",
    stats: [
        { label: "Accuracy", value: "94.2%" },
        { label: "Inference", value: "120ms" },
        { label: "Award", value: "Finalist" }
    ]
  },
  {
    id: "poker",
    title: "HUNL Poker CFR",
    description: "Monte Carlo CFR engine for optimal poker strategy. 95% convergence.",
    longDescription: "A C++ implementation of Monte Carlo Counterfactual Regret Minimization (MCCFR) for solving Heads-Up No-Limit Texas Hold'em. The solver uses information abstraction clustering to reduce the game state space by 90% while maintaining Nash Equilibrium approximation. Includes a custom hand evaluator optimized with AVX2 instructions.",
    year: "2025",
    month: "JAN-MAR",
    tags: ["C++", "Game Theory", "AI", "OpenMP"],
    type: "Algorithm",
    role: "Systems Engineer",
    stats: [
        { label: "Convergence", value: "95%" },
        { label: "State Redux", value: "90%" },
        { label: "Speedup", value: "40x" }
    ]
  }
];

export const posts: Post[] = [

  {
    id: "portfolio-walkthrough",
    title: "First Post: Inside This Portfolio",
    excerpt: "A quick look at the stack and design behind this website.",
    date: "2025.12.08",
    readTime: "2 min",
    tag: "Website",
    content: [
      { type: 'paragraph', text: "This portfolio is built with React and Three.js, designed to be a clean, pretty way to display some of the work and ideas I explore. The 3D background effects (Dust Motes and Neural Network) are rendered using @react-three/fiber with the help of Gemini." },
      { type: 'header', text: "The Data Structure" },
      { type: 'paragraph', text: "All the content you see here, including this very post, is stored in a very simple JSON-like structure within the application code. This makes it easy to update and maintain without a super complex backend." },
      { type: 'code', lang: 'typescript', code: `const posts: Post[] = [\n  {\n    id: "portfolio-walkthrough",\n    title: "Inside This Portfolio",\n    // ... content ...\n  }\n];` },
      { type: 'paragraph', text: "Navigating between sections triggers smooth state transitions, with the 3D scene adapting to the different contexts between  the home screen, and connected nodes for the writing section." },
      { type: 'paragraph', text: "Hopefully there is more to come very shortly!." } 
    ]
  }
];
