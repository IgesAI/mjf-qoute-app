import React from 'react';
import { MATERIAL } from '../../utils/priceConstants';

const MaterialSelector: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Material Specifications</h2>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium">{MATERIAL.name}</span>
            <span className="text-gray-600">${MATERIAL.costPerCm3}/cm³</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            <div>Reusage Rate: {MATERIAL.reusageRate * 100}%</div>
            <div>Density: {MATERIAL.density} g/cm³</div>
            <div>Color: {MATERIAL.color}</div>
            <p className="mt-2">{MATERIAL.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialSelector; 