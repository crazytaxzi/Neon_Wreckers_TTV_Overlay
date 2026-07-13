# Infrastructure

## Purpose

This folder contains the PostgreSQL schema and migration history plus the single Nginx gateway template.

## Architecture

Prisma defines the domain model. SQL migrations are applied by the one-shot Compose setup service before API and worker startup. Nginx terminates TLS, serves static clients, and proxies API and WebSocket traffic.

## Dependencies

Database migration uses Prisma and PostgreSQL 16. Gateway deployment uses the official Nginx Alpine image and host-managed Certbot certificates.

## Extension points

Every schema change requires a migration. Gateway changes must preserve all four public surfaces and WebSocket headers. Do not add alternate gateway directories or deployment-specific Dockerfiles.
