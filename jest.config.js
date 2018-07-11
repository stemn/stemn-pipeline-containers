module.exports = {
  transform: { '\.tsx?$': 'ts-jest', },
  testRegex: '\\w\\.(test|spec)\\.ts$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  coverageDirectory: ".coverage",
  coverageReporters: ['text', 'text-summary'],
  "testEnvironment": "node",
  coverageThreshold: {
    global: { statements: 90, lines: 90, functions: 90 }
  },
  setupTestFrameworkScriptFile: `${__dirname}/scripts/jest.js`,
  testPathIgnorePatterns: [
    '/build/',
    '/dist/',
    '/node_modules/',
    'jasmine-deprecated'
  ]
}
