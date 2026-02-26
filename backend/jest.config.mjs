// for a more detailed output run npm test -- --verbose
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s'],
  transform: {}
};