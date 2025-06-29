// eslint.config.js

const eslintConfig = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        // Browser
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        CustomEvent: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        self: 'readonly',
        URL: 'readonly',
        HTMLElement: 'readonly',
      },
    },
    rules: {
      // Add your custom rules here
    },
  },
];

export default eslintConfig;
