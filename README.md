# AI-Powered Hybrid Fake News Detection Platform
### Production-Grade Credibility Verification & Decision System

---

## 🛡️ Project Overview

This platform is a professional-grade, full-stack investigative web application designed to evaluate the factual credibility and authenticity of news headlines and articles. Built with a modern **Hybrid AI/ML Architecture**, it integrates traditional text-classification models with state-of-the-art Generative Large Language Models (LLMs).

Most standard fake news detectors rely strictly on statistical keyword patterns (which can misclassify satirical or creative writing), while deep neural networks can be computationally heavy for high-throughput filters. This system resolves these trade-offs by combining:
1. **Traditional ML Layer (High-Speed Local Filter)**: Standard **TF-IDF (Term Frequency-Inverse Document Frequency)** vectorization coupled with a **Logistic Regression** classifier, fully implemented mathematically. Runs in milliseconds.
2. **Cognitive Generative Layer (Deep Semantic Analysis)**: Deep reasoning powered by **Gemini 3.5 Flash** to evaluate logical fallacies, emotional sensationalism, source-bias intervals, and deceptive syntax markers.

---

## 🎯 Key Features

### 1. Unified Dashboard view
*   **Dual Theme Controller**: Full seamless light/dark mode support (Obsidian Slate vs. Clean Alabaster).
*   **Static Metadata Sidebar**: Keeps vital project telemetry (fit metrics, corpus counts, vocabs) visible in one view.
*   **Segmented stage navigation**: Tabs for simple transition between *Overview*, *Detection*, *Pipeline Preprocessing*, *Training*, and *Logs*.

### 2. Fake News Detection Terminal
*   **Direct Paste Evaluator**: Paste headlines and detailed article bodies for immediate verification.
*   **One-Click Sample Injectors**: Preloaded typical Real (bipartisan spending, JWST telescope) and Fake (mind-control microwaves, clone celebrities) news stories.
*   **Interactive Needle Gauge**: A 180-degree physical sweeping gauge visually reporting credibility probability.
*   **TF-IDF Feature Weights Bar Chart**: Displays the exact vocabularies and mathematical coefficients that triggered the ML prediction.
*   **Detailed Fact-Check PDF/HTML Report**: Generate a polished PDF-style assessment printout for physical files.

### 3. Step-by-Step NLP Pipeline Visualizer
Shows the step-by-step transformations on your specific input text:
*   `Step 1`: Lowercase Conversion (standardization).
*   `Step 2`: Punctuation & Special Character Removal.
*   `Step 3`: Number Filter (numeric cleaning).
*   `Step 4`: Tokenization (array splitting).
*   `Step 5`: Stop Words Elimination (eliminating fillers like "the", "and").
*   `Step 6`: Morphological Lemmatization (suffix stripping to root dictionary stems).

### 4. Interactive Training Playground
*   **Evaluation Dashboard**: Instant gauges for Accuracy, Precision, Recall, and F1-Score.
*   **Confusion Matrix Heatmap**: A color-coded grid representing True Positives, False Positives, False Negatives, and True Negatives. Intensity darkens as counts increase.
*   **Live Corpus Incrementor**: Write your own news articles directly in the UI, flag them as Real/Fake, and trigger a live training run. The server refits the Logistic Regression parameters using Gradient Descent in less than 10ms!
*   **Corpus Reset Switch**: Restores training data back to the preloaded 40 base documents.

### 5. Prediction Registry logs
*   **Session-based log**: Retains all analyzed stories with timestamps.
*   **Recall triggers**: Recall any historical analysis row to load its details and charts back onto the stage.
*   **CSV Exporter**: Downloads session logs as comma-separated tables, suitable for project binder appendixes.

---

## 📂 Project Directory Structure

The repository is organized following professional modular software architecture patterns:

```text
Fake-News-Detection/
│
├── server.ts               # Core full-stack Express server (Vite integration, ML + Gemini APIs)
├── package.json            # Node.js project manifest & script commands
├── tsconfig.json           # TypeScript compilation presets
├── vite.config.ts          # Vite build plugin and port configuration
├── README.md               # Platform architecture comprehensive documentation
├── metadata.json           # Platform capabilities manifest
│
├── src/
│   ├── main.tsx            # Main browser mount entrypoint
│   ├── App.tsx             # Central state-management & dashboard parent shell
│   ├── index.css           # Global Tailwind CSS configurations
│   │
│   ├── components/         # Modular React dashboard panels
│   │   ├── Overview.tsx           # Welcome hub & interactive Python exporter
│   │   ├── DetectionPanel.tsx     # News text inputs & visual charts binder
│   │   ├── InteractiveCharts.tsx  # Circular gauge, word frequency, comparator charts
│   │   ├── PipelineVisualizer.tsx # Step-by-step NLP preprocessor visualizer
│   │   ├── ModelTraining.tsx      # Metrics board & live confusion matrix builder
│   │   └── HistoryPanel.tsx       # History list table & CSV log exporter
│   │
│   └── utils/              # Mathematical NLP & ML implementation files
│       ├── nlp.ts                 # Full 6-stage NLP preprocessor regex pipeline
│       └── ml.ts                  # TF-IDF Vectorizer & Gradient Descent Logistic Solver
```

---

## 🏗️ Technical Methodologies & Formulas

Here are the exact mathematical equations implemented in the TypeScript source files:

### 1. TF-IDF Smoothing
For any term $t$ in a document $d$ within a corpus of size $N$, the Inverse Document Frequency (IDF) is calculated with smooth offset modifiers to avoid divisions by zero:

