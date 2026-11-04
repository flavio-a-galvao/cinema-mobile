module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci']],
    // Usa a regra convencional herdada, permitindo nomes próprios como Redis.
    'subject-full-stop': [2, 'never', '.'],
  },
};
