// Calculation utilities for beam analysis

export const calculateReactions = (supports, pointLoads, distributedLoads, moments, beamLength) => {
  const numSupports = supports.length;
  const hasInternalHinge = supports.some(s => s.type === 'Internal Hinge');
  
  if (numSupports === 1) {
    const support = supports[0];
    if (support.type === "Fixed") {
      return calculateFixedSupportReactions(support, pointLoads, distributedLoads, moments, beamLength);
    } else {
      return { error: "Unable to solve with single non-fixed support" };
    }
  } else if (numSupports === 2) {
    if (supports.some(s => s.type === "Fixed")) {
      return { error: "Unable to solve with fixed support and two supports" };
    } else {
      return calculateTwoSupportReactions(supports, pointLoads, distributedLoads, moments, beamLength);
    }
  } else if (numSupports === 3 && hasInternalHinge) {
    return calculateThreeSupportWithInternalHinge(supports, pointLoads, distributedLoads, moments, beamLength);
  } else {
    return { error: "Unsupported support configuration" };
  }
};

const calculateFixedSupportReactions = (support, pointLoads, distributedLoads, moments, beamLength) => {
  let sumPointLoads = 0;
  let sumDistLoads = 0;
  let sumPointLoadsMoments = 0;
  let sumDistLoadsMoments = 0;
  let sumExternalMoments = 0;

  const fixedSupportPos = support.position;

  // Point loads
  pointLoads.forEach(({ position, magnitude }) => {
    sumPointLoads += magnitude;
    sumPointLoadsMoments += magnitude * Math.abs(position - fixedSupportPos);
  });

  // Distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    const length = Math.abs(endPos - startPos);
    const totalLoad = 0.5 * (startMag + endMag) * length;
    sumDistLoads += totalLoad;

    if (endMag + startMag !== 0) {
      const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
      const centroidRight = length - centroidLeft;
      const distanceLeft = Math.min(startPos, endPos);
      const distanceRight = beamLength - Math.max(startPos, endPos);

      if (fixedSupportPos === 0) {
        sumDistLoadsMoments += totalLoad * (centroidLeft + distanceLeft);
      } else {
        sumDistLoadsMoments += totalLoad * (centroidRight + distanceRight);
      }
    }
  });

  // External moments
  moments.forEach(({ magnitude }) => {
    sumExternalMoments += magnitude;
  });

  const reactionForce = -sumPointLoads - sumDistLoads;
  const reactionMoment = sumPointLoadsMoments + sumDistLoadsMoments - sumExternalMoments;

  return {
    reactions: [
      { position: fixedSupportPos, force: reactionForce, moment: reactionMoment }
    ],
    supportReactions: [{ position: fixedSupportPos, magnitude: reactionForce }],
    supportMoments: [{ position: fixedSupportPos, magnitude: reactionMoment }]
  };
};

const calculateTwoSupportReactions = (supports, pointLoads, distributedLoads, moments, beamLength) => {
  let sumPointLoads = 0;
  let sumDistLoads = 0;
  let sumPointLoadsMoments = 0;
  let sumDistLoadsMoments = 0;
  let sumExternalMoments = 0;

  // Point loads
  pointLoads.forEach(({ position, magnitude }) => {
    sumPointLoads += magnitude;
    sumPointLoadsMoments += magnitude * position;
  });

  // Distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    const length = Math.abs(endPos - startPos);
    const totalLoad = 0.5 * (startMag + endMag) * length;
    sumDistLoads += totalLoad;

    if (endMag + startMag !== 0) {
      const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
      const distanceLeft = Math.min(startPos, endPos);
      sumDistLoadsMoments += totalLoad * (centroidLeft + distanceLeft);
    }
  });

  // External moments
  moments.forEach(({ magnitude }) => {
    sumExternalMoments += magnitude;
  });

  const reactionCoefficientMat = [
    [1, 1],
    [supports[0].position, supports[1].position]
  ];

  const constantMat = [
    sumPointLoads + sumDistLoads,
    sumPointLoadsMoments + sumDistLoadsMoments - sumExternalMoments
  ];

  try {
    const det = reactionCoefficientMat[0][0] * reactionCoefficientMat[1][1] - 
                reactionCoefficientMat[0][1] * reactionCoefficientMat[1][0];
    
    if (Math.abs(det) < 1e-10) {
      return { error: "Singular matrix - unable to solve" };
    }

    const r1 = -(reactionCoefficientMat[1][1] * constantMat[0] - reactionCoefficientMat[0][1] * constantMat[1]) / det;
    const r2 = -(reactionCoefficientMat[0][0] * constantMat[1] - reactionCoefficientMat[1][0] * constantMat[0]) / det;

    const reactions = [
      { position: supports[0].position, force: r1 },
      { position: supports[1].position, force: r2 }
    ].sort((a, b) => a.position - b.position);

    return {
      reactions,
      supportReactions: reactions.map(r => ({ position: r.position, magnitude: r.force }))
    };
  } catch (error) {
    return { error: "Unable to solve reaction equations" };
  }
};

