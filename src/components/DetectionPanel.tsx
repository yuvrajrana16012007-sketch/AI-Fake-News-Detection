/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Shield, ShieldCheck, ShieldAlert, Cpu, Sparkles, 
  Clock, Info, Copy, Download, CornerDownRight, AlertTriangle,
  Image as ImageIcon, Trash2, Loader2, Mic, MicOff, HelpCircle, Volume2
} from 'lucide-react';
import { GaugeChart, WordFrequencyChart, HybridComparatorChart } from './InteractiveCharts.tsx';
import { PipelineSteps } from '../utils/nlp.ts';

interface DetectionPanelProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
  onAnalysisSuccess: (payload: {
    ml: {
      label: 'Real' | 'Fake';
      probability: number;
      confidence: number;
      wordCount: number;
      charCount: number;
      readingTimeMin: number;
      pipeline: PipelineSteps;
      topFeatures: { word: string; value: number }[];
      processingTimeMs: number;
    };
    gemini: any;
    geminiKeyConfigured: boolean;
    title?: string;
    text?: string;
  }) => void;
  recalledItem?: any;
  onClearRecalledItem?: () => void;
}

export const DetectionPanel: React.FC<DetectionPanelProps> = ({ onNotification, onAnalysisSuccess, recalledItem, onClearRecalledItem }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [runGemini, setRunGemini] = useState(true);
  const [loading, setLoading] = useState(false);

  // States for screenshots and photographs (multimodal input / OCR)
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handle file uploads (screenshot/photo)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotification('error', 'Invalid file type. Please attach a valid image.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      onNotification('success', 'Screenshot/Photo attached! Click "Extract Text" to parse news details.');
    };
    reader.onerror = () => {
      onNotification('error', 'Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Perform Gemini OCR text extraction
  const extractTextFromImage = async () => {
    if (!attachedImage) return;

    setOcrLoading(true);
    try {
      const res = await fetch('/api/news/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: attachedImage,
          mimeType: attachedImage.split(';')[0].split(':')[1] || 'image/png'
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.title) setTitle(data.title);
        if (data.text) setText(data.text);
        onNotification('success', 'AI successfully extracted headline & article body from image!');
      } else {
        onNotification('error', data.error || 'Failed to extract text from the attached image.');
      }
    } catch (err) {
      onNotification('error', 'Network error connecting to the AI text extractor.');
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => {
    if (recalledItem) {
      setTitle(recalledItem.title || '');
      setText(recalledItem.text || '');
      if (recalledItem.fullData) {
        setResult(recalledItem.fullData);
      }
      if (onClearRecalledItem) {
        onClearRecalledItem();
      }
    }
  }, [recalledItem, onClearRecalledItem]);
  
  // App Config and Secret State
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  // Analysis result state
  const [result, setResult] = useState<any>(null);

  // Check if Gemini API Key is available on backend
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/model/status');
        const data = await res.json();
        // Since Gemini initialization checks the API key, let's verify if the backend exposes it
        // We will make a call or infer from /api/model/status
        const testRes = await fetch('/api/news/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'test', text: 'test', runGemini: false })
        });
        const testData = await testRes.json();
        setKeyConfigured(!!testData.geminiKeyConfigured);
      } catch (err) {
        console.error('Failed checking API secret status:', err);
      } finally {
        setCheckingKey(false);
      }
    };
    checkStatus();
  }, []);

  // Presets
  const sampleReal = {
    title: "NASA James Webb Space Telescope Sends Back Highly Detailed Images of Deep Universe",
    text: "NASA astronomers today released the clearest infrared images yet of the distant cosmos. The James Webb Space Telescope successfully captured the sharp thermal signatures of nebula clusters, showing intricate details of star formation and ancient galaxies that formed over 13 billion years ago. The telescope deployed complex gold mirrors to reflect ultra-faint infrared photons from early universal clusters."
  };

  const sampleFake = {
    title: "SHOCKING SECRET: Microwave Ovens Emit Chemical Waves That Brainwash Citizens",
    text: "A secret government document leaked by an anonymous insider reveals that all modern microwave ovens contain military-grade frequencies. These micro-pulses alter human brain chemistry, making citizens highly obedient to government broadcasts and destroying independent logical thinking. Scientists discovered water molecules are molecularly encoded with mind signals."
  };

  const injectPreset = (preset: typeof sampleReal) => {
    setTitle(preset.title);
    setText(preset.text);
    onNotification('success', 'Sample news loaded! Ready to analyze.');
  };

  const performAnalysisDirect = async (currentTitle: string, currentText: string) => {
    if (!currentTitle.trim() && !currentText.trim()) {
      onNotification('warning', 'Please enter a headline or news text to analyze.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          text: currentText,
          runGemini: runGemini && keyConfigured
        })
      });
      
      const data = await res.json();
      if (data.success) {
        const enrichedData = { ...data, title: currentTitle, text: currentText };
        setResult(enrichedData);
        onAnalysisSuccess(enrichedData);
        onNotification('success', `Analysis complete! Traditional ML: ${data.ml.label}.`);
      } else {
        onNotification('error', data.error || 'Prediction process failed.');
      }
    } catch (err) {
      onNotification('error', 'Network error connecting to the news analyzer backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    await performAnalysisDirect(title, text);
  };

  // Voice Commands and Speech Dictation State
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'title' | 'text'>('text');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Keep state refs in sync so speech callbacks always use fresh state values
  const titleRef = React.useRef(title);
  const textRef = React.useRef(text);
  const voiceTargetRef = React.useRef(voiceTarget);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { voiceTargetRef.current = voiceTarget; }, [voiceTarget]);

  // Check for Web Speech API Support and Initialize
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setLastCommand('Listening started');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          onNotification('error', 'Microphone permission denied by browser.');
        } else if (event.error !== 'no-speech') {
          onNotification('error', `Speech engine error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcriptRaw = event.results[resultIndex][0].transcript;
        const transcript = transcriptRaw.trim().toLowerCase();

        // 1. Core Voice commands:
        if (transcript === 'analyze' || transcript === 'analyze story' || transcript === 'start analysis' || transcript === 'run assessment') {
          setLastCommand('Triggered: Analyze Story');
          performAnalysisDirect(titleRef.current, textRef.current);
          return;
        }

        if (transcript === 'clear' || transcript === 'clear input' || transcript === 'clear text' || transcript === 'reset form') {
          setLastCommand('Triggered: Clear Fields');
          setTitle('');
          setText('');
          onNotification('success', 'Inputs cleared via voice command!');
          return;
        }

        if (transcript === 'load real' || transcript === 'inject real' || transcript === 'real news' || transcript === 'real sample') {
          setLastCommand('Triggered: Load Real News');
          setTitle(sampleReal.title);
          setText(sampleReal.text);
          onNotification('success', 'Sample real news loaded via voice!');
          return;
        }

        if (transcript === 'load fake' || transcript === 'inject fake' || transcript === 'fake news' || transcript === 'fake sample') {
          setLastCommand('Triggered: Load Fake News');
          setTitle(sampleFake.title);
          setText(sampleFake.text);
          onNotification('success', 'Sample fake news loaded via voice!');
          return;
        }

        if (transcript === 'stop' || transcript === 'stop listening' || transcript === 'turn off mic') {
          setLastCommand('Triggered: Stop Listening');
          rec.stop();
          setIsListening(false);
          onNotification('warning', 'Voice engine deactivated.');
          return;
        }

        if (transcript === 'dictate headline' || transcript === 'write headline' || transcript === 'select title') {
          setLastCommand('Switched to Headline');
          setVoiceTarget('title');
          onNotification('success', 'Now dictating to Headline field.');
          return;
        }

        if (transcript === 'dictate body' || transcript === 'write body' || transcript === 'select text' || transcript === 'dictate article') {
          setLastCommand('Switched to Article Body');
          setVoiceTarget('text');
          onNotification('success', 'Now dictating to Article Text field.');
          return;
        }

        // 2. Dictation text input:
        if (voiceTargetRef.current === 'title') {
          setTitle(prev => prev ? `${prev} ${transcriptRaw}` : transcriptRaw);
          setLastCommand(`Headline: "${transcriptRaw}"`);
        } else {
          setText(prev => prev ? `${prev} ${transcriptRaw}` : transcriptRaw);
          setLastCommand(`Article: "${transcriptRaw}"`);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported) {
      onNotification('error', 'Web Speech API is not supported in this browser. Try Google Chrome or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        onNotification('error', 'Could not access microphone or restart speech recognition.');
      }
    }
  };

  // Export Prediction Report as HTML Print/Download
  const handleExportReport = () => {
    if (!result) return;
    
    const reportHtml = `
      <html>
        <head>
          <title>AI Fake News Detector - Assessment Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .badge { display: inline-block; padding: 6px 12px; font-weight: bold; border-radius: 4px; font-size: 14px; text-transform: uppercase; }
            .badge-real { bg-color: #d1fae5; color: #065f46; background: #d1fae5; }
            .badge-fake { bg-color: #fee2e2; color: #991b1b; background: #fee2e2; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .metric { font-family: monospace; font-size: 14px; color: #64748b; margin-bottom: 5px; }
            .section-title { font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Credibility Assessment Report</h1>
          <div class="metric">Generated on: ${new Date().toLocaleString()}</div>
          <div class="metric">Platform Version: v1.0.0 (Credibility Engine)</div>
          
          <div class="card">
            <h3>Analyzed News Content</h3>
            <p><strong>Headline:</strong> "${title}"</p>
            <p><strong>Body Text:</strong> "${text}"</p>
          </div>

          <h2>Verification Summary</h2>
          <div style="margin: 15px 0;">
            <span class="badge ${result.ml.label === 'Real' ? 'badge-real' : 'badge-fake'}">
              Traditional ML Result: ${result.ml.label} News
            </span>
          </div>
          
          <div class="card">
            <div class="metric">Mathematical Confidence Probability: ${(result.ml.probability * 100).toFixed(1)}% Real</div>
            <div class="metric">Statistical Confidence Interval: ${result.ml.confidence}%</div>
            <div class="metric">Word Count: ${result.ml.wordCount} words</div>
            <div class="metric">Linguistic Token Extraction: ${result.ml.pipeline.lemmatized.slice(0, 15).join(', ')}...</div>
          </div>

          ${result.gemini ? `
            <h2>Advanced Gemini AI Semantic Analysis</h2>
            <div class="card">
              <p><strong>Verdict:</strong> ${result.gemini.verdict} News (${result.gemini.confidenceScore}% Confidence)</p>
              <p><strong>Political / Source Bias:</strong> ${result.gemini.biasLevel}</p>
              <p><strong>Sensationalism Index:</strong> ${result.gemini.sensationalism}</p>
              <p><strong>Analytical Summary:</strong> ${result.gemini.summary}</p>
              <p><strong>Linguistic Fallacies Detected:</strong> ${result.gemini.logicalFallacies.join(', ') || 'None detected.'}</p>
              <p><strong>Suspicious Style Cue Markers:</strong> ${result.gemini.linguisticHues.join(', ') || 'Standard objective style.'}</p>
              <p><strong>Fact-Checking Investigation Recommendations:</strong></p>
              <ul>
                ${result.gemini.investigationLeads.map((lead: string) => `<li>${lead}</li>`).join('')}
              </ul>
              <p><strong>Actionable Advice:</strong> ${result.gemini.recommendation}</p>
            </div>
          ` : ''}

          <div style="text-align: center; font-size: 11px; margin-top: 40px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            AI Fake News Detection System — Verification Platform
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Credibility_Report_${Date.now()}.html`;
    link.click();
    onNotification('success', 'Credibility HTML report downloaded successfully.');
  };

  return (
    <div id="detection-panel-layout" className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      {/* Input Section (Left Side) */}
      <div className="xl:col-span-7 space-y-6">
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-100 flex items-center">
              <FileText className="w-5 h-5 text-blue-400 mr-2" />
              Credibility Engine Core
            </h3>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Voice Command & Dictation Center */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                    isListening 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-gray-900 border-gray-800 text-gray-400'
                  }`}>
                    {isListening && (
                      <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    )}
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-semibold text-gray-200">AI Voice Assistant</h4>
                    <p className="text-[9px] text-gray-500 font-mono">
                      {isListening ? 'Microphone active, listening...' : 'Speak commands or dictate news'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Speech Support Badge */}
                  {!speechSupported ? (
                    <span className="text-[9px] font-mono bg-red-950/40 text-red-400 px-2 py-0.5 rounded border border-red-900/30">
                      Unsupported Browser
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleSpeech}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isListening
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Start Voice Assistant</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowCommandsHelp(!showCommandsHelp)}
                    className="p-1.5 bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white rounded-lg border border-gray-800 transition-colors cursor-pointer"
                    title="View Voice Commands List"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dictation Target Selector & Status */}
              {isListening && (
                <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-850 text-[10px]">
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="text-gray-500">Dictating to:</span>
                    <button
                      type="button"
                      onClick={() => setVoiceTarget('title')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        voiceTarget === 'title' 
                          ? 'bg-blue-500/20 text-blue-400 font-semibold' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Headline
                    </button>
                    <span className="text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={() => setVoiceTarget('text')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        voiceTarget === 'text' 
                          ? 'bg-blue-500/20 text-blue-400 font-semibold' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Article Body
                    </button>
                  </div>

                  {lastCommand && (
                    <div className="text-right text-gray-400 font-mono truncate max-w-[200px]" title={lastCommand}>
                      <span className="text-gray-500">Last activity:</span> {lastCommand}
                    </div>
                  )}
                </div>
              )}

              {/* Voice Commands Help Cheatsheet */}
              <AnimatePresence>
                {showCommandsHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-gray-900 border border-gray-850 rounded-lg p-2.5 space-y-1.5"
                  >
                    <p className="text-[10px] font-bold text-gray-300 font-mono uppercase tracking-wider">
                      🎤 Supported Voice Commands
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"dictate headline"</span>
                          <span>- Set voice input target to Title</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"dictate body"</span>
                          <span>- Set voice input target to Article Body</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"load real" / "load fake"</span>
                          <span>- Load preset stories instantly</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"analyze story" / "analyze"</span>
                          <span>- Submit story for classification</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"clear input" / "clear"</span>
                          <span>- Erase headline & article body</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-blue-400 mr-1.5">"stop listening"</span>
                          <span>- Disconnect voice assistant</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                News Headline (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the news headline or article title..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                Full Article Text Content
              </label>
              <textarea
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full paragraph copy or main text of the news story here..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 focus:outline-none focus:border-blue-700 resize-none font-sans"
              />
            </div>

            {/* Screenshot or Photo Attachment Area */}
            <div className="space-y-2 pb-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                  Attach Headline Screenshot or Photo
                </label>
                {attachedImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove Photo
                  </button>
                )}
              </div>

              {!attachedImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-950/20'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-950/20 hover:bg-gray-950/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="p-1.5 bg-gray-900 rounded-full border border-gray-850 text-gray-400">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      <span className="text-blue-400 font-medium">Click to upload</span> or drag and drop news screenshot/photo
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono">Supports PNG, JPEG, WEBP</p>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-800 rounded-lg p-2.5 bg-gray-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={attachedImage}
                        alt="Attached news"
                        className="w-12 h-12 object-cover rounded-md border border-gray-800 bg-gray-900 shadow-inner shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-300 truncate">
                          {fileName || 'news_artifact.png'}
                        </p>
                        <p className="text-[9px] text-gray-500 font-mono">
                          Ready for AI text extraction
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={ocrLoading}
                      onClick={extractTextFromImage}
                      className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white font-semibold text-[10px] rounded-lg flex items-center transition-colors cursor-pointer"
                    >
                      {ocrLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Extracting Text...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Extract with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Config Checkbox */}
            <div className="flex items-center justify-between py-2 border-t border-b border-gray-800/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="run-gemini-box"
                  checked={runGemini && keyConfigured}
                  disabled={!keyConfigured}
                  onChange={(e) => setRunGemini(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-gray-950 border-gray-800 cursor-pointer"
                />
                <label htmlFor="run-gemini-box" className={`text-xs font-medium cursor-pointer ${keyConfigured ? 'text-gray-300' : 'text-gray-600'}`}>
                  Run Deep Gemini 3.5 Flash Semantic Analysis
                </label>
              </div>

              <span className="text-[10px] font-mono text-gray-500">
                Words: {title.trim().split(/\s+/).filter(Boolean).length + text.trim().split(/\s+/).filter(Boolean).length}
              </span>
            </div>

            {/* Help Alert if Key is missing */}
            {!keyConfigured && !checkingKey && (
              <div className="bg-amber-950/20 border border-amber-900/60 rounded-lg p-3 text-[11px] text-amber-400 leading-normal flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> The traditional TF-IDF ML model is fully active! To unlock the deep, advanced Gemini AI Semantic analysis, please configure your <code>GEMINI_API_KEY</code> in the environment variables (<code>.env</code> file).
                </span>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                    Analyzing News Artifacts...
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 mr-2" />
                    Analyze News Content
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preset Buttons */}
          <div className="mt-5 pt-4 border-t border-gray-800">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block mb-2">
              💡 Instantly Test Sample Materials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => injectPreset(sampleReal)}
                className="text-left p-2.5 bg-gray-950 border border-gray-850 hover:border-emerald-900 hover:bg-emerald-950/10 rounded-lg group transition-colors cursor-pointer"
              >
                <div className="flex items-center text-[10px] font-bold text-emerald-400 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                  REAL NEWS PRESET
                </div>
                <p className="text-[10px] text-gray-400 truncate group-hover:text-gray-200">
                  {sampleReal.title}
                </p>
              </button>

              <button
                onClick={() => injectPreset(sampleFake)}
                className="text-left p-2.5 bg-gray-950 border border-gray-850 hover:border-red-900 hover:bg-red-950/10 rounded-lg group transition-colors cursor-pointer"
              >
                <div className="flex items-center text-[10px] font-bold text-red-400 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                  FAKE NEWS PRESET
                </div>
                <p className="text-[10px] text-gray-400 truncate group-hover:text-gray-200">
                  {sampleFake.title}
                </p>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Results Section (Right Side) */}
      <div className="xl:col-span-5 space-y-6">
        
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="empty-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px] shadow-lg"
            >
              <Cpu className="w-12 h-12 text-gray-700 mb-3 animate-pulse" />
              <h4 className="text-sm font-semibold text-gray-400">Awaiting Input News</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">
                Paste or select a sample news article on the left, then click analyze to compute traditional ML weights and deep AI verdicts.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="active-result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Verdict Shield Card */}
              <div className={`p-5 rounded-xl border shadow-lg ${
                result.ml.label === 'Real' 
                  ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' 
                  : 'bg-red-950/20 border-red-900 text-red-400'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-gray-950/60 border border-gray-800/40 px-2 py-0.5 rounded text-gray-400">
                    Traditional ML Assessment
                  </span>
                  
                  <button
                    onClick={handleExportReport}
                    className="text-[10px] flex items-center px-2 py-1 bg-gray-950 border border-gray-800 hover:border-gray-600 rounded text-gray-300 cursor-pointer"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export Report
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-full ${result.ml.label === 'Real' ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                    <Shield className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wider font-sans">
                      {result.ml.label === 'Real' ? '🟢 REAL NEWS' : '🔴 FAKE NEWS'}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Mathematical verification confidence: {result.ml.confidence}%
                    </p>
                  </div>
                </div>

                {/* Micro Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800/30 text-center text-xs font-mono text-gray-400">
                  <div className="bg-gray-950/40 p-2 rounded border border-gray-850/40">
                    <span className="block text-[8px] uppercase text-gray-500">Latency</span>
                    {result.ml.processingTimeMs} ms
                  </div>
                  <div className="bg-gray-950/40 p-2 rounded border border-gray-850/40">
                    <span className="block text-[8px] uppercase text-gray-500">Words</span>
                    {result.ml.wordCount}
                  </div>
                  <div className="bg-gray-950/40 p-2 rounded border border-gray-850/40">
                    <span className="block text-[8px] uppercase text-gray-500">Read Time</span>
                    {result.ml.readingTimeMin} min
                  </div>
                </div>
              </div>

              {/* Credibility Gauge */}
              <GaugeChart probability={result.ml.probability} label={result.ml.label} />

              {/* Top Feature Words List */}
              <WordFrequencyChart topFeatures={result.ml.topFeatures} />

              {/* Hybrid Comparator Chart (if Gemini was run) */}
              {runGemini && keyConfigured && (
                <HybridComparatorChart 
                  mlProb={result.ml.probability} 
                  geminiProb={result.gemini ? result.gemini.confidenceScore : null} 
                  geminiVerdict={result.gemini ? result.gemini.verdict : null} 
                />
              )}

              {/* Gemini AI Complete Insights */}
              {result.gemini && !result.gemini.error && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                    <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />
                      Gemini Semantic Insights
                    </h3>
                    <span className="text-[9px] font-mono bg-violet-950/50 text-violet-400 border border-violet-900 px-2 py-0.5 rounded-full">
                      GenAI Verdict: {result.gemini.verdict}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Fact-Checking Analysis</span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-gray-950 p-3 rounded-lg border border-gray-850">
                      {result.gemini.summary}
                    </p>
                  </div>

                  {/* Bias & Sensationalism info */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-gray-950/60 p-2.5 rounded-lg border border-gray-850">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Source Bias</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        result.gemini.biasLevel === 'Low' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                        result.gemini.biasLevel === 'Medium' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'
                      }`}>
                        {result.gemini.biasLevel}
                      </span>
                    </div>

                    <div className="bg-gray-950/60 p-2.5 rounded-lg border border-gray-850">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Sensationalism</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        result.gemini.sensationalism === 'None' || result.gemini.sensationalism === 'Low' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                        result.gemini.sensationalism === 'Medium' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-red-950/40 text-red-400 border border-red-900/50'
                      }`}>
                        {result.gemini.sensationalism}
                      </span>
                    </div>
                  </div>

                  {/* Logical fallacies */}
                  {result.gemini.logicalFallacies && result.gemini.logicalFallacies.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Logical Fallacies Detected</span>
                      <div className="flex flex-wrap gap-1">
                        {result.gemini.logicalFallacies.map((f: string, fIdx: number) => (
                          <span key={fIdx} className="inline-flex items-center px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-950 text-[10px]">
                            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style cues */}
                  {result.gemini.linguisticHues && result.gemini.linguisticHues.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Linguistic Cue Markers</span>
                      <div className="flex flex-wrap gap-1">
                        {result.gemini.linguisticHues.map((h: string, hIdx: number) => (
                          <span key={hIdx} className="inline-flex px-2 py-0.5 rounded bg-blue-950/20 text-blue-400 border border-blue-950 text-[10px]">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Investigation leads */}
                  {result.gemini.investigationLeads && result.gemini.investigationLeads.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Recommended Fact-Checking Steps</span>
                      <ul className="text-[11px] text-gray-400 space-y-1">
                        {result.gemini.investigationLeads.map((lead: string, lIdx: number) => (
                          <li key={lIdx} className="flex items-start">
                            <CornerDownRight className="w-3 h-3 text-violet-400 shrink-0 mr-1.5 mt-0.5" />
                            <span>{lead}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Recommendations */}
                  <div className="border-t border-gray-800 pt-3 mt-1 text-[11px] text-gray-400 leading-normal">
                    <strong>Action Advice:</strong> {result.gemini.recommendation}
                  </div>
                </div>
              )}

              {/* Gemini Error handle */}
              {result.gemini && result.gemini.error && (
                <div className="bg-amber-950/10 border border-amber-900/40 p-4 rounded-xl text-xs text-amber-400 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Gemini AI was unable to complete its detailed evaluation, but the traditional ML model parsed the text successfully. Check your API key.
                  </span>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};
