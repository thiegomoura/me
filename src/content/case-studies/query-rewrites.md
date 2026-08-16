---
title: "Critical-Path Query Rewrites: 8s → 0.9s"
tag: "Performance"
subtitle: "Reframing a hot endpoint as a series of small, indexable, cacheable lookups — and pulling the CI pipeline along for the ride."
period: "2024"
context: "Ioasys"
metric:
    value: "−89%"
    label: "P95 latency"
stack:
    - Nest.js
    - TypeScript
    - PostgreSQL
    - Redis
    - GitHub Actions
    - Azure
    - OpenTelemetry
diagram: perf
order: 20
---

## Context

One endpoint sat on the critical path of the most-used user flow. It returned a heavily denormalized payload assembled from roughly twelve related tables, joined through a mix of foreign keys, soft-delete flags, and computed columns. P95 latency on the endpoint hovered around **8 seconds** on production data volumes, and customers noticed. The endpoint was load-bearing — wrapping it in cache naively would have created a correctness landmine, and nobody wanted to touch it without proof it would actually get faster.

## Problem

- A single mega-query (5+ joins, several correlated subqueries) doing the work that should have been a graph of small lookups.
- No indexes on the columns that actually drove the joins — historical assumption was "the planner will figure it out".
- Hot, deterministic data was being recomputed on every request.
- CI took **20 minutes** for a single PR, blocking fast feedback on a team that was already under pressure.

## Approach

I treated this as a layered fix, not a single rewrite. Each layer had a measurable acceptance criterion, and I rolled out behind a feature flag so we could compare branches in production.

1. **Measure first.** `EXPLAIN ANALYZE` on the real query, with realistic data. Identified the two join edges that were doing all the damage.
2. **Decompose the mega-query.** Broke it into a graph of small, indexable lookups. Most edges dropped from sequential scans to index hits.
3. **Add a Redis cache-aside layer** in front of the deterministic, slowly-changing slice of the response (TTL tuned to the data's actual change rate, not a guess).
4. **Parallelize the lookups** that no longer had a data dependency, so the slow tail stopped serializing them.
5. **Fix the pipeline.** Cached dependencies, added obfuscation and minification, and parallelized the test and build stages.

## Architecture

Cache-aside is the boring choice on purpose: TTL matches the data's true change rate, and a stampede protection layer prevents thundering-herd rebuilds when a hot key expires.

## Key decisions

- **Decompose, then index.** Indexing the original mega-query would have helped at the margin but not fixed the structural cost.
- **Cache the slow slice, not the whole response.** The whole response varied per-user; only the upstream reference data was cacheable.
- **Parallelize the dependency-free lookups.** A small `Promise.all` gave back more wall-clock than the rewrite itself.
- **Pipeline work in the same change.** A faster endpoint behind a 20-minute CI is a half-fix — the team needs the feedback loop too.

## Outcomes

- **P95 latency: 8.0s → 0.9s** (~89% reduction) on the same production data.
- Database CPU on the affected primary dropped by roughly half during peak hours.
- CI build time: **20 min → 12 min** (40% reduction), with obfuscation and minification added in the same change.
- No regressions: the feature-flag rollout let us compare both branches on real traffic for a week before cutover.