$$IDF(t) = \ln\left(\frac{1 + N}{1 + DF(t)}\right) + 1$$

Where $DF(t)$ is the count of documents in the corpus containing the term $t$. The final TF-IDF weight is:

$$TF\text{-}IDF(t, d) = TF(t, d) \times IDF(t)$$

Each document vector is then normalized to unit Euclidean length ($L_2$ Norm):

$$\mathbf{x}_{norm} = \frac{\mathbf{x}}{\sqrt{\sum_{i=1}^{M} x_i^2}}$$

### 2. Logistic Regression & Sigmoid Activation
The probability $P$ of a news document belonging to the **Real** class (1) is computed using the dot product of the normalized TF-IDF vector $\mathbf{x}$ and the model weights $\mathbf{w}$, plus bias $b$, passing through the sigmoid activation function:

$$P(\text{Real} \mid \mathbf{x}) = \sigma(\mathbf{w} \cdot \mathbf{x} + b) = \frac{1}{1 + e^{-(\mathbf{w} \cdot \mathbf{x} + b)}}$$

### 3. Gradient Descent Optimization
During re-training, parameters are updated iteratively across $E$ epochs using L2-Regularization (Ridge Penalty $\lambda$) to limit overfitting:

$$\mathbf{w} \leftarrow \mathbf{w} - \alpha \left[ \frac{1}{M} \sum_{i=1}^{M} \left( P(\mathbf{x}_i) - y_i \right) \mathbf{x}_i + \lambda \mathbf{w} \right]$$

$$b \leftarrow b - \alpha \left[ \frac{1}{M} \sum_{i=1}^{M} \left( P(\mathbf{x}_i) - y_i \right) \right]$$

---

## 🖥️ Installation & Setup Guide

Follow these steps to set up, configure, and run the Fake News Detection Platform locally on your machine.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your system:
- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later)
- **A Google Gemini API Key**:
  1. Visit the [Google AI Studio](https://aistudio.google.com/).
  2. Create or sign in with your Google account.
  3. Click **Get API key** and generate a new key.

---

### 🚀 Step-by-Step Local Setup

#### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone <your-repository-url>
cd Fake-News-Detection
```

#### 2. Install Project Dependencies
Install all the required Node.js development and production dependencies:
```bash
npm install
```

#### 3. Configure Environment Variables
This application uses environment variables for secure server-side interactions with the Gemini LLM. 

1. Copy the provided `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file in your preferred text editor and add your credentials:
   ```env
   # Your Google Gemini API Key from AI Studio
   GEMINI_API_KEY="AIzaSyYourActualAPIKeyGoesHere"

   # The local development URL (used for local reference)
   APP_URL="http://localhost:3000"
   ```

---

### 💻 Running the Application

This platform is a full-stack application. It features a unified development system that boots a secure Express backend server and dynamically mounts Vite's fast HMR middleware inside it.

#### Option A: Running in Development Mode (Recommended for testing/modifications)
In development mode, TypeScript files are compiled and run on-the-fly using `tsx` (TypeScript Execute), and changes are immediately reflected in the browser:
```bash
npm run dev
```
- This will boot the server on **Port 3000**.
- Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**.

#### Option B: Building and Running for Production
For maximum performance and security, compile the application into a standalone optimized build.

1. **Clean up old builds** (Optional):
   ```bash
   npm run clean
   ```
2. **Compile and bundle**:
   ```bash
   npm run build
   ```
   *This commands runs `vite build` to bundle static client assets under `dist/`, then uses `esbuild` to compile and bundle the Express backend into a single self-contained CommonJS script at `dist/server.cjs`.*
3. **Start the production server**:
   ```bash
   npm start
   ```
- The production server will listen on **Port 3000**.
- Navigate to: **[http://localhost:3000](http://localhost:3000)**.

---

### 🧪 Verification Check

Once the application is running, you can verify everything is working perfectly by testing the two core analysis pipelines:
1. **Local ML Analysis**: Navigate to the **Detector** tab, click **"Inject Fake News Sample"** or **"Inject Real News Sample"**, and click **Analyze Story**. The local TF-IDF + Logistic Regression model will evaluate the input and display feature coefficient weights immediately.
2. **AI Semantic Analysis**: Toggle **"Enable Gemini Semantic Verification"** and hit **Analyze Story**. The platform will proxy the request through the Express backend to evaluate logical fallacies, emotional sensationalism, and source-bias. A comprehensive, multi-step report should render in the dashboard.

---

### 🐍 Standalone Python & Streamlit execution (Optional)
If you require running the standalone Python equivalent on your local PC or laptop:
1. **Create a folder** named `Fake-News-Detection-Python`.
2. **Copy the source files** provided directly inside the **Overview** tab of the running web app (recreated completely for you).
3. **Run the local pipeline**:
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   
   # Run the Streamlit web server
   streamlit run app.py
   ```

---

## 🚀 Future Enhancements & Extensions
*   **Ensemble Modeling**: Integrating PassiveAggressive, Naive Bayes, and Random Forest models side-by-side inside the training panel.
*   **Real-time Web Scrapers**: Adding automated scraping to search active Google News indices when a headline is submitted.
*   **Cross-Lingual Support**: Translating regional news into English before parsing it through the TF-IDF feature vocabulary.

---

## 📄 License
This project is released under the **Apache-2.0 License**. Developed for research and news verification purposes.
