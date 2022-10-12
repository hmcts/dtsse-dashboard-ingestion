module.exports = {
  roots: ['<rootDir>/src/main'],
  coverageDirectory: '<rootDir>/coverage/integration/',
  testRegex: '(/src/test/.*|\\.(integration-test|integration_spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
