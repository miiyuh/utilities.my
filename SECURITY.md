# Security Policy

utilities.my runs entirely in your browser and never receives what you put into its tools, but security still matters: a bug could leak data between tools, load something it shouldn't, or weaken the site's protections. Thank you for helping keep it safe.

## Supported versions

Only the live site at [utilities.my](https://utilities.my) and the latest `master` branch are supported. Fixes are deployed there; older releases are not patched.

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report privately through GitHub: [**Report a vulnerability**](https://github.com/miiyuh/utilities.my/security/advisories/new).

Helpful details:

- What the problem is and what an attacker could do with it
- Steps to reproduce, or a proof of concept
- The affected page or tool, and your browser and version

## What happens next

- **Within 3 days**: we acknowledge your report.
- **Within 7 days**: we confirm whether it's a vulnerability and share a plan.
- **When fixed**: we deploy the fix, publish a GitHub security advisory, and credit you (unless you'd rather stay anonymous).

## Scope

In scope:

- The site at `utilities.my` and the code in this repository
- Cross-site scripting, content-security-policy bypasses, data leaking from one tool or origin to another, and anything that sends user input off the device

Out of scope:

- Third-party services the site loads (Vercel, Google Fonts, the REST Countries flag CDN, analytics); please report those to their owners
- Reports from automated scanners without a demonstrated impact
- Missing best-practice headers with no exploitable consequence
- Denial-of-service and social-engineering attacks

## Safe harbour

We won't take action against good-faith research that follows this policy: test only against your own data, avoid harming other users or the service, and give us reasonable time to fix the problem before you disclose it.

A machine-readable summary of this policy is published at [`/.well-known/security.txt`](https://utilities.my/.well-known/security.txt).
