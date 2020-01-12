#!/usr/bin/env node

import path from 'path';
import { getFiles, generateJSON } from './utils.js';

const cwd = process.cwd();

// Handle errors
(async () => {
  const files = await getFiles(cwd, '.tf.js');

  files.forEach(file => {
    (async () => {
      try {
        const fullPath = path.join(cwd, file);

        const blocks = await import(fullPath);

        generateJSON(
          fullPath.replace('.tf.js', '.tf.json'),
          // Array of the exported Block instances
          Object.values(blocks)
        );
      } catch (err) {
        console.error(`Error processing the module ${file}: ${err}`);
      }
    })();
  });
})();
