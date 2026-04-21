import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const Stethoscope = () => {
    const jY = 0.5;
    const leftCurve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, jY, 0), new THREE.Vector3(-0.4, jY + 0.3, 0),
        new THREE.Vector3(-0.6, jY + 1.0, 0.2), new THREE.Vector3(-0.4, jY + 1.4, 0.4),
    ]), []);
    const rightCurve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, jY, 0), new THREE.Vector3(0.4, jY + 0.3, 0),
        new THREE.Vector3(0.6, jY + 1.0, 0.2), new THREE.Vector3(0.4, jY + 1.4, 0.4),
    ]), []);
    const rubberCurve = useMemo(() => new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, jY, 0), new THREE.Vector3(0, jY - 0.5, 0),
        new THREE.Vector3(-0.2, jY - 1.5, 0.2), new THREE.Vector3(0, jY - 2.2, 0.5),
        new THREE.Vector3(0.8, jY - 2.0, 0.4), new THREE.Vector3(1.2, jY - 1.2, 0.2),
        new THREE.Vector3(1.2, jY - 0.9, 0),
    ]), []);

    return (
        <group position={[-0.2, 0.5, 0]} scale={1.4}>
            <mesh><tubeGeometry args={[rubberCurve, 64, 0.08, 16, false]} /><meshStandardMaterial color="#77DD77" roughness={0.4} /></mesh>
            <mesh><tubeGeometry args={[leftCurve, 32, 0.05, 16, false]} /><meshStandardMaterial color="#cfcfcf" metalness={0.8} roughness={0.2} /></mesh>
            <mesh><tubeGeometry args={[rightCurve, 32, 0.05, 16, false]} /><meshStandardMaterial color="#cfcfcf" metalness={0.8} roughness={0.2} /></mesh>
            <mesh position={[0, jY, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#77DD77" roughness={0.4} /></mesh>
            <mesh position={[-0.4, jY + 1.4, 0.4]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#faf0e6" roughness={0.2} /></mesh>
            <mesh position={[0.4, jY + 1.4, 0.4]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#faf0e6" roughness={0.2} /></mesh>
            <group position={[1.2, jY - 0.9, 0]} rotation={[0.3, -0.2, 0.1]}>
                <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.06, 0.06, 0.3, 16]} /><meshStandardMaterial color="#cfcfcf" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.15, 32]} /><meshStandardMaterial color="#cfcfcf" metalness={0.8} roughness={0.2} /></mesh>
                <mesh position={[0, -0.1, 0.08]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.35, 0.35, 0.16, 32]} /><meshStandardMaterial color="#77DD77" roughness={0.3} /></mesh>
                <mesh position={[0, -0.1, -0.08]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.16, 32]} /><meshStandardMaterial color="#cfcfcf" metalness={0.8} roughness={0.2} /></mesh>
            </group>
        </group>
    );
};

const Composition = () => {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const autoRotateX = Math.sin(time * 0.8) * 0.1;
    const autoRotateY = time * 0.4;
    const targetX = state.pointer.x * 0.6;
    const targetY = -state.pointer.y * 0.6;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, autoRotateY + targetX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, autoRotateX + targetY, 0.05);
    groupRef.current.position.y = Math.sin(time * 2) * 0.1;
  });
  return <group ref={groupRef}><Stethoscope /></group>;
};

const Hero3D = () => (
  <div className="h-[400px] md:h-[500px] w-full cursor-crosshair">
    <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={3} color="#ffffff" />
      <directionalLight position={[-10, -5, -5]} intensity={1.5} color="#faf0e6" />
      <Environment preset="studio" />
      <Composition />
      <ContactShadows position={[0, -3.5, 0]} opacity={0.35} scale={10} blur={2.5} far={4} color="#a89b8d" />
    </Canvas>
  </div>
);

export default Hero3D;
