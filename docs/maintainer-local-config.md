# Maintainer Local Configuration

The `.project-config.json` file is intentionally local-only. It can contain environment-specific sandbox metadata and must remain ignored by Git; it is not required to install, build, run, or deploy the application.

When preparing a public GitHub publication, verify that `git ls-files .project-config.json` produces no output. Configure provider credentials through repository secrets or the deployment platform’s secure environment settings rather than any tracked configuration file.
