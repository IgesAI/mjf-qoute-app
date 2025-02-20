import React, { useState, useCallback } from 'react';
import Header from './components/Header/Header';
import ModelViewer from './components/ModelViewer/ModelViewer';
import MaterialSelector from './components/MaterialSelector/MaterialSelector';
import QuoteSummary from './components/QuoteSummary/QuoteSummary';
import {
  PriceCalculator,
  PriceBreakdown,
  ModelMetrics,
} from './utils/priceCalculator';
import { analyzeSTLFile } from './utils/modelAnalyzer';
import QuoteForm from './components/QuoteForm/QuoteForm';

function App() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    volume: 0,
    surfaceArea: 0,
    boundingBox: { x: 0, y: 0, z: 0 }
  });
  const [quoteData, setQuoteData] = useState<PriceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setModelFile(file);
      setError(null);

      // Analyze the STL file
      const metrics = await analyzeSTLFile(file);
      setModelMetrics(metrics);

      // Calculate price
      const calculator = new PriceCalculator(metrics.volume);
      const priceData = calculator.calculateTotalPrice();
      setQuoteData(priceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      console.error('Error processing file:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <QuoteForm onFileUpload={handleFileUpload} />
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="card p-4">
              {modelFile && (
                <ModelViewer 
                  file={modelFile}
                  onMetricsCalculated={setModelMetrics}
                />
              )}
            </div>
          </div>
          <div className="space-y-6">
            <MaterialSelector />
            {quoteData && (
              <QuoteSummary
                metrics={modelMetrics}
                quoteData={quoteData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 