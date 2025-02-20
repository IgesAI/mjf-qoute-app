import React from 'react';
import { ModelMetrics, PriceBreakdown } from '../../utils/priceCalculator';
import { OPERATING_COSTS, MATERIAL } from '../../utils/priceConstants';

interface QuoteSummaryProps {
  metrics: ModelMetrics;
  quoteData: PriceBreakdown;
}

const QuoteSummary: React.FC<QuoteSummaryProps> = ({ metrics, quoteData }) => {
  if (!quoteData) return null;

  const { materialCost, machineCost, laborCost, powerCost, postProcessingCost, total, printTime } = quoteData;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Quote Summary</h2>
      
      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Print Details</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>Part Volume:</div>
            <div>{metrics.volume.toFixed(2)} cm³</div>
            <div>Print Time:</div>
            <div>{printTime.toFixed(2)} hours</div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Cost Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Material Cost:</span>
              <span>${materialCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Machine Cost:</span>
              <span>${machineCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Cost:</span>
              <span>${laborCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Power Cost:</span>
              <span>${powerCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Post-Processing:</span>
              <span>${postProcessingCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between text-xl font-bold">
            <span>Total Price:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>* Prices include material reuse rate of {(MATERIAL.reusageRate * 100).toFixed(0)}%</p>
          <p>* Setup time: {OPERATING_COSTS.setupTimeBase} hours</p>
          <p>* Post-processing time: {OPERATING_COSTS.postProcessingTimeBase} hours</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary; 