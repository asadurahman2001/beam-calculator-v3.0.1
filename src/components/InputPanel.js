import React, { useState } from 'react';
import LengthTab from './tabs/LengthTab';
import SupportsTab from './tabs/SupportsTab';
import LoadsTab from './tabs/LoadsTab';
import MomentsTab from './tabs/MomentsTab';
import MaterialTab from './tabs/MaterialTab';
import SectionTab from './tabs/SectionTab';

const InputPanel = ({ beamData, updateBeamData, resolution, setResolution }) => {
  const [activeTab, setActiveTab] = useState('length');

  const tabs = [
    { id: 'length', label: 'Length', icon: '📏' },
    { id: 'supports', label: 'Supports', icon: '🏗️' },
    { id: 'loads', label: 'Loads', icon: '⬇️' },
    { id: 'moments', label: 'Moments', icon: '🔄' },
    { id: 'section', label: 'Section', icon: '⬜' },
    { id: 'material', label: 'Material', icon: '🧱' }
  ];

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Beam Configuration</h2>
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