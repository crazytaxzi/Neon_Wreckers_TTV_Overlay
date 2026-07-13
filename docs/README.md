# Documentation

## Purpose

This folder is the canonical operating and architecture reference for Neon Wreckers 2.0. It contains the guides required to develop, deploy, administer, extend, verify, back up, and restore the game.

## Architecture

Documentation is organized by responsibility rather than deployment variant. `ARCHITECTURE.md` describes system boundaries, `DEVELOPER_GUIDE.md` covers local work, `DEPLOYMENT.md` owns production operations, and the release evidence files record this sprint's audit and verification results.

## Dependencies

The guides describe the root `compose.yaml`, root `Dockerfile`, source-controlled content and assets, operational scripts, and current application/package boundaries. Documentation must not describe removed services, routes, variables, or alternate deployment paths.

## Extension points

Update the owning guide in the same change as code, schema, content, environment, or operational behavior. Add a new document only when no existing guide has clear ownership; link it from this index and the root README.

## Index

- `ARCHITECTURE.md`: runtime boundaries and data flow.
- `DATABASE_DOMAIN_MODEL.md`: active persistence model.
- `API_REFERENCE.md`: supported HTTP and WebSocket surfaces.
- `DEVELOPER_GUIDE.md`: local setup, structure, and contribution gates.
- `DEPLOYMENT.md`: installation, update, backup, restore, and environment reference.
- `ADMIN_GUIDE.md`: control-center operations.
- `OVERLAY_GUIDE.md`: OBS overlay setup and extension rules.
- `FRONTEND_VISUAL_GUIDE.md`: retained visual-system ownership.
- `CHANGE_SUMMARY.md` and the root `CHANGELOG.md`: cleanup history.
- `DEPENDENCY_AUDIT.md`: dependency ownership and upgrade decisions.
- `DEPLOYMENT_VERIFICATION.md`: deployment evidence and host-only gates.
- `TEST_REPORT.md`: executed checks and recorded limitations.
