# Operations scripts

## Purpose

- `install.sh` performs the first production installation.
- `update.sh` performs the only supported application update and certificate-renewal hook.
- `backup.sh` creates checksummed database and configuration archives.
- `restore.sh` verifies and restores an archive.
- `verify.sh` runs source and image quality gates.

## Architecture

Every script resolves the repository root, uses strict Bash error handling, reads the canonical `.env`, and invokes the root `compose.yaml` implicitly.

## Dependencies

Production scripts require Bash, Docker Compose, Certbot, curl, standard GNU utilities, PostgreSQL client tools inside the database container, and systemd for installed timers.

## Extension points

Operational changes belong in these scripts and `docs/DEPLOYMENT.md`. Do not create convenience copies for individual hosts. Add flags to the canonical process when a safe variation is necessary.
