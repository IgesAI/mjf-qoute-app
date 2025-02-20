export interface MachineParameters {
  hourlyRate: number;
  powerConsumption: {
    printing: number;
    cooling: number;
    standby: number;
  };
  maintenanceCost: number;
  printHeadLife: number;
  printHeadCost: number;
  filterLifespan: number;
  filterCost: number;
}

export interface MaterialProperties {
  baseCost: number;
  reusageRate: number;
  density: number;
  wasteFactor: {
    base: number;
    complexityMultiplier: number;
  };
}

export interface ProcessingParameters {
  printing: number;
  cooling: number;
  postProcessing: number;
  setup: number;
}