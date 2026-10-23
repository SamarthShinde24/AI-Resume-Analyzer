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
