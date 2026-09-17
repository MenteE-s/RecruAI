import React from "react";
import { FaBrain, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const ThinkingDisplay = ({ thinkingStep, isVisible, onToggle }) => {
  if (!thinkingStep || !isVisible) return null;

  const { analysis, reasoning, validation } = thinkingStep;
  const isValidationGood = validation?.is_acceptable;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FaBrain className="text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            AI Thinking Process
          </h3>
          {isValidationGood ? (
            <FaCheckCircle className="text-green-500" />
          ) : (
            <FaExclamationTriangle className="text-yellow-500" />
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Hide Process
        </button>
      </div>

      {/* Context Analysis */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Context Analysis</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Relevance Score:</span>
            <span className="ml-2 text-blue-600">
              {(analysis?.relevance_score || 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-medium">Context Quality:</span>
            <span className="ml-2 text-blue-600">
              {analysis?.context_quality || "Unknown"}
            </span>
          </div>
        </div>
        {analysis?.key_information?.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">Key Information:</span>
            <ul className="list-disc list-inside mt-1 text-gray-600">
              {analysis.key_information.slice(0, 3).map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Response Strategy</h4>
        <p className="text-sm text-gray-600 mb-2 italic">
          "{reasoning?.response_strategy || "Planning direct response..."}"
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Tone:</span>
            <span className="ml-2 text-blue-600 capitalize">
              {reasoning?.tone_and_style || "Professional"}
            </span>
          </div>
          <div>
            <span className="font-medium">Confidence:</span>
            <span className="ml-2 text-blue-600">
              {(reasoning?.confidence_assessment || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Validation */}
      {validation && (
        <div className="border-t border-gray-200 pt-3">
          <h4 className="font-medium text-gray-700 mb-2 text-xs uppercase tracking-wider">
            Quality Validation
          </h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2 rounded border border-gray-100 flex flex-col items-center">
              <span className="text-gray-500 text-[10px]">Quality</span>
              <span className="font-bold text-blue-600">
                {(validation.quality_score || 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100 flex flex-col items-center">
              <span className="text-gray-500 text-[10px]">Coherence</span>
              <span className="font-bold text-blue-600">
                {(validation.coherence_score || 0).toFixed(2)}
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100 flex flex-col items-center">
              <span className="text-gray-500 text-[10px]">Completeness</span>
              <span className="font-bold text-blue-600">
                {(validation.completeness_score || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingDisplay;
