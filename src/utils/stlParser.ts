import * as THREE from 'three';

export interface STLParseResult {
  vertices: Float32Array;
  normals: Float32Array;
  triangleCount: number;
}

export interface PrintOrientation {
  rotation: THREE.Euler;
  height: number;
  supportVolume: number;
}

export interface EnhancedMetrics {
  volume: number;
  surfaceArea: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
  optimalOrientation: PrintOrientation;
  supportRequired: boolean;
  complexity: number;
}

export function parseSTLBinary(buffer: ArrayBuffer): STLParseResult {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedBytes = 80 + 4 + (triangleCount * 50);
  
  if (buffer.byteLength !== expectedBytes) {
    throw new Error('Invalid STL file size');
  }

  const vertices = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);
  
  let offset = 84;
  let vertexIndex = 0;
  let normalIndex = 0;

  for (let i = 0; i < triangleCount; i++) {
    // Normal
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    offset += 12;

    // Vertices
    for (let j = 0; j < 3; j++) {
      const x = view.getFloat32(offset, true);
      const y = view.getFloat32(offset + 4, true);
      const z = view.getFloat32(offset + 8, true);
      offset += 12;

      vertices[vertexIndex] = x;
      vertices[vertexIndex + 1] = y;
      vertices[vertexIndex + 2] = z;
      vertexIndex += 3;

      normals[normalIndex] = nx;
      normals[normalIndex + 1] = ny;
      normals[normalIndex + 2] = nz;
      normalIndex += 3;
    }

    // Skip attribute byte count
    offset += 2;
  }

  return {
    vertices,
    normals,
    triangleCount
  };
}

export function calculateModelMetrics(parseResult: STLParseResult): EnhancedMetrics {
  const { vertices, triangleCount } = parseResult;
  
  // Calculate bounding box
  const bbox = new THREE.Box3();
  for (let i = 0; i < vertices.length; i += 3) {
    bbox.expandByPoint(new THREE.Vector3(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    ));
  }

  // Calculate volume using signed tetrahedra method
  let volume = 0;
  for (let i = 0; i < vertices.length; i += 9) {
    const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
    const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
    
    volume += signedVolumeOfTriangle(v1, v2, v3);
  }
  volume = Math.abs(volume) / 1000; // Convert to cm³

  // Calculate surface area
  let surfaceArea = 0;
  for (let i = 0; i < vertices.length; i += 9) {
    const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
    const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
    
    surfaceArea += triangleArea(v1, v2, v3);
  }
  surfaceArea = surfaceArea / 100; // Convert to cm²

  const size = bbox.getSize(new THREE.Vector3());
  
  // Calculate optimal orientation
  const orientation = calculateOptimalOrientation(vertices);
  
  // Calculate geometric complexity
  const complexity = calculateComplexity(vertices, triangleCount);
  
  return {
    volume,
    surfaceArea,
    boundingBox: {
      x: size.x / 10, // Convert to cm
      y: size.y / 10,
      z: size.z / 10
    },
    optimalOrientation: orientation,
    supportRequired: orientation.supportVolume > 0,
    complexity
  };
}

function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  return p1.dot(p2.cross(p3)) / 6.0;
}

function triangleArea(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  const normal = new THREE.Vector3().crossVectors(v1, v2);
  return normal.length() / 2;
}

export function calculateOptimalOrientation(vertices: Float32Array): PrintOrientation {
  const rotations = [
    new THREE.Euler(0, 0, 0),
    new THREE.Euler(Math.PI/2, 0, 0),
    new THREE.Euler(0, Math.PI/2, 0),
    new THREE.Euler(0, 0, Math.PI/2),
  ];

  let bestOrientation: PrintOrientation = {
    rotation: rotations[0],
    height: Infinity,
    supportVolume: Infinity
  };

  for (const rotation of rotations) {
    const matrix = new THREE.Matrix4().makeRotationFromEuler(rotation);
    let minZ = Infinity;
    let maxZ = -Infinity;
    let supportVol = 0;

    // Transform vertices and analyze
    for (let i = 0; i < vertices.length; i += 9) {
      const triangle = [
        new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]),
        new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]),
        new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8])
      ];

      // Transform triangle
      triangle.forEach(vertex => vertex.applyMatrix4(matrix));

      // Track height
      triangle.forEach(vertex => {
        minZ = Math.min(minZ, vertex.z);
        maxZ = Math.max(maxZ, vertex.z);
      });

      // Calculate support volume needed
      const normal = new THREE.Vector3()
        .crossVectors(
          new THREE.Vector3().subVectors(triangle[1], triangle[0]),
          new THREE.Vector3().subVectors(triangle[2], triangle[0])
        ).normalize();

      // If face is pointing downward more than 45 degrees, it needs support
      if (normal.z < -0.707) {
        const area = triangleArea(triangle[0], triangle[1], triangle[2]);
        supportVol += area * Math.abs(normal.z);
      }
    }

    const height = maxZ - minZ;
    if (supportVol < bestOrientation.supportVolume || 
       (supportVol === bestOrientation.supportVolume && height < bestOrientation.height)) {
      bestOrientation = {
        rotation,
        height,
        supportVolume: supportVol
      };
    }
  }

  return bestOrientation;
}

function calculateComplexity(vertices: Float32Array, triangleCount: number): number {
  // Complexity factor based on triangle count and surface curvature
  const avgTrianglesPerVolume = triangleCount / (Math.pow(calculateVolume(vertices), 2/3));
  const normalVariation = calculateNormalVariation(vertices);
  
  return (avgTrianglesPerVolume * normalVariation) / 1000;
}

function calculateNormalVariation(vertices: Float32Array): number {
  let variation = 0;
  const normals: THREE.Vector3[] = [];
  
  // Calculate normals for each triangle
  for (let i = 0; i < vertices.length; i += 9) {
    const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
    const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
    
    const normal = new THREE.Vector3()
      .crossVectors(
        new THREE.Vector3().subVectors(v2, v1),
        new THREE.Vector3().subVectors(v3, v1)
      ).normalize();
      
    normals.push(normal);
  }
  
  // Calculate average variation between adjacent normals
  for (let i = 0; i < normals.length - 1; i++) {
    variation += normals[i].angleTo(normals[i + 1]);
  }
  
  return variation / normals.length;
}

function calculateVolume(vertices: Float32Array): number {
  let volume = 0;
  for (let i = 0; i < vertices.length; i += 9) {
    const v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
    const v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    const v3 = new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
    volume += signedVolumeOfTriangle(v1, v2, v3);
  }
  return Math.abs(volume) / 1000; // Convert to cm³
} 