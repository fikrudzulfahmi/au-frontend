import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Berkas ini sengaja mengekspor komponen bersama hook/konstanta pendampingnya
    // (mis. AuthProvider + useAuth, StatusBadge + pemetaan status) agar pemakaian
    // tetap satu impor. Fast refresh hanya relevan saat pengembangan, bukan aturan
    // kebenaran, sehingga dimatikan khusus untuk berkas tersebut.
    files: [
      'src/components/ui/StatusBadge.tsx',
      'src/components/ui/Toast.tsx',
      'src/features/auth/AuthContext.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
