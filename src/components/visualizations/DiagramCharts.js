import React from 'react';
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

const DiagramCharts = ({ beamData, results }) => {
  const { convertValue, getUnit } = useUnits();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        grid: {
          display: true,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280'
        }
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Convert data for display
  const displayXCoords = results.shearForce.x.map(x => convertValue(x, 'length', 'SI'));
  const displayShearForce = results.shearForce.y.map(y => convertValue(y, 'force', 'SI'));
  const displayBendingMoment = results.bendingMoment.y.map(y => convertValue(y, 'moment', 'SI'));
  const displayDeflection = results.deflection.y.map(y => convertValue(y * 1000, 'deflection', 'SI')); // Convert from m to mm first

  const shearForceData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Shear Force (${getUnit('force')})`,
        data: displayShearForce,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const bendingMomentData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Bending Moment (${getUnit('moment')})`,
        data: displayBendingMoment,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const deflectionData = {
    labels: displayXCoords.map(x => x.toFixed(2)),
    datasets: [
      {
        label: `Deflection (${getUnit('deflection')})`,
        data: displayDeflection,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const findMaxValues = () => {
    const maxShear = Math.max(...displayShearForce.map(Math.abs));
    const maxMoment = Math.max(...displayBendingMoment.map(Math.abs));
    const maxDeflection = Math.max(...displayDeflection.map(Math.abs));
    
    const maxShearIndex = displayShearForce.findIndex(v => Math.abs(v) === maxShear);
    const maxMomentIndex = displayBendingMoment.findIndex(v => Math.abs(v) === maxMoment);
    const maxDeflectionIndex = displayDeflection.findIndex(v => Math.abs(v) === maxDeflection);

    return {
      maxShear: {
        value: displayShearForce[maxShearIndex],
        position: displayXCoords[maxShearIndex]
      },
      maxMoment: {
        value: displayBendingMoment[maxMomentIndex],
        position: displayXCoords[maxMomentIndex]
      },
      maxDeflection: {
        value: displayDeflection[maxDeflectionIndex],
        position: displayXCoords[maxDeflectionIndex]
      }
    };
  };

  const maxValues = results.shearForce.x.length > 0 ? findMaxValues() : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {maxValues && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Maximum Shear Force</h4>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {Math.abs(maxValues.maxShear.value).toFixed(2)} {getUnit('force')}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              at position {maxValues.maxShear.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Maximum Bending Moment</h4>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {Math.abs(maxValues.maxMoment.value).toFixed(2)} {getUnit('moment')}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              at position {maxValues.maxMoment.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Maximum Deflection</h4>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {Math.abs(maxValues.maxDeflection.value).toFixed(2)} {getUnit('deflection')}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              at position {maxValues.maxDeflection.position.toFixed(2)} {getUnit('length')}
            </div>
          </div>
        </div>
      )}

      {/* Shear Force Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shear Force Diagram (SFD)</h3>
        <div className="h-64">
          {results.shearForce.x.length > 0 ? (
            <Line data={shearForceData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    display: true,
                    text: `Shear Force (${getUnit('force')})`,
                    color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the shear force diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bending Moment Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bending Moment Diagram (BMD)</h3>
        <div className="h-64">
          {results.bendingMoment.x.length > 0 ? (
            <Line data={bendingMomentData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    display: true,
                    text: `Bending Moment (${getUnit('moment')})`,
                    color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the bending moment diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deflection Diagram */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deflection Diagram</h3>
        <div className="h-64">
          {results.deflection.x.length > 0 ? (
            <Line data={deflectionData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: {
                    display: true,
                    text: `Deflection (${getUnit('deflection')})`,
                    color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
                  }
                }
              }
            }} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No data to display</p>
                <p className="text-sm">Configure beam parameters to see the deflection diagram</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagramCharts;