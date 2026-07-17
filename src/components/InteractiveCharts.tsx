/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface GaugeProps {
  probability: number; // 0 = Fake, 1 = Real
  label: string;
}

/**
 * Custom half-circle needle gauge chart (0 to 180 deg)
 */
export const GaugeChart: React.FC<GaugeProps> = ({ probability, label }) => {
  // Angle calculated from probability (0 = Fake = 180deg left, 0.5 = neutral = 90deg, 1 = Real = 0deg right)
  // Let's sweep from 180deg (left/red) to 0deg (right/green)
  const angle = 180 - probability * 180;

  return (
    <div id="gauge-chart-container" className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Credibility Gauge</h4>
      <div className="relative w-64 h-36 flex justify-center items-end overflow-hidden">
        {/* Half Circle Track */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" /> {/* Red (Fake) */}
              <stop offset="50%" stopColor="#eab308" /> {/* Yellow (Unverified) */}
              <stop offset="100%" stopColor="#10b981" /> {/* Green (Real) */}
            </linearGradient>
          </defs>
          {/* Outer Ring */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Center Point */}
          <circle cx="100" cy="100" r="8" fill="#4b5563" />
        </svg>

        {/* Needle Indicator */}
        <motion.div
          className="absolute origin-bottom bottom-0 w-2 h-24 bg-gray-200"
          style={{
            bottom: '0px',
            transformOrigin: '50% 100%',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
          }}
          initial={{ rotate: 180 }}
          animate={{ rotate: angle - 90 }} // Adjusting offset for needle starting vertical
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
      </div>

      <div className="flex justify-between w-64 text-[10px] font-mono text-gray-500 mt-2 px-1">
        <span>🔴 FAKE NEWS (0%)</span>
        <span>🟡 50%</span>
        <span>🟢 REAL NEWS (100%)</span>
      </div>

      <div className="text-center mt-3">
        <span className="text-2xl font-bold text-gray-100 font-sans">
          {Math.round(probability * 100)}%
        </span>
        <span className="text-xs font-medium text-gray-400 ml-1">probability</span>
        <div className="mt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            probability >= 0.5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-900'
          }`}>
            {label === 'Real' ? '🟢 Highly Factual' : '🔴 Suspicious Claims'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface KeywordProps {
  topFeatures: { word: string; value: number }[];
}

/**
 * Horizontal Bar Chart showing preprocessed word feature frequencies or TF-IDF weights
 */
export const WordFrequencyChart: React.FC<KeywordProps> = ({ topFeatures }) => {
  if (topFeatures.length === 0) {
    return (
      <div id="word-chart-empty" className="flex flex-col items-center justify-center h-48 p-4 bg-gray-900 border border-gray-800 rounded-xl text-center">
        <span className="text-xs font-mono text-gray-500">No vocabulary features extracted.</span>
        <p className="text-[11px] text-gray-600 mt-1">Add a longer, structured article to extract relevant feature terms.</p>
      </div>
    );
  }

  // Normalize values relative to max value for visual sizing
  const maxValue = Math.max(...topFeatures.map(f => f.value));

  return (
    <div id="word-chart-container" className="flex flex-col p-4 bg-gray-900 border border-gray-800 rounded-xl h-full">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Extracted Feature Weights (TF-IDF)</h4>
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {topFeatures.map((feat, idx) => {
          const ratio = maxValue > 0 ? (feat.value / maxValue) * 100 : 0;
          return (
            <div key={idx} className="flex items-center text-xs">
              {/* Word label */}
              <div className="w-20 font-mono text-gray-300 truncate pr-2 text-right" title={feat.word}>
                {feat.word}
              </div>
              {/* Bar */}
              <div className="flex-1 bg-gray-800 h-3.5 rounded-full overflow-hidden relative">
                <motion.div
                  className="bg-blue-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${ratio}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  style={{
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                  }}
                />
              </div>
              {/* Score label */}
              <div className="w-12 text-right font-mono text-[10px] text-gray-500 pl-2">
                {feat.value.toFixed(3)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-600 mt-3 italic">
        TF-IDF assigns higher weights to rare, semantically distinct words that define the credibility profile of the text.
      </p>
    </div>
  );
};

interface HybridComparatorProps {
  mlProb: number;
  geminiProb: number | null;
  geminiVerdict: string | null;
}

/**
 * Hybrid Comparator Chart
 */
export const HybridComparatorChart: React.FC<HybridComparatorProps> = ({ mlProb, geminiProb, geminiVerdict }) => {
  const mlConfidence = mlProb >= 0.5 ? mlProb : 1 - mlProb;
  const geminiConfidence = geminiProb !== null ? (geminiProb >= 50 ? geminiProb / 100 : (100 - geminiProb) / 100) : null;

  return (
    <div id="hybrid-comparator" className="p-4 bg-gray-900 border border-gray-800 rounded-xl h-full flex flex-col justify-between">
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Hybrid Core Decision Comparison</h4>
        
        {/* Traditional ML Row */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-blue-400">Traditional ML Model</span>
            <span className="font-mono text-gray-400">
              {mlProb >= 0.5 ? 'Real' : 'Fake'} ({Math.round(mlConfidence * 100)}% Conf)
            </span>
          </div>
          <div className="bg-gray-800 h-3 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${mlProb >= 0.5 ? 'bg-emerald-500' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${mlConfidence * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Logistic Regression + TF-IDF Vectorizer
          </span>
        </div>

        {/* Advanced Gemini AI Row */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-violet-400">Gemini 3.5 Flash AI</span>
            {geminiProb !== null ? (
              <span className="font-mono text-gray-400">
                {geminiVerdict} ({Math.round(geminiConfidence! * 100)}% Conf)
              </span>
            ) : (
              <span className="text-[10px] text-gray-600 font-mono">NOT TRIGGERED</span>
            )}
          </div>
          <div className="bg-gray-800 h-3 rounded-full overflow-hidden">
            {geminiConfidence !== null ? (
              <motion.div
                className={`h-full rounded-full ${geminiVerdict === 'Real' ? 'bg-emerald-500' : geminiVerdict === 'Fake' ? 'bg-red-500' : 'bg-amber-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${geminiConfidence * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            ) : (
              <div className="w-0 h-full bg-gray-700" />
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Deep generative semantic context analyzer
          </span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3 mt-4 text-[10px] text-gray-600 leading-relaxed">
        <strong>Project Insight:</strong> Standard ML uses vocabulary frequency. Deep LLM checks syntactic cohesion, source references, logical structure, and cognitive bias to detect high-level propaganda.
      </div>
    </div>
  );
};
