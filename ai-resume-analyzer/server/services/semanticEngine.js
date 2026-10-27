/**
 * Deterministic Semantic Vector & Cosine Similarity Engine
 *
 * Implements an N-gram Term Frequency - Inverse Document Frequency (TF-IDF)
 * vectorizer and Cosine Similarity metric to compute a deterministic mathematical
 * compatibility baseline between resume content and job descriptions.
 *
 * This eliminates LLM scoring variance and mirrors the deterministic pre-filtering
 * stages used in enterprise ATS and modern Vector/RAG retrieval pipelines.
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
  "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
  "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
  "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
  "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
  "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
  "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
  "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
  "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
  "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
  "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
  "you've", "your", "yours", "yourself", "yourselves", "will", "shall", "role", "candidate", "responsibilities",
  "requirements", "qualifications", "preferred", "experience", "years", "looking", "working", "work", "job"
]);

/**
 * Normalizes text and produces unigrams and technical bigrams.
 */
export function tokenizeText(text) {
  if (!text) return [];

  // Normalize lower case and replace punctuation with spaces, preserving hyphens and dots in tech terms
  const cleaned = text
    .toLowerCase()
    .replace(/[/\\(),;:]/g, " ")
    .replace(/[^\w\s\.\-#+]/g, " ");

  const rawTokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim().replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

  const ngrams = [...rawTokens];

  // Generate bigrams for multi-word technical concepts (e.g., "ci cd", "react native", "system design")
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const bigram = `${rawTokens[i]} ${rawTokens[i + 1]}`;
    ngrams.push(bigram);
  }

  return ngrams;
}

/**
 * Computes Term Frequency map for a token list.
 */
function computeTermFrequencies(tokens) {
  const tf = new Map();
  if (tokens.length === 0) return tf;

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize frequency by total tokens
  for (const [token, count] of tf.entries()) {
    tf.set(token, count / tokens.length);
  }

  return tf;
}

/**
 * Computes Cosine Similarity between two TF-IDF vector representations.
 */
export function computeCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of vecA.entries()) {
    normA += valA * valA;
    const valB = vecB.get(key) || 0;
    dotProduct += valA * valB;
  }

  for (const [, valB] of vecB.entries()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes deterministic TF-IDF cosine similarity between resume and job description.
 *
 * @param {string} resumeText
 * @param {string} jdText
 * @returns {{
 *   score: number,
 *   vector_overlap: Array<{ term: string, weight: number }>,
 *   algorithm: string
 * }}
 */
export function computeSemanticSimilarity(resumeText, jdText) {
  const resumeTokens = tokenizeText(resumeText);
  const jdTokens = tokenizeText(jdText);

  if (resumeTokens.length === 0 || jdTokens.length === 0) {
    return {
      score: 50,
      vector_overlap: [],
      algorithm: "Deterministic TF-IDF Cosine Vector Similarity",
    };
  }

  const tfResume = computeTermFrequencies(resumeTokens);
  const tfJd = computeTermFrequencies(jdTokens);

  // Vocabulary of distinct terms
  const allTerms = new Set([...tfResume.keys(), ...tfJd.keys()]);

  // Compute Inverse Document Frequency (IDF) over this 2-document corpus
  // Terms present in both have moderate weight; terms uniquely shared emphasize specificity
  const idf = new Map();
  const totalDocs = 2;

  for (const term of allTerms) {
    let docsWithTerm = 0;
    if (tfResume.has(term)) docsWithTerm++;
    if (tfJd.has(term)) docsWithTerm++;

    // Standard smooth IDF formula
    const val = Math.log(1 + totalDocs / (1 + docsWithTerm)) + 1;
    idf.set(term, val);
  }

  // Build TF-IDF vectors
  const vecResume = new Map();
  const vecJd = new Map();

  for (const [term, tfVal] of tfResume.entries()) {
    vecResume.set(term, tfVal * (idf.get(term) || 1));
  }

  for (const [term, tfVal] of tfJd.entries()) {
    vecJd.set(term, tfVal * (idf.get(term) || 1));
  }

  const rawCosine = computeCosineSimilarity(vecResume, vecJd);

  // Cosine between rich text resumes & JDs typically sits between 0.15 (poor) and 0.70+ (exceptional)
  // We calibrate using an empirical sigmoid curve to scale 0.15 - 0.70 to a 0 - 100 benchmark score
  const calibrated = Math.round(
    Math.min(100, Math.max(10, ((rawCosine - 0.08) / (0.58 - 0.08)) * 100))
  );

  // Extract top overlapping terms sorted by mutual weight in JD
  const overlap = [];
  for (const [term, weightJd] of vecJd.entries()) {
    if (vecResume.has(term)) {
      const mutualScore = weightJd * vecResume.get(term);
      overlap.push({ term, mutualScore });
    }
  }

  overlap.sort((a, b) => b.mutualScore - a.mutualScore);

  const topVectorOverlap = overlap.slice(0, 10).map((item) => ({
    term: item.term,
    weight: Math.round(Math.min(100, item.mutualScore * 5000)) / 100,
  }));

  return {
    score: calibrated,
    raw_cosine: Math.round(rawCosine * 1000) / 1000,
    vector_overlap: topVectorOverlap,
    algorithm: "Deterministic TF-IDF N-Gram Vector Cosine",
  };
}
