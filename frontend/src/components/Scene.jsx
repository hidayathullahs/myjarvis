import React, { useRef, useMemo, Suspense, useLayoutEffect, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, useGLTF, Sparkles, Html, Line } from '@react-three/drei';

function Hologram({ rotation }) {
    const meshRef = useRef();
    const mesh = useRef();

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * 0.2;
        mesh.current.rotation.y += delta * 0.2;
        // Apply hand rotation if active
        if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
            mesh.current.rotation.x = rotation.x;
            mesh.current.rotation.y = rotation.y;
            mesh.current.rotation.z = rotation.z || 0;
        }
    });

    return (
        <group ref={mesh}>
            {/* Central Sphere (Icosahedron) */}
            <mesh>
                <icosahedronGeometry args={[1.5, 2]} /> {/* Higher detail */}
                <meshBasicMaterial color="#ffffff" wireframe />
            </mesh>

            {/* Surrounding Ring (Torus) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}> {/* Rotate to encircle */}
                <torusGeometry args={[3, 0.4, 16, 100]} /> {/* Ring radius 3, Tube 0.4 */}
                <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Outer Blue Glow */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3, 0.45, 16, 100]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} />
            </mesh>
        </group>
    );
}

function UploadedModel({ url, rotation, onLoad, toolMode, onMeasure, sliceConfig }) {
    const { scene } = useGLTF(url);
    const primRef = useRef();

    // Clipping Planes
    // We use useMemo so we don't recreate planes every frame
    const clippingPlanes = useMemo(() => {
        return {
            horizontal: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
            vertical: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
        };
    }, []);

    // Apply Slicing Logic
    useEffect(() => {
        if (!scene) return;

        const activePlane = toolMode === 'slice'
            ? (sliceConfig.mode === 'horizontal' ? clippingPlanes.horizontal : clippingPlanes.vertical)
            : null;

        if (activePlane) {
            // Upate Plane Constant (Offset) & Normal (Inversion)
            const normal = sliceConfig.mode === 'horizontal'
                ? (sliceConfig.inverted ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0))
                : (sliceConfig.inverted ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0));

            activePlane.normal.copy(normal);
            activePlane.constant = sliceConfig.offset;
        }

        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                // Determine if we need to patch material
                // We typically need to set clippingPlanes array
                if (toolMode === 'slice' && activePlane) {
                    child.material.clippingPlanes = [activePlane];
                    child.material.clipShadows = true;
                    child.material.needsUpdate = true;
                } else {
                    // Reset if exiting tool
                    if (child.material.clippingPlanes && child.material.clippingPlanes.length > 0) {
                        child.material.clippingPlanes = [];
                        child.material.needsUpdate = true;
                    }
                }
            }
        });

    }, [scene, toolMode, sliceConfig, clippingPlanes]);

    // Measurement State
    const [points, setPoints] = useState([]);

    const handlePointerDown = (e) => {
        if (toolMode !== 'measure') return;
        e.stopPropagation();

        const point = e.point; // info.point is Vector3

        let newPoints = [...points];
        if (newPoints.length >= 2) newPoints = []; // Reset on 3rd click

        newPoints.push(point);
        setPoints(newPoints);

        // Calculate
        let distance = null;
        if (newPoints.length === 2) {
            distance = newPoints[0].distanceTo(newPoints[1]).toFixed(2);
        }

        if (onMeasure) {
            onMeasure({
                a: newPoints[0],
                b: newPoints[1],
                distance: distance
            });
        }
    };

    // Initial load logic (previously implemented) is preserved below...
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Auto-Center & Scale Logic
    useLayoutEffect(() => {
        if (!clonedScene) return;

        // 1. Compute Bounding Box
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // 2. Center the model (offset)
        // We apply this to the scene's children or the scene position itself.
        // Easier to just move the scene position so (0,0,0) is center.
        clonedScene.position.x = -center.x;
        clonedScene.position.y = -center.y;
        clonedScene.position.z = -center.z;

        // 3. Scale to fit target size (e.g., 5 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5;
        const scaleFactor = targetSize / (maxDim || 1); // Avoid div by zero

        clonedScene.scale.setScalar(scaleFactor);

        // 4. Lighting & Shadows
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // 5. Telemetry Callback
        if (onLoad) {
            onLoad({
                size: { x: size.x, y: size.y, z: size.z },
                scale: scaleFactor,
                center: { x: center.x, y: center.y, z: center.z }
            });
        }

        console.log(`[MODEL] Loaded: ${url}`, { size, scaleFactor, center });

    }, [clonedScene, onLoad, url]);

    useFrame((state, delta) => {
        if (primRef.current) {
            // Manual Override with smooth interpolation or direct mapping
            if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
                primRef.current.rotation.x = rotation.x;
                primRef.current.rotation.y = rotation.y;
                primRef.current.rotation.z = rotation.z || 0;
            } else {
                primRef.current.rotation.y += delta * 0.05; // Very slow idle spin
            }
        }
    });

    // Wrapper group to hold the scaled/centered scene
    return (
        <group ref={primRef}>
            <primitive
                object={clonedScene}
                onPointerDown={handlePointerDown}
            />
            {/* Visuals for Measurement */}
            {points.map((p, i) => (
                <mesh key={i} position={[p.x, p.y, p.z]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshBasicMaterial color="#ff00ff" />
                </mesh>
            ))}
            {points.length === 2 && (
                <Line
                    points={points}       // Array of Vector3
                    color="#ff00ff"                   // Default
                    lineWidth={2}                   // In pixels (default)
                />
            )}
        </group>
    );
}

