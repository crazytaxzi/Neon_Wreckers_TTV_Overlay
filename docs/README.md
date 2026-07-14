# Documentation

This folder is the canonical architecture, development, visual-system, deployment, administration, and release-evidence reference for Neon Wreckers 2.0.

## Core architecture and development

- `ARCHITECTURE.md`: runtime boundaries, data flow, authority, and extension rules.
- `DATABASE_DOMAIN_MODEL.md`: active persistence model and migration ownership.
- `API_REFERENCE.md`: supported HTTP and WebSocket surfaces.
- `DEVELOPER_GUIDE.md`: local setup, workspace ownership, and contribution gates.

## UI foundation

- `UI_DESIGN_SYSTEM.md`: component library, typography, icons, responsive contract, motion, and accessibility.
- `THEME_TOKEN_GUIDE.md`: centralized theme shape, generated CSS variables, seasonal themes, and overlay defaults.
- `FRONTEND_VISUAL_GUIDE.md`: visual language and product-screen rules.
- `PHASE_2_UI_REPORT.md`: Phase 2 scope, protected source areas, deliverables, and verification boundary.

## Operations

- `DEPLOYMENT.md`: installation, updates, environment configuration, backups, and restores.
- `ADMIN_GUIDE.md`: Streamer Control Center operation and safe administration.
- `OVERLAY_GUIDE.md`: OBS setup, configuration, data flow, and troubleshooting.
- `DEPLOYMENT_VERIFICATION.md`: host-dependent release gates.

## Release evidence

- `TEST_REPORT.md`: checks executed for the current package and recorded environment limitations.
- `DEPENDENCY_AUDIT.md`: dependency ownership and audit status.
- `CHANGE_SUMMARY.md`: Sprint 1 stabilization plus the rebuilt Phase 2 interface layer.
- root `CHANGELOG.md`: version history.

Update the owning guide in the same change as code, schema, content, environment, UI tokens, or operational behavior. Documentation must not describe alternate deployment paths, retired services, or a second visual framework.
