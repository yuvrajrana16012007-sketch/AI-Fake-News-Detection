/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Layers, HelpCircle } from 'lucide-react';
import { PipelineSteps } from '../utils/nlp.ts';

interface PipelineVisualizerProps {
  steps: PipelineSteps | null;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ steps }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!steps) {
    return (
      <div id="pipeline-empty" className="bg-gray-950 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
        <Layers className="mx-auto w-10 h-10 mb-3 text-gray-600" />
        <p className="text-sm font-sans">No active analysis session.</p>
        <p className="text-xs text-gray-600 mt-1">Submit a news article in the Detector tab to see how NLP processes unstructured text into mathematical features.</p>
      </div>
    );
  }

  const pipelineDetails = [
    {
      index: 0,
      title: 'Lowercase Conversion',
      icon: '🔡',
      description: 'Standardizes all alphabetic characters to lowercase. In machine learning, this ensures that capitalization differences do not duplicate vocabulary cells (e.g., treating "Breaking" and "breaking" as identical feature values).',
      resultType: 'text',
      data: steps.lowercase
    },
    {
      index: 1,
      title: 'Remove Punctuation & Specials',
      icon: '🚫',
      description: 'Strips out all punctuation symbols, mathematical operators, and special characters, replacing them with spaces. This removes semantic noise and isolates words.',
      resultType: 'text',
      data: steps.noPunctuation
    },
    {
      index: 2,
      title: 'Remove Numbers',
      icon: '🔟',
      description: 'Filters out numeric digits. While numbers are critical in spreadsheets, they represent highly dynamic identifiers in general news classifiers, which can lead to over-fitting on specific statistics or dates.',
      resultType: 'text',
      data: steps.noNumbers
    },
    {
      index: 3,
      title: 'Tokenization (Split)',
      icon: '✂️',
      description: 'Slices the continuous string of characters into discrete lexical tokens (words) by splitting along whitespace boundaries, discarding any empty tokens.',
      resultType: 'pills',
      data: steps.tokens
    },
    {
      index: 4,
      title: 'Stop Words Filtration',
      icon: '🧹',
      description: 'Removes extremely high-frequency grammatical connector words (like "the", "and", "is", "of"). These words have no diagnostic semantic weight and would otherwise overwhelm the classification algorithm.',
      resultType: 'pills',
      data: steps.noStopWords
    },
    {
      index: 5,
      title: 'Lemmatization & Stemming',
      icon: '🪵',
      description: 'Truncates suffixes and converts words to their root dictionaries or lemmas (e.g., "spaceships" to "spaceship", "stories" to "story"). This groups morphological inflections together under single vector dimensions.',
      resultType: 'pills',
      data: steps.lemmatized
    }
  ];

  return (
    <div id="pipeline-visualizer-card" className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Layers className="text-blue-400 w-5 h-5" />
          <h3 className="text-base font-semibold text-gray-100">Natural Language Preprocessing (NLP) Pipeline</h3>
        </div>
        <span className="text-xs font-mono bg-blue-950 text-blue-400 border border-blue-900 px-2.5 py-0.5 rounded-full">
          6 Core Steps
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-5 leading-relaxed">
        Before the TF-IDF Vectorizer can represent news text numerically, unstructured writing must undergo detailed syntactic normalization. Click through the stages below to inspect the transformations.
      </p>

      {/* Steps Navigation Rail */}
      <div className="grid grid-cols-6 gap-1 mb-5">
        {pipelineDetails.map((step) => {
          const isActive = activeStep === step.index;
          return (
            <button
              key={step.index}
              onClick={() => setActiveStep(step.index)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                isActive 
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-400 font-semibold' 
                  : 'bg-gray-950 border-gray-850 hover:border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-base mb-1">{step.icon}</span>
              <span className="text-[9px] uppercase tracking-wider block font-mono">Step {step.index + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Active Step Panel */}
      <div className="bg-gray-950 border border-gray-850 rounded-xl p-4 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {pipelineDetails.map((step) => {
            if (activeStep !== step.index) return null;
            return (
              <motion.div
                key={step.index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-100 flex items-center">
                      <span className="mr-1.5">{step.icon}</span>
                      {step.title}
                    </h4>
                    <span className="text-[10px] text-blue-400 font-mono">
                      NLP PIPELINE STEP {step.index + 1} OF 6
                    </span>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="bg-gray-900/40 border border-gray-800/40 rounded-lg p-3 text-xs leading-relaxed text-gray-400 flex items-start space-x-2">
                  <HelpCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <span>{step.description}</span>
                </div>

                {/* Result Block */}
                <div>
                  <h5 className="text-[10px] font-mono font-semibold uppercase text-gray-500 tracking-wider mb-2">
                    Processed Output Result
                  </h5>
                  
                  {step.resultType === 'text' ? (
                    <div className="bg-gray-900 border border-gray-800/60 rounded-lg p-3 text-xs font-mono text-gray-300 break-words leading-relaxed max-h-36 overflow-y-auto">
                      {step.data as string}
                    </div>
                  ) : (
                    <div className="bg-gray-900 border border-gray-800/60 rounded-lg p-3 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {(step.data as string[]).length === 0 ? (
                        <span className="text-xs font-mono text-gray-600">Empty token array. All terms filtered as stop words.</span>
                      ) : (
                        (step.data as string[]).map((token, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex px-2 py-0.5 rounded bg-gray-950 text-gray-300 border border-gray-800 text-[10px] font-mono hover:border-gray-600 transition-colors"
                          >
                            {token}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-4 text-[10px] text-gray-500 font-mono">
        <span>Pipeline state: Verified</span>
        <div className="flex space-x-1">
          <button 
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="px-2 py-1 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 disabled:opacity-40 disabled:hover:bg-gray-950 rounded text-gray-400"
          >
            ← Previous
          </button>
          <button 
            disabled={activeStep === 5}
            onClick={() => setActiveStep(prev => prev + 1)}
            className="px-2 py-1 bg-gray-950 hover:bg-gray-850 border border-gray-800 hover:border-gray-700 disabled:opacity-40 disabled:hover:bg-gray-950 rounded text-gray-400"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
