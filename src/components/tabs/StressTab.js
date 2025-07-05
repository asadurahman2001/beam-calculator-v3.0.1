import React, { useState } from 'react';
import { useUnits } from '../../contexts/UnitContext';

const StressTab = ({ beamData, updateBeamData }) => {
  const { getUnit, convertValue } = useUnits();
  const [stressAnalysisPoint, setStressAnalysisPoint] = useState(beamData.length / 2);
  const [showMaxStress, setShowMaxStress] = useState(true);

  const updateStressAnalysisSettings = (settings) => {
    updateBeamData({
      stressAnalysis: {
        ...beamData.stressAnalysis,
        ...settings
      }
    });
  };

  const calculateSectionProperties = () => {
    const section = beamData.section || {};
    let properties = {
      area: 0,
      momentOfInertia: beamData.materialProperties.I,
      centroidHeight: 0,
      maxDistanceFromCentroid: 0,
      firstMomentOfArea: 0
    };

    switch (section.type) {
      case 'rectangular':
        const b = section.width || 0.3;
        const h = section.height || 0.5;
        properties.area = b * h;
        properties.centroidHeight = h / 2;
        properties.maxDistanceFromCentroid = h / 2;
        properties.firstMomentOfArea = (b * h * h) / 8; // Q = A * y_bar for rectangular section at neutral axis
        break;
      case 'circular':
        const d = section.diameter || 0.4;
        const r = d / 2;
        properties.area = Math.PI * r * r;
        properties.centroidHeight = r;
        properties.maxDistanceFromCentroid = r;
        properties.firstMomentOfArea = (2 * r * r * r) / 3; // Q for circular section at neutral axis
        break;
      case 'i-beam':
        const bf = section.flangeWidth || 0.2;
        const tf = section.flangeThickness || 0.02;
        const hw = section.webHeight || 0.4;
        const tw = section.webThickness || 0.01;
        const totalHeight = hw + 2 * tf;
        properties.area = 2 * bf * tf + tw * hw;
        properties.centroidHeight = totalHeight / 2;
        properties.maxDistanceFromCentroid = totalHeight / 2;
        // Simplified Q calculation for I-beam at neutral axis
        properties.firstMomentOfArea = (bf * tf * (totalHeight / 2 - tf / 2));
        break;
      case 't-beam':
        const bfT = section.flangeWidth || 0.3;
        const tfT = section.flangeThickness || 0.05;
        const hwT = section.webHeight || 0.4;
        const twT = section.webThickness || 0.02;
        const totalHeightT = hwT + tfT;
        
        // Calculate centroid
        const A1 = bfT * tfT;
        const A2 = twT * hwT;
        const y1 = totalHeightT - tfT / 2;
        const y2 = hwT / 2;
        const yBar = (A1 * y1 + A2 * y2) / (A1 + A2);
        
        properties.area = A1 + A2;
        properties.centroidHeight = yBar;
        properties.maxDistanceFromCentroid = Math.max(yBar, totalHeightT - yBar);
        properties.firstMomentOfArea = A1 * Math.abs(y1 - yBar); // Simplified Q calculation
        break;
      default:
        properties.area = 0.15; // Default area
        properties.centroidHeight = 0.25;
        properties.maxDistanceFromCentroid = 0.25;
        properties.firstMomentOfArea = 0.01;
    }

    return properties;
  };

  const sectionProperties = calculateSectionProperties();
  const displayAnalysisPoint = convertValue(stressAnalysisPoint, 'length', 'SI');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Stress Analysis Settings</h3>
        
        <div className="space-y-4">
          {/* Analysis Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analysis Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowMaxStress(true)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showMaxStress
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Maximum Stress
              </button>
              <button
                onClick={() => setShowMaxStress(false)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !showMaxStress
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Point Analysis
              </button>
            </div>
          </div>

          {/* Point Analysis Position */}
          {!showMaxStress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analysis Position ({getUnit('length')})
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={convertValue(beamData.length, 'length', 'SI')}
                  step="0.1"
                  value={displayAnalysisPoint}
                  onChange={(e) => setStressAnalysisPoint(convertValue(parseFloat(e.target.value), 'length', null, 'SI'))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0</span>
                  <span>{convertValue(beamData.length, 'length', 'SI').toFixed(1)} {getUnit('length')}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={convertValue(beamData.length, 'length', 'SI')}
                  step="0.1"
                  value={displayAnalysisPoint}
                  onChange={(e) => setStressAnalysisPoint(convertValue(parseFloat(e.target.value) || 0, 'length', null, 'SI'))}
                  className="input-field w-32"
                />
              </div>
            </div>
          )}

          {/* Stress Analysis Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stress Components to Analyze
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={beamData.stressAnalysis?.showBendingStress !== false}
                  onChange={(e) => updateStressAnalysisSettings({ showBendingStress: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Bending Stress (σ)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={beamData.stressAnalysis?.showShearStress !== false}
                  onChange={(e) => updateStressAnalysisSettings({ showShearStress: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Shear Stress (τ)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={beamData.stressAnalysis?.showStressDistribution !== false}
                  onChange={(e) => updateStressAnalysisSettings({ showStressDistribution: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cross-Section Stress Distribution</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section Properties Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Section Properties for Stress Analysis
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>Cross-sectional Area (A) = {convertValue(sectionProperties.area, 'area', 'SI').toFixed(4)} {getUnit('area')}</div>
              <div>Moment of Inertia (I) = {convertValue(sectionProperties.momentOfInertia, 'inertia', 'SI').toExponential(3)} {getUnit('inertia')}</div>
              <div>Distance to extreme fiber (c) = {convertValue(sectionProperties.maxDistanceFromCentroid, 'length', 'SI').toFixed(3)} {getUnit('length')}</div>
              <div>First Moment of Area (Q) = {convertValue(sectionProperties.firstMomentOfArea, 'firstMoment', 'SI').toExponential(3)} {getUnit('firstMoment')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Formulas */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Stress Calculation Formulas
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
              <div><strong>Bending Stress:</strong> σ = M × y / I</div>
              <div><strong>Maximum Bending Stress:</strong> σ_max = M × c / I</div>
              <div><strong>Shear Stress:</strong> τ = V × Q / (I × t)</div>
              <div className="text-xs mt-2 text-green-600 dark:text-green-400">
                Where: M = Bending Moment, V = Shear Force, y = Distance from neutral axis,<br/>
                c = Distance to extreme fiber, Q = First moment of area, t = Thickness at point
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Settings */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Display Settings</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={beamData.stressAnalysis?.showStressDiagrams !== false}
              onChange={(e) => updateStressAnalysisSettings({ showStressDiagrams: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Stress Diagrams (SSD & BSD)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={beamData.stressAnalysis?.showStressValues !== false}
              onChange={(e) => updateStressAnalysisSettings({ showStressValues: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Show Stress Values on Diagrams</span>
          </label>
        </div>
      </div>

      {/* Current Analysis Point Info */}
      {!showMaxStress && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Analysis Point: {displayAnalysisPoint.toFixed(2)} {getUnit('length')}
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Stress values will be calculated at this position along the beam length.
            Cross-section stress distribution will show how stresses vary across the beam height at this location.
          </div>
        </div>
      )}
    </div>
  );
};

export default StressTab;