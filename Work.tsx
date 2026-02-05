/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ArrowUpRight, ArrowLeft, ExternalLink, Layers } from 'lucide-react';
import { projects } from './data';

const WorkPage = ({ 
    selectedProjectId, 
    setSelectedProjectId 
}: { 
    selectedProjectId: string | null, 
    setSelectedProjectId: (id: string | null) => void 
}) => {
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 relative z-20 bg-[#0a0a0a]">
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="absolute right-[25%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
          <div className="absolute left-[15%] top-0 bottom-0 w-[1px] bg-white/20 hidden md:block"></div>
      </div>
      
      <div className="max-w-[1600px] mx-auto">
        
        {selectedProject ? (
            // === PROJECT DETAIL VIEW ===
            <div className="relative z-50">
                <button 
                    onClick={() => setSelectedProjectId(null)}
                    className="group flex items-center gap-2 text-white/50 hover:text-white mb-12 uppercase tracking-widest text-xs font-bold transition-all cursor-pointer hover:translate-x-[-4px] opacity-0 animate-fade-in delay-500"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Index
                </button>

                {/* Header - Increased Delay */}
                <div className="border-b border-white/20 pb-12 mb-12 opacity-0 animate-fade-in delay-700">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 opacity-0 animate-fade-in delay-1000">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <h3 className="text-white text-lg font-bold uppercase tracking-widest mb-6 border-l-2 border-white pl-4">About the Project</h3>
                            <p className="text-lg text-white/70 leading-relaxed font-serif whitespace-pre-wrap">
                                {selectedProject.longDescription}
                            </p>
                        </div>

                        {/* Visual Component */}
                        {selectedProject.image ? (
                            <div className="w-full h-auto bg-black border border-white/10 rounded-lg overflow-hidden">
                                <img 
                                    src={selectedProject.image} 
                                    alt={selectedProject.title} 
                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-500"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-[400px] bg-white/5 border border-white/10 rounded-lg flex flex-col items-center justify-center gap-4 group hover:bg-white/10 transition-colors cursor-default">
                                <Layers size={48} className="text-white/20 group-hover:text-white/40 transition-colors" />
                                <span className="font-mono text-white/30 text-sm">Interactive Visualization Component</span>
                            </div>
                        )}
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
            <div>
                {/* Title Section - Increased Delay */}
                <div className="mb-32 relative pl-4 md:pl-0 opacity-0 animate-fade-in delay-700">
                    <h1 className="text-7xl md:text-[10rem] font-bold mb-8 tracking-tighter text-white z-10 relative leading-[0.8]">
                    Selected<br/><span className="text-white/50">Index</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 max-w-xl font-light italic font-serif mt-12 border-l border-white/30 pl-6">
                    A collection of computational studies in optimization, stochastic dynamics, and machine learning architectures.
                    </p>
                </div>

                {/* Project Table Header */}
                <div className="hidden md:flex text-xs font-mono text-white/30 tracking-widest uppercase mb-4 border-b border-white/10 pb-2 opacity-0 animate-fade-in delay-1000">
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
                        }}
                        className="group cursor-pointer relative border-t border-white/20 py-12 hover:border-white transition-colors duration-500 opacity-0 animate-fade-in"
                        // Base delay of 1000ms (to come after title) + stagger
                        style={{ animationDelay: `${1000 + i * 150}ms` }}
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
                
                <div className="mt-48 py-20 border-t border-white text-center relative overflow-hidden opacity-0 animate-fade-in delay-1500">
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

export default WorkPage;