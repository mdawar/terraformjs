// Using the .cjs extension, because we have defined {"type": "module"} in package.json which makes all the .js files ES modules
// This file is loaded by Babel and using require()
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
