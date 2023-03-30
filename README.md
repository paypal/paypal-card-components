## Hosted Fields Component

[![build status][build-badge]][build]
[![code coverage][coverage-badge]][coverage]
[![npm version][version-badge]][package]
[![apache license][license-badge]][license]

[build-badge]: https://img.shields.io/github/actions/workflow/status/paypal/paypal-card-components/main.yml?branch=main&logo=github&style=flat-square
[build]: https://github.com/paypal/paypal-card-components/actions?query=workflow%3Abuild
[coverage-badge]: https://img.shields.io/codecov/c/github/paypal/paypal-card-components.svg?style=flat-square
[coverage]: https://codecov.io/github/paypal/paypal-card-components/
[version-badge]: https://img.shields.io/npm/v/@paypal/card-components.svg?style=flat-square
[package]: https://www.npmjs.com/package/@paypal/card-components
[license-badge]: https://img.shields.io/npm/l/@paypal/card-components.svg?style=flat-square
[license]: https://github.com/paypal/paypal-card-components/blob/main/LICENSE

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
