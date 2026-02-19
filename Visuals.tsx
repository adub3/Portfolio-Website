
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
  
  // Light mode: Slate 600 (#475569) instead of pure black for better aesthetics
  const colorVal = theme === 'dark' ? '#ffffff' : '#475569';
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(colorVal) },
  }), []);

  useEffect(() => {
    uniforms.uColor.value.set(colorVal);
  }, [theme, uniforms, colorVal]);

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
        blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
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
  
  // Enhanced colors for Light Mode to be "brighter" and more colorful
  const colorBlue = useMemo(() => new THREE.Color('#1d4ed8'), []); // Fixed stable colors
  const colorBlueLight = useMemo(() => new THREE.Color('#3b82f6'), []);
  const colorGreen = useMemo(() => new THREE.Color('#10b981'), []);
  const colorGreenLight = useMemo(() => new THREE.Color('#059669'), []);
  const colorRed = useMemo(() => new THREE.Color('#ef4444'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Dynamic base color: White in Dark Mode, Violet (#8b5cf6) in Light Mode to add vibrancy
  // We use a stable object and update it
  const colorBase = useMemo(() => new THREE.Color(), []);
  const currentColorBlue = useMemo(() => new THREE.Color(), []);
  const currentColorGreen = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
      colorBase.set(theme === 'dark' ? '#ffffff' : '#8b5cf6');
      currentColorBlue.set(theme === 'dark' ? '#1d4ed8' : '#3b82f6');
      currentColorGreen.set(theme === 'dark' ? '#10b981' : '#059669');
  }, [theme, colorBase, currentColorBlue, currentColorGreen]);

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
  
  const pointSizes = useMemo(() => {
      const arr = new Float32Array(count);
      for(let i = 0; i < count; i++) {
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
             if (t < threshold) tempColor.lerpColors(currentColorBlue, colorBase, t / threshold);
             else tempColor.lerpColors(colorBase, currentColorGreen, (t - threshold) / (1 - threshold));
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
    
    // Stable color object updated via useEffect
    const colorFast = useMemo(() => new THREE.Color(), []);
    
    useEffect(() => {
        colorFast.set(theme === 'dark' ? '#ffffff' : '#db2777');
    }, [theme, colorFast]);
    
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
                    <lineBasicMaterial 
                        vertexColors 
                        transparent 
                        opacity={theme === 'dark' ? 0.3 : 0.6} 
                        blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending} 
                        depthWrite={false} 
                    />
                </line>
            ))}
        </group>
    );
};

// 4. Aurora Borealis - Realistic Shader Effect
export const AuroraBorealis = ({ theme, opacity = 1 }: { theme: 'light' | 'dark', opacity?: number }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const { camera, viewport } = useThree();

    // Dynamically calculate the scale needed to cover the viewport at the mesh's depth.
    // Camera default pos is [0,0,5]. Mesh is at [0,0,-10].
    // Distance from camera = 15.
    const meshZ = -10;
    
    // Calculate the visible width/height at the mesh's Z-depth.
    const depth = Math.abs(camera.position.z - meshZ);
    // @ts-ignore - Fov exists on PerspectiveCamera
    const vFov = (camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(vFov / 2) * depth;
    const aspect = viewport.width / viewport.height;
    const width = height * aspect;

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        // Lighter, more subtle base colors to blend with stars better
        uColor1: { value: new THREE.Color(theme === 'dark' ? '#000000' : '#ffffff') }, 
        uColor2: { value: new THREE.Color(theme === 'dark' ? '#059669' : '#059669') }, 
        uColor3: { value: new THREE.Color(theme === 'dark' ? '#7c3aed' : '#7c3aed') }, 
        uColor4: { value: new THREE.Color(theme === 'dark' ? '#2563eb' : '#2563eb') }, 
    }), []);

    useEffect(() => {
        uniforms.uColor1.value.set(theme === 'dark' ? '#000000' : '#ffffff');
        uniforms.uColor2.value.set(theme === 'dark' ? '#059669' : '#10b981');
        uniforms.uColor3.value.set(theme === 'dark' ? '#7c3aed' : '#8b5cf6');
        uniforms.uColor4.value.set(theme === 'dark' ? '#2563eb' : '#3b82f6');
    }, [theme, uniforms]);

    useEffect(() => {
        if (mesh.current) {
             (mesh.current.material as THREE.ShaderMaterial).uniforms.uOpacity.value = opacity;
        }
    }, [opacity]);

    useFrame((state) => {
        if (mesh.current) {
            (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime * 0.2;
        }
    });

    return (
        <mesh ref={mesh} position={[0, 0, meshZ]} scale={[width * 1.5, height * 1.5, 1]}>
            <planeGeometry args={[1, 1, 128, 128]} />
            <shaderMaterial
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform float uTime;
                    uniform float uOpacity;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;
                    uniform vec3 uColor3;
                    uniform vec3 uColor4;
                    varying vec2 vUv;

                    // Simplex 2D noise
                    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                    float snoise(vec2 v){
                        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                        vec2 i  = floor(v + dot(v, C.yy) );
                        vec2 x0 = v -   i + dot(i, C.xx);
                        vec2 i1;
                        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                        vec4 x12 = x0.xyxy + C.xxzz;
                        x12.xy -= i1;
                        i = mod(i, 289.0);
                        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                        m = m*m ;
                        m = m*m ;
                        vec3 x = 2.0 * fract(p * C.www) - 1.0;
                        vec3 h = abs(x) - 0.5;
                        vec3 ox = floor(x + 0.5);
                        vec3 a0 = x - ox;
                        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                        vec3 g;
                        g.x  = a0.x  * x0.x  + h.x  * x0.y;
                        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                        return 130.0 * dot(m, g);
                    }

                    void main() {
                        vec2 uv = vUv;
                        
                        // Coherent, singular vertical curtain (no blobs)
                        
                        // Layer 1: Base Shape (Slow, Tall)
                        // Low Y frequency (0.2) = Long continuous vertical lines
                        float n1 = snoise(vec2(uv.x * 2.5 + uTime * 0.05 + 100.0, uv.y * 0.2 - uTime * 0.02)); 
                        
                        // Layer 2: Texture (Medium)
                        // Y frequency 0.5 still keeps it relatively vertical/connected
                        float n2 = snoise(vec2(uv.x * 5.0 - uTime * 0.1 + 200.0, uv.y * 0.5 + uTime * 0.05));
                        
                        // Combine: mostly n1 for shape, n2 for detail
                        float intensity = n1 * 0.7 + n2 * 0.3;
                        
                        // High Threshold: Cuts off background noise, isolating only the "peaks" (distinct curtains)
                        float alpha = smoothstep(0.4, 0.6, intensity + 0.2);
                        
                        // Fade at edges
                        alpha *= smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
                        
                        // Color mixing based on noise
                        vec3 color = mix(uColor2, uColor3, uv.x + n1 * 0.3);
                        color = mix(color, uColor4, uv.y + n2 * 0.3);
                        
                        gl_FragColor = vec4(color, alpha * 0.45 * uOpacity); 
                    }
                `}
            />
        </mesh>
    );
};