function InnerHalo() {
    const meshRef = useRef();
    useFrame(() => {
        meshRef.current.rotation.y -= 0.01;
        meshRef.current.rotation.z += 0.01;
    });

    return (
        <mesh ref={meshRef}>
            <torusGeometry args={[3, 0.02, 16, 100]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} />
        </mesh>
    )
}


function OuterHalo() {
    const meshRef = useRef();
    useFrame(() => {
        meshRef.current.rotation.y += 0.005;
        meshRef.current.rotation.z -= 0.005;
    });

    return (
        <mesh ref={meshRef}>
            <torusGeometry args={[3.2, 0.01, 16, 100]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.2} />
        </mesh>
    )
}

const MemoizedHologram = React.memo(Hologram);
const MemoizedInnerHalo = React.memo(InnerHalo);
const MemoizedOuterHalo = React.memo(OuterHalo);

function ScanningGrid() {
    const meshRef = useRef();
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        meshRef.current.position.y = Math.sin(t * 0.5) * 2;
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.05} wireframe side={2} />
        </mesh>
    );
}

// Duplicate logic for Reconstructed Mesh (could act as wrapper)
function ReconstructedModel({ meshGroup, rotation, toolMode, onMeasure, sliceConfig, onLoad }) {
    const groupRef = useRef();

    // Clipping Setup (Similar to UploadedModel)
    const clippingPlanes = useMemo(() => ({
        horizontal: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
        vertical: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)
    }), []);

    useEffect(() => {
        if (!groupRef.current) return;

        // Add mesh to scene
        groupRef.current.clear();
        const clone = meshGroup.clone();
        groupRef.current.add(clone);

        // Center/Scale logic?
        // Assuming meshBuilder returns metric scale. We might need to auto-center.
        const box = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.sub(center); // Center it

        // Notify
        if (onLoad) onLoad({ size: { x: 0, y: 0, z: 0 }, scale: 1.0 });

    }, [meshGroup]);

    // Apply Clipping to Children
    useEffect(() => {
        if (!groupRef.current) return;
        const activePlane = toolMode === 'slice'
            ? (sliceConfig.mode === 'horizontal' ? clippingPlanes.horizontal : clippingPlanes.vertical)
            : null;

        if (activePlane) {
            const normal = sliceConfig.mode === 'horizontal'
                ? (sliceConfig.inverted ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0))
                : (sliceConfig.inverted ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0));
            activePlane.normal.copy(normal);
            activePlane.constant = sliceConfig.offset;
        }

        groupRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
                if (toolMode === 'slice' && activePlane) {
                    child.material.clippingPlanes = [activePlane];
                    child.material.clipShadows = true;
                    child.material.needsUpdate = true;
                } else {
                    if (child.material.clippingPlanes && child.material.clippingPlanes.length > 0) {
                        child.material.clippingPlanes = [];
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
    }, [toolMode, sliceConfig, clippingPlanes]);


    useFrame((state, delta) => {
        if (groupRef.current) {
            if (rotation.x !== 0 || rotation.y !== 0) {
                groupRef.current.rotation.x = rotation.x;
                groupRef.current.rotation.y = rotation.y;
            } else {
                groupRef.current.rotation.y += delta * 0.05;
            }
        }
    });

    return <group ref={groupRef} />;
}

export default function Scene({ rotation, zoom, modelUrl, reconstructedMesh, onCanvasReady, toolMode, onMeasurementUpdate, sliceConfig }) {
    return (
        <Canvas
            className="w-full h-full"
            gl={{ preserveDrawingBuffer: true, antialias: false, localClippingEnabled: true }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
                gl.localClippingEnabled = true; // Ensure explicit enable
                if (onCanvasReady) onCanvasReady(gl.domElement);
            }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 8 / zoom]} />
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
                position={[10, 10, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <hemisphereLight skyColor="#00f0ff" groundColor="#000000" intensity={0.5} />

            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff0000" />
            <ScanningGrid />
            <Sparkles count={100} scale={5} size={2} speed={0.4} opacity={0.5} color="#00f0ff" />

            <Suspense fallback={<Html center><div className="text-cyan-400 font-bold animate-pulse">LOADING MODEL...</div></Html>}>
                {modelUrl ? (
                    <UploadedModel
                        url={modelUrl}
                        rotation={rotation}
                        toolMode={toolMode}
                        onMeasure={onMeasurementUpdate}
                        sliceConfig={sliceConfig}
                        onLoad={(data) => {
                            if (onCanvasReady) {
                                // Hack: We can emit a custom event or allow App.jsx to pass a callback props for telemetry
                                // For now, let's just log it or dispatch an event
                                const event = new CustomEvent('model-loaded', { detail: data });
                                window.dispatchEvent(event);
                            }
                        }}
                    />
                ) : reconstructedMesh ? (
                    <ReconstructedModel
                        meshGroup={reconstructedMesh}
                        rotation={rotation}
                        toolMode={toolMode}
                        onMeasure={onMeasurementUpdate}
                        sliceConfig={sliceConfig}
                        onLoad={(data) => {
                            const event = new CustomEvent('model-loaded', { detail: data });
                            window.dispatchEvent(event);
                        }}
                    />
                ) : (
                    <MemoizedHologram rotation={rotation} />
                )}
            </Suspense>

            <MemoizedInnerHalo />
            <MemoizedOuterHalo />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls
                enableDamping={true}
                dampingFactor={0.1} // Comfort: Smooth stop
                rotateSpeed={0.6}   // Comfort: Slow rotation
                zoomSpeed={0.8}     // Comfort: Smooth zoom
                minDistance={0.5}   // Safety: No clipping
                maxDistance={80}    // Safety: No lost in space
                enableZoom={true}   // Enable for review
                enablePan={false}   // Keep centered
                enableRotate={true} // Allow mouse override
            />
            <gridHelper args={[20, 20, 0x00f0ff, 0x111111]} position={[0, -2.5, 0]} />
        </Canvas>
    );
}
