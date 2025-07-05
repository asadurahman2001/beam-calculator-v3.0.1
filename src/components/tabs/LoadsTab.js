import React, { useState } from 'react';
import { useUnits } from '../../contexts/UnitContext';

const LoadsTab = ({ beamData, updateBeamData }) => {
  const [activeLoadType, setActiveLoadType] = useState('point');
  const { getUnit, convertValue } = useUnits();

  const addPointLoad = () => {
    const newLoad = { position: 0, magnitude: 0 };
    updateBeamData({
      pointLoads: [...beamData.pointLoads, newLoad]
    });
  };

  const addDistributedLoad = () => {
    const newLoad = {
      startPos: 0,
      endPos: beamData.length,
      startMag: 0,
      endMag: 0
    };
    updateBeamData({
      distributedLoads: [...beamData.distributedLoads, newLoad]
    });
  };

  const removePointLoad = (index) => {
    const newLoads = beamData.pointLoads.filter((_, i) => i !== index);
    updateBeamData({ pointLoads: newLoads });
  };

  const removeDistributedLoad = (index) => {
    const newLoads = beamData.distributedLoads.filter((_, i) => i !== index);
    updateBeamData({ distributedLoads: newLoads });
  };

  const updatePointLoad = (index, field, value) => {
    const newLoads = [...beamData.pointLoads];
    if (field === 'position') {
      // Convert from display units to SI
      newLoads[index] = { ...newLoads[index], [field]: convertValue(value, 'length', null, 'SI') };
    } else if (field === 'magnitude') {
      // Convert from display units to SI
      newLoads[index] = { ...newLoads[index], [field]: convertValue(value, 'force', null, 'SI') };
    } else {
      newLoads[index] = { ...newLoads[index], [field]: value };
    }
    updateBeamData({ pointLoads: newLoads });
  };

  const updateDistributedLoad = (index, field, value) => {
    const newLoads = [...beamData.distributedLoads];
    if (field === 'startPos' || field === 'endPos') {
      // Convert from display units to SI
      newLoads[index] = { ...newLoads[index], [field]: convertValue(value, 'length', null, 'SI') };
    } else if (field === 'startMag' || field === 'endMag') {
      // Convert from display units to SI
      newLoads[index] = { ...newLoads[index], [field]: convertValue(value, 'distributedLoad', null, 'SI') };
    } else {
      newLoads[index] = { ...newLoads[index], [field]: value };
    }
    updateBeamData({ distributedLoads: newLoads });
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveLoadType('point')}
          className={`tab-button ${activeLoadType === 'point' ? 'active' : 'inactive'}`}
        >
          Point Loads
        </button>
        <button
          onClick={() => setActiveLoadType('distributed')}
          className={`tab-button ${activeLoadType === 'distributed' ? 'active' : 'inactive'}`}
        >
          Distributed Loads
        </button>
      </div>

      {activeLoadType === 'point' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Point Loads</h3>
            <button onClick={addPointLoad} className="btn-primary text-sm">
              Add Point Load
            </button>
          </div>

          {beamData.pointLoads.map((load, index) => {
            const displayPosition = convertValue(load.position, 'length', 'SI');
            const displayMagnitude = convertValue(load.magnitude, 'force', 'SI');
            
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Point Load {index + 1}</h4>
                  <button
                    onClick={() => removePointLoad(index)}
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
                      onChange={(e) => updatePointLoad(index, 'position', parseFloat(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Magnitude ({getUnit('force')})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.abs(displayMagnitude).toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const signedValue = load.magnitude >= 0 ? value : -value;
                        updatePointLoad(index, 'magnitude', signedValue);
                      }}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => updatePointLoad(index, 'magnitude', Math.abs(displayMagnitude))}
                    className={`btn-secondary text-sm flex items-center ${load.magnitude >= 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}`}
                  >
                    ⬆️ Upward
                  </button>
                  <button
                    onClick={() => updatePointLoad(index, 'magnitude', -Math.abs(displayMagnitude))}
                    className={`btn-secondary text-sm flex items-center ${load.magnitude < 0 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : ''}`}
                  >
                    ⬇️ Downward
                  </button>
                </div>
              </div>
            );
          })}

          {beamData.pointLoads.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No point loads defined</p>
            </div>
          )}
        </div>
      )}

      {activeLoadType === 'distributed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Distributed Loads</h3>
            <button onClick={addDistributedLoad} className="btn-primary text-sm">
              Add Distributed Load
            </button>
          </div>

          {beamData.distributedLoads.map((load, index) => {
            const displayStartPos = convertValue(load.startPos, 'length', 'SI');
            const displayEndPos = convertValue(load.endPos, 'length', 'SI');
            const displayStartMag = convertValue(load.startMag, 'distributedLoad', 'SI');
            const displayEndMag = convertValue(load.endMag, 'distributedLoad', 'SI');
            
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Distributed Load {index + 1}</h4>
                  <button
                    onClick={() => removeDistributedLoad(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Position ({getUnit('length')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={convertValue(beamData.length, 'length', 'SI')}
                      step="0.1"
                      value={displayStartPos.toFixed(2)}
                      onChange={(e) => updateDistributedLoad(index, 'startPos', parseFloat(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Position ({getUnit('length')})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={convertValue(beamData.length, 'length', 'SI')}
                      step="0.1"
                      value={displayEndPos.toFixed(2)}
                      onChange={(e) => updateDistributedLoad(index, 'endPos', parseFloat(e.target.value) || 0)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Magnitude ({getUnit('distributedLoad')})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.abs(displayStartMag).toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const signedValue = load.startMag >= 0 ? value : -value;
                        updateDistributedLoad(index, 'startMag', signedValue);
                      }}
                      className="input-field"
                    />
                    <div className="mt-2 flex space-x-1">
                      <button
                        onClick={() => updateDistributedLoad(index, 'startMag', Math.abs(displayStartMag))}
                        className={`btn-secondary text-xs flex items-center px-2 py-1 ${load.startMag >= 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        ⬆️ Up
                      </button>
                      <button
                        onClick={() => updateDistributedLoad(index, 'startMag', -Math.abs(displayStartMag))}
                        className={`btn-secondary text-xs flex items-center px-2 py-1 ${load.startMag < 0 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : ''}`}
                      >
                        ⬇️ Down
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Magnitude ({getUnit('distributedLoad')})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.abs(displayEndMag).toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        const signedValue = load.endMag >= 0 ? value : -value;
                        updateDistributedLoad(index, 'endMag', signedValue);
                      }}
                      className="input-field"
                    />
                    <div className="mt-2 flex space-x-1">
                      <button
                        onClick={() => updateDistributedLoad(index, 'endMag', Math.abs(displayEndMag))}
                        className={`btn-secondary text-xs flex items-center px-2 py-1 ${load.endMag >= 0 ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''}`}
                      >
                        ⬆️ Up
                      </button>
                      <button
                        onClick={() => updateDistributedLoad(index, 'endMag', -Math.abs(displayEndMag))}
                        className={`btn-secondary text-xs flex items-center px-2 py-1 ${load.endMag < 0 ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : ''}`}
                      >
                        ⬇️ Down
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Start: {load.startMag > 0 ? 'Upward' : load.startMag < 0 ? 'Downward' : 'No load'} • 
                  End: {load.endMag > 0 ? 'Upward' : load.endMag < 0 ? 'Downward' : 'No load'}
                </div>
              </div>
            );
          })}

          {beamData.distributedLoads.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No distributed loads defined</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadsTab;