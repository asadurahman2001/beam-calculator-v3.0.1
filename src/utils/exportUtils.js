import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportResultsToPDF = async (beamData, results) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to capture and add canvas to PDF
  const addCanvasToPDF = async (canvasSelector, title) => {
    try {
      const canvas = document.querySelector(canvasSelector);
      if (canvas) {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        checkPageBreak(imgHeight + 30);
        
        // Add title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 15;
        
        // Add image
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
        
        return true;
      }
    } catch (error) {
      console.error(`Error capturing canvas for ${title}:`, error);
    }
    return false;
  };

  // Helper function to capture Chart.js charts using html2canvas
  const addChartToPDF = async (chartContainer, title) => {
    try {
      if (chartContainer) {
        // Wait a bit for chart to fully render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(chartContainer, {
          backgroundColor: '#ffffff',
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          width: chartContainer.offsetWidth,
          height: chartContainer.offsetHeight
        });
        
        const imgData = canvas.toDataURL('image/png', 0.95);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        checkPageBreak(imgHeight + 30);
        
        // Add title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPosition);
        yPosition += 15;
        
        // Add image
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
        
        return true;
      }
    } catch (error) {
      console.error(`Error capturing chart for ${title}:`, error);
    }
    return false;
  };

  try {
    // Title Page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Beam Analysis Report', pageWidth / 2, yPosition + 20, { align: 'center' });
    
    yPosition += 40;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('SFD, BMD & Deflection Analysis', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 30;
    pdf.setFontSize(12);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;
    pdf.text(`Beam Length: ${beamData.length} m`, pageWidth / 2, yPosition, { align: 'center' });

    // Beam Configuration Section
    checkPageBreak(60);
    yPosition += 30;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Beam Configuration', margin, yPosition);
    yPosition += 15;

    // Beam Properties
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Length: ${beamData.length} m`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Young's Modulus (E): ${beamData.materialProperties.E.toExponential(2)} kN/m²`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Moment of Inertia (I): ${beamData.materialProperties.I.toExponential(2)} m⁴`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Flexural Rigidity (EI): ${(beamData.materialProperties.E * beamData.materialProperties.I).toExponential(2)} kNm²`, margin, yPosition);
    yPosition += 15;

    // Supports
    if (beamData.supports.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Supports:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      beamData.supports.forEach((support, index) => {
        pdf.text(`  ${index + 1}. ${support.type} support at ${support.position} m`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Point Loads
    if (beamData.pointLoads.length > 0) {
      checkPageBreak(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Point Loads:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      beamData.pointLoads.forEach((load, index) => {
        const direction = load.magnitude > 0 ? 'Upward' : 'Downward';
        pdf.text(`  ${index + 1}. ${Math.abs(load.magnitude)} kN (${direction}) at ${load.position} m`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Distributed Loads
    if (beamData.distributedLoads.length > 0) {
      checkPageBreak(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Distributed Loads:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      beamData.distributedLoads.forEach((load, index) => {
        pdf.text(`  ${index + 1}. ${Math.abs(load.startMag)} to ${Math.abs(load.endMag)} kN/m from ${load.startPos} to ${load.endPos} m`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Applied Moments
    if (beamData.moments.length > 0) {
      checkPageBreak(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Applied Moments:', margin, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      beamData.moments.forEach((moment, index) => {
        const direction = moment.magnitude > 0 ? 'Clockwise' : 'Counter-clockwise';
        pdf.text(`  ${index + 1}. ${Math.abs(moment.magnitude)} kNm (${direction}) at ${moment.position} m`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Add Beam Diagram
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Beam Diagram', margin, yPosition);
    yPosition += 20;

    const beamDiagramCaptured = await addCanvasToPDF('#beam-diagram-canvas', 'Beam Configuration');

    // Reaction Forces Section
    if (results.reactions.length > 0) {
      checkPageBreak(50);
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reaction Forces', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      results.reactions.forEach((reaction, index) => {
        const support = beamData.supports.find(s => s.position === reaction.position);
        pdf.text(`Support ${index + 1} (${support?.type || 'Unknown'}) at ${reaction.position} m:`, margin, yPosition);
        yPosition += 8;
        const forceDirection = reaction.force < 0 ? 'Downward' : 'Upward';
        pdf.text(`  Vertical Force: ${Math.abs(reaction.force).toFixed(3)} kN (${forceDirection})`, margin + 10, yPosition);
        yPosition += 6;
        if (reaction.moment !== undefined) {
          const momentDirection = reaction.moment > 0 ? 'Clockwise' : 'Counter-clockwise';
          pdf.text(`  Moment: ${Math.abs(reaction.moment).toFixed(3)} kNm (${momentDirection})`, margin + 10, yPosition);
          yPosition += 6;
        }
        yPosition += 5;
      });
    }

    // Add Analysis Diagrams
    if (results.shearForce.x.length > 0) {
      // Add a new page for diagrams
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis Diagrams', margin, yPosition);
      yPosition += 20;

      // Capture SFD
      const sfdContainer = document.querySelector('.card:has(h3)') ? 
        Array.from(document.querySelectorAll('.card')).find(card => 
          card.querySelector('h3')?.textContent?.includes('Shear Force Diagram')
        ) : null;
      
      if (sfdContainer) {
        await addChartToPDF(sfdContainer, 'Shear Force Diagram (SFD)');
      }

      // Capture BMD
      const bmdContainer = Array.from(document.querySelectorAll('.card')).find(card => 
        card.querySelector('h3')?.textContent?.includes('Bending Moment Diagram')
      );
      
      if (bmdContainer) {
        await addChartToPDF(bmdContainer, 'Bending Moment Diagram (BMD)');
      }

      // Capture Deflection Diagram
      const deflectionContainer = Array.from(document.querySelectorAll('.card')).find(card => 
        card.querySelector('h3')?.textContent?.includes('Deflection Diagram')
      );
      
      if (deflectionContainer) {
        await addChartToPDF(deflectionContainer, 'Deflection Diagram');
      }
    }

    // Analysis Results Table
    if (results.shearForce.x.length > 0) {
      checkPageBreak(100);
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Analysis Results (every 1m)', margin, yPosition);
      yPosition += 15;

      // Table headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const colWidth = (pageWidth - 2 * margin) / 4;
      pdf.text('Position (m)', margin, yPosition);
      pdf.text('Shear Force (kN)', margin + colWidth, yPosition);
      pdf.text('Bending Moment (kNm)', margin + 2 * colWidth, yPosition);
      pdf.text('Deflection (mm)', margin + 3 * colWidth, yPosition);
      yPosition += 8;

      // Draw line under headers
      pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
      yPosition += 3;

      // Table data
      pdf.setFont('helvetica', 'normal');
      for (let i = 0; i < results.shearForce.x.length; i++) {
        const x = results.shearForce.x[i];
        if (x % 1 === 0 || Math.abs(x - beamData.length) < 0.01) {
          checkPageBreak(8);
          
          pdf.text(x.toFixed(2), margin, yPosition);
          pdf.text(results.shearForce.y[i].toFixed(4), margin + colWidth, yPosition);
          pdf.text(results.bendingMoment.y[i].toFixed(4), margin + 2 * colWidth, yPosition);
          pdf.text((results.deflection.y[i] * 1000).toFixed(4), margin + 3 * colWidth, yPosition);
          yPosition += 6;
        }
      }
    }

    // Maximum Values Summary
    if (results.shearForce.x.length > 0) {
      checkPageBreak(50);
      yPosition += 15;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Maximum Values Summary', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      // Find maximum values
      const maxShear = Math.max(...results.shearForce.y.map(Math.abs));
      const maxMoment = Math.max(...results.bendingMoment.y.map(Math.abs));
      const maxDeflection = Math.max(...results.deflection.y.map(Math.abs));
      
      const maxShearIndex = results.shearForce.y.findIndex(v => Math.abs(v) === maxShear);
      const maxMomentIndex = results.bendingMoment.y.findIndex(v => Math.abs(v) === maxMoment);
      const maxDeflectionIndex = results.deflection.y.findIndex(v => Math.abs(v) === maxDeflection);

      pdf.text(`Maximum Shear Force: ${maxShear.toFixed(2)} kN at ${results.shearForce.x[maxShearIndex].toFixed(2)} m`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Maximum Bending Moment: ${maxMoment.toFixed(2)} kNm at ${results.bendingMoment.x[maxMomentIndex].toFixed(2)} m`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Maximum Deflection: ${(maxDeflection * 1000).toFixed(2)} mm at ${results.deflection.x[maxDeflectionIndex].toFixed(2)} m`, margin, yPosition);
    }

    // Footer
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      pdf.text('Generated by Beam Calculator - Developed by Md. Asadur Rahman (Roll: 2100160)', margin, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `beam_analysis_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

export const exportChartsAsPDF = async () => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Beam Analysis Charts', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 30;

    // Find chart containers
    const chartContainers = document.querySelectorAll('canvas');
    
    for (let i = 0; i < chartContainers.length; i++) {
      const canvas = chartContainers[i];
      
      if (canvas) {
        // Convert canvas to image
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page
        if (yPosition + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
      }
    }

    const fileName = `beam_charts_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting charts:', error);
    return { success: false, error: error.message };
  }
};