module.exports = {
  platform: "github",
  autodiscover: false,
  onboarding: false,
  requireConfig: "optional",
  allowScripts: false,
  dependencyDashboard: false,
  vulnerabilityAlerts: { enabled: false },
  printConfig: false,
  ignorePaths: ["**/_components/**"],
  enabledManagers: ["copier", "github-actions", "pep621", "renovate-config", "vendir"],
  semanticCommits: "enabled",
  automerge: false,
  prCreation: "immediate",
  prHourlyLimit: 0,
  constraints: {
    copier: "9.17.0",
    vendir: "0.46.0",
  },
  packageRules: [
    {
      description: "Released component snapshots change generated products",
      matchManagers: ["vendir"],
      semanticCommitType: "fix",
      automerge: false,
    },
  ],
  gitAuthor: "Ternforge Renovate <8123085+betabitplus@users.noreply.github.com>",
};
