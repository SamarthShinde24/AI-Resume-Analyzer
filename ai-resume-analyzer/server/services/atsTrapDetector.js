/**
 * ATS "Red Flag" & Parseability Trap Detector
 *
 * Scans resume content for common rejection traps used by legacy ATS parsers
 * (Workday, Taleo, Greenhouse, iCIMS):
 * 1. Missing standard section headers (Experience, Education, Skills, Summary)
 * 2. Overuse of first-person pronouns ("I", "my", "we")
 * 3. Weak passive voice and generic buzzword clichés
 * 4. Contact details validation (Email, Phone, LinkedIn/GitHub links)
 * 5. Structural formatting health (bullet density, length balance)
 */

const STANDARD_SECTIONS = [
  {
    key: "experience",
    label: "Work Experience",
    pattern: /(?:experience|employment|work history|professional history|career history)/i,
    required: true,
  },
  {
    key: "education",
    label: "Education",
    pattern: /(?:education|academic|qualifications|degrees|university|college)/i,
    required: true,
  },
  {
    key: "skills",
    label: "Skills / Technical Stack",
    pattern: /(?:skills|technical skills|technologies|proficiencies|core competencies)/i,
    required: true,
  },
  {
    key: "summary",
    label: "Professional Summary / Profile",
    pattern: /(?:summary|professional summary|profile|about me|objective)/i,
    required: false,
  },
  {
    key: "projects",
    label: "Projects / Portfolio",
    pattern: /(?:projects|technical projects|portfolio|key achievements)/i,
    required: false,
  },
];

const FIRST_PERSON_PRONOUNS = [
  { word: "I", regex: /\bI\b/g },
  { word: "me", regex: /\bme\b/gi },
  { word: "my", regex: /\bmy\b/gi },
  { word: "myself", regex: /\bmyself\b/gi },
  { word: "we", regex: /\bwe\b/gi },
  { word: "our", regex: /\bour\b/gi },
  { word: "ourselves", regex: /\bourselves\b/gi },
];

const PASSIVE_BUZZWORDS = [
  { phrase: "responsible for", tip: "Replace with action verbs (e.g. 'Architected', 'Spearheaded', 'Delivered')." },
  { phrase: "helped with", tip: "State your exact individual contribution and measurable impact." },
  { phrase: "assisted in", tip: "Use high-ownership verbs like 'Co-designed' or 'Implemented'." },
  { phrase: "tasked with", tip: "Shows passive reception of tasks. Use proactive verbs like 'Executed' or 'Engineered'." },
  { phrase: "worked on", tip: "Too vague. Specify what you built, optimized, or shipped." },
  { phrase: "team player", tip: "Overused cliché. Demonstrate cross-functional leadership through metrics instead." },
  { phrase: "hard worker", tip: "Empty buzzword. Replace with quantifiable achievements and deliverables." },
  { phrase: "go-getter", tip: "Unprofessional slang. Focus on measurable results and initiative." },
  { phrase: "fast learner", tip: "Show technologies adopted and ramp-up timeline rather than claiming fast learning." },
  { phrase: "detail oriented", tip: "Demonstrate precision through zero-bug deployments or rigorous testing metrics." },
];

/**
 * Scans resume text and returns comprehensive ATS parseability diagnostics.
 *
 * @param {string} resumeText
 * @returns {object} ATS parseability diagnostics
 */
