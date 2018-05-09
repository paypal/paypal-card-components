'use strict';

module.exports = function applyIframeSrc(frame, src) {
  setTimeout(function () {
    // Edge has an intermittent issue where
    // the iframes load, but the JavaScript
    // can't message out to the parent page.
    // We can fix this by setting the src
    // to about:blank first followed by
    // the actual source. Both instances
    // of setting the src need to be in a
    // setTimeout to work.
    // In Safari, including this behavior
    // results in a new history event for
    // each iframe. So we only do this
    // hack in browsers that are not
    // safari based.
    if (global.navigator && global.navigator.vendor && global.navigator.vendor.indexOf('Apple') === -1) { // TODO - move to browser detection module
      frame.src = 'about:blank';
    }
    setTimeout(function () {
      frame.src = src;
    }, 0);
  }, 0);
};
