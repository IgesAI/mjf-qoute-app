import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { Mesh } from 'three';
import { ModelMetrics } from '../../utils/priceCalculator';
import { analyzeSTLFile } from '../../utils/modelAnalyzer';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Separate component for the 3D scene
const Scene: React.FC<{ url: string }> = ({ url }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const { scene, camera, gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls | null>(null);
  
  // Set up controls
  useEffect(() => {
    if (!gl.domElement) return;
    
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controlsRef.current = controls;
    
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    
    // Crucial: only respond to events when they originate from the canvas
    controls.enabled = true;
    
    return () => {
      controls.dispose();
    };
  }, [camera, gl]);

  // Update controls
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    const loader = new STLLoader();
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        setGeometry(geometry);
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
      }
    );
  }, [url]);
  
  useEffect(() => {
    if (geometry) {
      const material = new THREE.MeshStandardMaterial({ 
        color: "#808080",
        metalness: 0.5,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      geometry.center();
      
      scene.add(mesh);
      return () => {
        scene.remove(mesh);
        geometry.dispose();
        material.dispose();
      };
    }
  }, [geometry, scene]);

  return (
    <>
      <Stage 
        environment="city" 
        intensity={0.8}
        preset="rembrandt"
        adjustCamera={2.5}
      >
        {/* Remove OrbitControls component */}
      </Stage>
    </>
  );
};

interface ModelViewerProps {
  file: File | null;
  onMetricsCalculated: (metrics: ModelMetrics) => void;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ file, onMetricsCalculated }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    
    analyzeSTLFile(file)
      .then(metrics => {
        onMetricsCalculated(metrics);
      })
      .catch(err => {
        setError('Failed to analyze model');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
      
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, onMetricsCalculated]);

  // Add pointer event handlers
  const handlePointerEnter = () => {
    setIsPointerInside(true);
  };

  const handlePointerLeave = () => {
    setIsPointerInside(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isPointerInside) {
      return; // Allow normal page scroll when pointer is outside
    }
    e.stopPropagation();
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleScroll = (e: WheelEvent) => {
      const rect = viewer.getBoundingClientRect();
      const isInside = 
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!isInside) {
        // Prevent Three.js from handling scroll events when outside
        e.stopPropagation();
      }
    };

    // Add listener to the viewer element itself
    viewer.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      viewer.removeEventListener('wheel', handleScroll);
    };
  }, []);

  return (
    <div 
      ref={viewerRef}
      className="w-full h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden relative"
    >
      {loading && (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <p>Loading model...</p>
        </div>
      )}
      
      {error && (
        <div className="w-full h-full flex items-center justify-center text-red-400">
          <p>{error}</p>
        </div>
      )}
      
      {objectUrl && !loading && !error && (
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          style={{ touchAction: 'none' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            // Prevent the canvas from capturing all wheel events
            gl.domElement.style.pointerEvents = 'auto';
          }}
        >
          <Scene url={objectUrl} />
        </Canvas>
      )}
    </div>
  );
};

export default ModelViewer; 