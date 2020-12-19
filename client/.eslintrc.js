module.exports = {
    'env': {
        'browser': true,
        'es6': true,
        'node': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'prettier/@typescript-eslint'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'project': 'tsconfig.json',
        'sourceType': 'module'
    },
    'plugins': [
        'eslint-plugin-jsdoc',
        'eslint-plugin-import',
        '@typescript-eslint',
        '@typescript-eslint/tslint'
    ],
    'rules': {
        '@typescript-eslint/member-delimiter-style': [
            'warn',
            {
                'multiline': {
                    'delimiter': 'semi',
                    'requireLast': true
                },
                'singleline': {
                    'delimiter': 'semi',
                    'requireLast': false
                }
            }
        ],
        '@typescript-eslint/naming-convention': 'warn',
        '@typescript-eslint/no-for-in-array': 'warn',
        '@typescript-eslint/no-unused-expressions': 'warn',
        '@typescript-eslint/quotes': 'off',
        '@typescript-eslint/semi': [
            'warn',
            'always'
        ],
        '@typescript-eslint/tslint/config': [
            'error',
            {
                'rules': {
                    'no-restricted-globals': true
                }
            }
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'constructor-super': 'warn',
        'curly': 'warn',
        'eqeqeq': [
            'warn',
            'always'
        ],
        'import/order': 'warn',
        'jsdoc/no-types': 'warn',
        'no-caller': 'warn',
        'no-debugger': 'warn',
        'no-duplicate-case': 'warn',
        'no-eval': 'warn',
        'no-new-wrappers': 'warn',
        'no-redeclare': 'warn',
        'no-sparse-arrays': 'warn',
        'no-throw-literal': 'warn',
        'no-unsafe-finally': 'warn',
        'no-unused-labels': 'warn',
        'no-var': 'warn',
    },
    'settings': {
        'react': {
            'version': 'detect'
        }
    }
};
