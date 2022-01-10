module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "\\.(css(\\?inline)?|svg)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
}
