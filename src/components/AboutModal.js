import React from 'react';

const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About Beam Calculator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Beam SFD, BMD & Deflection Calculator</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              A professional structural analysis tool for calculating shear force diagrams, 
              bending moment diagrams, and beam deflections.
            </p>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Developer Information</h4>
            <div className="space-y-1 text-gray-700 dark:text-gray-300">
              <p className="font-medium">Md. Asadur Rahman</p>
              <p className="text-sm">Roll: 2100160</p>
              <p className="text-sm">Rajshahi University of Engineering & Technology</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                Developed as part of practicing and applying concepts from a structural analysis academic course.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Support for fixed, hinge, roller, and internal hinge supports</li>
              <li>• Point loads and distributed loads</li>
              <li>• Applied moments analysis</li>
              <li>• Real-time SFD, BMD, and deflection calculations</li>
              <li>• PDF export functionality</li>
              <li>• Interactive beam diagram visualization</li>
              <li>• Dark mode and unit system switching (SI/FPS)</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;