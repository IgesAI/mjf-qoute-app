import React, { useState } from 'react';
import ModelViewer from './components/ModelViewer/ModelViewer';
import MaterialSelector from './components/MaterialSelector/MaterialSelector';
import QuoteSummary from './components/QuoteSummary/QuoteSummary';
import {
  PriceCalculator,
  PriceBreakdown,
  ModelMetrics,
  Material
} from './utils/priceCalculator';
import {
  MATERIALS,
  POST_PROCESSING_OPTIONS 
} from './utils/priceConstants';
import QuoteForm from './components/QuoteForm/QuoteForm';

function App() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    volume: 0,
    surfaceArea: 0,
    boundingBox: { x: 0, y: 0, z: 0 }
  });
  const [quoteData, setQuoteData] = useState<PriceBreakdown>({
    materialCost: 0,
    machineCost: 0,
    laborCost: 0,
    powerCost: 0,
    postProcessingCost: 0,
    total: 0,
    printTime: 0,
    breakdown: {
      materialDetails: {
        volume: 0,
        costPerCm3: 0,
        reusageRate: 0,
        effectivePackingDensity: 0
      },
      timeDetails: {
        printTime: 0,
        setupTime: 0,
        postProcessingTime: 0
      }
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setError(null);
    setModelFile(file);
  };

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    calculateQuote(modelMetrics, material);
  };

  const calculateQuote = (metrics: ModelMetrics, material: Material) => {
    if (!metrics || !material) return;

    const calculator = new PriceCalculator(metrics.volume, 'BASIC');
    const quoteData = calculator.calculateTotalPrice();
    setQuoteData(quoteData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">MJF Part Quote Calculator</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {modelFile && (
            <ModelViewer 
              file={modelFile}
              onMetricsCalculated={setModelMetrics}
            />
          )}
          <QuoteForm 
            onFileUpload={handleFileUpload}
          />
        </div>
        <div>
          <MaterialSelector
            onMaterialSelect={handleMaterialSelect}
            selectedMaterial={selectedMaterial}
          />
          <QuoteSummary
            metrics={modelMetrics}
            quoteData={quoteData}
            material={selectedMaterial}
          />
        </div>
      </div>
    </div>
  );
}

export default App; 