export function detectAtsTraps(resumeText) {
  if (!resumeText || typeof resumeText !== "string") {
    return {
      ats_health_score: 50,
      total_traps_found: 1,
      traps: [
        {
          id: "empty_text",
          severity: "critical",
          category: "Parseability",
          title: "Unparseable Document Content",
          detail: "No readable text content could be extracted from this document.",
          recommendation: "Ensure your resume is a text-based PDF or DOCX file, not a flattened image or scanned photo.",
        },
      ],
      section_check: [],
      pronoun_audit: { count: 0, items: [] },
      buzzword_audit: { count: 0, items: [] },
      contact_check: { has_email: false, has_phone: false, has_linkedin: false },
    };
  }

  const traps = [];
  let scoreDeductions = 0;

  // 1. Standard Section Headers Check
  const sectionCheck = STANDARD_SECTIONS.map((sec) => {
    const detected = sec.pattern.test(resumeText);
    if (!detected && sec.required) {
      traps.push({
        id: `missing_${sec.key}`,
        severity: "critical",
        category: "ATS Section Trap",
        title: `Missing Standard "${sec.label}" Header`,
        detail: `ATS parsers look for explicit headers like "${sec.label}" to categorize your background into internal database fields.`,
        recommendation: `Add an explicit uppercase header named "${sec.label.toUpperCase()}" with standard bullet points below it.`,
      });
      scoreDeductions += 15;
    } else if (!detected && !sec.required) {
      traps.push({
        id: `missing_${sec.key}`,
        severity: "warning",
        category: "Section Optimization",
        title: `Consider Adding "${sec.label}"`,
        detail: `Including a dedicated "${sec.label}" section increases ATS keyword density and recruiter readability.`,
        recommendation: `Add a brief 2–3 line "${sec.label}" section highlighting your top technical achievements.`,
      });
      scoreDeductions += 5;
    }
    return { key: sec.key, label: sec.label, detected, required: sec.required };
  });

  // 2. First-Person Pronouns Check
  let totalPronouns = 0;
  const pronounMatches = [];
  for (const item of FIRST_PERSON_PRONOUNS) {
    const matches = resumeText.match(item.regex);
    if (matches && matches.length > 0) {
      totalPronouns += matches.length;
      pronounMatches.push({ word: item.word, count: matches.length });
    }
  }

  if (totalPronouns > 3) {
    traps.push({
      id: "pronoun_overuse",
      severity: totalPronouns > 8 ? "critical" : "warning",
      category: "Grammar & Tone",
      title: `Overuse of First-Person Pronouns (${totalPronouns} found)`,
      detail: `Resumes must use active telegraphic voice. Pronouns like "${pronounMatches.map((p) => p.word).join('", "')}" waste space and violate professional ATS resume standards.`,
      recommendation: `Convert sentences like "I led a team of 5" to "Led cross-functional team of 5 engineers to deliver...".`,
    });
    scoreDeductions += Math.min(20, totalPronouns * 2);
  }

  // 3. Passive Voice & Generic Buzzwords
  const buzzwordsFound = [];
  for (const b of PASSIVE_BUZZWORDS) {
    const regex = new RegExp(`\\b${b.phrase}\\b`, "gi");
    const count = (resumeText.match(regex) || []).length;
    if (count > 0) {
      buzzwordsFound.push({ phrase: b.phrase, count, tip: b.tip });
    }
  }

  if (buzzwordsFound.length > 0) {
    traps.push({
      id: "passive_buzzwords",
      severity: buzzwordsFound.length >= 3 ? "warning" : "info",
      category: "Impact & Action Verbs",
      title: `Passive Voice & Weak Buzzwords Detected (${buzzwordsFound.length} items)`,
      detail: `Terms like "${buzzwordsFound.slice(0, 3).map((b) => b.phrase).join('", "')}" weaken your resume's perceived authority and dilute action verbs.`,
      recommendation: buzzwordsFound[0]?.tip || "Replace passive phrases with strong quantifiable action verbs.",
    });
    scoreDeductions += Math.min(15, buzzwordsFound.length * 3);
  }

  // 4. Contact Information Check
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = /linkedin\.com\/in\/|linkedin/i.test(resumeText);
  const githubMatch = /github\.com\/|github/i.test(resumeText);

  if (!emailMatch) {
    traps.push({
      id: "missing_email",
      severity: "critical",
      category: "Contact Integrity",
      title: "No Contact Email Found",
      detail: "ATS parsers require a valid email address to create candidate profiles and trigger automated interview invitations.",
      recommendation: "Place your professional email clearly at the top of page 1.",
    });
    scoreDeductions += 20;
  }

  if (!phoneMatch) {
    traps.push({
      id: "missing_phone",
      severity: "warning",
      category: "Contact Integrity",
      title: "No Phone Number Detected",
      detail: "Many corporate ATS gateways require a phone number field to submit candidate applications.",
      recommendation: "Include a formatted phone number (e.g., +1 (555) 012-3456) in the header.",
    });
    scoreDeductions += 5;
  }

  if (!linkedinMatch && !githubMatch) {
    traps.push({
      id: "missing_profiles",
      severity: "info",
      category: "Digital Footprint",
      title: "No LinkedIn or GitHub Profile Link",
      detail: "Technical recruiters verify candidates by checking verified code repositories and professional recommendations.",
      recommendation: "Add your LinkedIn profile URL and GitHub/Portfolio link in the top contact banner.",
    });
    scoreDeductions += 5;
  }

  // 5. Word Count & Density
  const words = resumeText.trim().split(/\s+/).length;
  if (words < 200) {
    traps.push({
      id: "resume_too_short",
      severity: "critical",
      category: "Content Depth",
      title: `Resume Content Too Brief (${words} words)`,
      detail: "A standard single-page technical resume typically contains between 400 and 700 words. Short resumes fail ATS keyword thresholds.",
      recommendation: "Elaborate on technical project implementations, measurable business results, and tech stack proficiencies.",
    });
    scoreDeductions += 20;
  } else if (words > 1600) {
    traps.push({
      id: "resume_too_long",
      severity: "warning",
      category: "Content Depth",
      title: `High Word Count (${words} words)`,
      detail: "Resumes over 1,500 words (3+ pages) often get truncated or skimmed past by time-pressed recruiters.",
      recommendation: "Condense older roles into 2 bullets each and focus heavily on the most recent 4 years of experience.",
    });
    scoreDeductions += 10;
  }

  // If no critical traps found, add a positive confirmation
  if (traps.filter((t) => t.severity === "critical").length === 0) {
    traps.unshift({
      id: "ats_parsable_pass",
      severity: "passed",
      category: "Parseability",
      title: "Clean ATS Structural Foundation",
      detail: "Core standard section headers and key contact identifiers were successfully parsed without critical blocking traps.",
      recommendation: "Continue refining keyword alignment and quantifiable metrics.",
    });
  }

  const atsHealthScore = Math.max(20, Math.min(100, 100 - scoreDeductions));

  return {
    ats_health_score: atsHealthScore,
    total_traps_found: traps.filter((t) => t.severity !== "passed").length,
    traps,
    section_check: sectionCheck,
    pronoun_audit: {
      count: totalPronouns,
      items: pronounMatches,
    },
    buzzword_audit: {
      count: buzzwordsFound.reduce((acc, b) => acc + b.count, 0),
      items: buzzwordsFound,
    },
    contact_check: {
      has_email: Boolean(emailMatch),
      has_phone: Boolean(phoneMatch),
      has_linkedin: linkedinMatch,
      has_github: githubMatch,
    },
  };
}
