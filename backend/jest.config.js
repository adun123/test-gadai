module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/middleware/**',
    '!src/routes/**',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  moduleNameMapper: {
    '^../config/gemini$': '<rootDir>/__tests__/__mocks__/gemini.js',
    '^../../src/config/gemini$': '<rootDir>/__tests__/__mocks__/gemini.js'
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
