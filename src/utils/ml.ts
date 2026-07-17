/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runNlpPipeline, PipelineSteps } from './nlp.ts';

/**
 * Structure of a News Item in our dataset.
 */
export interface NewsItem {
  id: string;
  title: string;
  text: string;
  label: 'Real' | 'Fake'; // Real = 1, Fake = 0
  category: string;
}

/**
 * Metrics generated after training or evaluating the model.
 */
export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    trueNegative: number;  // Fake predicted as Fake
    falsePositive: number; // Fake predicted as Real
    falseNegative: number; // Real predicted as Fake
    truePositive: number;  // Real predicted as Real
  };
}

/**
 * Serialized model state that can be saved/loaded (our equivalent of model.pkl & vectorizer.pkl).
 */
export interface SerializedModel {
  vocabulary: Record<string, number>;
  idf: Record<string, number>;
  weights: number[];
  bias: number;
  metrics: ModelMetrics;
}

/**
 * Standard TF-IDF Vectorizer replicating Scikit-Learn's TfidfVectorizer.
 */
export class TfidfVectorizer {
  vocabulary: Record<string, number> = {}; // word -> index
  idf: Record<string, number> = {};        // word -> idf value
  vocabList: string[] = [];                // index -> word

  /**
   * Fits the vectorizer on an array of tokenized documents and computes IDF.
   * Uses Scikit-Learn standard formula: idf = ln((1 + N) / (1 + df)) + 1
   */
  fit(documents: string[][]): void {
    this.vocabulary = {};
    this.idf = {};
    this.vocabList = [];

    const numDocs = documents.length;
    const documentFrequencies: Record<string, number> = {};

    // 1. Compute Document Frequencies (DF)
    for (const doc of documents) {
      const uniqueWords = new Set(doc);
      for (const word of uniqueWords) {
        documentFrequencies[word] = (documentFrequencies[word] || 0) + 1;
      }
    }

    // 2. Build Vocabulary (filter out extremely rare words if necessary, but keep all for small dataset)
    let index = 0;
    for (const word of Object.keys(documentFrequencies)) {
      if (documentFrequencies[word] >= 1) {
        this.vocabulary[word] = index;
        this.vocabList.push(word);
        index++;
      }
    }

    // 3. Compute Inverse Document Frequencies (IDF)
    // Formula matches Scikit-Learn smooth IDF
    for (const word of this.vocabList) {
      const df = documentFrequencies[word];
      this.idf[word] = Math.log((1 + numDocs) / (1 + df)) + 1;
    }
  }

  /**
   * Transforms a single document (lemmatized words) into an L2-normalized TF-IDF vector.
   */
  transform(doc: string[]): number[] {
    const vector = new Array(this.vocabList.length).fill(0);
    if (this.vocabList.length === 0) return vector;

    // 1. Compute Term Count (raw frequency)
    const termCounts: Record<string, number> = {};
    for (const word of doc) {
      if (this.vocabulary[word] !== undefined) {
        termCounts[word] = (termCounts[word] || 0) + 1;
      }
    }

    // 2. Apply TF * IDF
    for (const [word, count] of Object.entries(termCounts)) {
      const idx = this.vocabulary[word];
      const idf = this.idf[word] || 0;
      vector[idx] = count * idf; // raw term count * idf
    }

    // 3. Apply L2 Normalization (Euclidean norm = 1)
    let sumSquares = 0;
    for (let i = 0; i < vector.length; i++) {
      sumSquares += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSquares);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Helper to get top feature words and their weights for an article.
   */
  getTopFeatures(vector: number[], topN: number = 8): { word: string; value: number }[] {
    const features: { word: string; value: number }[] = [];
    for (let i = 0; i < vector.length; i++) {
      if (vector[i] > 0) {
        features.push({ word: this.vocabList[i], value: vector[i] });
      }
    }
    return features.sort((a, b) => b.value - a.value).slice(0, topN);
  }
}

/**
 * Logistic Regression classifier with Gradient Descent.
 */
export class LogisticRegression {
  weights: number[] = [];
  bias: number = 0;

