
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, Box, Loader2, Maximize2, Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GraphData, GraphSeries } from './types';

// --- UTILS ---

export const parseCSV = (csv: string): GraphSeries[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const xIdx = headers.indexOf('x'), yIdx = headers.indexOf('y'), zIdx = headers.indexOf('z');
    const groupIdx = headers.findIndex(h => h.includes('group') || h.includes('class') || h.includes('series') || h.includes('phase'));
    const seriesMap = new Map<string, { x: number, y: number, z?: number }[]>();
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].trim().split(',');
        if (parts.length < 2) continue;
        const x = parseFloat(parts[xIdx]), y = parseFloat(parts[yIdx]), z = zIdx !== -1 ? parseFloat(parts[zIdx]) : 0;
        const group = groupIdx !== -1 ? parts[groupIdx].trim() : 'Data';
        if (isNaN(x) || isNaN(y)) continue;
        if (!seriesMap.has(group)) seriesMap.set(group, []);
        seriesMap.get(group)?.push({ x, y, z });
    }
    const colors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];
    return Array.from(seriesMap.entries()).map(([name, data], i) => ({
        name, color: colors[i % colors.length], data
    }));
};

const Portal = ({ children }: { children?: React.ReactNode }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
};

const SidebarButtons = ({ 
    series, 
    hiddenSeries, 
    toggleSeries 
}: { 
    series: GraphSeries[], 
    hiddenSeries: Set<string>, 
    toggleSeries: (name: string) => void 
}) => (
    <div className="flex flex-col gap-3 w-full">
        <div className="text-[10px] font-bold font-sans text-theme-text/30 uppercase tracking-[0.2em] mb-2 border-b border-theme-border/10 pb-2">Series Console</div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-theme-border/10">
            {series.map(s => (
                <button
                    key={s.name}
                    onClick={() => toggleSeries(s.name)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-sans font-medium border transition-all text-left pointer-events-auto ${
                        hiddenSeries.has(s.name) 
                        ? 'bg-transparent border-theme-border/5 text-theme-text/20' 
                        : 'bg-theme-text/5 border-theme-border/20 text-theme-text/80 hover:bg-theme-text/10'
                    }`}
                >
                    <div className="relative flex items-center justify-center shrink-0">
                        {hiddenSeries.has(s.name) ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: s.color, color: s.color, opacity: hiddenSeries.has(s.name) ? 0.2 : 1 }}></span>
                    </div>
                    <span className="truncate">{s.name}</span>
                </button>
            ))}
        </div>
    </div>
);

const GraphScene = ({ 
    normalizedSeries, 
    originalSeries, 
    isExpanded, 
    theme,
    labels 
}: { 
    normalizedSeries: GraphSeries[], 
    originalSeries: GraphSeries[], 
    isExpanded: boolean, 
    theme: 'light' | 'dark',
    labels: { x: string, y: string, z: string }
}) => {
    const { raycaster } = useThree();
    const [hovered, setHovered] = useState<any>(null);

    // Increase the threshold for points so they are easier to hover
    useEffect(() => {
        if (raycaster.params.Points) {
            raycaster.params.Points.threshold = 0.15;
        }
    }, [raycaster]);

    const gridColor1 = theme === 'light' ? 0xdddddd : 0x333333;
    const gridColor2 = theme === 'light' ? 0xeeeeee : 0x111111;
    const textColor = theme === 'light' ? '#000000' : '#ffffff';

    return (
        <>
            <ambientLight intensity={theme === 'light' ? 0.8 : 0.5} />
            <pointLight position={[10, 10, 10]} intensity={theme === 'light' ? 1.0 : 1.0} />
            <OrbitControls makeDefault autoRotate={!isExpanded && !hovered} autoRotateSpeed={0.5} enableZoom={true} />
            
            <gridHelper args={[2, 10, gridColor1, gridColor2]} />
            <axesHelper args={[1.2]} />
            
            {/* Axis Labels */}
            <Text position={[1.3, 0.05, 0]} fontSize={0.1} color={textColor} anchorX="left" anchorY="middle" outlineWidth={0.01} outlineColor={theme === 'light' ? '#ffffff' : '#000000'}>
                {labels.x}
            </Text>
            <Text position={[0, 1.3, 0]} fontSize={0.1} color={textColor} anchorX="center" anchorY="bottom" outlineWidth={0.01} outlineColor={theme === 'light' ? '#ffffff' : '#000000'}>
                {labels.y}
            </Text>
            <Text position={[0, 0, 1.3]} fontSize={0.1} color={textColor} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor={theme === 'light' ? '#ffffff' : '#000000'}>
                {labels.z}
            </Text>

            <group>
                {normalizedSeries.map((s, i) => (
                    <points 
                        key={i}
                        onPointerMove={(e) => {
                            e.stopPropagation();
                            if (e.index !== undefined) {
                                const normPoint = s.data[e.index];
                                const original = originalSeries[i].data[e.index];
                                if (normPoint && original) {
                                    setHovered({
                                        ...original,
                                        s: s.name,
                                        c: s.color,
                                        pos: [normPoint.x, normPoint.y, normPoint.z || 0]
                                    });
                                }
                            }
                        }}
                        onPointerOut={() => setHovered(null)}
                    >
                        <bufferGeometry>
                            <bufferAttribute attach="attributes-position" count={s.data.length} array={new Float32Array(s.data.flatMap(p => [p.x, p.y, p.z || 0]))} itemSize={3} />
                        </bufferGeometry>
                        <pointsMaterial 
                            size={0.08} 
                            color={s.color} 
                            sizeAttenuation={true} 
                            transparent 
                            opacity={theme === 'light' ? 1.0 : 0.8} 
                            blending={theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending} 
                        />
                    </points>
                ))}
            </group>
            
            {hovered && (
                <Html position={hovered.pos} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                    <div className="bg-theme-bg/95 border border-theme-border/20 p-4 rounded-lg shadow-2xl backdrop-blur-md w-max transform -translate-x-1/2 -translate-y-[120%] pointer-events-none min-w-[120px]">
                        {/* Series Identity Header */}
                        <div className="flex items-center gap-2 border-b border-theme-border/10 pb-2 mb-2">
                             <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: hovered.c }}></div>
                             <span className="font-bold text-xs uppercase tracking-widest text-theme-text">{hovered.s}</span>
                        </div>
                        
                        {/* Coordinates */}
                        <div className="space-y-1 font-mono text-[10px]">
                            <div className="text-theme-text/60 flex justify-between gap-4"><span>{labels.x}:</span> <span className="text-theme-text font-bold">{hovered.x.toFixed(2)}</span></div>
                            <div className="text-theme-text/60 flex justify-between gap-4"><span>{labels.y}:</span> <span className="text-theme-text font-bold">{hovered.y.toFixed(2)}</span></div>
                            <div className="text-theme-text/60 flex justify-between gap-4"><span>{labels.z}:</span> <span className="text-theme-text font-bold">{(hovered.z || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                </Html>
            )}
        </>
    );
};

export const ThreeDGraph = ({ data, onExpandChange, theme }: { data: GraphData, onExpandChange?: (expanded: boolean) => void, theme: 'light' | 'dark' }) => {
    const [fetchedSeries, setFetchedSeries] = useState<GraphSeries[] | null>(null);
    const [loading, setLoading] = useState(!!data.csvUrl);
    const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (data.csvUrl) {
            fetch(data.csvUrl).then(res => res.text()).then(t => { setFetchedSeries(parseCSV(t)); setLoading(false); }).catch(() => setLoading(false));
        }
    }, [data.csvUrl]);

    useEffect(() => { if (onExpandChange) onExpandChange(isExpanded); }, [isExpanded, onExpandChange]);

    const series = useMemo(() => fetchedSeries || (data.csv ? parseCSV(data.csv) : data.series), [data, fetchedSeries]);
    const toggleSeries = (name: string) => setHiddenSeries(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name); else next.add(name);
        return next;
    });

    const { normalizedSeries, visibleSeries } = useMemo(() => {
        const visible = series.filter(s => !hiddenSeries.has(s.name));
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
        visible.forEach(s => s.data.forEach(p => {
            const z = p.z || 0;
            if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x;
            if(p.y < minY) minY = p.y; if(p.y > maxY) maxY = p.y;
            if(z < minZ) minZ = z; if(z > maxZ) maxZ = z;
        }));
        if (minX === Infinity) return { normalizedSeries: [], visibleSeries: [] };
        const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
        const scale = 2 / (Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1);
        return { 
            visibleSeries: visible,
            normalizedSeries: visible.map(s => ({ ...s, data: s.data.map(p => ({ x: (p.x - cx)*scale, y: (p.y - cy)*scale, z: ((p.z||0) - cz)*scale })) })) 
        };
    }, [series, hiddenSeries]);

    const labels = { x: data.xLabel, y: data.yLabel, z: data.zLabel || 'Z' };

    return (
        <>
            <motion.div layout className="my-16 select-none relative group pointer-events-auto">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-theme-text/40 font-sans font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                        <Box size={14} className="text-blue-500" /> {data.title}
                    </h4>
                    <button onClick={() => setIsExpanded(true)} className="p-2 hover:bg-theme-text/10 rounded-full transition-colors text-theme-text/30 hover:text-theme-text pointer-events-auto"><Maximize2 size={16} /></button>
                </div>
                <div className="w-full aspect-[2/1] bg-theme-text/5 rounded-xl overflow-hidden relative cursor-move border border-theme-border/10">
                    {loading && <div className="absolute inset-0 flex items-center justify-center bg-theme-bg/40"><Loader2 className={theme === 'light' ? 'text-black/20' : 'text-white/20'} /></div>}
                    {!loading && <Canvas camera={{ position: [2, 2, 2], fov: 50 }}><GraphScene normalizedSeries={normalizedSeries} originalSeries={visibleSeries} isExpanded={false} theme={theme} labels={labels} /></Canvas>}
                </div>
            </motion.div>
            <Portal>
                <AnimatePresence>
                    {isExpanded ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-theme-bg/95 backdrop-blur-3xl flex items-center justify-center p-8 md:p-16 lg:p-24 overflow-hidden pointer-events-auto" onClick={() => setIsExpanded(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="w-full max-w-[1440px] h-full max-h-[85vh] flex flex-col relative border border-theme-border/20 bg-theme-bg rounded-3xl shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center px-10 py-6 border-b border-theme-border/10 bg-theme-text/[0.02]">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[10px] font-sans font-bold text-theme-text/40 uppercase tracking-[0.4em]">3D Visualization Mode</span></div>
                                        <h2 className="text-2xl font-bold tracking-tighter text-theme-text">{data.title}</h2>
                                    </div>
                                    <button onClick={() => setIsExpanded(false)} className="p-3 hover:bg-theme-text/10 rounded-full text-theme-text/50 hover:text-theme-text transition-all bg-theme-text/5 border border-theme-border/10 group pointer-events-auto"><X size={20} className="group-hover:rotate-90 transition-transform duration-300" /></button>
                                </div>
                                <div className="flex-1 flex min-h-0">
                                    <div className="flex-1 relative p-8 flex items-center justify-center bg-theme-text/5">
                                        <div className="w-full h-full rounded-[2rem] overflow-hidden border border-theme-border/10 bg-theme-bg/5 shadow-2xl relative cursor-move">
                                            {!loading && <Canvas camera={{ position: [2, 2, 2], fov: 50 }}><GraphScene normalizedSeries={normalizedSeries} originalSeries={visibleSeries} isExpanded={true} theme={theme} labels={labels} /></Canvas>}
                                        </div>
                                    </div>
                                    <div className="hidden xl:flex w-[320px] border-l border-theme-border/10 bg-theme-text/[0.02] p-10 flex-col gap-10">
                                        <SidebarButtons series={series} hiddenSeries={hiddenSeries} toggleSeries={toggleSeries} />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </Portal>
        </>
    );
};

export const InteractiveGraph = ({ data, onExpandChange, theme }: { data: GraphData, onExpandChange?: (expanded: boolean) => void, theme: 'light' | 'dark' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const expandedContainerRef = useRef<HTMLDivElement>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const [hoverPoint, setHoverPoint] = useState<any>(null);
    const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
    const [fetchedSeries, setFetchedSeries] = useState<GraphSeries[] | null>(null);
    const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => { if (data.csvUrl) fetch(data.csvUrl).then(res => res.text()).then(t => setFetchedSeries(parseCSV(t))); }, [data.csvUrl]);
    useEffect(() => { if (onExpandChange) onExpandChange(isExpanded); }, [isExpanded, onExpandChange]);

    const series = useMemo(() => fetchedSeries || (data.csv ? parseCSV(data.csv) : data.series), [data, fetchedSeries]);
    const visibleSeries = useMemo(() => series.filter(s => !hiddenSeries.has(s.name)), [series, hiddenSeries]);
    const toggleSeries = (name: string) => setHiddenSeries(prev => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; });

    const isScatter = data.type === 'scatter';
    const isBar = data.type === 'bar';
    const isDist = data.type === 'distribution'; // PMF (Discrete)
    const isPdf = data.type === 'pdf'; // Continuous Density

    const { minX, maxX, minY, maxY } = useMemo(() => {
        let mix = Infinity, max = -Infinity, miy = Infinity, may = -Infinity;
        visibleSeries.forEach(s => s.data.forEach(p => { if (p.x < mix) mix = p.x; if (p.x > max) max = p.x; if (p.y < miy) miy = p.y; if (p.y > may) may = p.y; }));
        if (mix === Infinity) return { minX:0, maxX:1, minY:0, maxY:1 };

        let finalMinX, finalMaxX, finalMinY, finalMaxY;
        if (isBar || isDist) {
            // Discrete data centered on integers. Range [min-0.5, max+0.5]
            finalMinX = mix - 0.5;
            finalMaxX = max + 0.5;
            finalMinY = 0;
            finalMaxY = may * 1.1; 
        } else {
            const py = (may - miy) * 0.1 || 1;
            const px = (max - mix) * 0.05 || 1;
            finalMinX = mix - px;
            finalMaxX = max + px;
            finalMinY = isPdf ? 0 : miy - py;
            finalMaxY = may + py;
        }
        return { minX: finalMinX, maxX: finalMaxX, minY: finalMinY, maxY: finalMaxY };
    }, [visibleSeries, isBar, isDist, isPdf]);

    const width = 1000, height = 500, pad = 60;
    const toX = (v: number) => pad + ((v - minX) / (maxX - minX)) * (width - pad * 2);
    const toY = (v: number) => height - pad - ((v - minY) / (maxY - minY)) * (height - pad * 2);

    // Calculate baseline Y coordinate (where y=0). For bars/dist, this is the visual bottom axis.
    const yBase = (isBar || isDist) ? height - pad : toY(0);

    const xTicks = useMemo(() => {
        if (visibleSeries.length === 0) return [];
        if (isBar || isDist) {
            const values = new Set<number>();
            visibleSeries.forEach(s => s.data.forEach(p => values.add(p.x)));
            return Array.from(values).sort((a, b) => a - b);
        } else {
            if (minX === Infinity || maxX === -Infinity) return [];
            return [0, 0.25, 0.5, 0.75, 1].map(t => minX + t * (maxX - minX));
        }
    }, [visibleSeries, isBar, isDist, minX, maxX]);

    const yTicks = useMemo(() => {
        if (minY === Infinity || maxY === -Infinity) return [];
        const tickCount = 5;
        const step = (maxY - minY) / tickCount;
        return Array.from({length: tickCount + 1}).map((_, i) => minY + i * step);
    }, [minY, maxY]);

    const formatYTick = (val: number) => {
        if (val >= 1000) return (val/1000).toFixed(1) + 'k';
        if (Math.abs(val) < 10 && val % 1 !== 0) return val.toFixed(1);
        return Math.round(val).toString();
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        const target = isExpanded ? expandedContainerRef : containerRef;
        if (!target.current) return;
        const rect = target.current.getBoundingClientRect();
        
        // Coordinates relative to container
        const xRel = e.clientX - rect.left;
        const yRel = e.clientY - rect.top;
        setMousePos({ x: xRel, y: yRel });

        // Map to SVG coordinate space
        const svgX = xRel * (width / rect.width);
        const svgY = yRel * (height / rect.height);
        
        let bestP: any = null;
        let minXDist = Infinity;
        let minYDist = Infinity;
        
        visibleSeries.forEach(s => s.data.forEach(p => {
            const px = toX(p.x);
            const py = toY(p.y);
            
            // Screen space distance
            const dx = Math.abs(px - svgX);
            const dy = Math.abs(py - svgY);

            // Prioritize X proximity strongly (create a vertical "lane"), then tie-break with Y proximity.
            // A 2px tolerance for X is used to group points that are vertically aligned.
            if (dx < minXDist - 2) {
                // Found a significantly closer X column
                minXDist = dx;
                minYDist = dy;
                bestP = { ...p, s: s.name, c: s.color, px, py };
            } else if (dx <= minXDist + 2) {
                // Roughly same X column (e.g. multi-series line chart), check Y
                if (dy < minYDist) {
                    minYDist = dy;
                    minXDist = dx; // Update minXDist to match the closer point
                    bestP = { ...p, s: s.name, c: s.color, px, py };
                }
            }
        }));
        
        if (bestP) { setHoverX(bestP.x); setHoverPoint(bestP); }
    };

    const renderSVG = (ref: React.RefObject<HTMLDivElement>) => (
        <div ref={ref} className="w-full h-full cursor-crosshair relative pointer-events-auto flex items-center justify-center" onMouseMove={handleMouseMove} onMouseLeave={() => { setHoverX(null); setHoverPoint(null); setMousePos(null); }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible font-sans">
                {/* Y-Axis Grid & Labels */}
                {yTicks.map(val => (
                    <g key={`y-${val}`}>
                        <line x1={pad} y1={toY(val)} x2={width - pad} y2={toY(val)} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="6 6" className="text-theme-text" />
                        <text 
                            x={pad - 10} 
                            y={toY(val) + 4} 
                            textAnchor="end" 
                            fill="currentColor" 
                            fillOpacity={0.6} 
                            fontSize="11" 
                            fontWeight="500"
                            className="text-theme-text font-sans"
                        >
                            {formatYTick(val)}
                        </text>
                    </g>
                ))}

                {/* X-Axis Ticks & Labels */}
                {xTicks.map(val => {
                    const isActive = hoverX === val;
                    // Determine label logic
                    let label = (isBar || isDist) ? val.toString() : val.toFixed(1);
                    if (isBar) {
                        // Find the series that corresponds to this x value (assumes 1:1 mapping for categories)
                        const s = visibleSeries.find(ser => ser.data[0]?.x === val);
                        if (s) label = s.name.toUpperCase();
                    }

                    return (
                        <g key={`x-${val}`}>
                            <line 
                                x1={toX(val)} y1={yBase} 
                                x2={toX(val)} y2={yBase+6} 
                                stroke="currentColor" 
                                strokeOpacity={0.3} 
                                className="text-theme-text"
                            />
                            <text 
                                x={toX(val)} 
                                y={yBase+24} 
                                textAnchor="middle" 
                                fill="currentColor" 
                                fillOpacity={isActive ? 1 : 0.5} 
                                fontWeight={isActive ? "bold" : "500"}
                                fontSize="11" 
                                className="text-theme-text font-sans"
                            >
                                {label}
                            </text>
                            {/* Category Bin Snapping Box */}
                            {(isBar || isDist) && isActive && (
                                <motion.rect 
                                    initial={{ opacity: 0, scale: 0.8 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    x={toX(val) - 14} 
                                    y={yBase + 11} 
                                    width={28} 
                                    height={18} 
                                    fill={hoverPoint ? hoverPoint.c : "#f59e0b"} 
                                    fillOpacity={0.2}
                                    stroke={hoverPoint ? hoverPoint.c : "#f59e0b"}
                                    strokeWidth={1}
                                    rx={4}
                                />
                            )}
                        </g>
                    );
                })}
                
                <text x={width/2} y={height-15} textAnchor="middle" fill="currentColor" fillOpacity="0.4" fontSize="10" fontWeight="700" className="uppercase tracking-[0.4em] text-theme-text font-sans">{data.xLabel}</text>
                <text x={15} y={height/2} textAnchor="middle" fill="currentColor" fillOpacity="0.4" fontSize="10" fontWeight="700" className="uppercase tracking-[0.4em] text-theme-text font-sans" transform={`rotate(-90, 15, ${height/2})`}>{data.yLabel}</text>

                {visibleSeries.map(s => (
                    <g key={s.name}>
                        {isPdf && (
                            <motion.path 
                                d={s.data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`).join(' ')} 
                                fill="none" stroke={s.color} strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            />
                        )}
                        {isDist && s.data.map((p, i) => (
                            <g key={i}>
                                <motion.line 
                                    x1={toX(p.x)} y1={yBase} x2={toX(p.x)} y2={toY(p.y)} stroke={s.color} strokeWidth="2" strokeOpacity={hoverX === p.x ? 1 : 0.6}
                                    initial={{ y2: yBase }} animate={{ y2: toY(p.y) }}
                                />
                                <circle cx={toX(p.x)} cy={toY(p.y)} r={hoverX === p.x ? 5 : 3.5} fill={theme === 'light' ? '#ffffff' : '#000000'} stroke={s.color} strokeWidth="2" />
                            </g>
                        ))}
                        {isBar && s.data.map((p, i) => {
                            // Render bars as thick lines from yBase to value. 
                            // This ensures perfect alignment with the axis line (y1 = yBase).
                            const unitScreenW = (width - pad * 2) / (maxX - minX);
                            const bw = unitScreenW * 0.6; // 60% of bin width
                            return (
                                <motion.line 
                                    key={i} 
                                    x1={toX(p.x)} y1={yBase} 
                                    x2={toX(p.x)} y2={toY(p.y)} 
                                    stroke={s.color} 
                                    strokeWidth={bw}
                                    strokeOpacity={hoverX === p.x ? 0.9 : 0.6}
                                    strokeLinecap="butt"
                                    initial={{ y2: yBase }} 
                                    animate={{ y2: toY(p.y) }} 
                                />
                            );
                        })}
                        {isScatter && s.data.map((p, i) => (
                            <circle key={i} cx={toX(p.x)} cy={toY(p.y)} r={hoverX === p.x ? 7 : 5} fill={s.color} fillOpacity={0.6} stroke={s.color} strokeWidth={hoverX === p.x ? 2 : 0} />
                        ))}
                        {!isScatter && !isBar && !isDist && !isPdf && (
                            <motion.path 
                                d={s.data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`).join(' ')} 
                                fill="none" stroke={s.color} strokeWidth="3" initial={{ pathLength:0 }} animate={{ pathLength:1 }} 
                            />
                        )}
                    </g>
                ))}

                {/* X-Axis Main Line - Drawn LAST to ensure it renders on top of the bottom edge of bars */}
                <line x1={pad} y1={yBase} x2={width-pad} y2={yBase} stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" className="text-theme-text" />

                {/* Data point highlight circle */}
                {hoverPoint && (
                    <g>
                         <circle cx={hoverPoint.px} cy={hoverPoint.py} r={6} fill="rgb(var(--bg-rgb))" stroke={hoverPoint.c} strokeWidth="2.5" />
                    </g>
                )}
            </svg>
            
            {/* Tooltip tied to mouse position */}
            {hoverPoint && mousePos && (
                <div 
                    className="absolute bg-theme-bg/95 border border-theme-border/20 p-3 rounded-lg text-[10px] font-sans font-medium pointer-events-none z-10 shadow-2xl backdrop-blur-md" 
                    style={{ 
                        left: mousePos.x, 
                        top: mousePos.y - 20, 
                        transform: 'translate(-50%, -100%)' 
                    }}
                >
                    <div className="font-bold mb-1" style={{ color: hoverPoint.c }}>{hoverPoint.s}</div>
                    <div className="text-theme-text/60">X: {hoverPoint.x.toFixed(2)}</div>
                    <div className="text-theme-text/60">Y: {hoverPoint.y.toFixed(4)}</div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <motion.div layout className="my-16 select-none flex flex-col pointer-events-auto">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-theme-text/40 font-sans font-bold text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                        <Activity size={14} className={isPdf ? 'text-blue-500' : 'text-emerald-500'} /> {data.title}
                    </h4>
                    <button onClick={() => setIsExpanded(true)} className="p-2 hover:bg-theme-text/10 rounded-full transition-colors text-theme-text/30 hover:text-theme-text pointer-events-auto"><Maximize2 size={16} /></button>
                </div>
                <div className="w-full aspect-[2/1] bg-theme-text/5 rounded-xl overflow-hidden border border-theme-border/5 p-8 flex items-center justify-center">
                    {renderSVG(containerRef)}
                </div>
            </motion.div>
            <Portal>
                <AnimatePresence>
                    {isExpanded ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-theme-bg/95 backdrop-blur-3xl flex items-center justify-center p-8 md:p-16 lg:p-24 overflow-hidden pointer-events-auto" onClick={() => setIsExpanded(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="w-full max-w-[1440px] h-full max-h-[85vh] flex flex-col relative border border-theme-border/20 bg-theme-bg rounded-3xl shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center px-10 py-6 border-b border-theme-border/10 bg-theme-text/[0.02]">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[10px] font-sans font-bold text-theme-text/40 uppercase tracking-[0.4em]">Interactive Analytics View</span></div>
                                        <h2 className="text-2xl font-bold tracking-tighter text-theme-text">{data.title}</h2>
                                    </div>
                                    <button onClick={() => setIsExpanded(false)} className="p-3 hover:bg-theme-text/10 rounded-full text-theme-text/50 hover:text-theme-text transition-all bg-theme-text/5 border border-theme-border/10 group pointer-events-auto"><X size={20} className="group-hover:rotate-90 transition-transform duration-300" /></button>
                                </div>
                                <div className="flex-1 flex min-h-0">
                                    <div className="flex-1 relative p-8 flex items-center justify-center bg-theme-text/5">
                                        <div className="w-full h-full rounded-[2rem] overflow-hidden border border-theme-border/10 bg-theme-bg/5 shadow-inner flex items-center justify-center p-12">
                                            {renderSVG(expandedContainerRef)}
                                        </div>
                                    </div>
                                    <div className="hidden xl:flex w-[320px] border-l border-theme-border/10 bg-theme-text/[0.02] p-10 flex-col gap-10">
                                        <SidebarButtons series={series} hiddenSeries={hiddenSeries} toggleSeries={toggleSeries} />
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </Portal>
        </>
    );
};
