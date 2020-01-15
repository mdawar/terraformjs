#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import child_process from 'child_process';
import { getFiles, generateJSON } from './utils.js';

/**
 * Generates Terraform JSON files from tf.js files in a directory.
 *
 * @param {string} dir - Directory path
 * @returns {string[]} Array of generated JSON files
 */
async function generateFiles(dir) {
  const generatedFiles = [];

  const files = await getFiles(dir, '.tf.js');

  for (const file of files) {
    const fullPath = path.join(dir, file);

    const blocks = await import(fullPath);

    await generateJSON(
      fullPath.replace('.tf.js', '.tf.json'),
      // Array of the exported Block instances
      Object.values(blocks)
    );

    generatedFiles.push(file.replace('.tf.js', '.tf.json'));
  }

  return generatedFiles;
}

/**
 * Removes all the tf.json files from a directory.
 *
 * @param {string} dir - Directory path
 * @returns {string[]} Array of removed JSON files
 */
async function removeFiles(dir) {
  const files = await getFiles(dir, '.tf.json');

  for (const file of files) {
    await fs.promises.unlink(path.join(dir, file));
  }

  return files;
}

/**
 * Executes Terraform with the passed arguments.
 *
 * @param {string[]} args - Array of arguments to pass to terraform
 */
function executeTerraform(args) {
  const terraform = child_process.spawn('terraform', args, {
    // Pass through the corresponding stdio stream to the parent process
    stdio: 'inherit'
  });

  terraform.on('close', code => {
    // Exit with the same code
    process.exit(code);
  });
}

/**
 * Returns a string wrapped with ANSI escape sequences.
 *
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code#Colors}
 *
 * @param {string} text - String to colorize
 * @param {string} code - ANSI code
 */
function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

/**
 * Generate the JSON files and execute Terraform afterwards.
 *
 * @param {bool} generate - Generate the JSON files
 * @param {bool} execute - Execute Terraform
 */
async function run(generate = true, execute = true) {
  if (generate) {
    const cwd = process.cwd();

    try {
      const files = await removeFiles(cwd);

      if (files.length > 0) {
        console.log(
          `${colorize('Removed files:', '31;1')} ${files.join(', ')}`
        );
      }
    } catch (err) {
      console.error(
        `${colorize(
          'Error removing the previously generated files:',
          '31;1'
        )} ${err}`
      );

      process.exit(1);
    }

    try {
      const files = await generateFiles(cwd);

      console.log(
        `${colorize('Generated files:', '36;1')} ${files.join(', ')}`
      );
    } catch (err) {
      console.error(
        `${colorize('Error generating the JSON files:', '31;1')} ${err}`
      );

      process.exit(1);
    }
  }

  if (execute) {
    executeTerraform(args);
  }
}

// The first 2 arguments are the paths of node and terraformjs
const args = process.argv.slice(2);
const cmd = args[0];

// Flag to generate the JSON files
let generate = true;
// Flag to execute Terraform
let execute = true;

if (['-v', '-version', '--version', 'version'].includes(cmd)) {
  generate = false;

  const dirname = path.dirname(fileURLToPath(import.meta.url));

  const pkg = JSON.parse(
    fs.readFileSync(path.join(dirname, '../package.json'), 'utf8')
  );

  console.log(`TerraformJS v${pkg.version}`);
} else if (
  ['-h', '-help', '--help', 'help', '0.12upgrade', 'fmt'].includes(cmd)
) {
  generate = false;
} else if (cmd === 'generate') {
  // Generate the JSON files without executing Terraform
  execute = false;
}

run(generate, execute);
