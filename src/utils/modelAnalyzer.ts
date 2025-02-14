import parseSTL from 'parse-stl';
import { ModelMetrics } from './priceCalculator';

export async function analyzeSTLFile(file: File): Promise<ModelMetrics> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const mesh = parseSTL(new Uint8Array(buffer));
        
        // Calculate basic metrics
        const vertices = mesh.positions;
        const volume = calculateVolume(vertices);
        const surfaceArea = calculateSurfaceArea(vertices);
        const boundingBox = calculateBoundingBox(vertices);
        
        resolve({
          volume,
          surfaceArea,
          boundingBox
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function calculateVolume(vertices: Float32Array): number {
  // Basic volume calculation - to be improved
  const vertexCount = vertices.length / 3;
  const xCoords = vertices.filter((_, i) => i % 3 === 0);
  const yCoords = vertices.filter((_, i) => i % 3 === 1);
  const zCoords = vertices.filter((_, i) => i % 3 === 2);
  
  const xMax = Math.max(...xCoords);
  const yMax = Math.max(...yCoords);
  const zMax = Math.max(...zCoords);
  
  return (xMax * yMax * zMax) / 1000; // Convert to cm³
}

function calculateSurfaceArea(vertices: Float32Array): number {
  // Basic surface area calculation - to be improved
  const vertexCount = vertices.length / 3;
  return vertexCount * 0.5; // Placeholder calculation
}

function calculateBoundingBox(vertices: Float32Array) {
  const xCoords = vertices.filter((_, i) => i % 3 === 0);
  const yCoords = vertices.filter((_, i) => i % 3 === 1);
  const zCoords = vertices.filter((_, i) => i % 3 === 2);
  
  return {
    x: Math.max(...xCoords) - Math.min(...xCoords),
    y: Math.max(...yCoords) - Math.min(...yCoords),
    z: Math.max(...zCoords) - Math.min(...zCoords)
  };
} 