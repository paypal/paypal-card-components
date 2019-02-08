/* @flow */
/* eslint import/no-default-export: off */

export default function rejectIfResolves () {
  throw new Error('should not have resolved');
}
