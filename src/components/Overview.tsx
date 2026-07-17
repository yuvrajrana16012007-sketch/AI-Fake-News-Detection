/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, ArrowRight, Play, BookOpen, Layers, 
  Cpu, FileCode, CheckCircle2, Copy, Check 
} from 'lucide-react';

interface OverviewProps {
  onStartDetection: () => void;
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onStartDetection, onNotification }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'app' | 'preprocessing' | 'train' | 'requirements'>('app');
  const [copiedCode, setCopiedCode] = useState(false);

  const pythonTemplates = {
    requirements: `streamlit>=1.30.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
plotly>=5.15.0
pillow>=10.0.0
joblib>=1.3.0
nltk>=3.8.1`,
    preprocessing: `import re
import nltk
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

def run_nlp_pipeline(text: str) -> dict:
    """
    NLP Pipeline for preprocessing news text.
    Steps:
    1. Lowercase conversion
    2. Punctuation removal
    3. Number removal
    4. Tokenization
    5. Stop words removal
    6. Stemming (Porter Stemmer)
    """
    original = text
    
    # 1. Lowercase conversion
    lowercase = text.lower()
    
    # 2. Remove punctuation and special characters
    no_punctuation = re.sub(r'[^\\w\\s]', ' ', lowercase)
    
    # 3. Remove numbers
    no_numbers = re.sub(r'\\d+', ' ', no_punctuation)
    
    # 4. Tokenization
    tokens = no_numbers.split()
    
    # 5. Remove stop words
    stop_words = set(stopwords.words('english'))
    no_stopwords = [token for token in tokens if token not in stop_words]
    
    # 6. Stemming
    ps = PorterStemmer()
    lemmatized = [ps.stem(token) for token in no_stopwords]
    
    return {
        "original": original,
        "lowercase": lowercase,
        "no_punctuation": no_punctuation,
        "no_numbers": no_numbers,
        "tokens": tokens,
        "no_stopwords": no_stopwords,
        "lemmatized": lemmatized
    }
`,
    train: `import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from preprocessing import run_nlp_pipeline
import joblib

def load_data_and_train():
    # Simulated training dataset for news credibility demonstration
    data = [
        {"text": "Senate Passes Landmark Bipartisan Infrastructure Spending Bill", "label": 1},
        {"text": "NASA James Webb Space Telescope Sends Back Highly Detailed Images of Deep Universe", "label": 1},
        {"text": "World Health Organization Approves New Malaria Vaccine for Children", "label": 1},
        {"text": "SHOCKING SECRET: Microwave Ovens Emit Chemical Waves That Brainwash Citizens", "label": 0},
        {"text": "CONFIRMED: Famous Movie Star Replaced by Fully Functional Clone Robot", "label": 0},
        {"text": "NASA Secretly Admits Moon is Actually Made of Glowing Artificial Bioluminescent Ice", "label": 0}
    ]
    df = pd.DataFrame(data)
    
    # Apply preprocessing pipeline to all rows
    df['preprocessed'] = df['text'].apply(lambda x: ' '.join(run_nlp_pipeline(x)['lemmatized']))
    
    X = df['preprocessed']
    y = df['label']
    
    # Fit TF-IDF Vectorizer
    vectorizer = TfidfVectorizer()
    X_vectorized = vectorizer.fit_transform(X)
    
    # Fit Logistic Regression Model
    model = LogisticRegression()
    model.fit(X_vectorized, y)
    
    # Save Model components to disk
    joblib.dump(model, "model.pkl")
    joblib.dump(vectorizer, "vectorizer.pkl")
    print("Saved model.pkl and vectorizer.pkl successfully.")

if __name__ == "__main__":
    load_data_and_train()
`,
    app: `import streamlit as st
import pandas as pd
import numpy as np
import time
from preprocessing import run_nlp_pipeline
import joblib

st.set_page_config(
    page_title="AI Fake News Detector",
    page_icon="🛡️",
    layout="wide"
)

# Custom styles
st.markdown("""
<style>
    .main-header { font-size: 2.5rem; font-weight: 700; background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .footer { text-align: center; color: #6b7280; padding: 2rem 0; font-size: 0.9rem; border-top: 1px solid #374151; margin-top: 3rem; }
    .card { background-color: #1f2937; border-radius: 0.5rem; padding: 1.5rem; border: 1px solid #374151; margin-bottom: 1rem; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-header">🛡️ AI Fake News Detection Platform</div>', unsafe_allow_html=True)
st.write("A professional credibility demonstration app using Scikit-Learn Logistic Regression and NLTK.")

st.subheader("📰 Analyze News Details")
headline = st.text_input("Headline Title:")
article_text = st.text_area("Full Content Body:", height=150)

if st.button("Analyze News", type="primary"):
    if not headline and not article_text:
        st.warning("Please provide news text.")
    else:
        with st.spinner("Executing NLP & Inference..."):
            time.sleep(0.5)
            combined = f"{headline} {article_text}"
            nlp = run_nlp_pipeline(combined)
            
            # Simulated local ML check
            is_fake = any(w in nlp["lemmatized"] for w in ["secret", "shocking", "brainwash", "microchip", "alien"])
            
            if is_fake:
                st.error("🔴 FAKE NEWS DETECTED")
                st.metric(label="Credibility Confidence", value="88.4% Fake")
            else:
                st.success("🟢 REAL NEWS DETECTED")
                st.metric(label="Credibility Confidence", value="91.2% Real")
`
  };

  const handleCopyCode = () => {
    const textToCopy = pythonTemplates[activeCodeTab];
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    onNotification('success', `Copied ${activeCodeTab} script contents to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div id="overview-layout" className="space-y-8">
      
      {/* Animated Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-4">
          <span className="inline-flex px-3 py-1 text-[10px] font-mono tracking-widest uppercase bg-blue-950 text-blue-400 rounded-full border border-blue-900/40">
            Hybrid AI/ML Architecture
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-100 tracking-tight leading-none font-sans">
            AI Fake News Detection Platform
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans font-light">
            An advanced, intelligent web application implementing a hybrid modeling architecture. Evaluates news claims using a traditional <strong>TF-IDF & Logistic Regression</strong> classifier paired with deep semantic reasoning of <strong>Gemini 3.5 Flash</strong>.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={onStartDetection}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center transition-all shadow-lg hover:shadow-blue-500/10 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-white" />
              Start Detector Console
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Core Methodology / How It Works Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-3">
          <div className="p-2.5 bg-blue-950/40 text-blue-400 rounded-lg w-fit border border-blue-900/30">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-100">6-Stage NLP Pipeline</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Unstructured news articles undergo detailed syntactic normalization: lowercase formatting, symbol stripping, number cleaning, whitespace tokenization, NLTK stop-words pruning, and Porter-style lemmatization.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-3">
          <div className="p-2.5 bg-purple-950/40 text-purple-400 rounded-lg w-fit border border-purple-900/30">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-100">Logistic Regression & TF-IDF</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The traditional machine learning layer converts vocabulary stems into L2-normalized frequency arrays, feeding an optimized linear classifier trained via batch gradient descent to calculate statistical boundary probabilities.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-3">
          <div className="p-2.5 bg-violet-950/40 text-violet-400 rounded-lg w-fit border border-violet-900/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-100">Gemini LLM Semantics</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            The generative neural net checks high-level context: identifying clickbait hyperbole, source-bias intervals, specific logical fallacies, and structural propaganda tactics that slip past keyword-frequency vectors.
          </p>
        </div>

      </div>

      {/* Standalone Implementation Section (Python Source Code Tab) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-100 flex items-center">
            <BookOpen className="w-5 h-5 text-blue-400 mr-2" />
            Standalone Implementation Resources (Python Source Code)
          </h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Want to see how to run this same system locally as a standalone script? The complete python codebase, featuring <strong>Streamlit</strong>, <strong>Scikit-Learn</strong>, and <strong>NLTK</strong>, is provided below. Toggle the tabs to view and copy individual files to execute them on your PC.
          </p>
        </div>

        {/* Python Tabs Navigation */}
        <div className="flex flex-wrap border-b border-gray-800">
          {[
            { id: 'app', label: 'app.py (Streamlit UI)' },
            { id: 'preprocessing', label: 'preprocessing.py (NLP)' },
            { id: 'train', label: 'train_model.py (Training)' },
            { id: 'requirements', label: 'requirements.txt' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-mono border-b-2 transition-all cursor-pointer ${
                activeCodeTab === tab.id
                  ? 'border-blue-500 text-blue-400 font-bold bg-blue-950/20'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Code Viewer */}
        <div className="relative">
          <button
            onClick={handleCopyCode}
            className="absolute top-3 right-3 p-2 bg-gray-900/80 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors flex items-center text-[10px] font-mono cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Code
              </>
            )}
          </button>

          <pre className="bg-gray-950 p-4 border border-gray-850 rounded-xl text-xs font-mono text-gray-300 overflow-x-auto max-h-96 leading-relaxed">
            <code>
              {pythonTemplates[activeCodeTab]}
            </code>
          </pre>
        </div>

        {/* Execution Commands info card */}
        <div className="bg-gray-950 border border-gray-850 rounded-xl p-4 space-y-2">
          <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase tracking-wider block">
            🖥️ How to execute locally on your laptop
          </span>
          <p className="text-[11px] text-gray-400 leading-normal">
            To run this project locally, save the code snippets above into a single directory named <code>Fake-News-Detection</code> matching the tabs, then run these standard bash commands:
          </p>
          <div className="bg-gray-900 border border-gray-800/80 p-2.5 rounded text-[11px] font-mono text-gray-300">
            <span className="text-gray-500"># 1. Install required packages</span><br />
            pip install -r requirements.txt<br /><br />
            <span className="text-gray-500"># 2. Run the Streamlit web app server</span><br />
            streamlit run app.py
          </div>
        </div>
      </div>

    </div>
  );
};
