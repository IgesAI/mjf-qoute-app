// Time Constants
export const TIME_CONSTANTS = {
  preheatingTime: 0.5, // hours
  coolingTimePerCm3: 0.001, // hours/cm³
  baseLayerTime: 0.002, // hours
  volumeTimeMultiplier: 0.005 // hours/cm³
} as const;

// Material Constants
export const MATERIALS = {
  PA12: {
    name: 'PA12',
    costPerCm3: 0.17,
    reusageRate: 0.80,
    density: 1.01,
  }
} as const;

// Machine Constants
export const MACHINE_CONSTANTS = {
  HP_JET_FUSION_5200: {
    name: 'HP Jet Fusion 5200',
    powerConsumption: 14.5, // kW
    baseHourlyCost: 45.00, // Base cost per hour for machine usage
    buildChamberSize: {
      x: 380, // mm
      y: 284, // mm
      z: 380,  // mm
    },
    averagePackingDensity: 0.0638, // 6.38%
    failureRate: 0.05, // 5% failure rate
    timeDistribution: {
      printing: 0.6,   // 60% of time spent printing
      cooling: 0.3,    // 30% of time spent cooling
      maintenance: 0.1 // 10% of time spent on maintenance
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
    cost: 25.00,
    additionalTime: 0.5,
  },
  MEDIUM: {
    name: 'Surface Smoothing',
    cost: 50.00,
    additionalTime: 1.0,
  },
  ADVANCED: {
    name: 'Dyeing and Finishing',
    cost: 100.00,
    additionalTime: 2.0,
  }
} as const;