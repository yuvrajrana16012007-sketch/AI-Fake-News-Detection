/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, AlertCircle, CheckCircle, Database, HelpCircle, Plus } from 'lucide-react';

interface ModelStatus {
  success: boolean;
  datasetSize: number;
  realCount: number;
  fakeCount: number;
  vocabularySize: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: {
      trueNegative: number;
      falsePositive: number;
      falseNegative: number;
      truePositive: number;
    };
  };
}

interface ModelTrainingProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
  onModelRetrained?: () => void;
}

export const ModelTraining: React.FC<ModelTrainingProps> = ({ onNotification, onModelRetrained }) => {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);

  // Form state for adding custom training items
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customLabel, setCustomLabel] = useState<'Real' | 'Fake'>('Real');
  const [customCategory, setCustomCategory] = useState('Politics');

  const categories = ['Politics', 'Technology', 'Science', 'Health', 'Finance', 'Celebrity', 'Conspiracy'];

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/model/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        onNotification('error', 'Failed to retrieve training status.');
      }
    } catch (err) {
      onNotification('error', 'Network error connecting to backend ML service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRetrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customText) {
      onNotification('warning', 'Please complete the title and text fields for custom training.');
      return;
    }

    setTraining(true);
    try {
      const res = await fetch('/api/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            title: customTitle,
            text: customText,
            label: customLabel,
            category: customCategory
          }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data);
        onNotification('success', `Model successfully re-trained! Dataset increased to ${data.datasetSize} items.`);
        setCustomTitle('');
        setCustomText('');
        if (onModelRetrained) onModelRetrained();
      } else {
        onNotification('error', data.error || 'Failed to train model.');
      }
    } catch (err) {
      onNotification('error', 'Error sending training payload to server.');
    } finally {
      setTraining(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/model/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => prev ? { ...prev, metrics: data.metrics, datasetSize: 40, realCount: 20, fakeCount: 20 } : null);
        onNotification('success', 'Model and training dataset reset to preloaded 40 base documents.');
        if (onModelRetrained) onModelRetrained();
      } else {
        onNotification('error', 'Failed to reset dataset.');
      }
    } catch (err) {
      onNotification('error', 'Error resetting dataset on server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div id="training-loader" className="flex flex-col items-center justify-center p-12 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
        <p className="text-sm">Connecting to local Machine Learning engine...</p>
      </div>
    );
  }

  const metrics = status?.metrics;
  const matrix = metrics?.confusionMatrix;

  // Max value in matrix to calculate background intensity
  const matrixMax = matrix 
    ? Math.max(matrix.trueNegative, matrix.falsePositive, matrix.falseNegative, matrix.truePositive)
    : 1;

  const getIntensityClass = (val: number, isError: boolean) => {
    const ratio = val / matrixMax;
    if (isError) {
      if (val === 0) return 'bg-gray-950 border-gray-800 text-gray-600';
      if (ratio < 0.3) return 'bg-red-950/20 border-red-950 text-red-400';
      return 'bg-red-950/50 border-red-900 text-red-300';
    } else {
      if (val === 0) return 'bg-gray-950 border-gray-800 text-gray-600';
      if (ratio < 0.4) return 'bg-emerald-950/30 border-emerald-950 text-emerald-400';
      if (ratio < 0.7) return 'bg-emerald-900/40 border-emerald-900/70 text-emerald-300';
      return 'bg-emerald-800/50 border-emerald-700/60 text-emerald-100 font-bold';
    }
  };

  return (
    <div id="model-training-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Metrics & Evaluation */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Dataset Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-100 flex items-center">
              <Database className="w-5 h-5 text-blue-400 mr-2" />
              Model & Dataset Status
            </h3>
            <button
              onClick={handleReset}
              className="text-xs flex items-center px-2.5 py-1.5 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
              title="Reset dataset back to original 40 articles"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Reset Dataset
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] font-mono font-semibold uppercase text-gray-500 tracking-wider">Total Corpus</span>
              <p className="text-2xl font-bold text-gray-100 mt-1">{status?.datasetSize}</p>
            </div>
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] font-mono font-semibold uppercase text-emerald-500 tracking-wider">Real News</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{status?.realCount}</p>
            </div>
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] font-mono font-semibold uppercase text-red-500 tracking-wider">Fake News</span>
              <p className="text-2xl font-bold text-red-400 mt-1">{status?.fakeCount}</p>
            </div>
            <div className="bg-gray-950 p-3 rounded-lg border border-gray-850">
              <span className="text-[10px] font-mono font-semibold uppercase text-blue-500 tracking-wider">Vocab Features</span>
              <p className="text-2xl font-bold text-blue-400 mt-1">{status?.vocabularySize}</p>
            </div>
          </div>
        </div>

        {/* Model Performance Metrics */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-gray-100 mb-4">
            Classifier Evaluation Metrics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Accuracy */}
            <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-xl text-center relative group">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Accuracy
              </span>
              <span className="text-2xl font-bold text-gray-100">
                {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[10px] text-gray-600 block mt-1">Overall correctness</span>
              
              {/* Tooltip */}
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 text-center leading-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-2xl">
                <strong>Accuracy:</strong> Ratio of total correct predictions (TP + TN) to total news documents.
              </div>
            </div>

            {/* Precision */}
            <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-xl text-center relative group">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Precision
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {metrics ? `${(metrics.precision * 100).toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[10px] text-gray-600 block mt-1">Relevance match</span>

              {/* Tooltip */}
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 text-center leading-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-2xl">
                <strong>Precision:</strong> Out of all documents classified as "Real", what fraction were genuinely Real? Measures quality.
              </div>
            </div>

            {/* Recall */}
            <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-xl text-center relative group">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                Recall
              </span>
              <span className="text-2xl font-bold text-purple-400">
                {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[10px] text-gray-600 block mt-1">Sensitivity</span>

              {/* Tooltip */}
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 text-center leading-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-2xl">
                <strong>Recall:</strong> Out of all genuinely "Real" documents in the dataset, what fraction did the model successfully find? Measures quantity.
              </div>
            </div>

            {/* F1 Score */}
            <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-xl text-center relative group">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-1">
                F1-Score
              </span>
              <span className="text-2xl font-bold text-amber-400">
                {metrics ? `${(metrics.f1Score * 100).toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[10px] text-gray-600 block mt-1">Harmonic mean</span>

              {/* Tooltip */}
              <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 text-center leading-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-2xl">
                <strong>F1-Score:</strong> Combined harmonic score balancing both Precision and Recall. Highly indicative on imbalanced datasets.
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix Heatmap */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-base font-semibold text-gray-100 mb-2">
            Confusion Matrix (Error Heatmap)
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            The confusion matrix is a tabular layout that reports the counts of True Positives, False Positives, False Negatives, and True Negatives, helping evaluate misclassifications.
          </p>

          {matrix ? (
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-12 gap-2 w-full max-w-sm text-xs font-mono text-center">
                
                {/* Empty corner */}
                <div className="col-span-4" />
                {/* Predictions Header */}
                <div className="col-span-8 font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                  Predicted Class
                </div>

                <div className="col-span-4" />
                <div className="col-span-4 text-[10px] text-gray-500">PREDICT FAKE (0)</div>
                <div className="col-span-4 text-[10px] text-gray-500">PREDICT REAL (1)</div>

                {/* Actual Fake Row */}
                <div className="col-span-4 flex items-center justify-end pr-2 text-right text-[10px] text-gray-500 font-bold uppercase leading-tight">
                  Actual Fake (0)
                </div>
                {/* TN Cell */}
                <div className={`col-span-4 p-4 border rounded-lg flex flex-col justify-center items-center h-20 transition-all ${getIntensityClass(matrix.trueNegative, false)}`}>
                  <span className="text-lg font-bold">{matrix.trueNegative}</span>
                  <span className="text-[8px] opacity-70">True Negative (TN)</span>
                </div>
                {/* FP Cell */}
                <div className={`col-span-4 p-4 border rounded-lg flex flex-col justify-center items-center h-20 transition-all ${getIntensityClass(matrix.falsePositive, true)}`}>
                  <span className="text-lg font-bold">{matrix.falsePositive}</span>
                  <span className="text-[8px] opacity-70">False Positive (FP)</span>
                </div>

                {/* Actual Real Row */}
                <div className="col-span-4 flex items-center justify-end pr-2 text-right text-[10px] text-gray-500 font-bold uppercase leading-tight">
                  Actual Real (1)
                </div>
                {/* FN Cell */}
                <div className={`col-span-4 p-4 border rounded-lg flex flex-col justify-center items-center h-20 transition-all ${getIntensityClass(matrix.falseNegative, true)}`}>
                  <span className="text-lg font-bold">{matrix.falseNegative}</span>
                  <span className="text-[8px] opacity-70">False Negative (FN)</span>
                </div>
                {/* TP Cell */}
                <div className={`col-span-4 p-4 border rounded-lg flex flex-col justify-center items-center h-20 transition-all ${getIntensityClass(matrix.truePositive, false)}`}>
                  <span className="text-lg font-bold">{matrix.truePositive}</span>
                  <span className="text-[8px] opacity-70">True Positive (TP)</span>
                </div>

              </div>

              {/* Matrix Legend */}
              <div className="flex space-x-6 text-[10px] font-mono text-gray-500 mt-5">
                <span className="flex items-center">
                  <span className="w-3.5 h-3.5 bg-emerald-800/40 border border-emerald-700/60 rounded mr-1.5 inline-block" />
                  Correct Assessment
                </span>
                <span className="flex items-center">
                  <span className="w-3.5 h-3.5 bg-red-950/40 border border-red-900 rounded mr-1.5 inline-block" />
                  Classifier Misprediction
                </span>
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {/* Right Column: Training Data Incrementor */}
      <div className="lg:col-span-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg h-full">
          <h3 className="text-base font-semibold text-gray-100 mb-2 flex items-center">
            <Plus className="w-5 h-5 text-blue-400 mr-2" />
            Append Training Corpus
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Expand the baseline dataset with customized articles. The model vectorizes the content, appends the data, and runs Gradient Descent optimization on the server to update the weights in real-time.
          </p>

          <form onSubmit={handleRetrain} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                News Headline
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter custom training news headline..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-blue-700 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                  Category Topic
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-700"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                  Ground Truth Label
                </label>
                <select
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value as 'Real' | 'Fake')}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-300 focus:outline-none focus:border-blue-700"
                >
                  <option value="Real">🟢 Real News</option>
                  <option value="Fake">🔴 Fake News</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                Full Article Text Content
              </label>
              <textarea
                required
                rows={6}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste the full paragraph copy here. Provide a rich amount of words to allow adequate TF-IDF feature extraction..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:border-blue-700 font-sans resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={training}
              className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                  Running Gradient Descent...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2 fill-white" />
                  Add to Corpus & Fit Model
                </>
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
