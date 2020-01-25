import fs from 'fs';
import { getFiles, createBlockObject, generateJSON } from '../src/utils.js';
import { Block } from '../src/base.js';

jest.mock('fs', () => {
  return {
    promises: {
      readdir: jest.fn(),
      writeFile: jest.fn()
    }
  };
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getFiles function', () => {
  test('Getting the all files in a directory', async () => {
    expect.assertions(1);

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
    expect.assertions(1);

    fs.promises.readdir.mockResolvedValue([]);

    const files = await getFiles('/path/to/dir');

    expect(files).toEqual([]);
  });

  test('Getting the files that match an extension in a directory', async () => {
    expect.assertions(1);

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
    expect.assertions(1);

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
  test('Creating an object from an empty Block instance', async () => {
    expect.assertions(1);

    const block = new Block();

    expect(await createBlockObject(block)).toEqual({});
  });

  test('Creating an object from a Block instance with a type only', async () => {
    expect.assertions(1);

    const block = new Block('resource');

    expect(await createBlockObject(block)).toEqual({ resource: {} });
  });

  test('Creating an object from a Block instance with a type and labels', async () => {
    expect.assertions(1);

    const block = new Block('resource', ['aws_instance', 'web']);

    expect(await createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {}
        }
      }
    });
  });

  test('Creating an object from a Block instance with a type, labels and body', async () => {
    expect.assertions(1);

    const block = new Block('resource', ['aws_instance', 'web'], {
      instance_type: 't2.micro'
    });

    expect(await createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {
            instance_type: 't2.micro'
          }
        }
      }
    });
  });

  test('Creating an object from a Block instance without labels', async () => {
    expect.assertions(1);

    const block = new Block('terraform', [], {
      required_version: {
        aws: '~> 2.0'
      }
    });

    expect(await createBlockObject(block)).toEqual({
      terraform: {
        required_version: {
          aws: '~> 2.0'
        }
      }
    });
  });

  test('Creating an object from a function Block body', async () => {
    expect.assertions(1);

    const block = new Block('resource', ['aws_instance', 'web'], function() {
      return {
        instance_type: 't2.micro'
      };
    });

    expect(await createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {
            instance_type: 't2.micro'
          }
        }
      }
    });
  });

  test('Creating an object from a function Block body returning a promise that resolves', async () => {
    expect.assertions(1);

    const block = new Block('resource', ['aws_instance', 'web'], function() {
      return Promise.resolve({
        instance_type: 't2.micro'
      });
    });

    expect(await createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {
            instance_type: 't2.micro'
          }
        }
      }
    });
  });

  test('Creating an object from a function Block body returning a promise that rejects', async () => {
    expect.assertions(1);

    const block = new Block('resource', ['aws_instance', 'web'], function() {
      return Promise.reject(new Error('Failure'));
    });

    return await expect(createBlockObject(block)).rejects.toThrow('Failure');
  });

  test('Creating an object from an async function Block body', async () => {
    expect.assertions(1);

    const block = new Block(
      'resource',
      ['aws_instance', 'web'],
      async function() {
        return {
          instance_type: 't2.micro'
        };
      }
    );

    expect(await createBlockObject(block)).toEqual({
      resource: {
        aws_instance: {
          web: {
            instance_type: 't2.micro'
          }
        }
      }
    });
  });

  test('Creating an object from an async function Block body that throws an error', async () => {
    expect.assertions(2);

    const block = new Block(
      'resource',
      ['aws_instance', 'web'],
      async function() {
        throw new Error('Failure');
      }
    );

    try {
      await createBlockObject(block);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toEqual('Failure');
    }
  });
});

describe('generateJSON function', () => {
  test('Generating a JSON file from an empty array', async () => {
    expect.assertions(1);

    fs.promises.writeFile.mockResolvedValue();

    await generateJSON('/path/to/file.json', []);

    expect(fs.promises.writeFile).toBeCalledWith(
      '/path/to/file.json',
      '[]',
      'utf8'
    );
  });

  test('Generating a JSON file from an array of non Block instances', async () => {
    expect.assertions(1);

    fs.promises.writeFile.mockResolvedValue();

    // All the values that are not instances of Block are ignored
    await generateJSON('/path/to/file.json', ['string', 1]);

    expect(fs.promises.writeFile).toBeCalledWith(
      '/path/to/file.json',
      '[]',
      'utf8'
    );
  });

  test('Generating a JSON file from an array of Block instances', async () => {
    expect.assertions(1);

    fs.promises.writeFile.mockResolvedValue();

    const blocks = [
      new Block('resource', ['aws_instance', 'web'], {
        instance_type: 't2.micro'
      }),
      new Block('provider', ['aws'], { region: 'us-east-1' }),
      new Block('output', ['ip_address'], {
        value: '${aws_instance.web.public_ip}'
      })
    ];

    const objects = [
      {
        resource: {
          aws_instance: {
            web: {
              instance_type: 't2.micro'
            }
          }
        }
      },
      {
        provider: {
          aws: {
            region: 'us-east-1'
          }
        }
      },
      {
        output: {
          ip_address: {
            value: '${aws_instance.web.public_ip}'
          }
        }
      }
    ];

    await generateJSON('/path/to/file.json', blocks);

    expect(fs.promises.writeFile).toBeCalledWith(
      '/path/to/file.json',
      JSON.stringify(objects, null, 2),
      'utf8'
    );
  });

  test('Generating a JSON file from nested arrays of Block instances', async () => {
    expect.assertions(1);

    fs.promises.writeFile.mockResolvedValue();

    const blocks = [
      new Block('resource', ['aws_instance', 'web'], {
        instance_type: 't2.micro'
      }),
      // Nested array
      [new Block('provider', ['aws'], { region: 'us-east-1' })],
      [
        [
          new Block('output', ['ip_address'], {
            value: '${aws_instance.web.public_ip}'
          })
        ]
      ]
    ];

    const objects = [
      {
        resource: {
          aws_instance: {
            web: {
              instance_type: 't2.micro'
            }
          }
        }
      },
      {
        provider: {
          aws: {
            region: 'us-east-1'
          }
        }
      },
      {
        output: {
          ip_address: {
            value: '${aws_instance.web.public_ip}'
          }
        }
      }
    ];

    await generateJSON('/path/to/file.json', blocks);

    expect(fs.promises.writeFile).toBeCalledWith(
      '/path/to/file.json',
      JSON.stringify(objects, null, 2),
      'utf8'
    );
  });

  test('fs.writeFile rejecting with an error', async () => {
    expect.assertions(1);

    fs.promises.writeFile.mockRejectedValue(
      new Error('Error writing the file')
    );

    return await expect(generateJSON('/path/to/file.json', [])).rejects.toThrow(
      'Error writing the file'
    );
  });
});
