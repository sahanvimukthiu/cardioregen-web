import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const HeartMesh = ({ objData }) => {
  const geometry = useMemo(() => {
    if (!objData) return null;
    const loader = new OBJLoader();
    try {
      const group = loader.parse(objData);
      let meshGeometry = null;
      group.traverse((child) => {
        if (child.isMesh) meshGeometry = child.geometry;
      });
      return meshGeometry;
    } catch (e) {
      console.error("Error parsing OBJ:", e);
      return null;
    }
  }, [objData]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ff4444" roughness={0.3} metalness={0.1} />
    </mesh>
  );
};

const HeartViewer = ({ objData }) => {
  return (
    <div style={{ height: '400px', width: '100%', background: '#111', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas shadows camera={{ position: [0, 0, 180], fov: 45 }}>
        <Stage environment="city" intensity={0.6}>
          <HeartMesh objData={objData} />
        </Stage>
        <OrbitControls autoRotate autoRotateSpeed={2.0} />
      </Canvas>
    </div>
  );
};

export default HeartViewer;