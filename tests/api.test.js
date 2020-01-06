import { Interpolation } from '../api.js';

describe('Interpolation class', () => {
  test('Expression is wrapped in ${}', () => {
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
