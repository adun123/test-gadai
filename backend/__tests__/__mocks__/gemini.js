const mockGetModel = jest.fn();
const mockGetVisionModel = jest.fn();

const mockGenerateContent = jest.fn();

mockGetModel.mockReturnValue({
  generateContent: mockGenerateContent
});

mockGetVisionModel.mockReturnValue({
  generateContent: mockGenerateContent
});

module.exports = {
  getModel: mockGetModel,
  getVisionModel: mockGetVisionModel,
  __mockGenerateContent: mockGenerateContent
};
