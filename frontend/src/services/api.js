const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Uploads a resume and job description for analysis
 * @param {File} resumeFile - The PDF file object
 * @param {string} jobDescription - The job description text
 */
export const analyzeResume = async (resumeFile, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('job_description', jobDescription);

    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

/**
 * Fetches the history of past resume scans
 */
export const getHistory = async () => {
  try {
    const response = await fetch(`${BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return []; // Return empty array on error to prevent UI crash
  }
};