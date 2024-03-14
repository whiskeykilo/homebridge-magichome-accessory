/**
 * ./src/extensions.ts
 * @author Will Kapcio
 */

/**
 * Converts a number [0-max] to a percentage value [0-100].
 * @param  {number} value The value to convert.
 * @param  {number} max The maximum value of the number.
 * @returns {number} The percentage value.
 */
export function convertToPercent(value: number, max: number): number {
  return clamp(Math.round((value / max) * 100), 0, 100);
}

/**
 * Converts a percentage value [0-100] to a number [0-max].
 * @param {number} value The percentage value to convert.
 * @param {number} max The maximum value of the number.
 * @returns {number} The number.
 */
export function convertToColor(value: number, max: number): number {
  return clamp(Math.round((value / 100) * max), 0, max);
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} value The value to clamp.
 * @param {number} min The minimum value.
 * @param {number} max The maximum value.
 * @returns {number} The clamped number.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts a boolean to a string of ['On', 'Off']
 * @param {boolean} value The boolean value to convert.
 * @returns {string} The corresponding string.
 */
export function onOff(value: boolean): string {
  return value ? 'On' : 'Off';
}

/**
 * A promise that resolves after a given time in ms.
 * @param  {number} ms The delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
