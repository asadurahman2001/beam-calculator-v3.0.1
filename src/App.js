import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import VisualizationPanel from './components/VisualizationPanel';
import { ThemeProvider } from './contexts/ThemeContext';
import { UnitProvider } from './contexts/UnitContext';
import { 
  calculateReactions, 
  calculateShearForce, 
  calculateBendingMoment, 
  calculateUnitLoadMoment, 
  calculateDeflection 
} from './utils/calculations';

function App() {
  const [beamData, setBeamData] = useState({
    length: 10.0,
    supports: [{ type: 'Fixed', position: 0.0 }],
    pointLoads: [],
    distributedLoads: [],
    moments: [],
    materialProperties: {
      E: 2e8, // Young's modulus in kN/m²
      I: 1e-4  // Moment of inertia in m⁴
    },
    section: {
      type: 'rectangular',
      width: 0.3,
      height: 0.5
    }
  });

  const [results, setResults] = useState({
    reactions: [],
    shearForce: { x: [], y: [] },
    bendingMoment: { x: [], y: [] },
    deflection: { x: [], y: [] }
  });

  const [resolution, setResolution] = useState(100);

  useEffect(() => {
    calculateResults();
  }, [beamData, resolution]);

  const calculateResults = () => {
    try {
      const reactions = calculateReactions(
        beamData.supports,
        beamData.pointLoads,
        beamData.distributedLoads,
        beamData.moments,
        beamData.length
      );

      if (reactions && !reactions.error) {
        const { x: xCoords, shear } = calculateShearForce(
          reactions.supportReactions || [],
          beamData.pointLoads,
          beamData.distributedLoads,
          beamData.length,
          resolution
        );

        const { x: xCoordsMoment, moment } = calculateBendingMoment(
          beamData.supports,
          reactions.supportReactions || [],
          reactions.supportMoments || [],
          beamData.pointLoads,
          beamData.distributedLoads,
          beamData.moments,
          beamData.length,
          resolution
        );

        // Calculate deflection
        const { unitWeightMoments } = calculateUnitLoadMoment(
          beamData.supports,
          beamData.length,
          resolution
        );

        const EI = beamData.materialProperties.E * beamData.materialProperties.I;
        const { deflections } = calculateDeflection(
          xCoordsMoment,
          moment,
          unitWeightMoments,
          beamData.length,
          EI
        );

        setResults({
          reactions: reactions.reactions || [],
          shearForce: { x: xCoords, y: shear },
          bendingMoment: { x: xCoordsMoment, y: moment },
          deflection: { x: xCoordsMoment, y: deflections }
        });
      } else {
        // Clear results if calculation failed
        setResults({
          reactions: [],
          shearForce: { x: [], y: [] },
          bendingMoment: { x: [], y: [] },
          deflection: { x: [], y: [] }
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setResults({
        reactions: [],
        shearForce: { x: [], y: [] },
        bendingMoment: { x: [], y: [] },
        deflection: { x: [], y: [] }
      });
    }
  };

  const updateBeamData = (newData) => {
    setBeamData(prev => ({ ...prev, ...newData }));
  };

  return (
    <ThemeProvider>
      <UnitProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Header beamData={beamData} results={results} />
          <div className="flex h-[calc(100vh-4rem)]">
            <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto transition-colors">
              <InputPanel 
                beamData={beamData} 
                updateBeamData={updateBeamData}
                resolution={resolution}
                setResolution={setResolution}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <VisualizationPanel 
                beamData={beamData} 
                results={results}
              />
            </div>
          </div>
        </div>
      </UnitProvider>
    </ThemeProvider>
  );
}

export default App;