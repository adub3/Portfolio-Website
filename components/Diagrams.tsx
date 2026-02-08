/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

// --- 3D Surface Plot Component ---

interface SurfacePlotProps {
    equation: (x: number, z: number) => number;
    range?: number;
    segments?: number;
    colorA?: string;
    colorB?: string;
}

const SurfaceMesh = ({ 
    equation, 
    range = 10, 
    segments = 100, 
    colorA = '#1d4ed8', // Blue
    colorB = '#10b981'  // Emerald
}: SurfacePlotProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => new THREE.PlaneGeometry(range, range, segments, segments), [range, segments]);
    
    // Generate colors and heights
    const { positions, colors } = useMemo(() => {
        const count = geometry.attributes.position.count;
        const pos = geometry.attributes.position;
        const cols = new Float32Array(count * 3);
        const c1 = new THREE.Color(colorA);
        const c2 = new THREE.Color(colorB);
        const tempColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const z = pos.getY(i); // Plane is initially X/Y
            // Calculate height
            const y = equation(x, z);
            
            // Update Z (which is Up in our rotated mesh, or Y in world)
            pos.setZ(i, y);

            // Color based on height
            // Normalize y (assuming approx -2 to 2 range for trig functions)
            const t = (y + 2) / 4; 
            tempColor.lerpColors(c1, c2, Math.max(0, Math.min(1, t)));
            
            cols[i * 3] = tempColor.r;
            cols[i * 3 + 1] = tempColor.g;
            cols[i * 3 + 2] = tempColor.b;
        }
        
        geometry.computeVertexNormals();
        return { positions: pos, colors: cols };
    }, [equation, geometry, colorA, colorB]);

    // Animate rotation
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.z += 0.002;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <primitive object={geometry} attach="geometry" />
            <meshStandardMaterial 
                vertexColors 
                side={THREE.DoubleSide} 
                wireframe={true} // Wireframe looks more "data-sciency"
                transparent
                opacity={0.8}
            />
        </mesh>
    );
};

export const SurfacePlot = (props: SurfacePlotProps) => {
    return (
        <div className="w-full h-[400px] cursor-move">
            <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <SurfaceMesh {...props} />
                <OrbitControls enableZoom={false} />
                <gridHelper args={[20, 20, 0x333333, 0x111111]} />
            </Canvas>
        </div>
    );
};
