import { Interpolation, Block } from '../src/base.js';

describe('Interpolation class', () => {
  test('Chaining a property on an Interpolation instance returns another Interpolation instance', () => {
    const inter = new Interpolation();

    expect(inter.custom_prop).toBeInstanceOf(Interpolation);
  });

  test('Chaining multiple properties on an Interpolation instance return other Interpolation instances', () => {
    const inter = new Interpolation();

    expect(inter.custom_prop).toBeInstanceOf(Interpolation);
    expect(inter.custom_prop.another_prop).toBeInstanceOf(Interpolation);
    expect(inter.prop_one.prop_two.prop_three).toBeInstanceOf(Interpolation);
  });

  test('Wrapping the expression in ${}', () => {
    const expr = new Interpolation('var.foo');

    expect(String(expr)).toBe('${var.foo}');
  });

  test('Accessing a dynamic property appends the property to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr.id)).toBe('${aws_instance.www.id}');
  });

  test('Accessing a dynamic property using brackets [] appends the property to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr['id'])).toBe('${aws_instance.www.id}');
  });

  test('Chaining dynamic properties appends the properties to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr.first.second.third)).toBe('${aws_instance.www.first.second.third}');
  });

  test('Using a dynamic index appends the index to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr[0])).toBe('${aws_instance.www[0]}');
  });

  test('Chaining multiple dynamic indexes appends the indexes to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr[0][1][100])).toBe('${aws_instance.www[0][1][100]}');
  });

  test('Chaining dynamic properties and indexes appends the properties and indexes to the expression', () => {
    const expr = new Interpolation('aws_instance.www');

    expect(String(expr.first[0].second[1].third[100])).toBe('${aws_instance.www.first[0].second[1].third[100]}');
  });
});

describe('Block class', () => {
  test('Creating an empty Block instance', () => {
    const block = new Block();

    expect(block._type).toBeUndefined();
    expect(block._labels).toEqual([]);
    expect(block._body).toEqual({});
    expect(String(block)).toEqual('${}');
  });

  test('Accessing any property on a Block instance returns an Interpolation instance', () => {
    const block = new Block();

    expect(block.any_prop).toBeInstanceOf(Interpolation);
  });

  test('Creating a "provider" Block instance', () => {
    const provider = new Block('provider', ['aws']);

    expect(String(provider)).toEqual('aws');
  });

  test('Accessing the alias property of a default "provider" Block instance', () => {
    const provider = new Block('provider', ['aws']);

    expect(String(provider.alias)).toEqual('aws.default');
  });

  test('Creating a "provider" Block instance with an alias', () => {
    const provider = new Block('provider', ['aws'], {
      alias: 'west'
    });

    expect(String(provider)).toEqual('aws.west');
  });

  test('Creating a "resource" Block instance', () => {
    const resource = new Block('resource', ['aws_instance', 'www']);

    expect(String(resource)).toEqual('${aws_instance.www}');
  });

  test('Creating a "variable" Block instance', () => {
    const variable = new Block('variable', ['api_key']);

    expect(String(variable)).toEqual('${var.api_key}');
  });

  test('Creating a "locals" Block instance', () => {
    const local = new Block('locals');

    expect(String(local.value_one)).toEqual('${local.value_one}');
    expect(String(local.value_two)).toEqual('${local.value_two}');
  });

  test('Creating a "data" Block instance', () => {
    const data = new Block('data', ['aws_ami', 'debian']);

    expect(String(data)).toEqual('${data.aws_ami.debian}');
  });

  test('Creating a "output" Block instance', () => {
    const output = new Block('output', ['ip_addr']);

    expect(String(output)).toEqual('${output.ip_addr}');
  });
});