  /**
   * Sigmoid activation function.
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, z)))); // clamp z to avoid overflow
  }

  /**
   * Trains the model using Gradient Descent with L2 regularization.
   * 
   * @param X Array of TF-IDF vectors (feature matrix).
   * @param y Array of binary labels (1 for Real, 0 for Fake).
   * @param learningRate Step size.
   * @param epochs Number of gradient descent iterations.
   * @param lambda L2 regularization factor.
   */
  fit(X: number[][], y: number[], learningRate: number = 0.5, epochs: number = 300, lambda: number = 0.01): void {
    if (X.length === 0) return;
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Initialize weights and bias to 0
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    // Gradient Descent loop
    for (let epoch = 0; epoch < epochs; epoch++) {
      const predictions: number[] = [];
      
      // Calculate predictions: p = sigmoid(X * w + b)
      for (let i = 0; i < numSamples; i++) {
        let z = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          z += X[i][j] * this.weights[j];
        }
        predictions.push(this.sigmoid(z));
      }

      // Compute gradients with L2 regularization
      const dw = new Array(numFeatures).fill(0);
      let db = 0;

      for (let i = 0; i < numSamples; i++) {
        const error = predictions[i] - y[i];
        db += error;
        for (let j = 0; j < numFeatures; j++) {
          dw[j] += error * X[i][j];
        }
      }

      // Divide by N and apply L2 regularization
      db /= numSamples;
      for (let j = 0; j < numFeatures; j++) {
        dw[j] = (dw[j] / numSamples) + (lambda * this.weights[j]);
      }

      // Update parameters
      this.bias -= learningRate * db;
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= learningRate * dw[j];
      }
    }
  }

  /**
   * Predicts the probability of being Real (1).
   */
  predictProbability(x: number[]): number {
    let z = this.bias;
    for (let i = 0; i < x.length; i++) {
      z += x[i] * (this.weights[i] || 0);
    }
    return this.sigmoid(z);
  }
}

/**
 * Standard preloaded dataset containing 40 news articles (half Real, half Fake).
 * This covers diverse topics and serves as the model training corpus.
 */
