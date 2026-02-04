/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Dust Motes (Three.js) - Simulates dust floating in light shafts
export const DustParticles = () => {
  const count = 1500;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  const colorLight = useMemo(() => new THREE.Color('#f5f0e1'), []);
  const colorDark = useMemo(() => new THREE.Color('#333333'), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      const x = (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10;
      const y = (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10;
      const z = (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10;

      dummy.position.set(x, y, z);
      const scale = (s + 2) * 0.04;
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      mesh.current!.setMatrixAt(i, dummy.matrix);

      const boundaryVal = x * 0.96 + y * 0.26;
      const alpha = Math.max(0, Math.min(1, (boundaryVal + 5) / 10)); 
      
      tempColor.lerpColors(colorDark, colorLight, alpha);
      mesh.current!.setColorAt(i, tempColor);
    });
    
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
};

// 2. Neural Network - Interactions: Freeze/Kill Nodes, Break Lines
export const NeuralNetworkEffect = () => {
  const count = 60; // Back to 60
  const radius = 10; 
  
  // Colors
  const colorBlue = useMemo(() => new THREE.Color('#1d4ed8'), []); // Back
  const colorWhite = useMemo(() => new THREE.Color('#ffffff'), []); // Mid
  const colorGreen = useMemo(() => new THREE.Color('#10b981'), []); // Front
  const colorRed = useMemo(() => new THREE.Color('#ef4444'), []);   // Hit
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Particle State
  // [x, y, z, vx, vy, vz, state(0=alive, 1=dying), hitTime]
  const particles = useMemo(() => {
    const data = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
        data[i*8] = (Math.random() - 0.5) * radius * 2;   // x
        data[i*8+1] = (Math.random() - 0.5) * radius * 1.5; // y
        data[i*8+2] = (Math.random() - 0.5) * 8; // z (-4 to 4)
        
        data[i*8+3] = (Math.random() - 0.5) * 0.01; // vx
        data[i*8+4] = (Math.random() - 0.5) * 0.01; // vy
        data[i*8+5] = (Math.random() - 0.5) * 0.01; // vz
        
        data[i*8+6] = 0; // state: 0=alive
        data[i*8+7] = 0; // hitTime
    }
    return data;
  }, []);

  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const maxConnections = count * count;
  const linePositions = useMemo(() => new Float32Array(maxConnections * 12), []);
  const lineColors = useMemo(() => new Float32Array(maxConnections * 12), []);
  const pointPositions = useMemo(() => new Float32Array(count * 3), []);
  const pointColors = useMemo(() => new Float32Array(count * 3), []);

  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  
  // Reusable vectors for calc
  const vec3 = useMemo(() => new THREE.Vector3(), []);
  const vec3_2 = useMemo(() => new THREE.Vector3(), []);
  const vec3_onSegment = useMemo(() => new THREE.Vector3(), []);

  // Track broken lines: "idx1-idx2" -> { brokenAt: time, ratio: 0..1 }
  const brokenRef = useRef(new Map<string, { brokenAt: number, ratio: number }>());

  useFrame((state) => {
    const { pointer, clock } = state;
    const now = clock.elapsedTime;
    
    // 1. Raycaster
    raycaster.setFromCamera(pointer, camera);
    const ray = raycaster.ray;

    const POINT_HIT_SQ = 0.4 * 0.4; 
    const FADE_DURATION = 0.5; // Time to fade out
    const RESPAWN_TIME = 3.0; // Time to stay dead

    // --- PARTICLES ---
    for (let i = 0; i < count; i++) {
        const idx = i * 8;
        
        let x = particles[idx];
        let y = particles[idx+1];
        let z = particles[idx+2];
        let vx = particles[idx+3];
        let vy = particles[idx+4];
        let vz = particles[idx+5];
        let status = particles[idx+6];
        let hitTime = particles[idx+7];

        // 1. STATE LOGIC
        if (status === 0) {
            // Check for Hit
            vec3.set(x, y, z);
            const distSq = ray.distanceSqToPoint(vec3);
            
            if (distSq < POINT_HIT_SQ) {
                // Trigger Death
                status = 1;
                hitTime = now;
                vx = 0; vy = 0; vz = 0; // Freeze immediately
            } else {
                // Physics: Brownian Motion
                if (x > radius) vx -= 0.0002;
                else if (x < -radius) vx += 0.0002;
                if (y > radius * 0.8) vy -= 0.0002;
                else if (y < -radius * 0.8) vy += 0.0002;
                if (z > 4) vz -= 0.0002;
                else if (z < -4) vz += 0.0002;
            }
        } else if (status === 1) {
            // Dying logic
            vx = 0; vy = 0; vz = 0; // Ensure frozen
            
            const age = now - hitTime;
            if (age > RESPAWN_TIME) {
                // Respawn
                status = 0;
                x = (Math.random() - 0.5) * radius * 2;
                y = (Math.random() - 0.5) * radius * 1.5;
                z = (Math.random() - 0.5) * 8;
                vx = (Math.random() - 0.5) * 0.01;
                vy = (Math.random() - 0.5) * 0.01;
                vz = (Math.random() - 0.5) * 0.01;
            }
        }

        // Apply Velocity (0 if dying)
        x += vx;
        y += vy;
        z += vz;

        particles[idx] = x;
        particles[idx+1] = y;
        particles[idx+2] = z;
        particles[idx+3] = vx;
        particles[idx+4] = vy;
        particles[idx+5] = vz;
        particles[idx+6] = status;
        particles[idx+7] = hitTime;

        // Visuals
        pointPositions[i*3] = x;
        pointPositions[i*3+1] = y;
        pointPositions[i*3+2] = z;

        if (status === 1) {
             const age = now - hitTime;
             // Calculate life based on FADE_DURATION only
             // If age > FADE_DURATION, life is 0 (invisible) until RESPAWN_TIME triggers
             const life = Math.max(0, 1 - (age / FADE_DURATION));
             
             // Flash Red then fade out
             tempColor.set(colorRed);
             pointColors[i*3] = tempColor.r * life;
             pointColors[i*3+1] = tempColor.g * life;
             pointColors[i*3+2] = tempColor.b * life;
        } else {
             // Normal Depth Coloring
             const t = Math.max(0, Math.min(1, (z + 4) / 8));
             
             // Kept the lower threshold to maximize green nodes as requested
             const threshold = 0.2; 

             if (t < threshold) {
                 // 0 to 0.2 -> Blue to White
                 tempColor.lerpColors(colorBlue, colorWhite, t / threshold);
             } else {
                 // 0.2 to 1.0 -> White to Green
                 tempColor.lerpColors(colorWhite, colorGreen, (t - threshold) / (1 - threshold));
             }
             
             pointColors[i*3] = tempColor.r;
             pointColors[i*3+1] = tempColor.g;
             pointColors[i*3+2] = tempColor.b;
        }
    }

    // --- LINES ---
    let vertexIndex = 0;
    const LINE_HIT_SQ = 0.2 * 0.2; 
    const BREAK_DURATION = 0.4; 
    const COOLDOWN = 2.0;

    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const xi = pointPositions[i*3]; const yi = pointPositions[i*3+1]; const zi = pointPositions[i*3+2];
            const xj = pointPositions[j*3]; const yj = pointPositions[j*3+1]; const zj = pointPositions[j*3+2];

            // Optimization: Skip long lines
            const dx = xi - xj;
            const dy = yi - yj;
            const dz = zi - zj;
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq > 16) continue;

            // Skip lines if both points are effectively dead (near black)
            // This ensures lines disappear completely while nodes are waiting to respawn
            if ((pointColors[i*3] + pointColors[i*3+1] + pointColors[i*3+2] < 0.01) && 
                (pointColors[j*3] + pointColors[j*3+1] + pointColors[j*3+2] < 0.01)) continue;

            const key = `${i}-${j}`;
            let brokenState = brokenRef.current.get(key);
            
            // Cleanup broken state
            if (brokenState && (now - brokenState.brokenAt > COOLDOWN)) {
                brokenRef.current.delete(key);
                brokenState = undefined;
            }

            // Check if line should break
            if (!brokenState) {
                vec3.set(xi, yi, zi);
                vec3_2.set(xj, yj, zj);
                
                const distToRay = ray.distanceSqToSegment(vec3, vec3_2, undefined, vec3_onSegment);
                
                if (distToRay < LINE_HIT_SQ) {
                    const totalLen = Math.sqrt(distSq);
                    const distFromStart = vec3.distanceTo(vec3_onSegment);
                    const ratio = Math.max(0.01, Math.min(0.99, distFromStart / totalLen));
                    
                    brokenState = { brokenAt: now, ratio };
                    brokenRef.current.set(key, brokenState);
                }
            }

            // --- DRAWING ---
            // Gradient between the two points. If a point is dying (fading to black), the line fades at that end.
            const r1 = pointColors[i*3];
            const g1 = pointColors[i*3+1];
            const b1 = pointColors[i*3+2];
            
            const r2 = pointColors[j*3];
            const g2 = pointColors[j*3+1];
            const b2 = pointColors[j*3+2];

            if (brokenState) {
                const age = now - brokenState.brokenAt;
                
                if (age < BREAK_DURATION) {
                    const progress = age / BREAK_DURATION;
                    const ease = 1 - Math.pow(1 - progress, 3);
                    const shrink = 1 - ease;
                    const t = brokenState.ratio;

                    // Segment 1
                    const t1 = t * shrink;
                    linePositions[vertexIndex] = xi;
                    linePositions[vertexIndex+1] = yi;
                    linePositions[vertexIndex+2] = zi;
                    linePositions[vertexIndex+3] = xi + (xj-xi)*t1;
                    linePositions[vertexIndex+4] = yi + (yj-yi)*t1;
                    linePositions[vertexIndex+5] = zi + (zj-zi)*t1;
                    
                    lineColors[vertexIndex] = r1; lineColors[vertexIndex+1] = g1; lineColors[vertexIndex+2] = b1;
                    // Midpoint color approximation (simplification: same as start)
                    lineColors[vertexIndex+3] = r1; lineColors[vertexIndex+4] = g1; lineColors[vertexIndex+5] = b1;
                    vertexIndex += 6;

                    // Segment 2
                    const t2 = (1 - t) * shrink;
                    linePositions[vertexIndex] = xj;
                    linePositions[vertexIndex+1] = yj;
                    linePositions[vertexIndex+2] = zj;
                    linePositions[vertexIndex+3] = xj + (xi-xj)*t2;
                    linePositions[vertexIndex+4] = yj + (yi-yj)*t2;
                    linePositions[vertexIndex+5] = zj + (zi-zj)*t2;
                    
                    lineColors[vertexIndex] = r2; lineColors[vertexIndex+1] = g2; lineColors[vertexIndex+2] = b2;
                    lineColors[vertexIndex+3] = r2; lineColors[vertexIndex+4] = g2; lineColors[vertexIndex+5] = b2;
                    vertexIndex += 6;
                }
            } else {
                const baseAlpha = Math.max(0, 1 - Math.sqrt(distSq)/4);
                if (baseAlpha > 0.01) {
                    linePositions[vertexIndex] = xi;
                    linePositions[vertexIndex+1] = yi;
                    linePositions[vertexIndex+2] = zi;
                    lineColors[vertexIndex] = r1 * baseAlpha;
                    lineColors[vertexIndex+1] = g1 * baseAlpha;
                    lineColors[vertexIndex+2] = b1 * baseAlpha;

                    linePositions[vertexIndex+3] = xj;
                    linePositions[vertexIndex+4] = yj;
                    linePositions[vertexIndex+5] = zj;
                    lineColors[vertexIndex+3] = r2 * baseAlpha;
                    lineColors[vertexIndex+4] = g2 * baseAlpha;
                    lineColors[vertexIndex+5] = b2 * baseAlpha;
                    
                    vertexIndex += 6;
                }
            }
        }
    }

    if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
    if (linesGeometryRef.current) {
        linesGeometryRef.current.setDrawRange(0, vertexIndex / 3);
        linesGeometryRef.current.attributes.position.needsUpdate = true;
        linesGeometryRef.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group>
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={pointPositions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    array={pointColors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial 
                size={0.15} 
                vertexColors 
                transparent 
                opacity={1} 
                sizeAttenuation={true} 
            />
        </points>
        <lineSegments>
            <bufferGeometry ref={linesGeometryRef}>
                <bufferAttribute
                    attach="attributes-position"
                    count={maxConnections * 2 * 2} // Double size for safety
                    array={linePositions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={maxConnections * 2 * 2}
                    array={lineColors}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial 
                vertexColors 
                transparent 
                opacity={1} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
            />
        </lineSegments>
    </group>
  );
};

// 3. Lorenz Attractor - Strange Attractor from Chaos Theory
// Represents Stochastic Dynamics, Simulation, and Mathematical Beauty.
// Zoomed in, Line-based version (High density, Dynamic Colors)
export const LorenzAttractor = () => {
    const count = 75; // Number of separate lines (Density)
    const trailLength = 120; // Length of each tail
    const groupRef = useRef<THREE.Group>(null);
    const tempColor = useMemo(() => new THREE.Color(), []);

    // Color Palette
    const colorSlow = useMemo(() => new THREE.Color('#1d4ed8'), []); // Blue-700
    const colorFast = useMemo(() => new THREE.Color('#ffffff'), []); // White

    // Initial State: Each particle has its own parameters and history buffer
    const [trajectories] = useState(() => {
        return Array.from({ length: count }).map(() => {
            const x = (Math.random() - 0.5) * 40;
            const y = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40 + 20;

            // Initialize color history buffer
            const baseColors = new Float32Array(trailLength * 3);
            for(let k=0; k<trailLength; k++) {
                baseColors[k*3] = colorSlow.r;
                baseColors[k*3+1] = colorSlow.g;
                baseColors[k*3+2] = colorSlow.b;
            }

            return {
                current: { x, y, z },
                history: new Float32Array(trailLength * 3).fill(0),
                baseColors: baseColors,
                sigma: 10,
                rho: 28,
                beta: 8/3,
                dt: 0.004 + Math.random() * 0.002 // Variation in speed
            };
        });
    });

    // Opacity Curve (Fade out tail)
    const opacityCurve = useMemo(() => {
        const arr = new Float32Array(trailLength);
        for(let i=0; i<trailLength; i++) {
            // i=0 is head (newest), i=length is tail (oldest)
            // Non-linear fade
            arr[i] = Math.max(0, 1 - Math.pow(i / trailLength, 0.4)); 
        }
        return arr;
    }, []);

    useFrame(() => {
        if (!groupRef.current) return;
        
        // Very slow global rotation
        groupRef.current.rotation.y += 0.001;

        // ZOOM FACTOR: Scale up to fill screen
        const ZOOM = 0.35;

        trajectories.forEach((traj, i) => {
            let { x, y, z } = traj.current;
            
            // Lorenz ODE Calculation
            const dx = traj.sigma * (y - x) * traj.dt;
            const dy = (x * (traj.rho - z) - y) * traj.dt;
            const dz = (x * y - traj.beta * z) * traj.dt;

            x += dx;
            y += dy;
            z += dz;
            
            traj.current = { x, y, z };

            // Speed calculation for Color (displacement magnitude)
            const speed = Math.sqrt(dx*dx + dy*dy + dz*dz);
            // Normalize speed roughly between 0 and 1.2
            const t = Math.min(1, speed / 1.2);

            // Interpolate color
            tempColor.lerpColors(colorSlow, colorFast, t);

            // 1. Shift History Buffers
            traj.history.copyWithin(3, 0, (trailLength - 1) * 3);
            traj.baseColors.copyWithin(3, 0, (trailLength - 1) * 3);
            
            // 2. Add new point at head (index 0)
            // Center around (0,0,0) by subtracting z-offset of 25 before scaling
            traj.history[0] = x * ZOOM;
            traj.history[1] = y * ZOOM;
            traj.history[2] = (z - 25) * ZOOM;

            // 3. Add new color at head
            traj.baseColors[0] = tempColor.r;
            traj.baseColors[1] = tempColor.g;
            traj.baseColors[2] = tempColor.b;
            
            // Initialization hack to prevent origin streaks
            if (traj.history[trailLength*3 - 1] === 0 && traj.history[trailLength*3 - 2] === 0) {
                 for(let k=1; k<trailLength; k++) {
                     traj.history[k*3] = traj.history[0];
                     traj.history[k*3+1] = traj.history[1];
                     traj.history[k*3+2] = traj.history[2];
                     
                     traj.baseColors[k*3] = traj.baseColors[0];
                     traj.baseColors[k*3+1] = traj.baseColors[1];
                     traj.baseColors[k*3+2] = traj.baseColors[2];
                 }
            }

            // Mark geometry for update
            const line = groupRef.current?.children[i] as THREE.Line;
            if (line && line.geometry) {
                // Update Positions
                line.geometry.attributes.position.needsUpdate = true;
                
                // Update Colors: Mix Base Color with Opacity Curve
                const colorsAttr = line.geometry.attributes.color;
                const colorArray = colorsAttr.array as Float32Array;

                for(let k=0; k<trailLength; k++) {
                    const alpha = opacityCurve[k];
                    colorArray[k*3] = traj.baseColors[k*3] * alpha;
                    colorArray[k*3+1] = traj.baseColors[k*3+1] * alpha;
                    colorArray[k*3+2] = traj.baseColors[k*3+2] * alpha;
                }
                colorsAttr.needsUpdate = true;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {trajectories.map((traj, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <bufferAttribute 
                            attach="attributes-position"
                            count={trailLength}
                            array={traj.history}
                            itemSize={3}
                        />
                        {/* Initial color buffer (zeros or pre-filled is fine, updated frame 1) */}
                        <bufferAttribute 
                            attach="attributes-color"
                            count={trailLength}
                            array={new Float32Array(trailLength * 3)}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial 
                        vertexColors={true} 
                        transparent={true} 
                        opacity={0.3} 
                        blending={THREE.AdditiveBlending} 
                        depthWrite={false}
                        linewidth={1}
                    />
                </line>
            ))}
        </group>
    );
};