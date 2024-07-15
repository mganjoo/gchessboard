import type { Config } from "release-it";

export default {
  git: {
    commitMessage: "chore: release v${version}",
  },
  github: {
    release: true,
    releaseName: "v${version}",
  },
  hooks: {
    "after:bump": "npm run build:package",
  },
  plugins: {
    "@release-it/keep-a-changelog": {
      filename: "CHANGELOG.md",
      addUnreleased: true,
      addVersionUrl: true,
    },
  },
} satisfies Config;
