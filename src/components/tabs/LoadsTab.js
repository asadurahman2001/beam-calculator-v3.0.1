import React, { useState } from 'react';
import { useUnits } from '../../contexts/UnitContext';

const LoadsTab = ({ beamData, updateBeamData }) => {
  const [activeLoadType, setActiveLoadType] = useState('point');
  const { getUnit, convertValue } = useUnits();

  const addPointLoad = () => {
    const newLoad = { position: 0, magnitude: 0, angle: 0, isInclined: false };
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
    } else if (field === 'angle') {
      // Angle is in degrees, no conversion needed
      newLoads[index] = { ...newLoads[index], [field]: value };
    } else if (field === 'isInclined') {
      // Boolean field
      newLoads[index] = { ...newLoads[index], [field]: value };
      // Reset angle when switching to vertical
      if (!value) {
        newLoads[index] = { ...newLoads[index], angle: 0 };
      }
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

  // Component for angle visualization
  const AngleVisualizer = ({ angle, magnitude }) => {
    const size = 80;
    const center = size / 2;
    const radius = 25;
    
    // Convert angle to radians and adjust for SVG coordinate system
    const angleRad = (angle * Math.PI) / 180;
    const endX = center + radius * Math.sin(angleRad);
    const endY = center - radius * Math.cos(angleRad);
    
    // Arrow head points
    const headLength = 8;
    const headAngle = Math.PI / 6;
    const head1X = endX - headLength * Math.cos(angleRad - headAngle);
    const head1Y = endY + headLength * Math.sin(angleRad - headAngle);
    const head2X = endX - headLength * Math.cos(angleRad + headAngle);
    const head2Y = endY + headLength * Math.sin(angleRad + headAngle);
    
    return (
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-600" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Center point */}
          <circle cx={center} cy={center} r="2" fill="currentColor" className="text-gray-600 dark:text-gray-400" />
          
          {/* Vertical reference line */}
          <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="text-gray-400 dark:text-gray-500" />
          
          {/* Load arrow */}
          <line x1={center} y1={center} x2={endX} y2={endY} stroke="#ef4444" strokeWidth="2" />
          
          {/* Arrow head */}
          <polygon points={`${endX},${endY} ${head1X},${head1Y} ${head2X},${head2Y}`} fill="#ef4444" />
          
          {/* Angle arc */}
          {angle !== 0 && (
            <path
              d={`M ${center} ${center - 15} A 15 15 0 0 ${angle > 0 ? 1 : 0} ${center + 15 * Math.sin(angleRad)} ${center - 15 * Math.cos(angleRad)}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
            />
          )}
          
          {/* Angle text */}
          {angle !== 0 && (
            <text x={center + 20} y={center - 5} fontSize="10" fill="currentColor" className="text-blue-600 dark:text-blue-400">
              {Math.abs(angle)}°
            </text>
          )}
          
          {/* Magnitude text */}
          <text x={center} y={size - 5} fontSize="8" textAnchor="middle" fill="currentColor" className="text-gray-600 dark:text-gray-400">
            {Math.abs(magnitude).toFixed(1)} {getUnit('force')}
          </text>
        </svg>
      </div>
    );
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
            const angle = load.angle || 0;
            const isInclined = load.isInclined || false;
            
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

                <div className="space-y-6">
                  {/* Load Type Selection with Modern Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Load Type
                    </label>
                    <div className="relative inline-flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updatePointLoad(index, 'isInclined', false)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          !isInclined
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          Vertical
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePointLoad(index, 'isInclined', true)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          isInclined
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                          </svg>
                          Inclined
                        </span>
                      </button>
                    </div>
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
                        value={displayPosition}
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
                        value={Math.abs(displayMagnitude)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          const signedValue = load.magnitude >= 0 ? value : -value;
                          updatePointLoad(index, 'magnitude', signedValue);
                        }}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Angle input for inclined loads with modern slider */}
                  {isInclined && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Angle from Vertical: {angle}°
                        </label>
                        <div className="space-y-3">
                          {/* Angle Slider */}
                          <div className="relative">
                            <input
                              type="range"
                              min="-90"
                              max="90"
                              step="1"
                              value={angle}
                              onChange={(e) => updatePointLoad(index, 'angle', parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #ef4444 0%, #3b82f6 50%, #ef4444 100%)`
                              }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>-90° (Left)</span>
                              <span>0° (Vertical)</span>
                              <span>90° (Right)</span>
                            </div>
                          </div>
                          
                          {/* Precise angle input */}
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="-90"
                              max="90"
                              step="1"
                              value={angle}
                              onChange={(e) => updatePointLoad(index, 'angle', parseFloat(e.target.value) || 0)}
                              className="input-field w-20 text-center"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">degrees</span>
                            
                            {/* Quick angle buttons */}
                            <div className="flex space-x-1 ml-4">
                              {[-45, -30, 0, 30, 45].map(quickAngle => (
                                <button
                                  key={quickAngle}
                                  onClick={() => updatePointLoad(index, 'angle', quickAngle)}
                                  className={`px-2 py-1 text-xs rounded transition-colors ${
                                    angle === quickAngle
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                  }`}
                                >
                                  {quickAngle}°
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual representation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Load Direction Preview
                        </label>
                        <AngleVisualizer angle={angle} magnitude={displayMagnitude} />
                      </div>
                    </div>
                  )}

                  {/* Direction buttons for vertical loads only */}
                  {!isInclined && (
                    <div className="flex space-x-2">
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
                  )}

                  {/* Load description with components */}
                  {isInclined && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Inclined Load: {Math.abs(displayMagnitude).toFixed(2)} {getUnit('force')} at {angle}°
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">
                              Vertical: {(Math.abs(displayMagnitude) * Math.cos(angle * Math.PI / 180)).toFixed(2)} {getUnit('force')} {load.magnitude >= 0 ? '↑' : '↓'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">
                              Horizontal: {(Math.abs(displayMagnitude) * Math.sin(angle * Math.PI / 180)).toFixed(2)} {getUnit('force')} {angle >= 0 ? '→' : '←'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {beamData.pointLoads.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p>No point loads defined</p>
              <p className="text-sm">Add point loads to analyze forces on the beam</p>
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
                      value={displayStartPos}
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
                      value={displayEndPos}
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
                      value={Math.abs(displayStartMag)}
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
                      value={Math.abs(displayEndMag)}
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
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p>No distributed loads defined</p>
              <p className="text-sm">Add distributed loads for continuous loading along the beam</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadsTab;