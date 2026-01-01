import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, useGLTF } from '@react-three/drei';

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

function UploadedModel({ url, rotation }) {
    const { scene } = useGLTF(url);
    const primRef = useRef();

    // Clone scene to avoid mutation issues if reused
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame((state, delta) => {
        if (primRef.current) {
            primRef.current.rotation.y += delta * 0.1; // Slow auto rotation

            // Manual Override
            if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
                primRef.current.rotation.x = rotation.x;
                primRef.current.rotation.y = rotation.y;
                primRef.current.rotation.z = rotation.z || 0;
            }
        }
    });

    return <primitive ref={primRef} object={clonedScene} scale={2} />;
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

// import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function Scene({ rotation, zoom, modelUrl, onCanvasReady }) {
    return (
        <Canvas
            className="w-full h-full"
            gl={{ preserveDrawingBuffer: true, antialias: false }} // Antialias off for performance with postprocessing
            dpr={[1, 2]} // Efficient pixel ratio
            onCreated={({ gl }) => {
                if (onCanvasReady) onCanvasReady(gl.domElement);
            }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 8 / zoom]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f0ff" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#ff0000" />

            <Suspense fallback={null}>
                {modelUrl ? (
                    <UploadedModel url={modelUrl} rotation={rotation} />
                ) : (
                    <MemoizedHologram rotation={rotation} />
                )}
            </Suspense>

            <MemoizedInnerHalo />
            <MemoizedOuterHalo />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />

            {/* <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.8} />
            </EffectComposer> */}
        </Canvas>
    );
}