const calculateThreeSupportWithInternalHinge = (supports, pointLoads, distributedLoads, moments, beamLength) => {
  // Find internal hinge and other supports
  const internalHinge = supports.find(s => s.type === 'Internal Hinge');
  const otherSupports = supports.filter(s => s.type !== 'Internal Hinge');
  
  if (!internalHinge || otherSupports.length !== 2) {
    return { error: "Invalid configuration for internal hinge analysis" };
  }

  // Sort supports by position
  const sortedSupports = [...otherSupports].sort((a, b) => a.position - b.position);
  const hingePos = internalHinge.position;

  // Calculate total loads and moments
  let sumPointLoads = 0;
  let sumDistLoads = 0;
  let sumPointLoadsMoments = 0;
  let sumDistLoadsMoments = 0;
  let sumExternalMoments = 0;

  // Point loads
  pointLoads.forEach(({ position, magnitude }) => {
    sumPointLoads += magnitude;
    sumPointLoadsMoments += magnitude * position;
  });

  // Distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    const length = Math.abs(endPos - startPos);
    const totalLoad = 0.5 * (startMag + endMag) * length;
    sumDistLoads += totalLoad;

    if (endMag + startMag !== 0) {
      const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
      const distanceLeft = Math.min(startPos, endPos);
      sumDistLoadsMoments += totalLoad * (centroidLeft + distanceLeft);
    }
  });

  // External moments
  moments.forEach(({ magnitude }) => {
    sumExternalMoments += magnitude;
  });

  // Calculate moment about the internal hinge for loads on left side
  let momentAboutHingeLeft = 0;
  let loadOnLeft = 0;

  // Point loads on left side of hinge
  pointLoads.forEach(({ position, magnitude }) => {
    if (position < hingePos) {
      loadOnLeft += magnitude;
      momentAboutHingeLeft += magnitude * (hingePos - position);
    }
  });

  // Distributed loads on left side of hinge
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    if (endPos <= hingePos) {
      // Entire load is on left side
      const length = Math.abs(endPos - startPos);
      const totalLoad = 0.5 * (startMag + endMag) * length;
      loadOnLeft += totalLoad;
      
      if (endMag + startMag !== 0) {
        const centroidLeft = (length / 3) * ((2 * endMag + startMag) / (endMag + startMag));
        const centroidPos = Math.min(startPos, endPos) + centroidLeft;
        momentAboutHingeLeft += totalLoad * (hingePos - centroidPos);
      }
    } else if (startPos < hingePos && endPos > hingePos) {
      // Load spans across the hinge - only consider left portion
      const leftLength = hingePos - startPos;
      const loadAtHinge = startMag + (endMag - startMag) * (leftLength / (endPos - startPos));
      const avgLoad = (startMag + loadAtHinge) / 2;
      const totalLoadLeft = avgLoad * leftLength;
      
      loadOnLeft += totalLoadLeft;
      momentAboutHingeLeft += totalLoadLeft * (leftLength / 2);
    }
  });

  // External moments on left side
  moments.forEach(({ position, magnitude }) => {
    if (position < hingePos) {
      momentAboutHingeLeft += magnitude;
    }
  });

  // Set up equations
  // 1. Sum of vertical forces = 0
  // 2. Sum of moments about left support = 0
  // 3. Moment at internal hinge = 0 (moment continuity condition)

  const leftSupportPos = sortedSupports[0].position;
  const rightSupportPos = sortedSupports[1].position;

  // Moment equation about left support
  let momentAboutLeftSupport = sumPointLoadsMoments + sumDistLoadsMoments - sumExternalMoments;

  // For the internal hinge condition, we use the fact that the moment at the hinge is zero
  // This gives us: R1 * (hingePos - leftSupportPos) + momentAboutHingeLeft = 0
  // Therefore: R1 = -momentAboutHingeLeft / (hingePos - leftSupportPos)

  const R1 = -momentAboutHingeLeft / (hingePos - leftSupportPos);

  // From equilibrium equations:
  // R1 + R2 + R3 = total load
  // R1 * leftSupportPos + R2 * rightSupportPos + R3 * hingePos = total moment about origin

  const totalLoad = sumPointLoads + sumDistLoads;
  
  // Solve for R2 and R3
  const coeffMatrix = [
    [1, 1],
    [rightSupportPos, hingePos]
  ];
  
  const constants = [
    totalLoad - R1,
    momentAboutLeftSupport - R1 * leftSupportPos
  ];

  try {
    const det = coeffMatrix[0][0] * coeffMatrix[1][1] - coeffMatrix[0][1] * coeffMatrix[1][0];
    
    if (Math.abs(det) < 1e-10) {
      return { error: "Singular matrix - unable to solve internal hinge system" };
    }

    const R2 = (coeffMatrix[1][1] * constants[0] - coeffMatrix[0][1] * constants[1]) / det;
    const R3 = (coeffMatrix[0][0] * constants[1] - coeffMatrix[1][0] * constants[0]) / det;

    const reactions = [
      { position: leftSupportPos, force: R1 },
      { position: rightSupportPos, force: R2 },
      { position: hingePos, force: R3, moment: 0 } // Internal hinge has zero moment
    ].sort((a, b) => a.position - b.position);

    return {
      reactions,
      supportReactions: reactions.map(r => ({ position: r.position, magnitude: r.force }))
    };
  } catch (error) {
    return { error: "Unable to solve internal hinge reaction equations" };
  }
};

