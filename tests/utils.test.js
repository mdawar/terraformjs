import fs from 'fs';
import { getFiles } from '../src/utils.js';

jest.mock('fs', () => {
  return {
    promises: {
      readdir: jest.fn()
    }
  };
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getFiles function', () => {
  test('Getting the all files in a directory', async () => {
    fs.promises.readdir.mockResolvedValue([
      { name: 'providers.tf.js', isFile: () => true },
      { name: 'variables.tf.js', isFile: () => true },
      { name: '.gitignore', isFile: () => true },
      { name: 'babel.config.js', isFile: () => true },
      { name: 'instances.tf.js', isFile: () => true },
      { name: 'main.tf', isFile: () => true },
      { name: 'node_modules', isFile: () => false },
      { name: 'directory.tf.js', isFile: () => false }
    ]);

    const files = await getFiles('/path/to/dir');

    expect(files).toEqual([
      'providers.tf.js',
      'variables.tf.js',
      '.gitignore',
      'babel.config.js',
      'instances.tf.js',
      'main.tf'
    ]);
  });

  test('Getting all the files from an empty directory', async () => {
    fs.promises.readdir.mockResolvedValue([]);

    const files = await getFiles('/path/to/dir');

    expect(files).toEqual([]);
  });

  test('Getting the files that match an extension in a directory', async () => {
    // fs.readdir with withFileTypes: true option returns fs.Dirent objects
    fs.promises.readdir.mockResolvedValue([
      { name: 'providers.tf.js', isFile: () => true },
      { name: 'variables.tf.js', isFile: () => true },
      { name: '.gitignore', isFile: () => true },
      { name: 'babel.config.js', isFile: () => true },
      { name: 'instances.tf.js', isFile: () => true },
      { name: 'main.tf', isFile: () => true },
      { name: 'node_modules', isFile: () => false },
      { name: 'directory.tf.js', isFile: () => false }
    ]);

    const files = await getFiles('/path/to/dir', '.tf.js');

    expect(files).toEqual([
      'providers.tf.js',
      'variables.tf.js',
      'instances.tf.js'
    ]);
  });

  test('Getting the files that match an extension from an empty directory', async () => {
    fs.promises.readdir.mockResolvedValue([]);

    const files = await getFiles('/path/to/dir', '.tf.js');

    expect(files).toEqual([]);
  });

  test('fs.readdir rejecting with an error', async () => {
    expect.assertions(1);

    fs.promises.readdir.mockRejectedValue(new Error('Permission denied'));

    return await expect(getFiles('/path/to/dir')).rejects.toThrow(
      'Permission denied'
    );
  });
});
