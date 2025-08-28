const { mean } = require('../stats');

describe('Stats Utility Functions', () => {
  describe('mean', () => {
    test('calculates mean of positive numbers', () => {
      const numbers = [1, 2, 3, 4, 5];
      const result = mean(numbers);
      expect(result).toBe(3);
    });

    test('calculates mean of decimal numbers', () => {
      const numbers = [1.5, 2.5, 3.5];
      const result = mean(numbers);
      expect(result).toBe(2.5);
    });

    test('calculates mean of negative numbers', () => {
      const numbers = [-1, -2, -3];
      const result = mean(numbers);
      expect(result).toBe(-2);
    });

    test('calculates mean of mixed positive and negative numbers', () => {
      const numbers = [-2, 0, 2, 4];
      const result = mean(numbers);
      expect(result).toBe(1);
    });

    test('calculates mean of single number', () => {
      const numbers = [42];
      const result = mean(numbers);
      expect(result).toBe(42);
    });

    test('calculates mean of zeros', () => {
      const numbers = [0, 0, 0];
      const result = mean(numbers);
      expect(result).toBe(0);
    });

    test('handles large numbers', () => {
      const numbers = [1000000, 2000000, 3000000];
      const result = mean(numbers);
      expect(result).toBe(2000000);
    });

    test('returns NaN for empty array', () => {
      const numbers = [];
      const result = mean(numbers);
      expect(result).toBeNaN();
    });
  });
});
