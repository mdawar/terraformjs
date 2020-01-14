import fs from 'fs';
import { getFiles, createBlockObject } from '../src/utils.js';
import { Block } from '../src/base.js';

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

describe('createBlockObject function', () => {
  test('Creating an object from an empty Block instance', () => {
    const block = new Block();

    expect(createBlockObject(block)).toEqual({});
  });

  test('Creating an object from a Block instance with a type only', () => {
    const block = new Block('resource');

    expect(createBlockObject(block)).toEqual({ resource: {} });
  });

  test('Creating an object from a Block instance with a type and labels', () => {
    const block = new Block('resource', ['aws_instance', 'web']);

    expect(createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {}
        }
      }
    });
  });

  test('Creating an object from a Block instance with a type, labels and body', () => {
    const block = new Block('resource', ['aws_instance', 'web'], {
      instance_type: 't2.micro'
    });

    expect(createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {
            instance_type: 't2.micro'
          }
        }
      }
    });
  });

  test('Creating an object from a Block instance without labels', () => {
    const block = new Block('terraform', [], {
      required_version: {
        aws: '~> 2.0'
      }
    });

    expect(createBlockObject(block)).toEqual({
      terraform: {
        required_version: {
          aws: '~> 2.0'
        }
      }
    });
  });
});
