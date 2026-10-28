async function parseApiResponse(res, defaultErrorMsg) {
  const contentType = res.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      // Fall through if json parsing fails
    }
  }

  if (!res.ok) {
    if (data?.error) {
      throw new Error(data.error);
    }
    const rawText = !data ? await res.text().catch(() => "") : "";
    throw new Error(rawText || `${defaultErrorMsg} (Status ${res.status})`);
  }

  if (!data) {
    throw new Error("Server returned an empty or invalid response.");
  }

  return data;
}

export async function analyzeResume(file, jobDescription) {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  return parseApiResponse(res, "Failed to analyze resume.");
}

export async function tailorResume({ file, jobDescription, resumeText }) {
  let res;
  if (file) {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    res = await fetch("/api/tailor", {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch("/api/tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription, resumeText }),
    });
  }

  return parseApiResponse(res, "Failed to generate tailored resume.");
}

export async function generateInterviewPrep({ file, jobDescription, resumeText }) {
  let res;
  if (file) {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    res = await fetch("/api/interview-prep", {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch("/api/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription, resumeText }),
    });
  }

  return parseApiResponse(res, "Failed to generate interview prep questions.");
}

export async function generateCoverLetter({ file, jobDescription, resumeText }) {
  let res;
  if (file) {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    res = await fetch("/api/cover-letter", {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch("/api/cover-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription, resumeText }),
    });
  }

  return parseApiResponse(res, "Failed to generate tailored cover letter.");
}

export async function scrapeJobUrl(url) {
  const res = await fetch("/api/scrape-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return parseApiResponse(res, "Failed to scrape job description from URL.");
}

export async function downloadTailoredDocx({
  resumeText,
  weakBullets = [],
  candidateName = "Candidate",
  autoApplyRewrites = true,
}) {
  const res = await fetch("/api/export-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeText,
      weakBullets,
      candidateName,
      autoApplyRewrites,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Failed to download DOCX (Status ${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanName = candidateName.replace(/[^a-zA-Z0-9_-]/g, "_") || "Tailored_Resume";
  a.download = `${cleanName}_Tailored_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
