module.exports = {
  spec: ['src/**/*.test.ts'],
  extension: ['ts'],
  loader: 'ts-node/esm',
  nodeOptions: [
    '--no-warnings',
    '--experimental-specifier-resolution=node',
    '--no-deprecation'
  ],
  timeout: 10000
};
