import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_\\d*$',
        'varsIgnorePattern': '^_\\d*$',
        'caughtErrorsIgnorePattern': '^_\\d*$'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      "@typescript-eslint/no-namespace": "off",
      
      '@typescript-eslint/naming-convention': [
        'error',
        // Types must use PascalCase
        {
          selector: ['typeLike', 'interface', 'typeAlias', 'enum', 'class'],
          format: ['PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid'
        },
        // Default rule for variables, functions, etc.
        {
          selector: ['variable', 'function',  'method', 'accessor'],
          format: ['camelCase'],
          leadingUnderscore: 'allow', 
          trailingUnderscore: 'forbid'
        },
        // Allow single underscore (_) as a variable name
        {
          selector: ['variable', 'parameter'],
          format: null,
          filter: {
            regex: '^_$',
            match: true
          }
        },
        // Allow both camelCase and PascalCase for properties
        {
          selector: ['property', 'parameter'],
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        // Quoted properties can use any format - exempting them from naming rules
        {
          selector: 'property',
          format: null,
          modifiers: ['requiresQuotes']
        },
        // Exported variables
        {
          selector: ['variable', 'function'],
          modifiers: ['exported'],
          format: ['camelCase', 'PascalCase']
        },
        // Destructured variables
        {
          selector: 'variable',
          modifiers: ['destructured'],
          format: null
        },
        // Constants
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase']
        }
      ]
    }
  }
];