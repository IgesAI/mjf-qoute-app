import { 
  MACHINE_CONSTANTS, 
  OPERATING_COSTS, 
  POST_PROCESSING_OPTIONS,
  TIME_CONSTANTS,
  MATERIAL
} from './priceConstants';
import { EnhancedMetrics } from './stlParser';
import { MachineParameters, MaterialProperties, ProcessingParameters } from './types';

// Types
export interface ModelMetrics {
  volume: number;
  surfaceArea: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
}

// Calculation Functions
export function estimateBuildTime(metrics: ModelMetrics): number {
  const machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
  
  // Basic time calculation based on volume and packing density
  const volumeInMm3 = metrics.volume * 1000; // Convert cm³ to mm³
  const chamberVolume = machine.buildChamberSize.x * 
                       machine.buildChamberSize.y * 
                       machine.buildChamberSize.z;
  
  // Estimate layers based on height
  const layerHeight = 0.08; // mm
  const numberOfLayers = metrics.boundingBox.z * 10 / layerHeight; // Convert cm to mm
  
  // Base time per layer is 8 seconds
  const baseLayerTime = numberOfLayers * 8 / 3600; // Convert to hours
  
  // Add setup time and post-processing time
  const totalTime = baseLayerTime + 
                   OPERATING_COSTS.setupTimeBase + 
                   POST_PROCESSING_OPTIONS.BASIC.additionalTime;
  
  return Number(totalTime.toFixed(2));
}

export function calculateMachineTime(buildTime: number): number {
  const machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
  const machineHourlyCost = machine.baseHourlyCost + 
                           (machine.powerConsumption * OPERATING_COSTS.energyCost);
  return Number((buildTime * machineHourlyCost).toFixed(2));
}

export interface PriceBreakdown {
  materialCost: number;
  machineCost: number;
  laborCost: number;
  powerCost: number;
  postProcessingCost: number;
  qcCost: number;
  overhead: number;
  profit: number;
  total: number;
  printTime: number;
  processingTimes: ProcessingParameters;
  breakdown: {
    materialDetails: {
      volume: number;
      costPerCm3: number;
      reusageRate: number;
      effectivePackingDensity: number;
    };
    timeDetails: {
      printTime: number;
      setupTime: number;
      postProcessingTime: number;
    };
  };
}

function calculatePrintTime(metrics: EnhancedMetrics): number {
  const machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
  
  // MJF specific timing calculations
  const layerHeight = 0.08; // mm
  const layerCount = (metrics.optimalOrientation.height * 10) / layerHeight; // Convert cm to mm
  const baseLayerTime = layerCount * TIME_CONSTANTS.baseLayerTime;
  
  // Preheat and cooldown times
  const thermalTime = TIME_CONSTANTS.preheatingTime + 
                     (metrics.volume * TIME_CONSTANTS.coolingTimePerCm3);
  
  // Additional time based on complexity
  const complexityTime = metrics.complexity * TIME_CONSTANTS.baseLayerTime;
  
  const totalTime = (baseLayerTime + thermalTime + complexityTime) / 
                   machine.timeDistribution.printing;
  
  return Number(totalTime.toFixed(2));
}

function calculatePostProcessingTime(
  metrics: EnhancedMetrics, 
  postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS
): number {
  const baseTime = POST_PROCESSING_OPTIONS.BASIC.additionalTime;
  const additionalTime = POST_PROCESSING_OPTIONS[postProcessingLevel].additionalTime;
  
  // Additional time for complex geometries
  const complexityFactor = Math.max(1, metrics.complexity);
  
  return baseTime + (additionalTime * complexityFactor);
}

