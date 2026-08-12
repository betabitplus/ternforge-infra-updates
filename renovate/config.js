module.exports = {
  onboarding: false,
  requireConfig: "optional",
  vulnerabilityAlerts: { enabled: false },
  ignorePaths: ["**/_components/**"],
  enabledManagers: ["copier", "custom.jsonata", "github-actions", "pep621", "renovate-config", "vendir"],
  "renovate-config": {
    managerFilePatterns: ["components/delivery/updates/template/renovate.json5"],
  },
  semanticCommits: "enabled",
  prHourlyLimit: 0,
  constraints: {
    copier: "9.17.0",
    vendir: "0.46.0",
  },
  packageRules: [
    {
      description: "Generated product inputs are product fixes",
      matchManagers: ["renovate-config", "vendir"],
      semanticCommitType: "fix",
    },
  ],
};
