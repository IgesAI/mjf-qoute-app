// Time Constants
export const TIME_CONSTANTS = {
  preheatingTime: 0.75, // hours
  coolingTimePerCm3: 0.0008, // hours/cm³
  baseLayerTime: 0.0015, // hours per layer
  volumeTimeMultiplier: 0.004 // hours/cm³
} as const;

// Material Constants - Simplified for PA12 only
export const MATERIAL = {
  name: 'PA12 Nylon',
  costPerCm3: 0.17,
  reusageRate: 0.80, // 80% powder reuse rate for MJF
  density: 1.01,
  color: 'Gray',
  description: 'Strong and flexible nylon polymer, ideal for functional parts'
} as const;

// Machine Constants
export const MACHINE_CONSTANTS = {
  HP_JET_FUSION_5200: {
    name: 'HP Jet Fusion 5200',
    powerConsumption: 12, // kW at peak
    baseHourlyCost: 45.00,
    buildChamberSize: {
      x: 380, // mm
      y: 284, // mm
      z: 380, // mm
    },
    averagePackingDensity: 0.12, // 12% typical packing density
    failureRate: 0.02,
    timeDistribution: {
      printing: 0.70,
      cooling: 0.20,
      maintenance: 0.10
    },
    minimumBatchSize: 8 // Minimum number of parts for optimal efficiency
  }
} as const;

// Operating Costs
export const OPERATING_COSTS = {
  laborRate: {
    setup: 25.00,    // Setup requires more skilled labor
    processing: 20.00, // Basic processing tasks
    qc: 22.00        // Quality control
  },
  energyCost: 0.12,
  setupTimeBase: 0.2, // 12 minutes per build, shared
  failureCostMultiplier: 1.05
} as const;

// Post-Processing Options
export const POST_PROCESSING_OPTIONS = {
  BASIC: {
    name: 'Basic Cleaning',
    cost: 5.00,      // Base cost for standard finish
    additionalTime: 0.08, // 5 minutes per part
  },
  MEDIUM: {
    name: 'Bead Blasting',
    cost: 15.00,     // Enhanced surface finish
    additionalTime: 0.17, // 10 minutes per part
  },
  ADVANCED: {
    name: 'Dyeing and Finishing',
    cost: 35.00,     // Full post-processing
    additionalTime: 0.33, // 20 minutes per part
  }
} as const;