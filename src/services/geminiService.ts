import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const MODEL_NAME = "gemini-3-flash-preview";

// Helper to get AI instance
const getAI = () => {
  const apiKey = (process.env.GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY) as string;
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please ensure it is configured in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const evaluateResume = async (file: File): Promise<any> => {
  const ai = getAI();
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        {
          text: `Evaluate this resume and provide a structured analysis in JSON format.
          Include: score (0-100), strengths (array of strings), weaknesses (array of strings), skills_detected (array of strings), recommended_roles (array of strings), and improvements (array of strings).
          Ensure the output is valid JSON.`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          skills_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "strengths", "weaknesses", "skills_detected", "recommended_roles", "improvements"]
      }
    }
  });

  let cleanText = response.text || "{}";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};

export const analyzeSkillGap = async (currentSkills: string[], targetRole: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Analyze the skill gap for a ${targetRole} role given these current skills: ${currentSkills.join(", ")}.
    Provide a JSON response with: missing_skills (array), recommended_courses (array), learning_priority (string), and estimated_time (string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended_courses: { type: Type.ARRAY, items: { type: Type.STRING } },
          learning_priority: { type: Type.STRING },
          estimated_time: { type: Type.STRING }
        },
        required: ["missing_skills", "recommended_courses", "learning_priority", "estimated_time"]
      }
    }
  });

  let cleanText = response.text || "{}";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};

export const generateTrainingPlan = async (role: string, gaps: string[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Create a 90-day training plan for a ${role} role focusing on these gaps: ${gaps.join(", ")}.
    Provide a JSON response with: plan_30_days, plan_60_days, plan_90_days. Each should be an object with 'focus', 'courses', 'projects', and 'milestones'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plan_30_days: { type: Type.OBJECT, properties: { focus: { type: Type.STRING }, courses: { type: Type.ARRAY, items: { type: Type.STRING } }, projects: { type: Type.ARRAY, items: { type: Type.STRING } }, milestones: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          plan_60_days: { type: Type.OBJECT, properties: { focus: { type: Type.STRING }, courses: { type: Type.ARRAY, items: { type: Type.STRING } }, projects: { type: Type.ARRAY, items: { type: Type.STRING } }, milestones: { type: Type.ARRAY, items: { type: Type.STRING } } } },
          plan_90_days: { type: Type.OBJECT, properties: { focus: { type: Type.STRING }, courses: { type: Type.ARRAY, items: { type: Type.STRING } }, projects: { type: Type.ARRAY, items: { type: Type.STRING } }, milestones: { type: Type.ARRAY, items: { type: Type.STRING } } } }
        }
      }
    }
  });

  let cleanText = response.text || "{}";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};

export const generateQuiz = async (skill: string, difficulty: string, count: number = 5): Promise<any[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Generate a ${difficulty} difficulty quiz for ${skill} with ${count} questions.
    Return a JSON array of objects with: question, options (array of 4), correct_answer (string), and explanation.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  });

  let cleanText = response.text || "[]";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};

export const generateInterviewQuestions = async (role: string, level: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Generate 5 interview questions for a ${level} ${role} position.
    Include a mix of technical and behavioral questions. Return as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  let cleanText = response.text || "[]";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};

export const evaluateInterviewAnswer = async (role: string, answers: {question: string, answer: string}[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Evaluate these interview answers for a ${role} role: ${JSON.stringify(answers)}.
    Provide a JSON response with: feedback (string), scores (object with technical, communication, confidence as 0-100), and tips (array).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feedback: { type: Type.STRING },
          scores: {
            type: Type.OBJECT,
            properties: {
              technical: { type: Type.INTEGER },
              communication: { type: Type.INTEGER },
              confidence: { type: Type.INTEGER }
            }
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  let cleanText = response.text || "{}";
  cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleanText);
};