export const calculateShearForce = (supportReactions, pointLoads, distributedLoads, beamLength, resolution) => {
  const numPoints = Math.floor(beamLength * resolution) + 1;
  const shear = new Array(numPoints).fill(0);
  const xCoords = Array.from({ length: numPoints }, (_, i) => (i * beamLength) / (numPoints - 1));

  // Add support reactions
  supportReactions.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        shear[i] += magnitude;
      }
    }
  });

  // Add point loads
  pointLoads.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        shear[i] += magnitude;
      }
    }
  });

  // Add distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    for (let i = 0; i < xCoords.length; i++) {
      const x = xCoords[i];
      if (x >= startPos && x <= endPos) {
        const load = startMag + (endMag - startMag) * ((x - startPos) / (endPos - startPos));
        const increment = load * (beamLength / (numPoints - 1));
        for (let j = i; j < xCoords.length; j++) {
          shear[j] += increment;
        }
      }
    }
  });

  return { x: xCoords, shear };
};

export const calculateBendingMoment = (supports, supportReactions, supportMoments, pointLoads, distributedLoads, externalMoments, beamLength, resolution) => {
  const numPoints = Math.floor(beamLength * resolution) + 1;
  const moment = new Array(numPoints).fill(0);
  const xCoords = Array.from({ length: numPoints }, (_, i) => (i * beamLength) / (numPoints - 1));

  // Fixed support position
  let fixedSupportPos = 0;
  supports.forEach(({ type, position }) => {
    if (type === "Fixed") {
      fixedSupportPos = position;
    }
  });

  // Find internal hinge positions
  const internalHinges = supports.filter(s => s.type === 'Internal Hinge').map(s => s.position);

  // Add support reaction moments
  supportReactions.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude * (xCoords[i] - position);
      }
    }
  });

  // Add support moments
  if (supportMoments) {
    supportMoments.forEach(({ position, magnitude }) => {
      for (let i = 0; i < xCoords.length; i++) {
        if (xCoords[i] >= position) {
          if (fixedSupportPos === 0) {
            moment[i] += magnitude;
          } else {
            moment[i] -= magnitude;
          }
        }
      }
    });
  }

  // Add point loads
  pointLoads.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude * (xCoords[i] - position);
      }
    }
  });

  // Add distributed loads
  distributedLoads.forEach(({ startPos, endPos, startMag, endMag }) => {
    for (let i = 0; i < xCoords.length; i++) {
      const x = xCoords[i];
      if (x >= startPos && x <= endPos) {
        const load = startMag + (endMag - startMag) * ((x - startPos) / (endPos - startPos));
        const increment = load * (beamLength / (numPoints - 1));
        for (let j = i; j < xCoords.length; j++) {
          moment[j] += (xCoords[j] - x) * increment;
        }
      }
    }
  });

  // Add external moments
  externalMoments.forEach(({ position, magnitude }) => {
    for (let i = 0; i < xCoords.length; i++) {
      if (xCoords[i] >= position) {
        moment[i] += magnitude;
      }
    }
  });

  // Apply internal hinge conditions (moment = 0 at hinge positions)
  internalHinges.forEach(hingePos => {
    const hingeIndex = xCoords.findIndex(x => Math.abs(x - hingePos) < 1e-6);
    if (hingeIndex >= 0) {
      // Set moment to zero at internal hinge
      moment[hingeIndex] = 0;
      
      // Note: In a more sophisticated analysis, we would need to handle
      // the discontinuity in moment properly, but for this simplified case,
      // we just ensure the moment is zero at the hinge location
    }
  });

  return { x: xCoords, moment };
};