export const PRELOADED_DATASET: NewsItem[] = [
  // --- REAL NEWS (Label: Real) ---
  {
    id: 'r1',
    category: 'Politics',
    title: 'Senate Passes Landmark Bipartisan Infrastructure Spending Bill',
    text: 'The United States Senate on Tuesday passed a historic bipartisan infrastructure bill with a 69-30 vote, directing $550 billion in new federal investments toward roads, bridges, clean water, high-speed internet, and electric vehicle charging networks across the nation over five years.',
    label: 'Real'
  },
  {
    id: 'r2',
    category: 'Technology',
    title: 'NASA James Webb Space Telescope Sends Back Highly Detailed Images of Deep Universe',
    text: 'NASA astronomers today released the clearest infrared images yet of the distant cosmos. The James Webb Space Telescope successfully captured the sharp thermal signatures of nebula clusters, showing intricate details of star formation and ancient galaxies that formed over 13 billion years ago.',
    label: 'Real'
  },
  {
    id: 'r3',
    category: 'Health',
    title: 'World Health Organization Approves New Malaria Vaccine for Children',
    text: 'In a major medical milestone, the World Health Organization has recommended the widespread deployment of the groundbreaking malaria vaccine for children in sub-Saharan Africa. Clinical trial results show a significant 70 percent reduction in severe life-threatening malaria cases.',
    label: 'Real'
  },
  {
    id: 'r4',
    category: 'Science',
    title: 'Researchers Map Entire Human Genome of Ancient Neanderthal Species',
    text: 'Geneticists have successfully reconstructed the full high-coverage genome of an ancient Neanderthal woman using DNA extracted from a fossilized bone found in a cave. This genetic map provides unprecedented insights into human evolution, showing how ancient interbreeding shaped modern immunity.',
    label: 'Real'
  },
  {
    id: 'r5',
    category: 'Politics',
    title: 'Federal Reserve Raises Benchmark Interest Rate to Combat Inflation',
    text: 'The Federal Reserve announced a quarter-percentage-point increase in its benchmark lending rate on Wednesday, seeking to cool economic demand and curb persistent inflation, which has hit a 40-year high. Fed Chairman Jerome Powell stated the central bank remains committed to restoring price stability.',
    label: 'Real'
  },
  {
    id: 'r6',
    category: 'Business',
    title: 'Global Chip Shortage Causes Temporary Shutdowns in Automotive Assembly Lines',
    text: 'Several major automobile manufacturers announced temporary factory closures this week due to an ongoing global shortage of microchips. The supply chain bottlenecks, triggered by pandemic lockdowns and surging consumer demand for electronics, have delayed vehicle deliveries globally.',
    label: 'Real'
  },
  {
    id: 'r7',
    category: 'Science',
    title: 'Oceanographers Discover Sixty New Marine Species in Deep Sea Trench Expedition',
    text: 'A international team of ocean biologists returned from a deep-sea diving expedition in the Pacific Ocean with over sixty previously unrecorded marine species, including glowing jellyfish, deep-water corals, and unique blind crustaceans living near thermal vents.',
    label: 'Real'
  },
  {
    id: 'r8',
    category: 'Technology',
    title: 'Tech Giants Agree to Set Global Safety Guidelines for Generative AI Development',
    text: 'Following a coordinate summit, major artificial intelligence development laboratories signed a voluntary safety charter outlining standardized protocols for testing large-scale models, watermarking generated content, and preventing the propagation of synthetic identity theft tools.',
    label: 'Real'
  },
  {
    id: 'r9',
    category: 'Science',
    title: 'Europe Experiences Warmest Summer on Record, Environmental Agencies Report',
    text: 'The European Union Climate Change Service confirmed that this summer was the continent warmest on record, characterized by persistent heatwaves, devastating wildfires, and severe droughts that lowered water levels of major shipping canals to critical depths.',
    label: 'Real'
  },
  {
    id: 'r10',
    category: 'Politics',
    title: 'Supreme Court Rules in Favor of Expanding Digital Privacy Protections',
    text: 'In a unanimous 9-0 decision, the Supreme Court ruled that law enforcement officials must secure a warrant before accessing historical cell-site location information of suspects, setting a significant legal precedent for personal digital privacy rights in the digital age.',
    label: 'Real'
  },
  {
    id: 'r11',
    category: 'Health',
    title: 'FDA Approves Pioneering Gene-Editing Therapy for Sickle Cell Disease',
    text: 'The Food and Drug Administration has officially approved the first cell-based gene therapy using CRISPR technology to treat sickle cell disease. The historic approval offers a potential lifetime cure for patients suffering from the painful genetic blood disorder.',
    label: 'Real'
  },
  {
    id: 'r12',
    category: 'Business',
    title: 'Renewable Energy Outpaces Coal Generation in United States Electricity Sector',
    text: 'The US Energy Information Administration reported that combined electricity generation from wind, solar, and hydroelectric resources exceeded coal-fired generation for the first time in history, representing a major transition in the national energy portfolio.',
    label: 'Real'
  },
  {
    id: 'r13',
    category: 'Technology',
    title: 'Cybersecurity Agencies Issue Warning Over Sophisticated Ransomware Campaign',
    text: 'A joint cybersecurity advisory was published by international security agencies, warning of a coordinated ransomware group targeting regional hospitals and municipal grid utilities, exploiting outdated VPN firmware to gain network access.',
    label: 'Real'
  },
  {
    id: 'r14',
    category: 'Science',
    title: 'Archaeologists Uncover Lost Mayan City in Remote Guatemalan Jungle',
    text: 'Using airborne laser mapping technology (LiDAR), archaeologists have mapped a massive, previously hidden Mayan metropolis containing pyramids, defensive fortifications, and sophisticated agricultural canals buried beneath dense tropical forest canopy.',
    label: 'Real'
  },
  {
    id: 'r15',
    category: 'Politics',
    title: 'United Nations Signs Global Treaty to Protect Biodiversity in High Seas',
    text: 'After nearly two decades of negotiations, UN member nations adopted a unified treaty to protect marine life in international waters. The agreement establishes a legal framework to create massive ocean sanctuaries, restricting commercial fishing and deep-sea mining.',
    label: 'Real'
  },
  {
    id: 'r16',
    category: 'Health',
    title: 'Regular Aerobic Exercise Significantly Enhances Cognitive Memory in Older Adults',
    text: 'A randomized clinical study of seniors found that engaging in moderate aerobic exercise three times a week for six months increases the volume of the hippocampus, the brain region critical for verbal memory and spatial learning, reducing risks of dementia.',
    label: 'Real'
  },
  {
    id: 'r17',
    category: 'Business',
    title: 'E-Commerce Platform Reports Sharp Rise in Small Business Export Sales',
    text: 'Financial earnings reports highlight a 35 percent annual growth in global sales for independent merchants utilizing cross-border e-commerce tools, showing how standardized payment APIs have enabled micro-businesses to reach international consumer bases.',
    label: 'Real'
  },
  {
    id: 'r18',
    category: 'Science',
    title: 'Geologists Trace Origins of Historic Volcanic Eruption in Iceland',
    text: 'Geologists studying rock formations have published a comprehensive timeline of the recent volcanic fissure eruption, determining that magma migrated through a 15-kilometer underground conduit before breaching the surface, validating predictive warning models.',
    label: 'Real'
  },
  {
    id: 'r19',
    category: 'Politics',
    title: 'G20 Leaders Agree on Minimum Corporate Tax Framework to Curb Tax Havens',
    text: 'Leaders of the world largest economies reached a consensus to establish a minimum global corporate tax rate of 15 percent, aiming to discourage multinational corporations from shifting profits to low-tax jurisdictions to avoid local tax obligations.',
    label: 'Real'
  },
  {
    id: 'r20',
    category: 'Technology',
    title: 'Autonomous Delivery Drones Receive Flight Approvals for Dense Suburbs',
    text: 'Federal aviation administrators have granted key safety certifications to a drone logistics firm, allowing autonomous commercial parcel delivery flights in suburban residential neighborhoods without requiring active spotters on the ground.',
    label: 'Real'
  },

  // --- FAKE NEWS (Label: Fake) ---
  {
    id: 'f1',
    category: 'Conspiracy',
    title: 'SHOCKING SECRET: Microwave Ovens Emit Chemical Waves That Brainwash Citizens',
    text: 'A secret government document leaked by an anonymous insider reveals that all modern microwave ovens contain military-grade frequencies. These micro-pulses alter human brain chemistry, making citizens highly obedient to government broadcasts and destroying independent logical thinking.',
    label: 'Fake'
  },
  {
    id: 'f2',
    category: 'Celebrity',
    title: 'CONFIRMED: Famous Movie Star Replaced by Fully Functional Clone Robot',
    text: 'Shocking photographic evidence circulating online shows a bizarre mechanical port behind the ear of a famous celebrity. Experts confirm the beloved Oscar-winning actor died in a secret incident last year and has been replaced by a highly advanced clone robot to avoid movie studio bankruptcy.',
    label: 'Fake'
  },
  {
    id: 'f3',
    category: 'Science',
    title: 'NASA Secretly Admits Moon is Actually Made of Glowing Artificial Bioluminescent Ice',
    text: 'Leaked laboratory tapes from deep within NASA research centers prove that the 1969 moon landings were staged because scientists discovered the moon is not solid rock. It is actually a giant hollow ball of ancient glowing alien ice designed to illuminate the Earth for orbital monitoring.',
    label: 'Fake'
  },
  {
    id: 'f4',
    category: 'Health',
    title: 'Drinking Boiling Lemon Juice and Vinegar Instantly Cures All Virus Infections',
    text: 'Doctors do not want you to know this simple secret cure! Drinking a cup of freshly boiled lemon juice mixed with two tablespoons of raw vinegar completely flushes any virus out of your body within 45 seconds. Big pharma is actively suppressing this medical breakthrough to keep selling pills.',
    label: 'Fake'
  },
  {
    id: 'f5',
    category: 'Conspiracy',
    title: 'Government Secretly Installing Hidden Mind-Control Microchips in Everyday Drinking Water',
    text: 'Emergency alert! Reliable whistleblowers have revealed that local municipal water agencies are infusing drinking water with microscopic smart microchips. Once swallowed, these nanotechnologies connect directly to cell phone towers, giving politicians full mind-control capabilities over the population.',
    label: 'Fake'
  },
  {
    id: 'f6',
    category: 'Finance',
    title: 'All Global Banks Closing Forever Tomorrow, Withdraw Your Money Immediately',
    text: 'Urgent warning! A secret global financial memo shows that every major banking institution in the world will freeze all personal accounts and shut down operations permanently at midnight. A new global order will replace paper money with virtual credits, erasing your lifetime savings.',
    label: 'Fake'
  },
  {
    id: 'f7',
    category: 'Celebrity',
    title: 'Pioneering Actor Lives in Secret Underground Base Beneath Active Volcano in Italy',
    text: 'Exclusive reports reveal that a legendary Hollywood movie star has built a 20-story luxury survival bunker directly inside an active volcano. Powered by geothermal heat, the base is designed to protect elites from an upcoming magnetic pole shift that will destroy outer cities.',
    label: 'Fake'
  },
  {
    id: 'f8',
    category: 'Health',
    title: 'Secret Study Proves Eating Plastic Wrappers Extends Human Lifespan to 150 Years',
    text: 'Scientists have secretly discovered that certain chemicals inside food plastic packaging act as a powerful cellular preservative. Consuming small shredded pieces of plastic wraps halts cellular aging entirely, allowing humans to easily live past 150 years without disease.',
    label: 'Fake'
  },
  {
    id: 'f9',
    category: 'Conspiracy',
    title: 'Giant Alien Spacecraft Hidden Inside Clouds Over New York City Preparing to Land',
    text: 'Amateur weather radar operators have detected a massive metallic mothership, larger than five football fields, hovering completely silent inside storm clouds. The military is actively spraying chemicals to keep the alien spaceship invisible from public sight to prevent national panic.',
    label: 'Fake'
  },
  {
    id: 'f10',
    category: 'Technology',
    title: 'New Smartphone App Lets You Teleport Small Objects Over the Internet Instantly',
    text: 'Tech breakthrough! A new app released by a shadowy startup uses advanced quantum entanglement algorithms to convert real physical objects into digital files. Users can place a key on their screen and send it to friends over text message, where it materializes out of their speakers.',
    label: 'Fake'
  },
  {
    id: 'f11',
    category: 'Politics',
    title: 'Congress Secretly Votes to Outlaw Sleeping on Tuesdays to Boost National Productivity',
    text: 'In a midnight session behind locked doors, federal politicians quietly passed a law making it a federal crime to sleep between 9:00 PM and 5:00 AM on Tuesdays. Citizens caught resting will be fined, with the goal of raising industrial manufacturing output.',
    label: 'Fake'
  },
  {
    id: 'f12',
    category: 'Science',
    title: 'Ancient Pyramids Were Massive Wireless Electricity Generators Built by Extraterrestrials',
    text: 'Archaeologists with secret clearance have found copper coils and gold-plated chambers inside the Great Pyramid. This proves the structure was not a tomb, but a nuclear-powered wireless power station left by space aliens to charge their atmospheric flying saucers.',
    label: 'Fake'
  },
  {
    id: 'f13',
    category: 'Health',
    title: 'Scientists Confirm Staring Directly at the Sun for Ten Minutes Cures Blindness',
    text: 'A shocking new report from a rogue ophthalmology lab proves that intense solar radiation stimulates dormant optical nerves. Staring directly into the sun during mid-day bypasses damaged retinas and completely restores full vision to blind individuals within three sessions.',
    label: 'Fake'
  },
  {
    id: 'f14',
    category: 'Conspiracy',
    title: 'Leaked NASA Photos Show Giant Ancient Brick Wall at the Edge of Flat Earth',
    text: 'Deep conspiracy uncovered! Whistleblower pilots have leaked satellite images taken at the South Pole showing a massive, 1000-foot-tall brick wall blocking the edge of our flat world. The military guards the wall with warships to hide the vast outer continents from us.',
    label: 'Fake'
  },
  {
    id: 'f15',
    category: 'Finance',
    title: 'Government to Hand Out Million-Dollar Gold Bars to Every Household Next Week',
    text: 'To completely solve national poverty, the Treasury has minted solid gold bullion bricks for every family. Armored trucks are preparing to distribute them door-to-door starting Monday. No work is required; simply sign a receipt and become a millionaire.',
    label: 'Fake'
  },
  {
    id: 'f16',
    category: 'Technology',
    title: 'New Quantum Wi-Fi Transmits Internet Signals Through Solid Rock and Earth Core',
    text: 'A subterranean internet firm has bypassed satellites entirely. By encoding data packets in neutrino streams, their new Wi-Fi routers transmit flawless gigabit speeds directly through thousands of miles of molten iron in the Earth core, leaving conventional fiber optic networks obsolete.',
    label: 'Fake'
  },
  {
    id: 'f17',
    category: 'Science',
    title: 'Gravity is Decreasing Globally, Humans Will Float Away by the Year 2030',
    text: 'Highly secret cosmic measurements reveal that the core gravity constant of the solar system is decaying rapidly. Physicists predict that within four years, gravity on Earth will drop by 90 percent, requiring all citizens to wear heavy iron boots to avoid drifting into the upper stratosphere.',
    label: 'Fake'
  },
  {
    id: 'f18',
    category: 'Celebrity',
    title: 'Worldwide Pop Star Admits to Being Born on Mars and Sent Here via Meteorite',
    text: 'In a startling live interview that was quickly deleted from the internet, a top pop music icon admitted she is not human. She was hatched from an egg in a martian underground colony and transported to Earth inside a hollow iron meteorite that crashed in Russia in 1999.',
    label: 'Fake'
  },
  {
    id: 'f19',
    category: 'Politics',
    title: 'Leaked Law Permits Cats to Vote in Municipal Elections to Enhance Democracy',
    text: 'To ensure a more compassionate legal system, federal courts have ruled that registered domestic felines possess equal citizenship rights. Pet owners can now bring their cats to local polling booths to cast legal ballot papers in county and city tax debates.',
    label: 'Fake'
  },
  {
    id: 'f20',
    category: 'Technology',
    title: 'Secret Code Found in Toasters Allows Free Unlimited Electricity Generation',
    text: 'Electrical companies do not want you to know this simple trick! Inputting a secret key combination on your kitchen toaster button dial causes the heating elements to operate in reverse, pushing 240 volts of free electricity back into your home sockets and reducing your bill to zero.',
    label: 'Fake'
  }
];

