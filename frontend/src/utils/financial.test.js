import { applyMarginMarkup, parseMarkup, parseMoney, parseNonNegative, parsePositive, roundCurrency } from './financial';

describe('validação financeira', () => {
  test('mantém margem comercial por divisão', () => {
    expect(roundCurrency(applyMarginMarkup(1000, 10))).toBe(1111.11);
  });
  test.each([100, 120, -1, 'abc', ''])('rejeita markup inválido: %s', (value) => {
    expect(() => parseMarkup(value)).toThrow();
  });
  test('aceita markup zero', () => {
    expect(applyMarginMarkup(1000, 0)).toBe(1000);
  });
  test.each([
    ['1,234.56', 1234.56],
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56],
    ['-24.00', -24],
  ])('interpreta %s como %s', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });
  test.each(['1,234', '1.234', '1,2,34', 'abc', ''])('rejeita número ambíguo ou inválido %s', (value) => {
    expect(() => parseMoney(value)).toThrow();
  });
  test('valida limites e valores positivos', () => {
    expect(() => parseNonNegative(-1, 'FEE')).toThrow();
    expect(() => parsePositive(0, 'Cotação')).toThrow();
    expect(parsePositive('5.5410', 'Cotação')).toBe(5.541);
  });
});
