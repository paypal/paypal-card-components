/* @flow */

export default {

    // Set up `?modules=hosted-fields` to include `./src/index`
    modules: {
        'hosted-fields': './src/index'
    },

    // Set up a namespace for any module-specific build-time flags
    staticNamespace: 'HOSTED_FIELDS',

    // Set up a graphql config query
    configQuery: `
        configuration {
            card {
                checkoutUrl
            }
        }
    `,

    // Configure features specific to this module
    features: {

        date: {
            // Deprecate feature X from 2017/06/23 onwards
            '2017-06-23': {
                FEATURE_X: false
            },

            // Enable feature Y from 2018/02/09 onwards
            '2018-02-09': {
                FEATURE_Y: true
            }
        },

        country: {
            // Enable feature Z for FR
            FR: {
                FEATURE_Z: true
            }
        },

        partner: {
            // Enable feature A for partner XYZ
            XYZ: {
                FEATURE_A: true
            }
        },

        merchant: {
            // Enable feature B for merchant ABC
            ABC: {
                FEATURE_B: true
            }
        }
    }
};
