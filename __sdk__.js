/* @flow */

module.exports = {
    'hosted-fields': {
        entry: './src/index',

        staticNamespace: 'HOSTED_FIELDS',

        configQuery: `
            clientConfiguration {
                assetsUrl
            }
        `
    }
};
