const mockGetModel = jest.fn();
const mockGetVisionModel = jest.fn();
const mockGetGroundedModel = jest.fn();

const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    text: jest.fn().mockReturnValue(JSON.stringify({
      document_type: 'SLIK',
      extracted_data: {
        full_name: 'Test User',
        credit_status: 'Lancar',
        collectibility: 1
      },
      confidence_score: 0.9
    }))
  }
});

mockGetModel.mockReturnValue({
  generateContent: mockGenerateContent
});

mockGetVisionModel.mockReturnValue({
  generateContent: mockGenerateContent
});

mockGetGroundedModel.mockReturnValue({
  generateContent: mockGenerateContent
});

module.exports = {
  getModel: mockGetModel,
  getVisionModel: mockGetVisionModel,
  getGroundedModel: mockGetGroundedModel,
  __mockGenerateContent: mockGenerateContent
};
