import { Interpolation } from '../api.js';

test('Expression is wrapped in ${}', () => {
  const expr = new Interpolation('var.foo');

  expect(String(expr)).toBe('${var.foo}');
});
