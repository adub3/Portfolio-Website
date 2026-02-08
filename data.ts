

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Project, Post } from './types';

// --- DATA GENERATORS ---

const generateGaussian = (mu: number, sigma: number, points: number = 100) => {
    const data = [];
    const step = (sigma * 8) / points;
    for (let i = 0; i <= points; i++) {
        const x = (mu - sigma * 4) + i * step;
        const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
        data.push({ x, y });
    }
    return data;
};

const generateBinomial = (n: number, p: number) => {
    const factorial = (x: number): number => (x <= 1 ? 1 : x * factorial(x - 1));
    const combinations = (n: number, k: number) => factorial(n) / (factorial(k) * factorial(n - k));
    const data = [];
    for (let k = 0; k <= n; k++) {
        const prob = combinations(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
        data.push({ x: k, y: prob });
    }
    return data;
};

const generateDiscreteFreq = (counts: number[]) => {
    return counts.map((v, i) => ({ x: i, y: v }));
};

const generateWalk = (steps: number, start: number, vol: number, drift: number, jumpProb: number = 0) => {
    const data = [];
    let current = start;
    for (let i = 0; i < steps; i++) {
        data.push({ x: i, y: current });
        let change = drift + (Math.random() - 0.5) * vol;
        if (Math.random() < jumpProb) change -= vol * 3;
        current += change;
    }
    return data;
};

const generateSineWave = (points: number, frequency: number, phase: number, amplitude: number) => {
    const data = [];
    for (let i = 0; i <= points; i++) {
        const x = (i / points) * 4 * Math.PI;
        data.push({ x: i, y: Math.sin(x * frequency + phase) * amplitude });
    }
    return data;
};

const generateCluster = (count: number, centerX: number, centerY: number, spread: number) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        const u = 1 - Math.random(), v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const u2 = 1 - Math.random(), v2 = Math.random();
        const z2 = Math.sqrt(-2.0 * Math.log(u2)) * Math.cos(2.0 * Math.PI * v2);
        data.push({ x: centerX + z * spread, y: centerY + z2 * spread });
    }
    return data;
};

// --- DATA INSTANCES ---

const steps = 60;
const lineDataA = generateWalk(steps, 50, 4, 0.1);
const lineDataB = generateWalk(steps, 40, 2, 0.2);
const normalData = generateGaussian(0, 1, 100);
const normalWide = generateGaussian(0, 2, 100);
const binomialN20 = generateBinomial(20, 0.5);
const clusterA = generateCluster(45, 30, 30, 5);
const clusterB = generateCluster(45, 60, 50, 7);

const barSeries = [
    { name: "Q1-24", val: 32, color: "#ef4444" },
    { name: "Q2-24", val: 45, color: "#f97316" },
    { name: "Q3-24", val: 80, color: "#f59e0b" },
    { name: "Q4-24", val: 60, color: "#10b981" },
    { name: "Q1-25", val: 75, color: "#06b6d4" },
    { name: "Q2-25", val: 90, color: "#3b82f6" },
    { name: "Q3-25", val: 50, color: "#8b5cf6" },
];

export const projects: Project[] = [
  {
    id: "brownian",
    title: "Brownian Motion Webapp",
    description: "Interactive stochastic dynamics visualizer with parallelized Euler-Maruyama solver.",
    longDescription: "A high-performance educational tool designed to build intuition for stochastic calculus. By visualizing the convergence of random walks to continuous Wiener processes, users can interactively explore concepts like Ito's Lemma and geometric volatility.",
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
    longDescription: "A C++ implementation of Monte Carlo Counterfactual Regret Minimization (MCCFR) for solving Heads-Up No-Limit Texas Hold'em.",
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
  }
];

