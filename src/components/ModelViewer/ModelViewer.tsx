import React, { useEffect, useState } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { ModelMetrics } from '../../utils/priceCalculator';
import { analyzeSTLFile } from '../../utils/modelAnalyzer';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

extend({ 
  Mesh: THREE.Mesh,
  MeshStandardMaterial: THREE.MeshStandardMaterial 
});

interface ModelViewerProps {
  file: File | null;
  onMetricsCalculated: (metrics: ModelMetrics) => void;
}

function Model({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  useEffect(() => {
    const loader = new STLLoader();
    loader.load(url, (geometry) => {
      setGeometry(geometry);
    });
  }, [url]);
  
  if (!geometry) return null;
  
  return (
    <primitive object={new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: "#808080" })
    )} />
  );
}

const ModelViewer: React.FC<ModelViewerProps> = ({ file, onMetricsCalculated }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    // Create object URL for the model
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    
    // Analyze the file
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
  }, [file]);

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      {loading && (
        <div className="w-full h-full flex items-center justify-center">
          <p>Loading model...</p>
        </div>
      )}
      
      {error && (
        <div className="w-full h-full flex items-center justify-center text-red-500">
          <p>{error}</p>
        </div>
      )}
      
      {objectUrl && !loading && !error && (
        <Canvas>
          <Stage environment="city" intensity={0.6}>
            <Model url={objectUrl} />
          </Stage>
          <OrbitControls />
        </Canvas>
      )}
    </div>
  );
};

export default ModelViewer; 