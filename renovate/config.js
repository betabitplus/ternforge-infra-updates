module.exports = {
  onboarding: false,
  requireConfig: "optional",
  vulnerabilityAlerts: { enabled: false },
  ignorePaths: ["template/_components/**"],
  extends: ["helpers:pinGitHubActionDigests", "customManagers:githubActionsVersions"],
  "renovate-config": {
    managerFilePatterns: ["components/delivery/updates/template/renovate.json5"],
  },
  semanticCommits: "enabled",
  prHourlyLimit: 0,
  prConcurrentLimit: 0,
  customEnvVariables: {
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "url.https://x-access-token:{{ secrets.SOURCE_READ_TOKEN }}@github.com/.insteadOf",
    GIT_CONFIG_VALUE_0: "https://github.com/",
  },
  customDatasources: {
    "github-runner-release-assets": {
      defaultRegistryUrlTemplate: "https://api.github.com/repos/actions/runner/releases?per_page=100",
      format: "json",
      transformTemplates: [
        '({"releases": $map($filter($, function($r) { $type($r.assets[name = "actions-runner-linux-arm64-" & $substring($r.tag_name, 1) & ".tar.gz"][0].digest) = "string" }), function($r) { ( $v := $substring($r.tag_name, 1); $a := $r.assets[name = "actions-runner-linux-arm64-" & $v & ".tar.gz"][0]; {"version": $v, "digest": $substringAfter($a.digest, "sha256:"), "releaseTimestamp": $r.published_at} ) })})',
      ],
    },
  },
  allowedCommands: [
    "^python -c \\\"import os,tomllib; v=tomllib\\.load\\(open\\('pyproject\\.toml','rb'\\)\\)\\['tool'\\]\\['uv'\\]\\['required-version'\\]\\.removeprefix\\('=='\\); os\\.execvp\\('install-tool',\\['install-tool','uv',v\\]\\)\\\"$",
    "^uv lock$",
    "^xargs -a \\.opentofu-version install-tool tofu$",
    "^tofu init -backend=false -input=false -upgrade$",
  ],
  constraints: {
    copier: "9.17.1",
    vendir: "0.46.0",
  },
  customManagers: [
    {
      customType: "regex",
      description: "OpenTofu execution version",
      managerFilePatterns: ["/(^|/)\\.opentofu-version$/", "/(^|/)versions\\.tf$/"],
      matchStrings: [
        "^(?<currentValue>\\d+\\.\\d+\\.\\d+)\\s*$",
        "required_version\\s*=\\s*\"=\\s*(?<currentValue>\\d+\\.\\d+\\.\\d+)\"",
      ],
      depNameTemplate: "opentofu/opentofu",
      datasourceTemplate: "github-releases",
      versioningTemplate: "semver",
      extractVersionTemplate: "^v(?<version>.*)$",
    },
    {
      customType: "regex",
      description: "Copier execution version",
      managerFilePatterns: [
        "/(^|/)\\.github/workflows/.+\\.ya?ml$/",
        "/(^|/)copier\\.yml$/",
        "/(^|/)scripts/accept-template\\.sh$/",
        "/(^|/)components/project/py/(?:base|library)/template/(?:CONTRIBUTING\\.md|scripts/README\\.md)$/",
        "/(^|/)renovate/config\\.js$/",
      ],
      matchStrings: [
        "copier==(?<currentValue>\\d+\\.\\d+\\.\\d+)",
        "_min_copier_version:\\s*\"(?<currentValue>\\d+\\.\\d+\\.\\d+)\"",
        "copier:\\s*\"(?<currentValue>\\d+\\.\\d+\\.\\d+)\"",
      ],
      depNameTemplate: "copier",
      datasourceTemplate: "pypi",
      versioningTemplate: "pep440",
    },
    {
      customType: "regex",
      description: "Vendir execution version",
      managerFilePatterns: ["/(^|/)\\.github/workflows/.+\\.ya?ml$/", "/(^|/)renovate/config\\.js$/"],
      matchStrings: ["vendir:\\s*[\"']?(?<currentValue>\\d+\\.\\d+\\.\\d+)[\"']?"],
      depNameTemplate: "carvel-dev/vendir",
      datasourceTemplate: "github-releases",
      versioningTemplate: "semver",
      extractVersionTemplate: "^v(?<version>.*)$",
    },
    {
      customType: "regex",
      description: "Renovate runtime image",
      managerFilePatterns: ["/(^|/)\\.github/workflows/.+\\.ya?ml$/"],
      matchStrings: [
        "ghcr\\.io/renovatebot/renovate:(?<currentValue>\\d+\\.\\d+\\.\\d+)@(?<currentDigest>sha256:[a-f0-9]{64})",
        "renovate-version:\\s*(?<currentValue>\\d+\\.\\d+\\.\\d+)@(?<currentDigest>sha256:[a-f0-9]{64})",
      ],
      depNameTemplate: "ghcr.io/renovatebot/renovate",
      datasourceTemplate: "docker",
      versioningTemplate: "semver",
    },
    {
      customType: "regex",
      description: "uv required execution version",
      managerFilePatterns: ["/(^|/)components/quality/py/includes/uv/pyproject\\.toml$/"],
      matchStrings: ["required-version\\s*=\\s*\"==(?<currentValue>\\d+\\.\\d+\\.\\d+)\""],
      depNameTemplate: "astral-sh/uv",
      datasourceTemplate: "github-releases",
      versioningTemplate: "semver",
    },
    {
      customType: "regex",
      description: "Local CI Actions runner archive",
      managerFilePatterns: ["/(^|/)local-ci/versions\\.env$/"],
      matchStrings: [
        "RUNNER_VERSION=(?<currentValue>[^\\s]+)\\s+RUNNER_SHA256=(?<currentDigest>[a-f0-9]{64})",
      ],
      depNameTemplate: "actions/runner",
      datasourceTemplate: "custom.github-runner-release-assets",
      versioningTemplate: "semver",
      autoReplaceStringTemplate: "RUNNER_VERSION={{newValue}}\\nRUNNER_SHA256={{newDigest}}",
    },
    {
      customType: "regex",
      description: "Local CI runtime tools",
      managerFilePatterns: ["/(^|/)local-ci/versions\\.env$/"],
      matchStrings: [
        "# renovate: datasource=(?<datasource>[^\\s]+) depName=(?<depName>[^\\s]+) versioning=(?<versioning>[^\\s]+) extractVersion=(?<extractVersion>[^\\s]+)\\s+[A-Z0-9_]+_VERSION=(?<currentValue>[^\\s]+)",
      ],
    },
  ],
  packageRules: [
    {
      description: "Refresh Python lock after template updates",
      matchManagers: ["copier"],
      matchPackageNames: ["https://github.com/betabitplus/ternforge-template-py-library.git"],
      postUpgradeTasks: {
        commands: [
          "python -c \"import os,tomllib; v=tomllib.load(open('pyproject.toml','rb'))['tool']['uv']['required-version'].removeprefix('=='); os.execvp('install-tool',['install-tool','uv',v])\"",
          "uv lock",
        ],
        fileFilters: ["uv.lock"],
        installTools: { python: {} },
        workingDirTemplate: "{{{packageFileDir}}}",
      },
    },
    {
      description: "Component snapshot updates are product fixes",
      matchManagers: ["vendir"],
      semanticCommitType: "fix",
    },
    {
      description: "Use the OpenTofu registry for providers and modules",
      matchDatasources: ["terraform-provider", "terraform-module"],
      registryUrls: ["https://registry.opentofu.org"],
    },
    {
      description: "Regenerate OpenTofu provider locks in the same update",
      matchManagers: ["terraform"],
      matchDepTypes: ["required_provider"],
      postUpgradeTasks: {
        commands: [
          "xargs -a .opentofu-version install-tool tofu",
          "tofu init -backend=false -input=false -upgrade",
        ],
        fileFilters: ["**/.terraform.lock.hcl"],
        workingDirTemplate: "{{{packageFileDir}}}",
      },
    },
    {
      description: "OpenTofu required_version is handled by the explicit OpenTofu manager",
      matchManagers: ["terraform"],
      matchDepTypes: ["required_version"],
      enabled: false,
    },
    {
      description: "Keep Docker dependencies immutable",
      matchDatasources: ["docker"],
      pinDigests: true,
    },
  ],
};
