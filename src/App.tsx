import React, { useState } from 'react';
import Header from './components/Header/Header';
import ModelViewer from './components/ModelViewer/ModelViewer';
import MaterialSelector from './components/MaterialSelector/MaterialSelector';
import QuoteSummary from './components/QuoteSummary/QuoteSummary';
import {
  PriceCalculator,
  PriceBreakdown,
  ModelMetrics,
} from './utils/priceCalculator';
import { MATERIAL } from './utils/priceConstants';
import QuoteForm from './components/QuoteForm/QuoteForm';

function App() {
  const [modelFile, setModelFile] = useState<File | null>(null);
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

  const calculateQuote = (metrics: ModelMetrics) => {
    if (!metrics) return;

    const calculator = new PriceCalculator(metrics.volume, 'BASIC');
    const quoteData = calculator.calculateTotalPrice();
    setQuoteData(quoteData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
          </div>
          <div>
            <MaterialSelector />
            <QuoteSummary
              metrics={modelMetrics}
              quoteData={quoteData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 