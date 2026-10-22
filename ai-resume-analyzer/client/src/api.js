export async function analyzeResume(file, jobDescription) {
  const formData = new FormData();
  formData.append("resume", file);
  formData.append("jobDescription", jobDescription);

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to analyze resume.");
  }
  return data;
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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to generate tailored resume.");
  }
  return data;
}
