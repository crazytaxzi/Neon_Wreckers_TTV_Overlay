# Release evidence

## Identification

- Release or deployment name:
- Date and UTC time:
- Commit SHA:
- Git tag, if any:
- Operator:
- Environment identifier:
- Host or cluster description:

## Source-level verification

| Command or workflow | Result | Run or artifact reference | Notes |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` | pending | | |
| `pnpm verify` | pending | | |
| CI and security gates | pending | | |
| CodeQL and secret scan | pending | | |
| Browser and visual tests | pending | | |
| Compose validation and image builds | pending | | |

## Database and deployment

- Migration command and result:
- Seed command and result:
- Deployed image identifiers or digests:
- Service health results:
- PostgreSQL readiness result:
- Redis readiness result:
- Gateway and WebSocket routing result:
- Backup created and verified:
- Restore rehearsal reference:
- Rollback procedure reviewed:

## External integrations

Record only tests performed with real configured services. Use `not tested` rather than simulated success.

| Integration | Result | Evidence | Limitations |
| --- | --- | --- | --- |
| Twitch OAuth start and callback | not tested | | |
| StreamElements debit, failure, and compensation | not tested | | |
| Public DNS and TLS | not tested | | |
| Production WebSocket delivery | not tested | | |
| OBS Browser Source transparency and long-session behavior | not tested | | |

## Security and release decision

- Historical credential rotation checklist completed:
- Secret scan reviewed:
- Known vulnerabilities or accepted risks:
- Licensing and distribution posture reviewed:
- Final go or no-go decision:
- Approver:
