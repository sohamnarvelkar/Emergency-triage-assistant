import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PatientData {
  age: number;
  heart_rate: number;
  systolic_blood_pressure: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  body_temperature: number;
  pain_level: number;
  chronic_disease_count: number;
  previous_er_visits: number;
  arrival_mode: string;
  symptoms: string;
  medical_history: string;
}

export interface PredictionResult {
  triage_level: number;
  confidence: number;
  risk_factors: string[];
  explanation: {
    top_features: string[];
    summary: string;
    clinical_summary: string;
  };
}

export const analyzeTriage = async (data: PatientData): Promise<PredictionResult> => {
  const prompt = `
    As a clinical triage expert, analyze the following patient data and classify their urgency level using the Emergency Severity Index (ESI) scale (1-5).
    
    Patient Data:
    - Age: ${data.age}
    - Chief Complaint/Symptoms: ${data.symptoms}
    - Relevant Medical History: ${data.medical_history}
    - Heart Rate: ${data.heart_rate} BPM
    - Systolic BP: ${data.systolic_blood_pressure} mmHg
    - Oxygen Saturation: ${data.oxygen_saturation}%
    - Respiratory Rate: ${data.respiratory_rate}/min
    - Temperature: ${data.body_temperature}°C
    - Pain Level: ${data.pain_level}/10
    - Chronic Conditions Count: ${data.chronic_disease_count}
    - Previous ER Visits: ${data.previous_er_visits}
    - Arrival Mode: ${data.arrival_mode}

    ESI Triage Levels:
    1: Resuscitation (Immediate life-saving intervention required)
    2: Emergent (High-risk situation, confused/lethargic/disoriented, or severe pain/distress)
    3: Urgent (Stable, but requires multiple resources)
    4: Less Urgent (Stable, requires one resource)
    5: Non-Urgent (Stable, requires no resources)

    Provide a structured analysis including triage level, confidence score (0-1), key risk factors, and a brief clinical summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            triage_level: { type: Type.INTEGER, description: "ESI Level 1-5" },
            confidence: { type: Type.NUMBER, description: "Confidence score 0-1" },
            risk_factors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of identified clinical risk factors"
            },
            explanation: {
              type: Type.OBJECT,
              properties: {
                top_features: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Top 2-3 clinical drivers for this decision"
                },
                summary: { type: Type.STRING, description: "Brief clinical justification" },
                clinical_summary: { type: Type.STRING, description: "A concise 2-3 sentence summary of the patient's overall clinical condition." }
              },
              required: ["top_features", "summary", "clinical_summary"]
            }
          },
          required: ["triage_level", "confidence", "risk_factors", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Gemini Triage Analysis Error:", error);
    // Fallback to basic logic if AI fails
    return fallbackTriage(data);
  }
};

const fallbackTriage = (data: PatientData): PredictionResult => {
  let score = 0;
  const risk_factors: string[] = [];
  
  if (data.oxygen_saturation < 90) { score += 4; risk_factors.push("Critical Hypoxia"); }
  if (data.heart_rate > 130 || data.heart_rate < 50) { score += 3; risk_factors.push("Tachycardia/Bradycardia"); }
  if (data.systolic_blood_pressure < 90 || data.systolic_blood_pressure > 180) { score += 3; risk_factors.push("Abnormal Blood Pressure"); }
  if (data.respiratory_rate > 30) { score += 3; risk_factors.push("Tachypnea"); }

  let level = 5;
  if (score >= 6) level = 1;
  else if (score >= 4) level = 2;
  else if (score >= 2) level = 3;
  else if (score >= 1) level = 4;

  return {
    triage_level: level,
    confidence: 0.7,
    risk_factors,
    explanation: {
      top_features: risk_factors.slice(0, 2),
      summary: "Rule-based fallback analysis due to system latency.",
      clinical_summary: `Patient presents with ${risk_factors.length > 0 ? risk_factors.join(', ') : 'stable vitals'}. Immediate clinical monitoring is advised based on the identified risk factors.`
    }
  };
};
