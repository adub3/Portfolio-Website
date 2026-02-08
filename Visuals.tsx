
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// 1. StarField - Background
export const StarField = ({ theme }: { theme: 'light' | 'dark' }) => {
  const count = 2000;
  const mesh = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(theme === 'dark' ? '#ffffff' : '#000000') },
  }), []);

  useEffect(() => {
    uniforms.uColor.value.set(theme === 'dark' ? '#ffffff' : '#000000');
  }, [theme, uniforms]);

  const [positions, sizes, shifts] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const h = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const r = 30 + Math.random() * 90;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        p[i*3] = r * Math.sin(phi) * Math.cos(theta);
        p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        p[i*3+2] = r * Math.cos(phi);
        s[i] = Math.random(); 
        h[i] = Math.random() * Math.PI * 2;
    }
    return [p, s, h];
  }, []);

  useFrame((state) => {
    if (mesh.current) {
        (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
        mesh.current.rotation.y += (state.pointer.x * 0.05 - mesh.current.rotation.y) * 0.02;
        mesh.current.rotation.x += (-state.pointer.y * 0.05 - mesh.current.rotation.x) * 0.02;
        mesh.current.rotation.z += 0.0005; 
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aShift" count={count} array={shifts} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          attribute float aSize;
          attribute float aShift;
          varying float vAlpha;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (150.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = 0.3 + 0.6 * (0.5 + 0.5 * sin(uTime * 0.8 + aShift)); 
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(uColor, vAlpha * (1.0 - smoothstep(0.0, 0.5, dist)));
          }
        `}
      />
    </points>
  );
};

// 2. Neural Network - Interactions: Freeze/Kill Nodes, Break Lines
export const NeuralNetworkEffect = ({ theme }: { theme: 'light' | 'dark' }) => {
  const count = 60;
  const radius = 10; 
  
  const colorBlue = useMemo(() => new THREE.Color('#1d4ed8'), []);
  const colorGreen = useMemo(() => new THREE.Color('#10b981'), []);
  const colorRed = useMemo(() => new THREE.Color('#ef4444'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Dynamic base color based on theme
  const colorBase = useMemo(() => new THREE.Color(theme === 'dark' ? '#ffffff' : '#000000'), [theme]);

  const particles = useMemo(() => {
    const data = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
        data[i*8] = (Math.random() - 0.5) * radius * 2;
        data[i*8+1] = (Math.random() - 0.5) * radius * 1.5;
        data[i*8+2] = (Math.random() - 0.5) * 8;
        data[i*8+3] = (Math.random() - 0.5) * 0.01;
        data[i*8+4] = (Math.random() - 0.5) * 0.01;
        data[i*8+5] = (Math.random() - 0.5) * 0.01;
        data[i*8+6] = 0; // state: 0=alive, 1=dying
        data[i*8+7] = 0; // hitTime
    }
    return data;
  }, []);

  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const maxConnections = count * count;
  const linePositions = useMemo(() => new Float32Array(maxConnections * 6), []);
  const lineColors = useMemo(() => new Float32Array(maxConnections * 6), []);
  const lineOpacities = useMemo(() => new Float32Array(maxConnections * 2), []); // 1 float per vertex
  
  const pointPositions = useMemo(() => new Float32Array(count * 3), []);
  const pointColors = useMemo(() => new Float32Array(count * 3), []);
  const pointOpacities = useMemo(() => new Float32Array(count), []);
  
  // Variable sizes for points with distribution biased towards smaller sizes
  const pointSizes = useMemo(() => {
      const arr = new Float32Array(count);
      for(let i = 0; i < count; i++) {
          // Range 10 to 40.
          // Using power of 3 biases heavily towards the lower end (smaller nodes appear more often)
          arr[i] = 10.0 + Math.pow(Math.random(), 3.0) * 30.0;
      }
      return arr;
  }, []);

  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const vec3 = useMemo(() => new THREE.Vector3(), []);
  const vec3_2 = useMemo(() => new THREE.Vector3(), []);
  const vec3_onSegment = useMemo(() => new THREE.Vector3(), []);
  const brokenRef = useRef(new Map<string, { brokenAt: number, ratio: number }>());

  useFrame((state) => {
    const { pointer, clock } = state;
    const now = clock.elapsedTime;
    raycaster.setFromCamera(pointer, camera);
    const ray = raycaster.ray;

    const POINT_HIT_SQ = 0.4 * 0.4; 
    const FADE_DURATION = 0.5;
    const RESPAWN_TIME = 3.0;

    // Update Particles
    for (let i = 0; i < count; i++) {
        const idx = i * 8;
        let x = particles[idx], y = particles[idx+1], z = particles[idx+2];
        let vx = particles[idx+3], vy = particles[idx+4], vz = particles[idx+5];
        let status = particles[idx+6], hitTime = particles[idx+7];

        if (status === 0) {
            vec3.set(x, y, z);
            if (ray.distanceSqToPoint(vec3) < POINT_HIT_SQ) {
                status = 1; hitTime = now; vx = 0; vy = 0; vz = 0;
            } else {
                if (x > radius) vx -= 0.0002; else if (x < -radius) vx += 0.0002;
                if (y > radius * 0.8) vy -= 0.0002; else if (y < -radius * 0.8) vy += 0.0002;
                if (z > 4) vz -= 0.0002; else if (z < -4) vz += 0.0002;
            }
        } else if (status === 1) {
            vx = 0; vy = 0; vz = 0;
            if (now - hitTime > RESPAWN_TIME) {
                status = 0;
                x = (Math.random() - 0.5) * radius * 2; y = (Math.random() - 0.5) * radius * 1.5; z = (Math.random() - 0.5) * 8;
                vx = (Math.random() - 0.5) * 0.01; vy = (Math.random() - 0.5) * 0.01; vz = (Math.random() - 0.5) * 0.01;
            }
        }

        x += vx; y += vy; z += vz;
        particles[idx] = x; particles[idx+1] = y; particles[idx+2] = z;
        particles[idx+3] = vx; particles[idx+4] = vy; particles[idx+5] = vz;
        particles[idx+6] = status; particles[idx+7] = hitTime;

        pointPositions[i*3] = x; pointPositions[i*3+1] = y; pointPositions[i*3+2] = z;

        if (status === 1) {
             const life = Math.max(0, 1 - ((now - hitTime) / FADE_DURATION));
             tempColor.set(colorRed);
             pointColors[i*3] = tempColor.r; pointColors[i*3+1] = tempColor.g; pointColors[i*3+2] = tempColor.b;
             pointOpacities[i] = life;
        } else {
             const t = Math.max(0, Math.min(1, (z + 4) / 8));
             const threshold = 0.2; 
             if (t < threshold) tempColor.lerpColors(colorBlue, colorBase, t / threshold);
             else tempColor.lerpColors(colorBase, colorGreen, (t - threshold) / (1 - threshold));
             pointColors[i*3] = tempColor.r; pointColors[i*3+1] = tempColor.g; pointColors[i*3+2] = tempColor.b;
             pointOpacities[i] = 1.0;
        }
    }

    // Update Lines
    let vertexIndex = 0;
    let opacityIndex = 0;
    const LINE_HIT_SQ = 0.2 * 0.2; const BREAK_DURATION = 0.4; const COOLDOWN = 2.0;

    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const xi = pointPositions[i*3], yi = pointPositions[i*3+1], zi = pointPositions[i*3+2];
            const xj = pointPositions[j*3], yj = pointPositions[j*3+1], zj = pointPositions[j*3+2];
            const dx = xi - xj, dy = yi - yj, dz = zi - zj;
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq > 16) continue;
            
            if (pointOpacities[i] <= 0.01 || pointOpacities[j] <= 0.01) continue;

            const key = `${i}-${j}`;
            let brokenState = brokenRef.current.get(key);
            if (brokenState && (now - brokenState.brokenAt > COOLDOWN)) { brokenRef.current.delete(key); brokenState = undefined; }

            if (!brokenState) {
                vec3.set(xi, yi, zi); vec3_2.set(xj, yj, zj);
                if (ray.distanceSqToSegment(vec3, vec3_2, undefined, vec3_onSegment) < LINE_HIT_SQ) {
                    const ratio = Math.max(0.01, Math.min(0.99, vec3.distanceTo(vec3_onSegment) / Math.sqrt(distSq)));
                    brokenState = { brokenAt: now, ratio }; brokenRef.current.set(key, brokenState);
                }
            }

            const r1 = pointColors[i*3], g1 = pointColors[i*3+1], b1 = pointColors[i*3+2];
            const r2 = pointColors[j*3], g2 = pointColors[j*3+1], b2 = pointColors[j*3+2];
            
            const distAlpha = Math.max(0, 1 - Math.sqrt(distSq)/4);
            const alpha1 = distAlpha * pointOpacities[i];
            const alpha2 = distAlpha * pointOpacities[j];

            if (brokenState) {
                const age = now - brokenState.brokenAt;
                if (age < BREAK_DURATION) {
                    const progress = age / BREAK_DURATION;
                    const ease = 1 - Math.pow(1 - progress, 3);
                    const shrink = 1 - ease;
                    const t = brokenState.ratio;

                    // Segment 1
                    const t1 = t * shrink;
                    linePositions[vertexIndex] = xi; linePositions[vertexIndex+1] = yi; linePositions[vertexIndex+2] = zi;
                    linePositions[vertexIndex+3] = xi + (xj-xi)*t1; linePositions[vertexIndex+4] = yi + (yj-yi)*t1; linePositions[vertexIndex+5] = zi + (zj-zi)*t1;
                    lineColors[vertexIndex] = r1; lineColors[vertexIndex+1] = g1; lineColors[vertexIndex+2] = b1;
                    lineColors[vertexIndex+3] = r1; lineColors[vertexIndex+4] = g1; lineColors[vertexIndex+5] = b1;
                    lineOpacities[opacityIndex] = alpha1; lineOpacities[opacityIndex+1] = alpha1;
                    vertexIndex += 6; opacityIndex += 2;

                    // Segment 2
                    const t2 = (1 - t) * shrink;
                    linePositions[vertexIndex] = xj; linePositions[vertexIndex+1] = yj; linePositions[vertexIndex+2] = zj;
                    linePositions[vertexIndex+3] = xj + (xi-xj)*t2; linePositions[vertexIndex+4] = yj + (yi-yj)*t2; linePositions[vertexIndex+5] = zj + (zi-zj)*t2;
                    lineColors[vertexIndex] = r2; lineColors[vertexIndex+1] = g2; lineColors[vertexIndex+2] = b2;
                    lineColors[vertexIndex+3] = r2; lineColors[vertexIndex+4] = g2; lineColors[vertexIndex+5] = b2;
                    lineOpacities[opacityIndex] = alpha2; lineOpacities[opacityIndex+1] = alpha2;
                    vertexIndex += 6; opacityIndex += 2;
                }
            } else {
                if (distAlpha > 0.01) {
                    linePositions[vertexIndex] = xi; linePositions[vertexIndex+1] = yi; linePositions[vertexIndex+2] = zi;
                    linePositions[vertexIndex+3] = xj; linePositions[vertexIndex+4] = yj; linePositions[vertexIndex+5] = zj;
                    
                    lineColors[vertexIndex] = r1; lineColors[vertexIndex+1] = g1; lineColors[vertexIndex+2] = b1;
                    lineColors[vertexIndex+3] = r2; lineColors[vertexIndex+4] = g2; lineColors[vertexIndex+5] = b2;
                    
                    lineOpacities[opacityIndex] = alpha1;
                    lineOpacities[opacityIndex+1] = alpha2;
                    
                    vertexIndex += 6; opacityIndex += 2;
                }
            }
        }
    }

    if (pointsRef.current) { 
        pointsRef.current.geometry.attributes.position.needsUpdate = true; 
        pointsRef.current.geometry.attributes.aColor.needsUpdate = true;
        pointsRef.current.geometry.attributes.aOpacity.needsUpdate = true;
    }
    if (linesGeometryRef.current) { 
        linesGeometryRef.current.setDrawRange(0, vertexIndex / 3); 
        linesGeometryRef.current.attributes.position.needsUpdate = true; 
        linesGeometryRef.current.attributes.aColor.needsUpdate = true;
        linesGeometryRef.current.attributes.aOpacity.needsUpdate = true;
    }
  });

  return (
    <group>
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={pointPositions} itemSize={3} />
                <bufferAttribute attach="attributes-aColor" count={count} array={pointColors} itemSize={3} />
                <bufferAttribute attach="attributes-aOpacity" count={count} array={pointOpacities} itemSize={1} />
                <bufferAttribute attach="attributes-aSize" count={count} array={pointSizes} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial
                transparent
                depthWrite={false}
                vertexShader={`
                    attribute float aOpacity;
                    attribute vec3 aColor;
                    attribute float aSize;
                    varying vec3 vColor;
                    varying float vOpacity;
                    void main() {
                        vColor = aColor;
                        vOpacity = aOpacity;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = aSize * (10.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `}
                fragmentShader={`
                    varying vec3 vColor;
                    varying float vOpacity;
                    void main() {
                        float dist = length(gl_PointCoord - vec2(0.5));
                        if (dist > 0.5) discard;
                        gl_FragColor = vec4(vColor, vOpacity);
                    }
                `}
            />
        </points>
        <lineSegments>
            <bufferGeometry ref={linesGeometryRef}>
                <bufferAttribute attach="attributes-position" count={maxConnections * 2} array={linePositions} itemSize={3} />
                <bufferAttribute attach="attributes-aColor" count={maxConnections * 2} array={lineColors} itemSize={3} />
                <bufferAttribute attach="attributes-aOpacity" count={maxConnections * 2} array={lineOpacities} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial 
                transparent
                depthWrite={false}
                vertexShader={`
                    attribute float aOpacity;
                    attribute vec3 aColor;
                    varying vec3 vColor;
                    varying float vOpacity;
                    void main() {
                        vColor = aColor;
                        vOpacity = aOpacity;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    varying vec3 vColor;
                    varying float vOpacity;
                    void main() {
                        gl_FragColor = vec4(vColor, vOpacity);
                    }
                `}
            />
        </lineSegments>
    </group>
  );
};

// 3. Lorenz Attractor - Strange Attractor
export const LorenzAttractor = ({ theme }: { theme: 'light' | 'dark' }) => {
    const count = 75; const trailLength = 120;
    const groupRef = useRef<THREE.Group>(null);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const colorSlow = useMemo(() => new THREE.Color('#1d4ed8'), []);
    const colorFast = useMemo(() => new THREE.Color(theme === 'dark' ? '#ffffff' : '#000000'), [theme]);
    
    // Zoom factor for visuals
    const ZOOM = 0.35;

    const [trajectories] = useState(() => Array.from({ length: count }).map(() => {
        const x = (Math.random() - 0.5) * 40, y = (Math.random() - 0.5) * 40, z = (Math.random() - 0.5) * 40 + 20;
        const baseColors = new Float32Array(trailLength * 3).fill(colorSlow.r);
        
        // Initialize history with starting position to avoid (0,0,0) artifact (the "star" effect)
        const history = new Float32Array(trailLength * 3);
        for(let i=0; i<trailLength; i++) {
             history[i*3] = x * ZOOM;
             history[i*3+1] = y * ZOOM;
             history[i*3+2] = (z - 25) * ZOOM;
        }

        return { current: { x, y, z }, history, baseColors, sigma: 10, rho: 28, beta: 8/3, dt: 0.004 + Math.random() * 0.002 };
    }));

    const opacityCurve = useMemo(() => {
        const arr = new Float32Array(trailLength);
        for(let i=0; i<trailLength; i++) arr[i] = Math.max(0, 1 - Math.pow(i / trailLength, 0.4)); 
        return arr;
    }, []);

    useFrame(() => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += 0.001;
        
        // Update fast color reference in loop if theme changed, though better to do outside
        colorFast.set(theme === 'dark' ? '#ffffff' : '#000000');

        trajectories.forEach((traj, i) => {
            let { x, y, z } = traj.current;
            const dx = traj.sigma * (y - x) * traj.dt, dy = (x * (traj.rho - z) - y) * traj.dt, dz = (x * y - traj.beta * z) * traj.dt;
            x += dx; y += dy; z += dz;
            traj.current = { x, y, z };
            tempColor.lerpColors(colorSlow, colorFast, Math.min(1, Math.sqrt(dx*dx + dy*dy + dz*dz) / 1.2));

            traj.history.copyWithin(3, 0, (trailLength - 1) * 3);
            traj.baseColors.copyWithin(3, 0, (trailLength - 1) * 3);
            traj.history[0] = x * ZOOM; traj.history[1] = y * ZOOM; traj.history[2] = (z - 25) * ZOOM;
            traj.baseColors[0] = tempColor.r; traj.baseColors[1] = tempColor.g; traj.baseColors[2] = tempColor.b;

            const line = groupRef.current?.children[i] as THREE.Line;
            if (line && line.geometry) {
                line.geometry.attributes.position.needsUpdate = true;
                const colorsArr = line.geometry.attributes.color.array as Float32Array;
                for(let k=0; k<trailLength; k++) {
                    const alpha = opacityCurve[k];
                    colorsArr[k*3] = traj.baseColors[k*3] * alpha;
                    colorsArr[k*3+1] = traj.baseColors[k*3+1] * alpha;
                    colorsArr[k*3+2] = traj.baseColors[k*3+2] * alpha;
                }
                line.geometry.attributes.color.needsUpdate = true;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {trajectories.map((traj, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" count={trailLength} array={traj.history} itemSize={3} />
                        <bufferAttribute attach="attributes-color" count={trailLength} array={new Float32Array(trailLength * 3)} itemSize={3} />
                    </bufferGeometry>
                    <lineBasicMaterial vertexColors transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
                </line>
            ))}
        </group>
    );
};

// 4. Shooting Star Effect (Particle Trail)
export const ShootingStarEffect = ({ target, theme }: { target: {x: number, y: number, id: number} | null; theme: 'light' | 'dark' }) => {
  const { camera } = useThree();
  
  const STAR_POOL_SIZE = 5;
  const PARTICLE_COUNT = 4000;
  const EMISSION_RATE = 8; 
  
  // Active Stars Logic
  const stars = useRef<{
    active: boolean;
    startTime: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    duration: number;
  }[]>([]);

  useMemo(() => {
    stars.current = Array.from({ length: STAR_POOL_SIZE }, () => ({
      active: false,
      startTime: 0,
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      duration: 1,
    }));
  }, []);

  // Particle System
  const pointsRef = useRef<THREE.Points>(null);
  const particleSystem = useMemo(() => {
    return {
        positions: new Float32Array(PARTICLE_COUNT * 3),
        velocities: new Float32Array(PARTICLE_COUNT * 3),
        ages: new Float32Array(PARTICLE_COUNT).fill(1), // Init dead
        lifetimes: new Float32Array(PARTICLE_COUNT),
        sizes: new Float32Array(PARTICLE_COUNT),
        cursor: 0
    };
  }, []);

  // Trigger Logic
  useEffect(() => {
    if (!target) return;
    
    const idx = stars.current.findIndex(s => !s.active);
    if (idx !== -1) {
      const s = stars.current[idx];
      s.active = true;
      s.startTime = performance.now() / 1000;
      s.duration = 2.5 + Math.random() * 2.0; // Slow speed: 2.5s - 4.5s duration

      const Z_DEPTH = -5;
      const vec = new THREE.Vector3(target.x, target.y, 0.5);
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      const distance = (Z_DEPTH - camera.position.z) / vec.z;
      const hitPoint = camera.position.clone().add(vec.multiplyScalar(distance));
      
      const angle = Math.random() * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const pathLength = 50;
      
      s.startPos.set(hitPoint.x - dirX * (pathLength/2), hitPoint.y - dirY * (pathLength/2), Z_DEPTH);
      s.endPos.set(hitPoint.x + dirX * (pathLength/2), hitPoint.y + dirY * (pathLength/2), Z_DEPTH);
    }
  }, [target, camera]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const ps = particleSystem;
    
    // 1. Update Active Stars & Emit
    stars.current.forEach(s => {
        if (!s.active) return;
        const age = time - s.startTime;
        const progress = age / s.duration;
        
        if (progress >= 1) {
            s.active = false;
            return;
        }

        const currentPos = new THREE.Vector3().lerpVectors(s.startPos, s.endPos, progress);

        for(let i=0; i<EMISSION_RATE; i++) {
            const idx = ps.cursor;
            ps.cursor = (ps.cursor + 1) % PARTICLE_COUNT;
            
            // Spawn at head with slight spread
            ps.positions[idx*3] = currentPos.x + (Math.random()-0.5) * 0.15;
            ps.positions[idx*3+1] = currentPos.y + (Math.random()-0.5) * 0.15;
            ps.positions[idx*3+2] = currentPos.z + (Math.random()-0.5) * 0.15;
            
            // Velocity: Drift perpendicular to motion or random
            ps.velocities[idx*3] = (Math.random()-0.5) * 0.05;
            ps.velocities[idx*3+1] = (Math.random()-0.5) * 0.05;
            ps.velocities[idx*3+2] = (Math.random()-0.5) * 0.05;
            
            ps.ages[idx] = 0;
            ps.lifetimes[idx] = 0.5 + Math.random() * 1.5; // Random lifetime
            ps.sizes[idx] = Math.random();
        }
    });

    // 2. Update Particles
    for(let i=0; i<PARTICLE_COUNT; i++) {
        if (ps.ages[i] >= 1) continue;
        
        ps.ages[i] += delta * (1.0 / ps.lifetimes[i]); 
        
        if (ps.ages[i] >= 1) {
            ps.ages[i] = 1;
        } else {
            ps.positions[i*3] += ps.velocities[i*3];
            ps.positions[i*3+1] += ps.velocities[i*3+1];
            ps.positions[i*3+2] += ps.velocities[i*3+2];
        }
    }

    // 3. Update Geometry Attributes
    if (pointsRef.current) {
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.aAge.needsUpdate = true;
    }
  });

  const colorUniform = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
      const c = new THREE.Color(theme === 'dark' ? '#ffffff' : '#000000');
      colorUniform.set(c.r, c.g, c.b);
  }, [theme]);

  return (
      <points ref={pointsRef}>
          <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={particleSystem.positions} itemSize={3} />
              <bufferAttribute attach="attributes-aAge" count={PARTICLE_COUNT} array={particleSystem.ages} itemSize={1} />
              <bufferAttribute attach="attributes-aSize" count={PARTICLE_COUNT} array={particleSystem.sizes} itemSize={1} />
          </bufferGeometry>
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{ uColor: { value: colorUniform } }}
            vertexShader={`
                uniform vec3 uColor;
                attribute float aAge;
                attribute float aSize;
                varying float vAlpha;
                void main() {
                    if (aAge >= 1.0) {
                        gl_Position = vec4(0.0);
                        return;
                    }
                    vAlpha = 1.0 - aAge; 
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = (4.0 * aSize + 3.0) * (10.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `}
            fragmentShader={`
                uniform vec3 uColor;
                varying float vAlpha;
                void main() {
                    if (vAlpha <= 0.01) discard;
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if (dist > 0.5) discard;
                    
                    float strength = 1.0 - (dist * 2.0);
                    strength = pow(strength, 2.0);
                    
                    gl_FragColor = vec4(uColor, vAlpha * strength);
                }
            `}
          />
      </points>
  );
};
