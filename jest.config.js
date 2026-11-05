export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/app.js',
    'src/config/*.js',
    'src/middlewares/*.js',
    'src/routes/*.js',
    'src/schemas/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
};
