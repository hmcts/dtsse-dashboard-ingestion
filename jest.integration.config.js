module.exports = {
  roots: ['<rootDir>/src/main'],
  testRegex: '(/src/test/.*|\\.(integration-test|integration_spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