export const posts: Post[] = [
  {
    id: "master-viz",
    title: "The Comprehensive Visualization Engine",
    excerpt: "Exploring the full spectrum of our custom charting toolkit: from 3D manifolds to discrete probability mass functions.",
    date: "2025.04.01",
    readTime: "12 min",
    tag: "Engineering",
    content: [
        { type: 'paragraph', text: "Data visualization isn't just about rendering points; it's about choosing the right visual metaphor for the underlying mathematical structure. This post serves as a living gallery for every capability currently integrated into our high-performance visualization suite." },
        
        { type: 'header', text: "1. Three-Dimensional Phase Space" },
        { type: 'paragraph', text: "For complex systems where dynamics are coupled across multiple dimensions, 2D projections often hide the most interesting behaviors (like strange attractors or latent embeddings). Our 3D engine uses WebGL to render high-density point clouds with interactive orbit controls." },
        { 
            type: 'graph', 
            data: {
                title: "Strange Attractor Phase Space",
                xLabel: "X Axis",
                yLabel: "Y Axis",
                zLabel: "Z Axis",
                type: "3d-scatter",
                csvUrl: "/lorenz.csv",
                series: []
            }
        },

        { type: 'header', text: "2. Continuous Density Functions (PDF)" },
        { type: 'paragraph', text: "Continuous probability is visualized through 'Density.' Instead of discrete points, we render smooth area paths with glowing gradients to signify the concentration of probability mass across a domain." },
        { 
            type: 'graph', 
            data: {
                title: "Gaussian Kernel Densities",
                xLabel: "Variable Value (x)",
                yLabel: "Probability Density f(x)",
                type: "pdf",
                series: [
                    { name: "Unit Normal (σ=1)", color: "#3b82f6", data: normalData },
                    { name: "Broad Normal (σ=2)", color: "#f59e0b", data: normalWide }
                ]
            }
        },

        { type: 'header', text: "3. Discrete Probability Mass (PMF)" },
        { type: 'paragraph', text: "Discrete distributions require a visual language that emphasizes the exactness of outcomes. Our 'Distribution' mode uses high-contrast stems to represent discrete probability mass at specific integers." },
        { 
            type: 'graph', 
            data: {
                title: "Binomial Mass Function (n=20, p=0.5)",
                xLabel: "Successes (k)",
                yLabel: "P(X=k)",
                type: "distribution",
                series: [
                    { name: "Binomial Trail", color: "#10b981", data: binomialN20 }
                ]
            }
        },

        { type: 'header', text: "4. Standard Analytical Views (Line & Scatter)" },
        { type: 'paragraph', text: "The foundation of data science: time-series and correlations. Our standard interactive charts feature SVG-path smoothing for lines and variable-opacity nodes for scatter projections." },
        { 
            type: 'graph', 
            data: {
                title: "Multi-Series Stochastic Walk",
                xLabel: "Time (Steps)",
                yLabel: "Normalized Value",
                type: "line",
                series: [
                    { name: "Process Alpha", color: "#ef4444", data: lineDataA },
                    { name: "Process Beta", color: "#3b82f6", data: lineDataB }
                ]
            }
        },
        { 
            type: 'graph', 
            data: {
                title: "High-Dimensional Cluster Embedding",
                xLabel: "Component 1",
                yLabel: "Component 2",
                type: "scatter",
                series: [
                    { name: "Class 0", color: "#8b5cf6", data: clusterA },
                    { name: "Class 1", color: "#10b981", data: clusterB }
                ]
            }
        },

        { type: 'header', text: "5. Categorical Magnitudes (Bar)" },
        { type: 'paragraph', text: "When comparing binned data or discrete categories, Bar charts provide the most direct representation of magnitude differences." },
        { 
            type: 'graph', 
            data: {
                title: "Quarterly Performance",
                xLabel: "Fiscal Period",
                yLabel: "Metric Units",
                type: "bar",
                series: barSeries.map((s, i) => ({
                    name: s.name,
                    color: s.color,
                    data: [{ x: i, y: s.val }]
                }))
            }
        }
    ]
  },
  {
      id: "prob-geometry",
      title: "The Geometry of Probability",
      excerpt: "Visualizing mass vs density. Comparing the visual metaphors of smooth PDFs and discrete PMFs.",
      date: "2025.03.25",
      readTime: "5 min",
      tag: "Statistics",
      content: [
          { type: 'paragraph', text: "In probability theory, the way we visualize a distribution tells us everything about the nature of the space we are working in. For discrete variables, we use mass. For continuous ones, we use density." },
          { type: 'header', text: "Continuous Density (PDF)" },
          { type: 'paragraph', text: "The Probability Density Function (PDF) describes the relative likelihood for a random variable to take on a given value. The absolute probability of a single point is zero; instead, we measure the area under the curve between two points." },
          { 
              type: 'graph', 
              data: {
                  title: "Standard Normal Distribution",
                  xLabel: "Standard Deviations (σ)",
                  yLabel: "Density f(x)",
                  type: "pdf",
                  series: [
                      { name: "Gaussian (μ=0, σ=1)", color: "#3b82f6", data: normalData }
                  ]
              }
          },
          { type: 'header', text: "Discrete Mass (PMF)" },
          { type: 'paragraph', text: "In contrast, the Probability Mass Function (PMF) gives the probability that a discrete random variable is exactly equal to some value." },
          { 
              type: 'graph', 
              data: {
                  title: "Binomial Mass Function",
                  xLabel: "Successes (k)",
                  yLabel: "P(X=k)",
                  type: "distribution",
                  series: [
                      { name: "Fair Coin (n=20, p=0.5)", color: "#10b981", data: binomialN20 }
                  ]
              }
          },
          { type: 'header', text: "Comparison Summary" },
          {
            type: 'table',
            data: {
                headers: ["Property", "Discrete (PMF)", "Continuous (PDF)"],
                rows: [
                    ["Definition", "P(X = x)", "f(x)"],
                    ["Point Prob", "Non-zero", "Zero"],
                    ["Summation", "Sigma (Σ)", "Integral (∫)"],
                    ["Normalization", "Σ P(x) = 1", "∫ f(x) dx = 1"]
                ],
                caption: "Table 1: Fundamental differences between probability mass and density."
            }
          }
      ]
  }
];