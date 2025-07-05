import React from 'react';
import { useUnits } from '../../contexts/UnitContext';

const MomentsTab = ({ beamData, updateBeamData }) => {
  const { getUnit, convertValue } = useUnits();

  const addMoment = () => {
    const newMoment = { position: 0, magnitude: 0 };
    updateBeamData({
      moments: [...beamData.moments, newMoment]
    });
  };

  const removeMoment = (index) => {
    const newMoments = beamData.moments.filter((_, i) => i !== index);
    updateBeamData({ moments: newMoments });
  };

  const updateMoment = (index, field, value) => {
    const newMoments = [...beamData.moments];
    if (field === 'position') {
      // Convert from display units to SI
      newMoments[index] = { ...newMoments[index], [field]: convertValue(value, 'length', null, 'SI') };
    } else if (field === 'magnitude') {
      // Convert from display units to SI
      newMoments[index] = { ...newMoments[index], [field]: convertValue(value, 'moment', null, 'SI') };
    } else {
      newMoments[index] = { ...newMoments[index], [field]: value };
    }
    updateBeamData({ moments: newMoments });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Applied Moments</h3>
        <button onClick={addMoment} className="btn-primary text-sm">
          Add Moment
        </button>
      </div>

      <div className="space-y-4">
        {beamData.moments.map((moment, index) => {
          const displayPosition = convertValue(moment.position, 'length', 'SI');
          const displayMagnitude = convertValue(moment.magnitude, 'moment', 'SI');
          
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Moment {index + 1}</h4>
                <button
                  onClick={() => removeMoment(index)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    onChange={(e) => updateMoment(index, 'position', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Magnitude ({getUnit('moment')})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={Math.abs(displayMagnitude).toFixed(2)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const signedValue = moment.magnitude >= 0 ? value : -value;
                      updateMoment(index, 'magnitude', signedValue);
                    }}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => updateMoment(index, 'magnitude', Math.abs(displayMagnitude))}
                  className={`btn-secondary text-sm flex items-center ${moment.magnitude >= 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}`}
                >
                  🔄 Clockwise
                </button>
                <button
                  onClick={() => updateMoment(index, 'magnitude', -Math.abs(displayMagnitude))}
                  className={`btn-secondary text-sm flex items-center ${moment.magnitude < 0 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : ''}`}
                >
                  🔄 Counter-clockwise
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {moment.magnitude > 0 ? 'Clockwise moment' : moment.magnitude < 0 ? 'Counter-clockwise moment' : 'No moment applied'}
              </div>
            </div>
          );
        })}
      </div>

      {beamData.moments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p>No moments defined</p>
          <p className="text-sm">Add applied moments to the beam</p>
        </div>
      )}
    </div>
  );
};

export default MomentsTab;