// lib/download.ts
export const downloadFile = (url: string, filename: string) => {
  // Create a temporary anchor element
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const downloadResume = () => {
  // Path to your resume file in the public folder
  const resumeUrl = "/Khalfan_Athman_Resume.pdf";
  downloadFile(resumeUrl, "Khalfan_Athman_Resume.pdf");
};
