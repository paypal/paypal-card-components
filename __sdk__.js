/* @flow */

export default {

    modules: {
        'hosted-fields': './src/index'
    },

    staticNamespace: 'HOSTED_FIELDS',

    configQuery: `
        configuration {
            card {
                supportedCardTypes
            }
        }
    `
};
