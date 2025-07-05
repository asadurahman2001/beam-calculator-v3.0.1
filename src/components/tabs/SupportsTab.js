import React from 'react';
import { useUnits } from '../../contexts/UnitContext';

const SupportsTab = ({ beamData, updateBeamData }) => {
  const supportTypes = ['Fixed', 'Hinge', 'Roller', 'Internal Hinge'];
  const { getUnit, convertValue } = useUnits();

  const addSupport = () => {
    if (beamData.supports.length < 3) {
      const newSupport = {
        type: 'Hinge',
        position: beamData.supports.length === 0 ? 0 : beamData.length
      };
      updateBeamData({
        supports: [...beamData.supports, newSupport]
      });
    }
  };

  const removeSupport = (index) => {
    const newSupports = beamData.supports.filter((_, i) => i !== index);
    updateBeamData({ supports: newSupports });
  };

  const updateSupport = (index, field, value) => {
    const newSupports = [...beamData.supports];
    if (field === 'position') {
      // Convert from display units to SI
      newSupports[index] = { ...newSupports[index], [field]: convertValue(value, 'length', null, 'SI') };
    } else {
      newSupports[index] = { ...newSupports[index], [field]: value };
    }
    updateBeamData({ supports: newSupports });
  };

  const getSupportDescription = (type) => {
    switch (type) {
      case 'Fixed':
        return 'Prevents translation and rotation';
      case 'Hinge':
        return 'Prevents translation, allows rotation';
      case 'Roller':
        return 'Prevents vertical translation only';
      case 'Internal Hinge':
        return 'Allows rotation at internal point, creates moment discontinuity';
      default:
        return '';
    }
  };

  const getMaxSupports = () => {
    const hasInternalHinge = beamData.supports.some(s => s.type === 'Internal Hinge');
    return hasInternalHinge ? 3 : 2;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Support Configuration</h3>
        {beamData.supports.length < getMaxSupports() && (
          <button onClick={addSupport} className="btn-primary text-sm">
            Add Support
          </button>
        )}
      </div>

      <div className="space-y-4">
        {beamData.supports.map((support, index) => {
          const displayPosition = convertValue(support.position, 'length', 'SI');
          
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {support.type === 'Internal Hinge' ? 'Internal Hinge' : `Support ${index + 1}`}
                </h4>
                {beamData.supports.length > 1 && (
                  <button
                    onClick={() => removeSupport(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Support Type
                  </label>
                  <select
                    value={support.type}
                    onChange={(e) => updateSupport(index, 'type', e.target.value)}
                    className="input-field"
                  >
                    {supportTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position ({getUnit('length')})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={convertValue(beamData.length, 'length', 'SI')}
                    step="0.1"
                    value={displayPosition.toFixed(2)}
                    onChange={(e) => updateSupport(index, 'position', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {getSupportDescription(support.type)}
              </div>

              {support.type === 'Internal Hinge' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <h4 className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Internal Hinge Note</h4>
                      <div className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                        Internal hinges create moment discontinuity and require additional supports for stability.
                        Position must be between 0 and beam length (not at ends).
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {beamData.supports.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p>No supports defined</p>
          <p className="text-sm">Add at least one support to analyze the beam</p>
        </div>
      )}

      {/* Support Configuration Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Support Configuration Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Fixed:</strong> Use at beam ends for cantilever beams</li>
                <li><strong>Hinge/Roller:</strong> Standard supports for simply supported beams</li>
                <li><strong>Internal Hinge:</strong> Creates moment release at internal points</li>
                <li>Internal hinges require at least 3 supports for stability</li>
                <li>Maximum 3 supports total (including internal hinges)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportsTab;