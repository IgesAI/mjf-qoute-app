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
    powerConsumption: 14.5, // kW
    baseHourlyCost: 65.00, // Higher for MJF
    buildChamberSize: {
      x: 380, // mm
      y: 284, // mm
      z: 380,  // mm
    },
    averagePackingDensity: 0.12, // 12% - typical for MJF
    failureRate: 0.03, // 3% - MJF is quite reliable
    timeDistribution: {
      printing: 0.65,   // 65% of time spent printing
      cooling: 0.25,    // 25% cooling
      maintenance: 0.10 // 10% maintenance
    }
  }
} as const;

// Operating Costs
export const OPERATING_COSTS = {
  laborRate: 28.00, // USD per hour
  energyCost: 0.12, // USD per kWh
  setupTimeBase: 1.5, // hours
  postProcessingTimeBase: 0.5, // hours
  failureCostMultiplier: 1.1 // 10% additional cost for failures
} as const;

// Post-Processing Options
export const POST_PROCESSING_OPTIONS = {
  BASIC: {
    name: 'Basic Cleaning',
    cost: 35.00, // Higher for MJF due to powder removal
    additionalTime: 0.75,
  },
  MEDIUM: {
    name: 'Bead Blasting',
    cost: 65.00,
    additionalTime: 1.25,
  },
  ADVANCED: {
    name: 'Dyeing and Finishing',
    cost: 120.00,
    additionalTime: 2.5,
  }
} as const;