// Calculate unit load moment matrix for deflection calculations
export const calculateUnitLoadMoment = (supports, beamLength, resolution) => {
  const numPoints = Math.floor(beamLength * resolution) + 1;
  const xCoords = Array.from({ length: numPoints }, (_, i) => (i * beamLength) / (numPoints - 1));
  const unitWeightMoments = Array(numPoints).fill(null).map(() => Array(numPoints).fill(0));

  for (let i = 0; i < numPoints; i++) {
    // Apply a unit load at x_coords[i]
    const unitLoad = [{ position: xCoords[i], magnitude: -1.0 }];
    const reactions = calculateReactions(supports, unitLoad, [], [], beamLength);
    
    if (reactions && !reactions.error) {
      // Separate reactions and moments
      let supportReactions = [];
      let supportMoments = [];
      
      if (supports.length === 1 && supports[0].type === "Fixed") {
        supportReactions = [{ position: reactions.supportReactions[0].position, magnitude: reactions.supportReactions[0].magnitude }];
        supportMoments = reactions.supportMoments || [];
      } else {
        supportReactions = reactions.supportReactions || [];
      }

      // Calculate bending moment due to this unit load
      const { moment: unitMoment } = calculateBendingMoment(
        supports, supportReactions, supportMoments, unitLoad, [], [], beamLength, resolution
      );
      
      for (let j = 0; j < numPoints; j++) {
        unitWeightMoments[i][j] = unitMoment[j];
      }
    }
  }

  return { x: xCoords, unitWeightMoments };
};

// Calculate deflection using virtual work method
export const calculateDeflection = (xCoords, bendingMoment, unitWeightMoments, beamLength, EI) => {
  const numPoints = xCoords.length;
  const deflections = new Array(numPoints).fill(0);
  const dx = beamLength / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    let sumDeflection = 0.0;
    for (let j = 0; j < numPoints; j++) {
      sumDeflection += bendingMoment[j] * (-unitWeightMoments[i][j]) * dx;
    }
    deflections[i] = sumDeflection / EI; // Deflection in meters
  }

  return { x: xCoords, deflections };
};