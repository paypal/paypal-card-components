/* @flow */

export default function rejectIfResolves () {
  throw new Error('should not have resolved');
}
