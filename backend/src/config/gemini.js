const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => {
  return genAI.getGenerativeModel({ 
  model: 'gemini-flash-lite-latest',
    generationConfig: {
      temperature: 0,
      topK: 1,
      topP: 0.1
    }
  });
};

const getVisionModel = () => {
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.0,
      topK: 1,
      topP:0.1,
      responseMimeType: 'application/json'
    }
  });
};

module.exports = { getModel, getVisionModel };
