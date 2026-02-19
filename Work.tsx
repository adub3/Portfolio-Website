
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ArrowUpRight, ArrowLeft, ExternalLink, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { projects } from './data';

const WorkPage = ({ 
    selectedProjectId, 
    setSelectedProjectId,
    onGraphExpand
}: { 
    selectedProjectId: string | null, 
    setSelectedProjectId: (id: string | null) => void,
    onGraphExpand?: (expanded: boolean) => void
}) => {
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // List View Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.5
        }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const headerVariants = {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  // Detail View Variants
  const detailVariants = {
      hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      exit: { opacity: 0, y: -30, filter: "blur(10px)", transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 relative z-20 bg-transparent">
      <div className="max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {selectedProject ? (
              <motion.div 
                key="detail"
                variants={detailVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative z-50"
              >
                  <button onClick={() => setSelectedProjectId(null)} className="group flex items-center gap-2 text-theme-text/50 hover:text-theme-text mb-12 uppercase tracking-widest text-xs font-bold transition-all"><ArrowLeft size={16} /> Back to Projects</button>
                  <div className="border-b border-theme-border/20 pb-12 mb-12">
                       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                           <div>
                              <span className="text-emerald-500 font-mono uppercase tracking-widest text-sm mb-4 block">{selectedProject.type} /// {selectedProject.year}</span>
                              <h1 className="text-5xl md:text-8xl font-bold text-theme-text tracking-tighter leading-none">{selectedProject.title}</h1>
                           </div>
                           <div className="flex flex-wrap gap-2 md:justify-end">
                               {selectedProject.tags.map(tag => <span key={tag} className="border border-theme-border/20 px-3 py-1 text-theme-text/60 text-xs uppercase tracking-wider rounded-full">{tag}</span>)}
                           </div>
                       </div>
                       <p className="text-2xl text-theme-text max-w-3xl font-light leading-relaxed">{selectedProject.description}</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                      <div className="lg:col-span-2 space-y-12">
                          <div><h3 className="text-theme-text text-lg font-bold uppercase tracking-widest mb-6 border-l-2 border-theme-text pl-4">About the Project</h3><p className="text-lg text-theme-text leading-relaxed font-serif whitespace-pre-wrap">{selectedProject.longDescription}</p></div>
                          <div className="w-full h-[400px] bg-theme-text/5 border border-theme-border/10 rounded-lg flex flex-col items-center justify-center gap-4 group hover:bg-theme-text/10 transition-colors"><Layers size={48} className="text-theme-text/20 group-hover:text-theme-text/40" /><span className="font-mono text-theme-text/30 text-sm">Interactive Visualization Component</span></div>
                      </div>
                      <div className="space-y-12">
                          <div className="bg-theme-text/5 p-8 border border-theme-border/10 backdrop-blur-sm"><h4 className="text-theme-text/50 text-xs font-mono uppercase tracking-widest mb-8">Key Metrics</h4><div className="space-y-8">{selectedProject.stats.map((stat, i) => <div key={i}><div className="text-4xl font-bold text-theme-text mb-1">{stat.value}</div><div className="text-sm text-theme-text/40 font-mono">{stat.label}</div></div>)}</div></div>
                          <div><h4 className="text-theme-text/50 text-xs font-mono uppercase tracking-widest mb-4">Role</h4><p className="text-theme-text text-lg">{selectedProject.role}</p></div>
                          <button className="w-full py-4 bg-theme-text text-theme-bg font-bold uppercase tracking-widest hover:opacity-80 transition-colors flex items-center justify-center gap-3 group">Launch Case Study <ExternalLink size={16} /></button>
                      </div>
                  </div>
              </motion.div>
          ) : (
              <motion.div 
                key="list" 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                  <motion.div variants={headerVariants} className="mb-32">
                      <h1 className="text-7xl md:text-[10rem] font-bold mb-8 tracking-tighter text-theme-text leading-[0.8]">Selected<br/><span className="text-theme-text/50">Projects</span></h1>
                      <p className="text-xl md:text-2xl text-theme-text max-w-xl font-light italic font-serif mt-12 border-l border-theme-border/30 pl-6">Mapping the trajectory of my research in stochastic modeling, high-performance computing, and game-theoretic optimization.</p>
                  </motion.div>
                  <div className="space-y-12">
                  {projects.map((project, i) => (
                      <motion.div 
                        key={project.id} 
                        variants={itemVariants}
                        onClick={() => setSelectedProjectId(project.id)} 
                        className="group cursor-pointer relative border-t border-theme-border/20 py-12 hover:border-theme-text transition-colors duration-500"
                      >
                          <div className="absolute inset-0 bg-gradient-to-r from-theme-text/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                          <div className="flex flex-col md:flex-row gap-8 md:gap-0">
                              <div className="md:w-[15%] flex flex-row md:flex-col gap-2 md:gap-1 items-baseline md:items-start"><span className="text-xs font-bold text-theme-text/50 tracking-widest uppercase">{project.month}</span><span className="text-3xl md:text-4xl font-light text-theme-text/80 font-mono">{project.year}</span></div>
                              <div className="md:w-[60%] md:pr-12">
                                  <div className="flex items-baseline gap-4 mb-4"><span className="font-mono text-xs text-theme-text/30">0{i + 1}</span><h2 className="text-3xl md:text-5xl font-bold text-theme-text tracking-tight flex items-center gap-4">{project.title}<ArrowUpRight size={24} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-theme-text/50" /></h2></div>
                                  <p className="text-lg md:text-xl text-theme-text/90 group-hover:text-theme-text leading-relaxed font-light max-w-2xl">{project.description}</p>
                              </div>
                              <div className="md:w-[25%] flex flex-col justify-between items-start md:items-end border-l md:border-l-0 border-theme-border/10 pl-6 md:pl-0">
                                  <div className="text-right mb-4"><div className="text-xs text-theme-text/30 uppercase tracking-widest mb-1">Type</div><div className="text-theme-text font-medium">{project.type}</div></div>
                                  <div className="flex flex-wrap justify-end gap-2">{project.tags.map(tag => <span key={tag} className="text-xs border border-theme-border/20 px-2 py-1 text-theme-text/60 transition-colors">{tag}</span>)}</div>
                              </div>
                          </div>
                      </motion.div>
                  ))}
                  </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkPage;
