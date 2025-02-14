import { 
  MACHINE_CONSTANTS, 
  OPERATING_COSTS, 
  POST_PROCESSING_OPTIONS,
  TIME_CONSTANTS,
  MATERIALS,
  Material
} from './priceConstants';

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

export interface Material {
  name: string;
  costPerCm3: number;
  reusageRate: number;
  density: number;
}

// Calculation Functions
export function calculateMaterialCost(volume: number, material: Material): number {
  const rawMaterialCost = volume * material.costPerCm3;
  const effectiveCost = rawMaterialCost / material.reusageRate;
  return Number(effectiveCost.toFixed(2));
}

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

export function calculateTotalPrice(
  materialCost: number, 
  machineTime: number, 
  postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS = 'BASIC'
): number {
  const postProcessing = POST_PROCESSING_OPTIONS[postProcessingLevel];
  const laborCost = (machineTime + postProcessing.additionalTime) * OPERATING_COSTS.laborRate;
  
  const totalCost = materialCost + 
                   machineTime + 
                   postProcessing.cost + 
                   laborCost;
  
  // Add 20% markup
  const finalPrice = totalCost * 1.2;
  
  return Number(finalPrice.toFixed(2));
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

export class PriceCalculator {
  private partVolume: number;
  private postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS;
  private machine;
  private material;
  private printTime: number;

  constructor(partVolume: number, postProcessingLevel: keyof typeof POST_PROCESSING_OPTIONS = 'BASIC') {
    this.partVolume = partVolume;
    this.postProcessingLevel = postProcessingLevel;
    this.machine = MACHINE_CONSTANTS.HP_JET_FUSION_5200;
    this.material = MATERIALS.PA12;
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
    const volumeCost = effectiveVolume * this.material.costPerCm3;
    const materialEfficiencyCost = volumeCost * (1 - this.material.reusageRate);
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
          costPerCm3: this.material.costPerCm3,
          reusageRate: this.material.reusageRate,
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