/**
 * Trains the TF-IDF Vectorizer and Logistic Regression model on a dataset.
 * Computes accuracy and details the standard metrics.
 * 
 * @param dataset The news dataset.
 * @returns Fully serialized model containing vocabulary, IDF values, weights, and bias.
 */
export function trainModel(dataset: NewsItem[]): SerializedModel {
  // 1. Run NLP pipeline on all items
  const documents: string[][] = [];
  const labels: number[] = []; // Real = 1, Fake = 0

  for (const item of dataset) {
    const pipeline = runNlpPipeline(`${item.title} ${item.text}`);
    documents.push(pipeline.lemmatized);
    labels.push(item.label === 'Real' ? 1 : 0);
  }

  // 2. Fit TF-IDF Vectorizer
  const vectorizer = new TfidfVectorizer();
  vectorizer.fit(documents);

  // 3. Transform documents to feature matrices
  const X: number[][] = [];
  for (const doc of documents) {
    X.push(vectorizer.transform(doc));
  }

  // 4. Train Logistic Regression
  const model = new LogisticRegression();
  model.fit(X, labels, 0.5, 400, 0.005); // Learning rate 0.5, 400 epochs, minor regularization

  // 5. Evaluate the model on the training data (for simple demonstration)
  let truePositive = 0;  // Real predicted as Real
  let falsePositive = 0; // Fake predicted as Real
  let falseNegative = 0; // Real predicted as Fake
  let trueNegative = 0;  // Fake predicted as Fake

  for (let i = 0; i < X.length; i++) {
    const prob = model.predictProbability(X[i]);
    const pred = prob >= 0.5 ? 1 : 0;
    const actual = labels[i];

    if (actual === 1) {
      if (pred === 1) truePositive++;
      else falseNegative++;
    } else {
      if (pred === 0) trueNegative++;
      else falsePositive++;
    }
  }

  const accuracy = (truePositive + trueNegative) / dataset.length;
  const precision = truePositive / (truePositive + falsePositive || 1);
  const recall = truePositive / (truePositive + falseNegative || 1);
  const f1Score = (2 * precision * recall) / (precision + recall || 1);

  const metrics: ModelMetrics = {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: {
      trueNegative,
      falsePositive,
      falseNegative,
      truePositive
    }
  };

  // Convert map weights and IDFs to JSON format
  const serialized: SerializedModel = {
    vocabulary: vectorizer.vocabulary,
    idf: vectorizer.idf,
    weights: model.weights,
    bias: model.bias,
    metrics
  };

  return serialized;
}

