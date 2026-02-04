/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Page = 'home' | 'work' | 'writing';

export type ContentBlock = 
  | { type: 'paragraph'; text: string }
  | { type: 'header'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; caption: string };

export interface Post {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tag: string;
    content: ContentBlock[];
}

export interface Project {
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
