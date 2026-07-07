module.exports = {
  roots: ['<rootDir>/src/main'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@octokit/rest$': '<rootDir>/__mocks__/@octokit/rest.js',
    '^@octokit/graphql$': '<rootDir>/__mocks__/@octokit/graphql.js',
  },
};
