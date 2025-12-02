
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Server misconfiguration: GEMINI_API_KEY is missing.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const { model, contents, config } = req.body;

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config
    });

    // We must manually extract the text and other properties because 
    // the response object contains getters that might not serialize automatically.
    const result = {
      text: response.text,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Gemini', 
      details: error.message 
    });
  }
}
