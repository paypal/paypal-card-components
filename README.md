Hosted Fields Component
-----------------------

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