/**
 * Predicts the label of a query text using a serialized model.
 * 
 * @param modelState The serialized model.
 * @param title Headline text.
 * @param text Article text.
 * @returns Object containing predictions, confidence, pipeline logs, and explanation.
 */
export function predictNews(
  modelState: SerializedModel,
  title: string,
  text: string
): {
  label: 'Real' | 'Fake';
  probability: number;
  confidence: number;
  wordCount: number;
  charCount: number;
  readingTimeMin: number;
  pipeline: PipelineSteps;
  topFeatures: { word: string; value: number }[];
} {
  const combinedText = `${title} ${text}`;
  
  // 1. Run Pipeline
  const pipeline = runNlpPipeline(combinedText);

  // 2. Reconstruct Vectorizer from serialized state
  const vectorizer = new TfidfVectorizer();
  vectorizer.vocabulary = modelState.vocabulary;
  vectorizer.idf = modelState.idf;
  vectorizer.vocabList = new Array(Object.keys(modelState.vocabulary).length);
  for (const [word, idx] of Object.entries(modelState.vocabulary)) {
    vectorizer.vocabList[idx] = word;
  }

  // 3. Vectorize text
  const x = vectorizer.transform(pipeline.lemmatized);

  // 4. Reconstruct Logistic Regression
  const logReg = new LogisticRegression();
  logReg.weights = modelState.weights;
  logReg.bias = modelState.bias;

  // 5. Predict
  const probability = logReg.predictProbability(x);
  const label = probability >= 0.5 ? 'Real' : 'Fake';
  
  // Confidence is how far the prediction is from decision boundary 0.5
  // Real: close to 1.0 -> 100% confidence. Close to 0.5 -> 0% confidence.
  // Fake: close to 0.0 -> 100% confidence. Close to 0.5 -> 0% confidence.
  const confidence = Math.round(Math.abs(probability - 0.5) * 2 * 100);

  // Calculate text metadata
  const cleanWords = combinedText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = cleanWords.length;
  const charCount = combinedText.length;
  // Avg reading speed is 225 words per minute
  const readingTimeMin = Math.max(1, Math.round(wordCount / 225));

  // Extract top matching vocabulary features from the vectorizer
  const topFeatures = vectorizer.getTopFeatures(x);

  return {
    label,
    probability,
    confidence,
    wordCount,
    charCount,
    readingTimeMin,
    pipeline,
    topFeatures
  };
}
