import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext();

export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};

// Unit conversion factors and labels
export const UNIT_SYSTEMS = {
  SI: {
    name: 'SI (Metric)',
    length: { unit: 'm', factor: 1 },
    force: { unit: 'kN', factor: 1 },
    moment: { unit: 'kNm', factor: 1 },
    stress: { unit: 'kN/m²', factor: 1 },
    inertia: { unit: 'm⁴', factor: 1 },
    deflection: { unit: 'mm', factor: 1000 },
    distributedLoad: { unit: 'kN/m', factor: 1 }
  },
  FPS: {
    name: 'FPS (Imperial)',
    length: { unit: 'ft', factor: 3.28084 },
    force: { unit: 'kip', factor: 0.224809 },
    moment: { unit: 'kip-ft', factor: 0.737562 },
    stress: { unit: 'kip/ft²', factor: 0.0208854 },
    inertia: { unit: 'ft⁴', factor: 115.862 },
    deflection: { unit: 'in', factor: 39.3701 },
    distributedLoad: { unit: 'kip/ft', factor: 0.0685218 }
  }
};

export const UnitProvider = ({ children }) => {
  const [unitSystem, setUnitSystem] = useState(() => {
    const saved = localStorage.getItem('unitSystem');
    return saved || 'SI';
  });

  useEffect(() => {
    localStorage.setItem('unitSystem', unitSystem);
  }, [unitSystem]);

  const toggleUnitSystem = () => {
    setUnitSystem(prev => prev === 'SI' ? 'FPS' : 'SI');
  };

  const convertValue = (value, type, fromSystem = null, toSystem = null) => {
    const from = fromSystem || unitSystem;
    const to = toSystem || unitSystem;
    
    if (from === to) return value;
    
    const fromFactor = UNIT_SYSTEMS[from][type]?.factor || 1;
    const toFactor = UNIT_SYSTEMS[to][type]?.factor || 1;
    
    // Convert to base SI unit first, then to target unit
    const siValue = value / fromFactor;
    return siValue * toFactor;
  };

  const getUnit = (type) => {
    return UNIT_SYSTEMS[unitSystem][type]?.unit || '';
  };

  const formatValue = (value, type, precision = 3) => {
    const convertedValue = convertValue(value, type);
    const unit = getUnit(type);
    return `${convertedValue.toFixed(precision)} ${unit}`;
  };

  return (
    <UnitContext.Provider value={{
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      convertValue,
      getUnit,
      formatValue,
      units: UNIT_SYSTEMS[unitSystem]
    }}>
      {children}
    </UnitContext.Provider>
  );
};