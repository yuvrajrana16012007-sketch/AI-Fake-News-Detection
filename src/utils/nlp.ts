/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Standard list of English stop words used in natural language processing.
 */
export const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
  'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't",
  'should', "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn',
  "couldn't", 'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't",
  'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't",
  'shouldn', "shouldn't", 'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
]);

/**
 * Interface representing the detailed output of each step of the NLP pipeline.
 */
export interface PipelineSteps {
  original: string;
  lowercase: string;
  noPunctuation: string;
  noNumbers: string;
  tokens: string[];
  noStopWords: string[];
  lemmatized: string[];
}

/**
 * Simple rule-based lemmatizer/stemmer for common English endings.
 * This simulates a basic lemmatization process for a lightweight ML project.
 * 
 * @param word The token to lemmatize.
 * @returns The lemmatized/stemmed word.
 */
export function lemmatize(word: string): string {
  let w = word.toLowerCase().trim();
  
  if (w.length <= 2) {
    return w;
  }

  // Common verb/noun replacements
  const commonLemmas: Record<string, string> = {
    'is': 'be',
    'are': 'be',
    'am': 'be',
    'was': 'be',
    'were': 'be',
    'has': 'have',
    'had': 'have',
    'having': 'have',
    'goes': 'go',
    'went': 'go',
    'gone': 'go',
    'came': 'come',
    'comes': 'come',
    'found': 'find',
    'finding': 'find',
    'saying': 'say',
    'said': 'say',
    'says': 'say',
    'spaceships': 'spaceship',
    'stories': 'story',
    'conspiracies': 'conspiracy',
    'claims': 'claim',
    'claimed': 'claim',
    'claiming': 'claim',
    'elections': 'election',
    'politicians': 'politician',
    'vaccines': 'vaccine',
    'secrets': 'secret',
    'lying': 'lie',
    'lies': 'lie',
    'lied': 'lie'
  };

  if (commonLemmas[w]) {
    return commonLemmas[w];
  }

  // Suffix strip rules
  if (w.endsWith('sses')) {
    w = w.slice(0, -2); // caresses -> caress
  } else if (w.endsWith('ies')) {
    w = w.slice(0, -3) + 'y'; // worries -> worry
  } else if (w.endsWith('ss')) {
    // Keep ss (caress)
  } else if (w.endsWith('s') && !w.endsWith('us') && !w.endsWith('is') && !w.endsWith('as')) {
    w = w.slice(0, -1); // cats -> cat
  }

  if (w.endsWith('eed')) {
    if (w.length > 4) w = w.slice(0, -1); // agreed -> agree
  } else if (w.endsWith('ing')) {
    w = w.slice(0, -3); // walking -> walk
    if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) {
      w = w + 'e'; // duplicating -> duplicate, troubling -> trouble
    }
  } else if (w.endsWith('ed')) {
    w = w.slice(0, -2); // walked -> walk
  }

  if (w.endsWith('y') && w.length > 3) {
    // stem newly -> new, quickly -> quick (handled below if ending in ly)
  }

  if (w.endsWith('ly')) {
    w = w.slice(0, -2); // newly -> new
  }

  return w;
}

/**
 * Runs the text through the full NLP preprocessing pipeline.
 * Returns both the final processed array of stems and a detailed breakdown of each step.
 * 
 * @param text The input news article or headline text.
 * @returns PipelineSteps object containing the state of the text after each step.
 */
export function runNlpPipeline(text: string): PipelineSteps {
  const original = text;
  
  // 1. Lowercase conversion
  const lowercase = text.toLowerCase();
  
  // 2. Remove punctuation and special characters (keep spaces)
  // Replaces everything except letters, numbers, and spaces
  const noPunctuation = lowercase.replace(/[^\w\s\d]/g, ' ');
  
  // 3. Remove numbers
  const noNumbers = noPunctuation.replace(/\d+/g, ' ');
  
  // 4. Tokenization (split by whitespace and filter out empty strings)
  const tokens = noNumbers.split(/\s+/).filter(token => token.length > 0);
  
  // 5. Remove stop words
  const noStopWords = tokens.filter(token => !STOP_WORDS.has(token));
  
  // 6. Lemmatization
  const lemmatized = noStopWords.map(token => lemmatize(token));
  
  return {
    original,
    lowercase,
    noPunctuation,
    noNumbers,
    tokens,
    noStopWords,
    lemmatized
  };
}
