---
title: "Generic Offline-First Sync Service"
tag: "Backend Platform"
subtitle: "A table-agnostic sync engine that eliminated per-feature custom logic and powered offline clients across the product."
period: "2023"
context: "Ioasys"
metric:
    value: "−90%"
    label: "sync defects"
stack:
    - Nest.js
    - TypeScript
    - PostgreSQL
    - Azure App Service
    - Clean Architecture
    - DDD
    - Vitest
diagram: sync
order: 10
---

## Context

The product had grown into a multi-module application where each new offline-capable feature required its own sync implementation. The result was N slightly different sync pipelines, each with its own bugs, its own conflict-resolution quirks, and its own operational story. Every new feature started with a one-to-two-week "build the sync" tax before product work could even begin.

Worse, conflicts surfaced inconsistently: some clients would silently lose data, others would refuse to apply deltas, and on-call had no shared observability story to debug from.

## Problem

- Every offline feature re-implemented deltas, conflict resolution, and retry logic.
- Sync bugs were the single largest source of customer-reported issues.
- Engineering velocity was capped by sync complexity, not product complexity.
- No shared observability — every team wrote its own logging and metrics.

## Approach

I designed a single, schema-driven sync engine that any module could plug into. Instead of writing sync code per table, a feature owner declares the schema (table name, version column, soft-delete flag, conflict policy) and gets a working sync pipeline — push, pull, delta application, conflict resolution — for free.

Internally, the engine is a NestJS module with three layers: a transport-agnostic sync core (pure TypeScript, easy to test), a Postgres adapter using a generic CRUD abstraction, and a thin HTTP boundary that accepts batched changes from clients.

## Architecture

- **Client side:** a thin offline store queues local mutations and ships them as batched deltas.
- **Sync API:** stateless, accepts a batch + cursor, returns server-side deltas since cursor, applies client deltas inside a single transaction.
- **Conflict resolver:** pluggable per schema — last-write-wins by default, configurable for stricter rules.
- **Postgres:** every synced table carries a `version` column and an `updated_at` cursor; the engine never hardcodes schema.

## Key decisions

- **Schema-driven, not code-generated.** Generating code per table would have been the obvious move, but it pushes complexity to the client side. A schema registry lets the same engine handle a new table with zero new code.
- **Optimistic concurrency, not pessimistic locking.** Version columns are cheap and the offline use case demands that writes never block on a remote lock.
- **Cursor-based deltas, not full snapshots.** A monotonic server cursor keeps payloads small and lets clients resume cleanly after long offline windows.
- **Observability baked in.** Every batch emits per-table counters (received, applied, conflicts, retried) into the same metrics pipeline — no per-team instrumentation needed.

## Outcomes

- Sync-related defects dropped by ~90% in the quarter after rollout.
- New offline features went from a 1–2 week tax to a same-day integration.
- ~8 hours of engineering time per week recovered across the team.
- On-call gained a single dashboard to debug any sync incident, regardless of which module triggered it.
