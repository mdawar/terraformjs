import { promises as fs } from 'fs';
import path from 'path';

/**
 * Global Terraform block symbols.
 */
const TYPE = Symbol.for('type');
const LABELS = Symbol.for('labels');
const BODY = Symbol.for('body');

/**
 * Returns an array of file names matching the extension.
 *
 * @param {string} dir - Directory path to search for the files
 * @param {string} ext - File extension to match
 * @returns {string[]} Array of matching file names
 */
export async function getFiles(dir, ext) {
  const files = await fs.readdir(dir);

  const stat = await Promise.all(files.map(fs.stat));

  return files.filter((f, i) => {
    return stat[i].isFile() && f.endsWith(ext);
  });
}

/**
 * Creates an object from a Block instance.
 *
 * @param {Block} block - Block instance
 */
export function createBlockObject(block) {
  // Create a nested object from the block labels
  const blockObject = block[LABELS].reduceRight(
    (value, key) => {
      return { [key]: value };
    },
    // Start with the block body as the initial value
    block[BODY]
  );

  return {
    [block[TYPE]]: blockObject
  };
}

/**
 * Writes a JSON file from the array of the Block instances.
 *
 * @param {string} path - Path where to write the generated JSON file
 * @param {object[]} blocks - Array of Block instances
 * @returns {Promise}
 */
export function generateJSON(path, blocks) {
  const objects = [];

  blocks.forEach(value => {
    // The exported value might be an array of Block instances
    if (Array.isArray(value)) {
      value.forEach(block => {
        objects.push(createBlockObject(block));
      });
    } else {
      objects.push(createBlockObject(value));
    }
  });

  return fs.writeFile(path, JSON.stringify(objects, null, 2), 'utf8');
}
