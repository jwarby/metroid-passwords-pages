'use strict';

// The Metroid alphabet
var ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz?- ';

/**
 * Converts a number to a binary string and pads it to 8 bits with leading
 * zeroes if necessary.
 *
 * @param {Number} byte  The byte value
 *
 * @return {String} byte converted to a binary string and padded
 */
var byteToBinaryString = function(byte) {
  var bin = byte.toString(2);

  return '00000000'.substring(bin.length) + bin;
};

/**
 * Encode a password into the Metroid alphabet.
 *
 * @param {Uint8ClampedArray}  The password to encode.  Only the first 16 bytes
 *                             are considered - 17th byte is not-yet-implemented
 *                             encryption shift byte, 18th is the checksum which
 *                             will be calculated.
 *
 * @return {String} the encoded password, which can be used in Metroid
 */
module.exports.encode = function(input) {
  var password;

  // 144 bits = 8 * 18 bytes
  var bytes = new Uint8ClampedArray(18);

  // Checksum byte - last byte
  bytes[17] = this.calculateChecksum(input);

  // Shift byte - how many times to rotate the password
  bytes[16] = 0;

  // Copy input data
  [].slice.call(input, 0, 16).forEach(function(byte, i) {
    bytes[i] = byte;
  });

  // @todo rotate according shift byte here

  // Convert to 6-bit blocks
  var sixBitBlocks = [];
  var binaryString = [].join.call(
    [].map.call(bytes, byteToBinaryString),
    ''
  );

  while (binaryString.length > 0) {
    sixBitBlocks.push(binaryString.substring(0, 6));

    binaryString = binaryString.substring(6);
  }

  password = sixBitBlocks.reduce(function(pass, block) {
    return pass + ALPHABET[parseInt(block, 2)];
  }, '');

  return password;
};

/**
 * Calculate the checksum for a password.
 *
 * The checksum is the sum of the first 136 bits, AND'd with 255.
 *
 * @param {Uint8ClampedArray} password  The 18-byte password
 *
 * @return {Number} the checksum value
 */
module.exports.calculateChecksum = function(password) {
  password = [].slice.call(password, 0, 16);

  var sum = password.reduce(function(total, byte) {
      return total + byte;
    }, 0);

  return sum & 255;
};

/**
 * Export the JSON structure used to describe the password bits.
 */
module.exports._data = require('../data/format.json');
