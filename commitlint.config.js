export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Messages rédigés en français : on n'impose pas la casse du sujet
    'subject-case': [0],
    'body-max-line-length': [0],
  },
};