export function calculateTotalPrice(
  metrics: EnhancedMetrics,
  postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS = 'BASIC'
): PriceBreakdown {
  const machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
  
  // Material cost calculation considering powder reuse
  const effectiveVolume = metrics.volume / machine.averagePackingDensity;
  const rawMaterialCost = effectiveVolume * MATERIAL.costPerCm3;
  const materialCost = rawMaterialCost / MATERIAL.reusageRate;
  
  // Time calculations
  const printTime = calculatePrintTime(metrics);
  const postProcessingTime = calculatePostProcessingTime(metrics, postProcessingLevel);
  const totalProcessingTime = printTime + postProcessingTime;
  
  // Cost calculations
  const machineCost = printTime * machine.baseHourlyCost;
  const powerCost = (printTime * machine.powerConsumption * OPERATING_COSTS.energyCost);
  const laborCost = totalProcessingTime * OPERATING_COSTS.laborRate.processing;
  const postProcessingCost = POST_PROCESSING_OPTIONS[postProcessingLevel].cost;
  
  // Failure rate consideration
  const failureCostMultiplier = 1 + machine.failureRate;
  
  const subtotal = (materialCost + machineCost + powerCost + laborCost + postProcessingCost) * 
                  failureCostMultiplier;
  
  // Industry standard markup
  const total = subtotal * 1.3; // 30% markup for MJF parts
  
  const qcCost = metrics.volume * 0.05; // Add QC cost calculation
  const overhead = subtotal * 0.15;     // Add overhead calculation
  const profit = subtotal * 0.30;       // Add profit calculation
  
  return {
    materialCost: Number(materialCost.toFixed(2)),
    machineCost: Number(machineCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    powerCost: Number(powerCost.toFixed(2)),
    postProcessingCost: Number(postProcessingCost.toFixed(2)),
    qcCost: Number(qcCost.toFixed(2)),
    overhead: Number(overhead.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    total: Number(total.toFixed(2)),
    printTime: Number(printTime.toFixed(2)),
    processingTimes: {
      printing: printTime * 0.7,
      cooling: printTime * 0.2,
      postProcessing: POST_PROCESSING_OPTIONS[postProcessingLevel].additionalTime,
      setup: OPERATING_COSTS.setupTimeBase
    },
    breakdown: {
      materialDetails: {
        volume: metrics.volume,
        costPerCm3: MATERIAL.costPerCm3,
        reusageRate: MATERIAL.reusageRate,
        effectivePackingDensity: machine.averagePackingDensity
      },
      timeDetails: {
        printTime,
        setupTime: OPERATING_COSTS.setupTimeBase,
        postProcessingTime: POST_PROCESSING_OPTIONS[postProcessingLevel].additionalTime
      }
    }
  };
}

export class PriceCalculator {
  private partVolume: number;
  private postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS;
  private machine;
  private printTime: number;
  private batchEfficiencyFactor: number;

  constructor(partVolume: number, postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS = 'BASIC') {
    this.partVolume = partVolume;
    this.postProcessingLevel = postProcessingLevel;
    this.machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
    
    // Calculate batch efficiency factor
    const buildVolume = (this.machine.buildChamberSize.x * 
                        this.machine.buildChamberSize.y * 
                        this.machine.buildChamberSize.z) / 1000; // Convert to cm³
    const typicalBatchSize = Math.floor(buildVolume * this.machine.averagePackingDensity / this.partVolume);
    this.batchEfficiencyFactor = Math.min(1, 1/Math.max(1, typicalBatchSize));
    
    this.printTime = this.estimatePrintTime();
  }

  private estimatePrintTime(): number {
    // MJF specific timing calculations
    const layerHeight = 0.08; // mm (standard MJF layer height)
    const partHeightMm = Math.pow(this.partVolume * 1000, 1/3); // Convert cm³ to mm³ and estimate height
    const numberOfLayers = Math.ceil(partHeightMm / layerHeight);
    
    // Base time calculations
    const preheatingTime = TIME_CONSTANTS.preheatingTime;
    const layerTime = numberOfLayers * TIME_CONSTANTS.baseLayerTime;
    
    // Cooling time based on volume
    const coolingTime = this.partVolume * TIME_CONSTANTS.coolingTimePerCm3;
    
    // Additional time for powder spreading and recoating
    const recoatingTime = numberOfLayers * 0.0005; // 0.5 seconds per layer
    
    // Total print time including machine efficiency factor
    const totalTime = (preheatingTime + layerTime + coolingTime + recoatingTime) / 
                     this.machine.timeDistribution.printing;
    
    return Number(totalTime.toFixed(2));
  }

  private calculateMaterialCost(): number {
    // Account for packing density and powder reuse
    const effectiveVolume = this.partVolume / this.machine.averagePackingDensity;
    const newPowderVolume = effectiveVolume * (1 - MATERIAL.reusageRate);
    const reusedPowderVolume = effectiveVolume * MATERIAL.reusageRate;
    
    // Different costs for new and reused powder
    const newPowderCost = newPowderVolume * MATERIAL.costPerCm3;
    const reusedPowderCost = reusedPowderVolume * (MATERIAL.costPerCm3 * 0.3); // Reused powder costs 30% of new
    
    return Number((newPowderCost + reusedPowderCost).toFixed(2));
  }

  private calculateMachineCost(): number {
    // Base machine costs are divided among all parts in the batch
    const baseHourlyCost = (this.machine.baseHourlyCost * this.printTime) * this.batchEfficiencyFactor;
    
    // Power consumption is also shared
    const printingPowerCost = (this.machine.powerConsumption * 
                             OPERATING_COSTS.energyCost * 
                             this.printTime * 
                             this.machine.timeDistribution.printing) * 
                             this.batchEfficiencyFactor;
    
    const coolingPowerCost = (this.machine.powerConsumption * 0.6 * 
                            OPERATING_COSTS.energyCost * 
                            this.printTime * 
                            this.machine.timeDistribution.cooling) * 
                            this.batchEfficiencyFactor;
    
    // Agents cost remains per part
    const agentsCost = this.partVolume * 0.8;
    
    // Facility overhead is shared
    const facilityOverhead = (8 * this.printTime) * this.batchEfficiencyFactor;
    
    const totalMachineCost = (baseHourlyCost + 
                             printingPowerCost + 
                             coolingPowerCost + 
                             agentsCost + 
                             facilityOverhead) * 
                             OPERATING_COSTS.failureCostMultiplier;
    
    return Number(totalMachineCost.toFixed(2));
  }

  private calculateLaborCost(): number {
    // For MJF 5200, typical full build takes about 1.5 hours to process
    const fullBuildProcessingTime = 1.5;
    
    // Calculate part's share of the build processing
    const partShareOfBuild = this.partVolume / 
      (this.machine.buildChamberSize.x * this.machine.buildChamberSize.y * 
       this.machine.buildChamberSize.z * this.machine.averagePackingDensity / 1000);
    
    // Labor time calculation
    const setupShare = (OPERATING_COSTS.setupTimeBase * partShareOfBuild);
    const processingShare = (fullBuildProcessingTime * partShareOfBuild);
    const qualityCheckTime = 0.08; // 5 minutes per part for QC
    
    const totalLaborTime = setupShare + processingShare + qualityCheckTime;
    
    // Different labor rates for different activities
    const setupCost = setupShare * OPERATING_COSTS.laborRate.setup;
    const processingCost = processingShare * OPERATING_COSTS.laborRate.processing;
    const qcCost = qualityCheckTime * OPERATING_COSTS.laborRate.qc;
    
    return Number((setupCost + processingCost + qcCost).toFixed(2));
  }

  private calculatePostProcessingCost(): number {
    // Basic post-processing for MJF includes:
    // 1. Bead blasting (shared cost)
    // 2. Compressed air cleaning (per part)
    // 3. Optional finishing
    
    const buildShare = this.partVolume / 
      (this.machine.buildChamberSize.x * this.machine.buildChamberSize.y * 
       this.machine.buildChamberSize.z * this.machine.averagePackingDensity / 1000);
    
    // Bead blasting equipment cost per build
    const blastingCostShare = 25 * buildShare; // $25 per full build
    
    // Compressed air and basic cleaning
    const basicCleaningCost = 0.5 + (this.partVolume * 0.1); // Base + volume-based
    
    // Additional finishing if selected
    const finishingCost = POST_PROCESSING_OPTIONS[this.postProcessingLevel].cost * 
      (this.partVolume / 10); // Scale by volume, baseline is 10cm³
    
    return Number((blastingCostShare + basicCleaningCost + finishingCost).toFixed(2));
  }

  calculateTotalPrice(): PriceBreakdown {
    const materialCost = this.calculateMaterialCost();
    const machineCost = this.calculateMachineCost();
    const laborCost = this.calculateLaborCost();
    const powerCost = this.machine.powerConsumption * OPERATING_COSTS.energyCost * this.printTime;
    const postProcessingCost = this.calculatePostProcessingCost();
    const qcCost = this.partVolume * 0.05;

    const subtotal = materialCost + machineCost + laborCost + powerCost + postProcessingCost;
    const overhead = subtotal * 0.15;
    const profit = subtotal * 0.30;
    const total = subtotal + overhead + profit;

    return {
      materialCost: Number(materialCost.toFixed(2)),
      machineCost: Number(machineCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      powerCost: Number(powerCost.toFixed(2)),
      postProcessingCost: Number(postProcessingCost.toFixed(2)),
      qcCost: Number(qcCost.toFixed(2)),
      overhead: Number(overhead.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      total: Number(total.toFixed(2)),
      printTime: this.printTime,
      processingTimes: {
        printing: this.printTime * 0.7,
        cooling: this.printTime * 0.2,
        postProcessing: POST_PROCESSING_OPTIONS[this.postProcessingLevel].additionalTime,
        setup: OPERATING_COSTS.setupTimeBase
      },
      breakdown: {
        materialDetails: {
          volume: this.partVolume,
          costPerCm3: MATERIAL.costPerCm3,
          reusageRate: MATERIAL.reusageRate,
          effectivePackingDensity: this.machine.averagePackingDensity
        },
        timeDetails: {
          printTime: this.printTime,
          setupTime: OPERATING_COSTS.setupTimeBase,
          postProcessingTime: POST_PROCESSING_OPTIONS[this.postProcessingLevel].additionalTime
        }
      }
    };
  }
}

export class AdvancedPriceCalculator {
  private readonly buildVolume: number;
  private readonly partComplexity: number;
  private readonly postProcessingLevel: 'basic' | 'standard' | 'premium';

  // Machine-specific parameters
  private readonly machineParams: MachineParameters = {
    hourlyRate: 45.0,
    powerConsumption: {
      printing: 12.0,    // kW during printing
      cooling: 7.2,      // kW during cooling
      standby: 3.0       // kW in standby
    },
    maintenanceCost: 0.15, // Per hour
    printHeadLife: 1500,   // Hours
    printHeadCost: 2500,   // USD
    filterLifespan: 500,   // Hours
    filterCost: 300        // USD
  };

  // Material properties
  private readonly materialProps: MaterialProperties = {
    baseCost: 0.17,        // USD per cm³
    reusageRate: 0.80,     // 80% powder reuse
    density: 1.01,         // g/cm³
    wasteFactor: {
      base: 1.1,           // Base waste factor
      complexityMultiplier: 0.05
    }
  };

  constructor(
    buildVolume: number, 
    partComplexity: number, 
    postProcessingLevel: 'basic' | 'standard' | 'premium'
  ) {
    this.buildVolume = buildVolume;
    this.partComplexity = partComplexity;
    this.postProcessingLevel = postProcessingLevel;
  }

  calculateMaterialCost(): number {
    // Dynamic waste factor based on complexity
    const dynamicWasteFactor = this.materialProps.wasteFactor.base + 
      (this.partComplexity * this.materialProps.wasteFactor.complexityMultiplier);

    // Raw material cost with reuse consideration
    const effectiveMaterialCost = (this.buildVolume * this.materialProps.baseCost) / 
      this.materialProps.reusageRate;

    return effectiveMaterialCost * dynamicWasteFactor;
  }

  calculateProcessingTime(): ProcessingParameters {
    const layerHeight = 0.08; // mm
    const layerCount = Math.ceil((this.buildVolume ** (1/3)) * 10 / layerHeight);
    
    return {
      printing: layerCount * 0.0015, // Hours per layer
      cooling: this.buildVolume * 0.0008, // Hours per cm³
      postProcessing: this.calculatePostProcessingTime(),
      setup: 0.5 // Base setup time in hours
    };
  }

  calculateMachineCost(): number {
    const times = this.calculateProcessingTime();
    const totalTime = (Object.values(times as ProcessingParameters) as number[])
      .reduce((a, b) => a + b, 0);

    // Machine depreciation and maintenance
    const baseOperationCost = totalTime * this.machineParams.hourlyRate;
    
    // Consumables depreciation
    const printHeadDepreciation = (this.machineParams.printHeadCost / this.machineParams.printHeadLife) * totalTime;
    const filterDepreciation = (this.machineParams.filterCost / this.machineParams.filterLifespan) * totalTime;
    
    // Energy costs
    const energyCost = this.calculateEnergyCost(times);

    return baseOperationCost + printHeadDepreciation + filterDepreciation + energyCost;
  }

  private calculateEnergyCost(times: ProcessingParameters): number {
    const energyRate = 0.12; // USD per kWh
    
    return (
      (times.printing * this.machineParams.powerConsumption.printing +
       times.cooling * this.machineParams.powerConsumption.cooling +
       times.setup * this.machineParams.powerConsumption.standby) * energyRate
    );
  }

  private calculatePostProcessingTime(): number {
    const baseTime = 0.25;
    const complexityFactor = 1 + (this.partComplexity * 0.2);
    
    const postProcessingFactors: Record<'basic' | 'standard' | 'premium', number> = {
      'basic': 1.0,
      'standard': 1.5,
      'premium': 2.0
    };

    return baseTime * complexityFactor * postProcessingFactors[this.postProcessingLevel];
  }

  calculateTotalPrice(): PriceBreakdown {
    const materialCost = this.calculateMaterialCost();
    const machineCost = this.calculateMachineCost();
    const processingTimes = this.calculateProcessingTime();
    
    // Labor costs
    const laborRate = 35; // USD per hour
    const laborCost = (Object.values(processingTimes as ProcessingParameters) as number[])
      .reduce((a, b) => a + b, 0) * laborRate;
    
    // Quality control costs
    const qcCost = this.buildVolume * 0.05; // Basic QC cost per cm³
    
    const subtotal = materialCost + machineCost + laborCost + qcCost;
    const overhead = subtotal * 0.15; // 15% overhead
    const profit = subtotal * 0.30;   // 30% profit margin

    return {
      materialCost,
      machineCost,
      laborCost,
      powerCost: 0,
      postProcessingCost: 0,
      qcCost,
      overhead,
      profit,
      total: subtotal + overhead + profit,
      printTime: 0,
      processingTimes,
      breakdown: {
        materialDetails: {
          volume: this.buildVolume,
          costPerCm3: this.materialProps.baseCost,
          reusageRate: this.materialProps.reusageRate,
          effectivePackingDensity: 0.12
        },
        timeDetails: {
          printTime: processingTimes.printing,
          setupTime: processingTimes.setup,
          postProcessingTime: processingTimes.postProcessing
        }
      }
    };
  }
} 