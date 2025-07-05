import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useUnits } from '../../contexts/UnitContext';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StressAnalysis = ({ beamData, results }) => {
  const { convertValue, getUnit } = useUnits();
  const { isDarkMode } = useTheme();
  const [chartKey, setChartKey] = useState(0);
  const [analysisPosition, setAnalysisPosition] = useState(beamData.length / 2);

  // Force chart re-render when theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [isDarkMode]);

  const calculateSectionProperties = () => {
    const section = beamData.section || {};
    let properties = {
      area: 0,
      momentOfInertia: beamData.materialProperties.I,
      centroidHeight: 0,
      maxDistanceFromCentroid: 0,
      thickness: 0,
      firstMomentOfArea: 0
    };

    switch (section.type) {
      case 'rectangular':
        const b = section.width || 0.3;
        const h = section.height || 0.5;
        properties.area = b * h;
        properties.centroidHeight = h / 2;
        properties.maxDistanceFromCentroid = h / 2;
        properties.thickness = b;
        properties.firstMomentOfArea = (b * h * h) / 8;
        break;
      case 'circular':
        const d = section.diameter || 0.4;
        const r = d / 2;
        properties.area = Math.PI * r * r;
        properties.centroidHeight = r;
        properties.maxDistanceFromCentroid = r;
        properties.thickness = d; // Diameter at neutral axis
        properties.firstMomentOfArea = (2 * r * r * r) / 3;
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
        properties.thickness = tw; // Web thickness
        properties.firstMomentOfArea = bf * tf * (totalHeight / 2 - tf / 2);
        break;
      case 't-beam':
        const bfT = section.flangeWidth || 0.3;
        const tfT = section.flangeThickness || 0.05;
        const hwT = section.webHeight || 0.4;
        const twT = section.webThickness || 0.02;
        const totalHeightT = hwT + tfT;
        
        const A1 = bfT * tfT;
        const A2 = twT * hwT;
        const y1 = totalHeightT - tfT / 2;
        const y2 = hwT / 2;
        const yBar = (A1 * y1 + A2 * y2) / (A1 + A2);
        
        properties.area = A1 + A2;
        properties.centroidHeight = yBar;
        properties.maxDistanceFromCentroid = Math.max(yBar, totalHeightT - yBar);
        properties.thickness = twT;
        properties.firstMomentOfArea = A1 * Math.abs(y1 - yBar);
        break;
      default:
        properties.area = 0.15;
        properties.centroidHeight = 0.25;
        properties.maxDistanceFromCentroid = 0.25;
        properties.thickness = 0.3;
        properties.firstMomentOfArea = 0.01;
    }

    return properties;
  };

  const calculateStresses = () => {
    if (results.shearForce.x.length === 0) return { bendingStress: [], shearStress: [] };

    const sectionProps = calculateSectionProperties();
    const bendingStress = [];
    const shearStress = [];

    for (let i = 0; i < results.shearForce.x.length; i++) {
      const moment = results.bendingMoment.y[i];
      const shearForce = results.shearForce.y[i];

      // Bending stress (maximum at extreme fiber)
      const maxBendingStress = Math.abs(moment * sectionProps.maxDistanceFromCentroid / sectionProps.momentOfInertia);
      
      // Shear stress (maximum at neutral axis for most sections)
      const maxShearStress = Math.abs(shearForce * sectionProps.firstMomentOfArea / (sectionProps.momentOfInertia * sectionProps.thickness));

      bendingStress.push(maxBendingStress);
      shearStress.push(maxShearStress);
    }

    return { bendingStress, shearStress };
  };

  const calculateStressAtPosition = (position) => {
    if (results.shearForce.x.length === 0) return { bendingStress: 0, shearStress: 0, moment: 0, shearForce: 0 };

    // Find the closest index to the analysis position
    const index = results.shearForce.x.findIndex(x => x >= position);
    const actualIndex = index === -1 ? results.shearForce.x.length - 1 : index;

    const sectionProps = calculateSectionProperties();
    const moment = results.bendingMoment.y[actualIndex];
    const shearForce = results.shearForce.y[actualIndex];

    const maxBendingStress = Math.abs(moment * sectionProps.maxDistanceFromCentroid / sectionProps.momentOfInertia);
    const maxShearStress = Math.abs(shearForce * sectionProps.firstMomentOfArea / (sectionProps.momentOfInertia * sectionProps.thickness));

    return {
      bendingStress: maxBendingStress,
      shearStress: maxShearStress,
      moment: Math.abs(moment),
      shearForce: Math.abs(shearForce)
    };
  };

  const generateCrossSectionStressDistribution = (position) => {
    const stressAtPos = calculateStressAtPosition(position);
    const sectionProps = calculateSectionProperties();
    const points = 50;
    const distribution = [];

    // Generate stress distribution across the height of the section
    for (let i = 0; i <= points; i++) {
      const y = (i / points) * (2 * sectionProps.maxDistanceFromCentroid) - sectionProps.maxDistanceFromCentroid;
      
      // Bending stress varies linearly from neutral axis
      const bendingStress = stressAtPos.moment * Math.abs(y) / sectionProps.momentOfInertia;
      
      // Shear stress varies parabolically for rectangular sections (simplified)
      let shearStress = 0;
      if (beamData.section?.type === 'rectangular') {
        const h = sectionProps.maxDistanceFromCentroid * 2;
        shearStress = stressAtPos.shearForce * (1 - Math.pow(y / (h/2), 2)) * 1.5 / sectionProps.area;
      } else {
        // Simplified for other sections - maximum at neutral axis
        shearStress = stressAtPos.shearForce * (1 - Math.abs(y) / sectionProps.maxDistanceFromCentroid) / sectionProps.area;
      }

      distribution.push({
        y: y,
        bendingStress: bendingStress,
        shearStress: Math.max(0, shearStress)
      });
    }

    return distribution;
  };

  const { bendingStress, shearStress } = calculateStresses();
  const displayXCoords = results.shearForce.x.map(x => convertValue(x, 'length', 'SI'));
  const displayBendingStress = bendingStress.map(stress => convertValue(stress, 'stress', 'SI'));
  const displayShearStress = shearStress.map(stress => convertValue(stress, 'stress', 'SI'));

  const stressAtAnalysisPoint = calculateStressAtPosition(analysisPosition);
  const crossSectionDistribution = generateCrossSectionStressDistribution(analysisPosition);

  // Chart options
  const getChartOptions = (yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#6b7280' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            const xValue = parseFloat(context[0].label);
            const displayX = convertValue(xValue, 'length', 'SI');
            return `Position: ${displayX.toFixed(2)} ${getUnit('length')}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: `Position along beam (${getUnit('length')})`,
          color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
          color: isDarkMode ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#d1d5db' : '#6b7280'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });

  const bendingStressData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Bending Stress (${getUnit('stress')})`,
        data: displayBendingStress,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const shearStressData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Shear Stress (${getUnit('stress')})`,
        data: displayShearStress,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  // Cross-section stress distribution data
  const crossSectionBendingData = {
    labels: crossSectionDistribution.map(point => convertValue(point.y, 'length', 'SI').toFixed(3)),
    datasets: [
      {
        label: `Bending Stress (${getUnit('stress')})`,
        data: crossSectionDistribution.map(point => convertValue(point.bendingStress, 'stress', 'SI')),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      }
    ]
  };

  const crossSectionShearData = {
    labels: crossSectionDistribution.map(point => convertValue(point.y, 'length', 'SI').toFixed(3)),
    datasets: [
      {
        label: `Shear Stress (${getUnit('stress')})`,
        data: crossSectionDistribution.map(point => convertValue(point.shearStress, 'stress', 'SI')),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
      }
    ]
  };

  const displayAnalysisPosition = convertValue(analysisPosition, 'length', 'SI');

  return (
    <div className="space-y-6">
      {/* Analysis Position Control */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Analysis Position</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analysis Position: {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
            </label>
            <input
              type="range"
              min="0"
              max={convertValue(beamData.length, 'length', 'SI')}
              step="0.1"
              value={displayAnalysisPosition}
              onChange={(e) => setAnalysisPosition(convertValue(parseFloat(e.target.value), 'length', null, 'SI'))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0</span>
              <span>{convertValue(beamData.length, 'length', 'SI').toFixed(1)} {getUnit('length')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Values at Analysis Point */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Maximum Bending Stress</h4>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {convertValue(stressAtAnalysisPoint.bendingStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            at position {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </div>
          <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
            Moment: {convertValue(stressAtAnalysisPoint.moment, 'moment', 'SI').toFixed(2)} {getUnit('moment')}
          </div>
        </div>
        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Maximum Shear Stress</h4>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {convertValue(stressAtAnalysisPoint.shearStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400">
            at position {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </div>
          <div className="text-xs text-amber-500 dark:text-amber-400 mt-1">
            Shear Force: {convertValue(stressAtAnalysisPoint.shearForce, 'force', 'SI').toFixed(2)} {getUnit('force')}
          </div>
        </div>
      </div>

      {/* Bending Stress Diagram (BSD) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bending Stress Diagram (BSD)</h3>
        <div className="h-80">
          {results.shearForce.x.length > 0 ? (
            <Line 
              key={`bsd-${chartKey}`}
              data={bendingStressData} 
              options={{
                ...getChartOptions(`Bending Stress (${getUnit('stress')})`),
                indexAxis: 'y',
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: true,
                      text: `Bending Stress (${getUnit('stress')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }
                  },
                  y: {
                    display: true,
                    title: {
                      display: true,
                      text: `Position along beam (${getUnit('length')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }
                  }
                }
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the bending stress diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shear Stress Diagram (SSD) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shear Stress Diagram (SSD)</h3>
        <div className="h-80">
          {results.shearForce.x.length > 0 ? (
            <Line 
              key={`ssd-${chartKey}`}
              data={shearStressData} 
              options={{
                ...getChartOptions(`Shear Stress (${getUnit('stress')})`),
                indexAxis: 'y',
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: true,
                      text: `Shear Stress (${getUnit('stress')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }
                  },
                  y: {
                    display: true,
                    title: {
                      display: true,
                      text: `Position along beam (${getUnit('length')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    },
                    grid: {
                      display: true,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                      color: isDarkMode ? '#d1d5db' : '#6b7280'
                    }
                  }
                }
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the shear stress diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stress Diagrams and Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bending Stress Diagram - Vertical */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bending Stress Diagram (BSD)
          </h3>
          <div className="h-96">
            {results.shearForce.x.length > 0 ? (
              <Line 
                key={`bsd-vertical-${chartKey}`}
                data={bendingStressData} 
                options={{
                  ...getChartOptions(`Bending Stress (${getUnit('stress')})`),
                  indexAxis: 'y',
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: `Bending Stress (${getUnit('stress')})`,
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      },
                      grid: {
                        display: true,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? '#d1d5db' : '#6b7280'
                      }
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: `Position (${getUnit('length')})`,
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      },
                      grid: {
                        display: true,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? '#d1d5db' : '#6b7280'
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No data to display</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Visualization */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cross-Section at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </h3>
          <div className="flex flex-col items-center justify-center h-96">
            {/* Section Preview */}
            <div className="mb-6">
              <svg width="200" height="200" viewBox="0 0 200 200" className="border border-gray-300 dark:border-gray-600 rounded">
                {(beamData.section?.type || 'rectangular') === 'rectangular' && (
                  <>
                    <rect
                      x="50"
                      y="50"
                      width="100"
                      height="100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600 dark:text-blue-400"
                    />
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                    <text x="175" y="105" fontSize="10" fill="currentColor" className="text-yellow-600 dark:text-yellow-400">
                      N.A.
                    </text>
                    {/* Stress arrows for bending */}
                    <g className="text-purple-600 dark:text-purple-400">
                      {/* Compression arrows (top) */}
                      <polygon points="45,60 40,55 40,65" fill="currentColor" />
                      <polygon points="155,60 160,55 160,65" fill="currentColor" />
                      <line x1="40" y1="60" x2="160" y2="60" stroke="currentColor" strokeWidth="1" />
                      <text x="100" y="45" fontSize="8" textAnchor="middle" fill="currentColor">Compression</text>
                      
                      {/* Tension arrows (bottom) */}
                      <polygon points="40,140 45,135 45,145" fill="currentColor" />
                      <polygon points="160,140 155,135 155,145" fill="currentColor" />
                      <line x1="40" y1="140" x2="160" y2="140" stroke="currentColor" strokeWidth="1" />
                      <text x="100" y="165" fontSize="8" textAnchor="middle" fill="currentColor">Tension</text>
                    </g>
                  </>
                )}
                {(beamData.section?.type) === 'circular' && (
                  <>
                    <circle
                      cx="100"
                      cy="100"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600 dark:text-blue-400"
                    />
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                  </>
                )}
                {(beamData.section?.type) === 'i-beam' && (
                  <>
                    <g className="text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                      {/* Top flange */}
                      <rect x="40" y="50" width="120" height="20" />
                      {/* Web */}
                      <rect x="90" y="70" width="20" height="60" />
                      {/* Bottom flange */}
                      <rect x="40" y="130" width="120" height="20" />
                    </g>
                    {/* Neutral axis */}
                    <line
                      x1="30"
                      y1="100"
                      x2="170"
                      y2="100"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-yellow-500"
                    />
                  </>
                )}
              </svg>
            </div>
            
            {/* Stress values at this position */}
            <div className="text-center space-y-2">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Max Bending Stress: {convertValue(stressAtAnalysisPoint.bendingStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
              </div>
              <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Max Shear Stress: {convertValue(stressAtAnalysisPoint.shearStress, 'stress', 'SI').toFixed(2)} {getUnit('stress')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                M = {convertValue(stressAtAnalysisPoint.moment, 'moment', 'SI').toFixed(2)} {getUnit('moment')}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                V = {convertValue(stressAtAnalysisPoint.shearForce, 'force', 'SI').toFixed(2)} {getUnit('force')}
              </div>
            </div>
          </div>
        </div>

        {/* Shear Stress Diagram - Vertical */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Shear Stress Diagram (SSD)
          </h3>
          <div className="h-96">
            {results.shearForce.x.length > 0 ? (
              <Line 
                key={`ssd-vertical-${chartKey}`}
                data={shearStressData} 
                options={{
                  ...getChartOptions(`Shear Stress (${getUnit('stress')})`),
                  indexAxis: 'y',
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: `Shear Stress (${getUnit('stress')})`,
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      },
                      grid: {
                        display: true,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? '#d1d5db' : '#6b7280'
                      }
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: `Position (${getUnit('length')})`,
                        color: isDarkMode ? '#e5e7eb' : '#374151'
                      },
                      grid: {
                        display: true,
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? '#d1d5db' : '#6b7280'
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p>No data to display</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Section Stress Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bending Stress Distribution at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </h3>
          <div className="h-64">
            <Line 
              key={`cross-bending-${chartKey}`}
              data={crossSectionBendingData} 
              options={{
                ...getChartOptions(`Bending Stress (${getUnit('stress')})`),
                scales: {
                  ...getChartOptions().scales,
                  x: {
                    ...getChartOptions().scales.x,
                    title: {
                      display: true,
                      text: `Distance from Neutral Axis (${getUnit('length')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Shear Stress Distribution at {displayAnalysisPosition.toFixed(2)} {getUnit('length')}
          </h3>
          <div className="h-64">
            <Line 
              key={`cross-shear-${chartKey}`}
              data={crossSectionShearData} 
              options={{
                ...getChartOptions(`Shear Stress (${getUnit('stress')})`),
                scales: {
                  ...getChartOptions().scales,
                  x: {
                    ...getChartOptions().scales.x,
                    title: {
                      display: true,
                      text: `Distance from Neutral Axis (${getUnit('length')})`,
                      color: isDarkMode ? '#e5e7eb' : '#374151'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Stress Analysis Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Analysis Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bending Stress Analysis</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Maximum bending stress occurs at extreme fibers</li>
              <li>• Stress varies linearly across the section height</li>
              <li>• Zero stress at the neutral axis</li>
              <li>• Formula: σ = M × c / I</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shear Stress Analysis</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Maximum shear stress typically at neutral axis</li>
              <li>• Stress varies parabolically for rectangular sections</li>
              <li>• Zero stress at extreme fibers</li>
              <li>• Formula: τ = V × Q / (I × t)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressAnalysis;