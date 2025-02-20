import { 
  MACHINE_CONSTANTS, 
  OPERATING_COSTS, 
  POST_PROCESSING_OPTIONS,
  TIME_CONSTANTS,
  MATERIAL
} from './priceConstants';
import { EnhancedMetrics } from './stlParser';

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
                   OPERATING_COSTS.postProcessingTimeBase;
  
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
  total: number;
  printTime: number;
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
  const baseTime = OPERATING_COSTS.postProcessingTimeBase;
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
  const laborCost = totalProcessingTime * OPERATING_COSTS.laborRate;
  const postProcessingCost = POST_PROCESSING_OPTIONS[postProcessingLevel].cost;
  
  // Failure rate consideration
  const failureCostMultiplier = 1 + machine.failureRate;
  
  const subtotal = (materialCost + machineCost + powerCost + laborCost + postProcessingCost) * 
                  failureCostMultiplier;
  
  // Industry standard markup
  const total = subtotal * 1.3; // 30% markup for MJF parts
  
  return {
    materialCost: Number(materialCost.toFixed(2)),
    machineCost: Number(machineCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    powerCost: Number(powerCost.toFixed(2)),
    postProcessingCost: Number(postProcessingCost.toFixed(2)),
    total: Number(total.toFixed(2)),
    printTime: Number(printTime.toFixed(2)),
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
        postProcessingTime
      }
    }
  };
}

export class PriceCalculator {
  private partVolume: number;
  private postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS;
  private machine;
  private printTime: number;

  constructor(partVolume: number, postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS = 'BASIC') {
    this.partVolume = partVolume;
    this.postProcessingLevel = postProcessingLevel;
    this.machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
    this.printTime = this.estimatePrintTime();
  }

  private estimatePrintTime(): number {
    const preheatingTime = TIME_CONSTANTS.preheatingTime;
    const coolingTime = this.partVolume * TIME_CONSTANTS.coolingTimePerCm3;
    
    const partHeight = Math.pow(this.partVolume / this.machine.averagePackingDensity, 1/3);
    const layerHeight = 0.08; // mm
    const numberOfLayers = Math.ceil(partHeight / layerHeight);
    
    const layerTime = numberOfLayers * TIME_CONSTANTS.baseLayerTime;
    const volumeTime = this.partVolume * TIME_CONSTANTS.volumeTimeMultiplier;
    
    const totalTime = preheatingTime + coolingTime + layerTime + volumeTime;
    
    return Number((totalTime / this.machine.timeDistribution.printing).toFixed(2));
  }

  private calculateMaterialCost(): number {
    const effectiveVolume = this.partVolume * (1 + this.machine.failureRate);
    const volumeCost = effectiveVolume * MATERIAL.costPerCm3;
    const materialEfficiencyCost = volumeCost * (1 - MATERIAL.reusageRate);
    return Number((volumeCost + materialEfficiencyCost).toFixed(2));
  }

  private calculateMachineCost(): number {
    return Number((this.machine.baseHourlyCost * this.printTime * OPERATING_COSTS.failureCostMultiplier).toFixed(2));
  }

  private calculateLaborCost(): number {
    const setupTime = OPERATING_COSTS.setupTimeBase;
    const postProcessingTime = OPERATING_COSTS.postProcessingTimeBase + 
                             POST_PROCESSING_OPTIONS[this.postProcessingLevel].additionalTime;
    
    const maintenanceTime = this.printTime * this.machine.timeDistribution.maintenance / 
                           this.machine.timeDistribution.printing;
    
    const totalLaborTime = setupTime + postProcessingTime + maintenanceTime;
    return Number((totalLaborTime * OPERATING_COSTS.laborRate).toFixed(2));
  }

  private calculatePowerCost(): number {
    const activeTime = this.printTime * (
      this.machine.timeDistribution.printing + 
      this.machine.timeDistribution.cooling
    );
    const kwhUsed = this.machine.powerConsumption * activeTime;
    return Number((kwhUsed * OPERATING_COSTS.energyCost).toFixed(2));
  }

  private calculatePostProcessingCost(): number {
    return POST_PROCESSING_OPTIONS[this.postProcessingLevel].cost;
  }

  calculateTotalPrice(): PriceBreakdown {
    const materialCost = this.calculateMaterialCost();
    const machineCost = this.calculateMachineCost();
    const laborCost = this.calculateLaborCost();
    const powerCost = this.calculatePowerCost();
    const postProcessingCost = this.calculatePostProcessingCost();

    const total = Number((materialCost + machineCost + laborCost + powerCost + postProcessingCost).toFixed(2));
    
    return {
      materialCost,
      machineCost,
      laborCost,
      powerCost,
      postProcessingCost,
      total,
      printTime: this.printTime,
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
          postProcessingTime: OPERATING_COSTS.postProcessingTimeBase + 
                            POST_PROCESSING_OPTIONS[this.postProcessingLevel].additionalTime
        }
      }
    };
  }
} 