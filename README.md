Hosted Fields Component
-----------------------

[![npm version](https://img.shields.io/npm/v/@paypal/card-components.svg?style=flat-square)](https://www.npmjs.com/package/@paypal/card-components) [![build status](https://img.shields.io/travis/paypal/paypal-card-components/master.svg?style=flat-square)](https://travis-ci.org/paypal/paypal-card-components)

[![dependencies Status](https://david-dm.org/paypal/paypal-card-components/status.svg)](https://david-dm.org/paypal/paypal-card-components) [![devDependencies Status](https://david-dm.org/paypal/paypal-card-components/dev-status.svg)](https://david-dm.org/paypal/paypal-card-components?type=dev)

Hosted Fields component to be included in the Payments SDK

### Quick start

See [src/index.js](./src/index.js)

#### Tests

- Run the tests:

  ```bash
  npm test
  ```

#### Testing with different/multiple browsers

```bash
npm run karma -- --browser=PhantomJS
npm run karma -- --browser=Chrome
npm run karma -- --browser=Safari
npm run karma -- --browser=Firefox
npm run karma -- --browser=PhantomJS,Chrome,Safari,Firefox
```

#### Keeping the browser open after tests

```bash
npm run karma -- --browser=Chrome --keep-open
```

#### Releasing and Publishing

- Publish your code with a patch version:

```bash
npm run release
```

- Or `npm run release:patch`, `npm run release:minor`, `npm run release:major`
