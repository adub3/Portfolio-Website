/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ArrowUpRight, ArrowLeft, Terminal, ImageIcon } from 'lucide-react';
import { posts } from './data';

const BlogPage = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div className="min-h-screen pt-40 pb-20 px-4 md:px-12 relative z-20 bg-[#0a0a0a]">
        
        {/* Paper texture column on the right for visual interest (Fan Ho style split) */}
        <div className="fixed right-0 top-0 bottom-0 w-[15vw] bg-[#f5f0e1] opacity-5 pointer-events-none hidden md:block"></div>
        <div className="fixed right-[15vw] top-0 bottom-0 w-[1px] bg-white/10 hidden md:block"></div>

        <div className="max-w-[1200px] mx-auto relative z-10">
            
            {selectedPost ? (
                // ARTICLE VIEW
                <div>
                    <button 
                        onClick={() => setSelectedPostId(null)}
                        className="group flex items-center gap-2 text-white/50 hover:text-white mb-12 uppercase tracking-widest text-xs font-bold transition-all cursor-pointer hover:translate-x-[-4px] opacity-0 animate-fade-in delay-500"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Index
                    </button>
                    
                    <div className="max-w-4xl mx-auto opacity-0 animate-fade-in delay-700">
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
                    {/* Title Section - Increased Delay */}
                    <div className="mb-24 opacity-0 animate-fade-in delay-700">
                        <h1 className="text-7xl md:text-[9rem] font-bold mb-8 tracking-tighter text-white leading-[0.8]">
                            Field<br/><span className="text-white/30">Notes</span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-lg font-mono text-sm uppercase tracking-widest mt-8 border-t border-white/20 pt-4">
                            Thoughts on simulation, systems programming, and model interpretability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-16">
                        {posts.map((post, i) => (
                            <article 
                                key={i} 
                                className="group relative border-t border-white/10 pt-12 transition-all duration-500 hover:border-white/60 opacity-0 animate-fade-in"
                                // Base delay 1000ms + stagger
                                style={{ animationDelay: `${1000 + i * 150}ms` }}
                            >
                                
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
                    
                    <div className="mt-32 text-center border-t border-white/10 pt-12 opacity-0 animate-fade-in delay-1500">
                        <p className="text-white/30 text-sm font-mono">End of Feed</p>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default BlogPage;