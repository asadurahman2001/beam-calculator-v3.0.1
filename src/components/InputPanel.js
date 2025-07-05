import React, { useState } from 'react';
import LengthTab from './tabs/LengthTab';
import SupportsTab from './tabs/SupportsTab';
import LoadsTab from './tabs/LoadsTab';
import MomentsTab from './tabs/MomentsTab';
import MaterialTab from './tabs/MaterialTab';
import SectionTab from './tabs/SectionTab';
import StressTab from './tabs/StressTab';

const InputPanel = ({ beamData, updateBeamData, resolution, setResolution }) => {
  const [expandedSections, setExpandedSections] = useState(['length']); // Start with length expanded

  const sections = [
    { id: 'length', label: 'Beam Length', icon: '📏', component: LengthTab },
    { id: 'supports', label: 'Supports', icon: '🏗️', component: SupportsTab },
    { id: 'loads', label: 'Loads', icon: '⬇️', component: LoadsTab },
    { id: 'moments', label: 'Moments', icon: '🔄', component: MomentsTab },
    { id: 'section', label: 'Cross-Section', icon: '⬜', component: SectionTab },
    { id: 'material', label: 'Material Properties', icon: '🧱', component: MaterialTab },
    { id: 'stress', label: 'Stress Analysis', icon: '📐', component: StressTab }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    const props = section.id === 'material' 
      ? { beamData, updateBeamData, resolution, setResolution }
      : { beamData, updateBeamData };
    
    return <Component {...props} />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Beam Configuration</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Click sections below to expand and configure beam parameters
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            
            return (
              <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{section.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Status indicator */}
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(section.id, beamData)}`}></div>
                      {/* Expand/Collapse arrow */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Section Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="animate-fade-in">
                      {renderSectionContent(section)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setExpandedSections(sections.map(s => s.id))}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedSections([])}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium"
            >
              Collapse All
            </button>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {expandedSections.length} of {sections.length} sections open
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine status color based on configuration completeness
const getStatusColor = (sectionId, beamData) => {
  switch (sectionId) {
    case 'length':
      return beamData.length > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600';
    case 'supports':
      return beamData.supports.length > 0 ? 'bg-green-500' : 'bg-red-500';
    case 'loads':
      return (beamData.pointLoads.length > 0 || beamData.distributedLoads.length > 0) 
        ? 'bg-green-500' : 'bg-yellow-500';
    case 'moments':
      return beamData.moments.length > 0 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600';
    case 'section':
      return beamData.section?.type ? 'bg-green-500' : 'bg-yellow-500';
    case 'material':
      return (beamData.materialProperties.E > 0 && beamData.materialProperties.I > 0) 
        ? 'bg-green-500' : 'bg-yellow-500';
    case 'stress':
      return 'bg-blue-500'; // Always available
    default:
      return 'bg-gray-300 dark:bg-gray-600';
  }
};

export default InputPanel;