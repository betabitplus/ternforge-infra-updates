module.exports = {
  onboarding: false,
  requireConfig: "optional",
  vulnerabilityAlerts: { enabled: false },
  ignorePaths: ["**/_components/**"],
  enabledManagers: ["copier", "github-actions", "pep621", "renovate-config", "vendir"],
  semanticCommits: "enabled",
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
    },
  ],
};
