import React from 'react';
import { useUnits } from '../../contexts/UnitContext';

const MaterialTab = ({ beamData, updateBeamData, resolution, setResolution }) => {
  const { getUnit, convertValue } = useUnits();

  const updateMaterialProperty = (property, value) => {
    let siValue = value;
    if (property === 'E') {
      // Convert from display units to SI
      siValue = convertValue(value, 'stress', null, 'SI');
    } else if (property === 'I') {
      // Convert from display units to SI
      siValue = convertValue(value, 'inertia', null, 'SI');
    }
    
    updateBeamData({
      materialProperties: {
        ...beamData.materialProperties,
        [property]: siValue
      }
    });
  };

  const materialPresets = [
    { name: 'Steel', E: 2e8, description: 'Structural steel (200 GPa)' },
    { name: 'Concrete', E: 3e7, description: 'Normal concrete (30 GPa)' },
    { name: 'Aluminum', E: 7e7, description: 'Aluminum alloy (70 GPa)' },
    { name: 'Wood', E: 1.2e7, description: 'Softwood timber (12 GPa)' }
  ];

  const applyPreset = (preset) => {
    updateMaterialProperty('E', convertValue(preset.E, 'stress', 'SI'));
  };

  // Convert from SI to display units
  const displayE = convertValue(beamData.materialProperties.E, 'stress', 'SI');
  const displayI = convertValue(beamData.materialProperties.I, 'inertia', 'SI');
  const displayEI = convertValue(beamData.materialProperties.E * beamData.materialProperties.I, 'moment', 'SI');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Material Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Young's Modulus E ({getUnit('stress')})
            </label>
            <input
              type="number"
              min="1e6"
              max="1e9"
              step="1e6"
              value={displayE.toFixed(0)}
              onChange={(e) => updateMaterialProperty('E', parseFloat(e.target.value) || 0)}
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Elastic modulus of the beam material
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Moment of Inertia I ({getUnit('inertia')})
            </label>
            <input
              type="number"
              min="1e-8"
              max="1e-2"
              step="1e-8"
              value={displayI.toExponential(2)}
              onChange={(e) => updateMaterialProperty('I', parseFloat(e.target.value) || 0)}
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Second moment of area of the beam cross-section
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Material Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          {materialPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Analysis Settings</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Resolution (points per meter)
          </label>
          <input
            type="number"
            min="10"
            max="1000"
            step="10"
            value={resolution}
            onChange={(e) => setResolution(parseInt(e.target.value) || 100)}
            className="input-field"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Higher resolution provides more accurate results but slower calculation
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Flexural Rigidity (EI)
            </h3>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Current EI = {displayEI.toExponential(2)} {getUnit('moment')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialTab;