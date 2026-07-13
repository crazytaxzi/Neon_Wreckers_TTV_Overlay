# Applications

## Purpose

This folder contains the five deployable runtime surfaces: `web`, `admin`, `overlay`, `api`, and `worker`.

## Architecture

The three React applications are static Vite builds. The API is the authoritative Fastify service. The worker resolves delayed BullMQ jobs. Browser applications communicate through same-origin API routes exposed by the gateway.

## Dependencies

Each application declares only the packages it imports. Shared game rules and provider adapters come from workspace packages. No app installs dependencies at container startup.

## Extension points

Add HTTP domains as API route and service modules, add delayed work as named worker jobs, and add browser surfaces within the existing applications. New deployable apps require an architecture review because the production topology intentionally remains small.
