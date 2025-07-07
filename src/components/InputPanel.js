import React, { useState } from 'react';
import LengthTab from './tabs/LengthTab';
import SupportsTab from './tabs/SupportsTab';
import LoadsTab from './tabs/LoadsTab';
import MomentsTab from './tabs/MomentsTab';
import MaterialTab from './tabs/MaterialTab';
import SectionTab from './tabs/SectionTab';

const InputPanel = ({ beamData, updateBeamData, resolution, setResolution }) => {
  const [activeTab, setActiveTab] = useState('length');
  const [expandedSections, setExpandedSections] = useState(['length']);
  const [layoutMode, setLayoutMode] = useState('tabs'); // 'tabs' or 'accordion'

  const tabs = [
    { id: 'length', label: 'Length', icon: '📏' },
    { id: 'supports', label: 'Supports', icon: '🏗️' },
    { id: 'loads', label: 'Loads', icon: '⬇️' },
    { id: 'moments', label: 'Moments', icon: '🔄' },
    { id: 'section', label: 'Section & Stress', icon: '⬜' },
    { id: 'material', label: 'Material', icon: '🧱' },
  ];

  const sections = [
    { id: 'length', label: 'Beam Length', icon: '📏', component: LengthTab },
    { id: 'supports', label: 'Supports', icon: '🏗️', component: SupportsTab },
    { id: 'loads', label: 'Loads', icon: '⬇️', component: LoadsTab },
    { id: 'moments', label: 'Moments', icon: '🔄', component: MomentsTab },
    { id: 'section', label: 'Cross-Section & Stress', icon: '⬜', component: SectionTab },
    { id: 'material', label: 'Material Properties', icon: '🧱', component: MaterialTab },
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'length':
        return <LengthTab beamData={beamData} updateBeamData={updateBeamData} />;
      case 'supports':
        return <SupportsTab beamData={beamData} updateBeamData={updateBeamData} />;
      case 'loads':
        return <LoadsTab beamData={beamData} updateBeamData={updateBeamData} />;
      case 'moments':
        return <MomentsTab beamData={beamData} updateBeamData={updateBeamData} />;
      case 'section':
        return <SectionTab beamData={beamData} updateBeamData={updateBeamData} />;
      case 'material':
        return <MaterialTab beamData={beamData} updateBeamData={updateBeamData} resolution={resolution} setResolution={setResolution} />;
      default:
        return null;
    }
  };

  const renderSectionContent = (section) => {
    const Component = section.component;
    const props = section.id === 'material' 
      ? { beamData, updateBeamData, resolution, setResolution }
      : { beamData, updateBeamData };
    
    return <Component {...props} />;
  };

  // Helper function to determine status color based on configuration completeness
  const getStatusColor = (sectionId) => {
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
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  if (layoutMode === 'accordion') {
    return (
      <div className="h-full flex flex-col">
        {/* Header with Layout Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Beam Configuration</h2>
            <button
              onClick={() => setLayoutMode('tabs')}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Switch to Tab Layout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click sections below to expand and configure beam parameters
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {sections.map((section, index) => {
              const isExpanded = expandedSections.includes(section.id);
              
              return (
                <div key={section.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 relative z-10"
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
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(section.id)}`}></div>
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
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="pt-4">
                        <div className="animate-fade-in">
                          {renderSectionContent(section)}
                        </div>
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
  }

  // Original Tab Layout
  return (
    <div className="h-full flex flex-col">
      {/* Header with Layout Toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Beam Configuration</h2>
          <button
            onClick={() => setLayoutMode('accordion')}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Switch to Accordion Layout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : 'inactive'}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default InputPanel;