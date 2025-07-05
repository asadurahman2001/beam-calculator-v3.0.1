import React from 'react';
import { useUnits } from '../../contexts/UnitContext';

const LengthTab = ({ beamData, updateBeamData }) => {
  const { getUnit, convertValue } = useUnits();

  const handleLengthChange = (e) => {
    const displayValue = parseFloat(e.target.value) || 0;
    // Convert from display units to SI for storage
    const siValue = convertValue(displayValue, 'length', null, 'SI');
    updateBeamData({ length: siValue });
  };

  // Convert from SI to display units
  const displayLength = convertValue(beamData.length, 'length', 'SI');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Beam Length ({getUnit('length')})
        </label>
        <input
          type="number"
          min="1"
          max="1000"
          step="0.1"
          value={displayLength.toFixed(2)}
          onChange={handleLengthChange}
          className="input-field"
          placeholder="Enter beam length"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Specify the total length of the beam in {getUnit('length')}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Beam Length Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Typical range: 3-300 {getUnit('length')}</li>
                <li>Consider practical construction limits</li>
                <li>Longer beams may require intermediate supports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LengthTab;