import { promises as fs } from 'fs';

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
export async function getFiles(dir, ext = '') {
  // An array of fs.Dirent objects when using withFileTypes
  const files = await fs.readdir(dir, { withFileTypes: true });

  return (
    files
      // Keep only the files that end with the extension
      .filter(f => f.isFile() && f.name.endsWith(ext))
      // Then create an array of the file names
      .map(f => f.name)
  );
}

/**
 * Creates an object from a Block instance.
 *
 * @param {Block} block - Block instance
 * @returns {object} Object representation of the block
 */
export async function createBlockObject(block) {
  let body = block[BODY];

  // The body might be a function
  if (typeof body === 'function') {
    body = await body();
  }

  // Create a nested object from the block labels
  const blockObject = block[LABELS].reduceRight(
    (value, key) => {
      return { [key]: value };
    },
    // Start with the block body as the initial value
    body
  );

  return block[TYPE]
    ? {
        [block[TYPE]]: blockObject
      }
    : {};
}

/**
 * Writes a JSON file from the array of the Block instances.
 *
 * @param {string} path - Path where to write the generated JSON file
 * @param {object[]} blocks - Array of Block instances
 * @returns {Promise}
 */
export async function generateJSON(path, blocks) {
  const objects = [];

  await (async function processBlocks(value) {
    // Handle nested arrays
    if (Array.isArray(value)) {
      for (const innerVal of value) {
        await processBlocks(innerVal);
      }
    } else if (value[TYPE]) {
      objects.push(await createBlockObject(value));
    }
  })(blocks);

  return fs.writeFile(path, JSON.stringify(objects, null, 2), 'utf8');
}
