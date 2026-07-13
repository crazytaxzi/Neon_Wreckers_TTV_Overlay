# Repository tools

## Purpose

This folder contains source-quality utilities and automated repository tests. These tools validate content, dependencies, migrations, route ownership, deployment uniqueness, documentation coverage, and the absence of retired code or secret-bearing artifacts.

## Architecture

Tools are deterministic local programs invoked by root npm scripts. They inspect source-controlled files and do not mutate game data. TypeScript tests cover runtime helpers and production safeguards; JavaScript repository tests cover structure and release invariants.

## Dependencies

The tools use Node.js built-ins, the locked workspace packages, and `tsx` for TypeScript test execution. They require no running PostgreSQL, Redis, Docker, Twitch, or StreamElements service.

## Extension points

Add a focused invariant when a production rule could otherwise regress silently. Keep checks independent of generated output and local credentials. Cleanup behavior belongs in `clean.mjs`; content ownership belongs in `validate-content.mjs`; manifest ownership belongs in `audit-dependencies.mjs`.
