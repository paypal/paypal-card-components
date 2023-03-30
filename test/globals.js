/* @flow */

import { insertMockSDKScript } from "@paypal/sdk-client/src";
import { SDK_SETTINGS } from "@paypal/sdk-constants/src";

beforeEach(() => {
  const body = document.body;

  if (!body) {
    throw new Error("Document body not available");
  }

  body.innerHTML = "";

  insertMockSDKScript({
    attributes: {
      [SDK_SETTINGS.CLIENT_TOKEN]: "TEST",
    },
  });
});
