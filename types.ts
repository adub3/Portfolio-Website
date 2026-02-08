

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Page = 'home' | 'work' | 'writing';

export interface GraphPoint {
    x: number;
    y: number;
    z?: number; 
}

export interface GraphSeries {
    name: string;
    color: string;
    type?: 'line' | 'scatter' | '3d-scatter' | 'bar' | 'distribution' | 'pdf'; 
    data: GraphPoint[];
}

export interface GraphData {
    title: string;
    xLabel: string;
    yLabel: string;
    zLabel?: string; 
    type?: 'line' | 'scatter' | '3d-scatter' | 'bar' | 'distribution' | 'pdf';
    csv?: string; 
    csvUrl?: string; 
    series: GraphSeries[];
}

export interface TableData {
    headers: string[];
    rows: string[][];
    caption?: string;
}

export type ContentBlock = 
  | { type: 'paragraph'; text: string }
  | { type: 'header'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'image'; caption: string }
  | { type: 'graph'; data: GraphData }
  | { type: 'table'; data: TableData };

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