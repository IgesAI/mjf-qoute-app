import React from 'react';
import { MATERIALS } from '../../utils/priceConstants';
import { Material } from '../../utils/priceCalculator';

interface MaterialSelectorProps {
  onMaterialSelect: (material: Material) => void;
  selectedMaterial: Material | null;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({ onMaterialSelect, selectedMaterial }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Select Material</h2>
      <div className="space-y-4">
        {Object.entries(MATERIALS).map(([key, material]) => (
          <button
            key={key}
            className={`w-full p-4 rounded-lg border ${
              selectedMaterial?.name === material.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => onMaterialSelect(material)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{material.name}</span>
              <span className="text-gray-600">${material.costPerCm3}/cm³</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              <div>Reusage Rate: {material.reusageRate * 100}%</div>
              <div>Density: {material.density} g/cm³</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MaterialSelector; 