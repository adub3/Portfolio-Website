
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Terminal, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { posts } from './data';
import { ThreeDGraph, InteractiveGraph } from './PlotComponents';

const BlogPage = ({ onPostSelect, onGraphExpand, theme }: { onPostSelect?: (id: string | null) => void, onGraphExpand?: (expanded: boolean) => void, theme: 'light' | 'dark' }) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (onPostSelect) onPostSelect(selectedPostId);
  }, [selectedPostId, onPostSelect]);

  const currentIndex = posts.findIndex(p => p.id === selectedPostId);
  const selectedPost = posts[currentIndex];
  const newerPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const olderPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 relative z-20 bg-transparent">
        <div className="max-w-[1200px] mx-auto relative z-10">
            <AnimatePresence mode="wait">
                {selectedPost ? (
                    <motion.div key={selectedPost.id} initial={{ opacity: 0, y: 20, filter: "blur(15px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -20, filter: "blur(15px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                        <button onClick={() => setSelectedPostId(null)} className="group flex items-center gap-2 text-theme-text/50 hover:text-theme-text mb-12 uppercase tracking-widest text-xs font-bold transition-all pointer-events-auto"><ArrowLeft size={16} /> Back to Index</button>
                        <div className="max-w-4xl mx-auto">
                            <div className="flex gap-4 mb-6 text-xs font-bold uppercase tracking-widest border-b border-theme-border/10 pb-6"><span className="text-theme-text/50">{selectedPost.date}</span><span className="text-theme-text/30">/</span><span className="text-theme-text">{selectedPost.tag}</span><span className="text-theme-text/30 ml-auto">{selectedPost.readTime}</span></div>
                            <h1 className="text-4xl md:text-6xl font-bold text-theme-text mb-16 leading-tight tracking-tight">{selectedPost.title}</h1>
                            <div className="space-y-12">
                                {selectedPost.content.map((block, idx) => {
                                    switch(block.type) {
                                        case 'paragraph': return <p key={idx} className="text-lg md:text-xl text-theme-text font-light leading-relaxed">{block.text}</p>;
                                        case 'header': return <h3 key={idx} className="text-2xl md:text-3xl font-bold text-theme-text mt-16 mb-6 tracking-tight">{block.text}</h3>;
                                        case 'code': return <div key={idx} className="my-8 rounded-lg overflow-hidden bg-theme-text/5 border border-theme-border/10"><div className="bg-theme-text/5 px-4 py-2 flex items-center justify-between border-b border-theme-border/5"><span className="text-xs font-mono text-theme-text/40 uppercase">{block.lang}</span><Terminal size={14} className="text-theme-text/20" /></div><pre className="p-6 overflow-x-auto"><code className="font-mono text-sm text-theme-text/80 leading-relaxed">{block.code}</code></pre></div>;
                                        case 'graph': return <React.Fragment key={idx}>{block.data.type === '3d-scatter' ? <ThreeDGraph data={block.data} onExpandChange={onGraphExpand} theme={theme} /> : <InteractiveGraph data={block.data} onExpandChange={onGraphExpand} />}</React.Fragment>;
                                        case 'table': return (
                                            <div key={idx} className="my-12 w-full border border-theme-border/10 rounded-lg overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-theme-text/5 border-b border-theme-border/10">
                                                                {block.data.headers.map((header, i) => (
                                                                    <th key={i} className="px-6 py-4 text-xs font-bold text-theme-text uppercase tracking-widest whitespace-nowrap">
                                                                        {header}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-theme-border/5">
                                                            {block.data.rows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="group hover:bg-theme-text/5 transition-colors">
                                                                    {row.map((cell, cIdx) => (
                                                                        <td key={cIdx} className="px-6 py-4 text-sm text-theme-text/70 border-r border-theme-border/5 last:border-r-0 whitespace-nowrap">
                                                                            {cell}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {block.data.caption && (
                                                    <div className="px-6 py-3 bg-theme-text/[0.02] border-t border-theme-border/10 text-xs text-theme-text/40 uppercase tracking-widest">
                                                        Figure: {block.data.caption}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                        default: return null;
                                    }
                                })}
                            </div>
                            <div className="mt-24 pt-12 border-t border-theme-border/10 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-theme-text/40">
                                {newerPost && <button onClick={() => setSelectedPostId(newerPost.id)} className="hover:text-theme-text transition-colors pointer-events-auto">Newer: {newerPost.title}</button>}
                                {olderPost && <button onClick={() => setSelectedPostId(olderPost.id)} className="ml-auto hover:text-theme-text transition-colors pointer-events-auto">Older: {olderPost.title}</button>}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="mb-24 opacity-0 animate-fade-in delay-500">
                            <h1 className="text-7xl md:text-[9rem] font-bold mb-8 tracking-tighter text-theme-text leading-[0.8]">Field<br/><span className="text-theme-text/30">Notes</span></h1>
                            <p className="text-xl text-theme-text/60 max-w-lg font-mono text-sm uppercase tracking-widest mt-8 border-t border-theme-border/20 pt-4">Thoughts on simulation and research.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-16">
                            {posts.map((post, i) => (
                                <article key={i} className="group relative border-t border-theme-border/10 pt-12 transition-all duration-500 hover:border-theme-text/60 opacity-0 animate-fade-in" style={{ animationDelay: `${700 + i * 150}ms` }}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 group-hover:translate-x-6 transition-transform">
                                        <div className="md:col-span-3 flex flex-col gap-2"><time className="text-sm font-mono text-theme-text/50">{post.date}</time><span className="text-xs font-bold text-theme-text uppercase tracking-widest">{post.tag}</span></div>
                                        <div className="md:col-span-6"><h2 onClick={() => setSelectedPostId(post.id)} className="text-3xl md:text-4xl font-bold text-theme-text mb-4 cursor-pointer hover:underline underline-offset-8 transition-all pointer-events-auto">{post.title}</h2><p className="text-lg text-theme-text/60 font-light leading-relaxed">{post.excerpt}</p></div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default BlogPage;
