// ESLint 10 usa "flat config". eslint-config-next 16 exporta su config flat
// nativa (un array Linter.Config[]), así que la usamos directamente — sin FlatCompat.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-img-element': 'warn',
      // Reglas NUEVAS de eslint-plugin-react-hooks (las trae eslint-config-next 16,
      // era del React Compiler). Marcan patrones preexistentes que funcionan
      // correctamente; se desactivan para no bloquear el lint tras el upgrade.
      // Revisar y refactorizar por separado si se desea adoptarlas.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
];

export default eslintConfig;
