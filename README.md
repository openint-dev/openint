[![MIT License](https://img.shields.io/badge/license-MIT-green)](https://tldrlegal.com/license/mit-license)
[![ELv2 License](https://img.shields.io/badge/license-ELv2-green)](https://www.elastic.co/licensing/elastic-license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)

# OpenInt

Open source integrations with a vision

- Modular
  - Auth
  - Unify
  - Sync
- Extensible
- Self hostable

## Deployment checklist

First setup dependencies
- Postgres (recommend Vercel postgres)
- Clerk (will be made optional later)
  - Setup JWT Template -> Supabase
    - Use `pwgen 32 -1 | pbcopy` for jwt secret
  - Enable organizations
  - (Use the development env is enough for private use )
- Nango (should be but not yet optional if oauth connections are not used)
- Inngest (optional if sync is desired)

Then deploy
- Vercel

## Contributors

<img src="https://contributors-img.web.app/image?repo=openint-dev/openint"/>
