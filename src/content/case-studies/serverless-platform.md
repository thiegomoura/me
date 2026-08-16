---
title: "Serverless Club Platform on AWS"
tag: "Platform Engineering"
subtitle: "A domain-driven, serverless microservices platform that took the team from a single hard-to-ship monolith to independently deployable bounded contexts."
period: "2021–2023"
context: "iClubs"
metric:
    value: "8h/wk"
    label: "team time saved"
stack:
    - Node.js
    - TypeScript
    - AWS Lambda
    - API Gateway
    - DynamoDB
    - MongoDB
    - SNS / SQS
    - DDD
    - Clean Architecture
    - Jest
diagram: platform
order: 30
---

## Context

The product was a club-management platform used by hundreds of organizations. The original codebase was a single Node.js monolith with no clear boundaries: every change carried deployment risk, every feature branched off the same trunk, and incident response meant paging whoever had touched the failing path most recently. The team needed to ship faster without taking the platform down with each deploy.

## Problem

- One deploy unit, many teams — change collision was constant.
- Domain logic was tangled with infrastructure code; testing required booting the world.
- Scaling was uniform: noisy neighbors on one tenant affected everyone.
- Operational tooling was a patchwork of ad-hoc scripts.

## Approach

I led the move to a serverless, domain-aligned architecture on AWS, with a strict layered template for every service. The guiding principles were: **domain boundaries first, technology second**; **tests as part of the deploy contract**; and **every service is boring on the inside**.

1. **Map the domain.** Ran a DDD event-storming session with product and ops to identify bounded contexts (Members, Billing, Events, Notifications, Auth).
2. **Cut the monolith by bounded context.** Each context got its own repo, its own Lambda, its own data store choice, and its own deploy pipeline.
3. **Standardize the service template.** A shared NestJS scaffold enforced the same Clean Architecture layers, the same CI checks, and the same observability hooks across every service.
4. **Asynchronous by default.** Cross-context work went through SNS/SQS, never direct HTTP calls. The system could lose a service and recover.

## Architecture

- **Per-context Lambdas** own their data store and expose a thin contract; cross-context calls are asynchronous.
- **DynamoDB** for high-volume, access-pattern-driven data (sessions, activity).
- **MongoDB** for flexible-schema content (club profiles, custom fields).
- **SNS/SQS** as the only cross-service primitive — a missing service degrades, not fails.

## Key decisions

- **Serverless for cost and elastic scaling** on a workload that was spiky and tenant-bounded.
- **Polyglot persistence** — picking the right store per bounded context, not the same DB everywhere.
- **Async by default, sync only when latency demands it.** A single sync call is a single point of failure; an event is recoverable.
- **Standardized service template** — every new context started from a Clean Architecture scaffold, so the next engineer always knew where to look.
- **Feature-based branching strategy** — short-lived branches per feature, fast forward-merge, no long-running integration pain.

## Outcomes

- About **8 hours per week** of process overhead recovered across the team.
- Deploys became per-service — a billing change could ship without touching the events pipeline.
- Incident blast radius shrank: a failing context could degrade gracefully behind the event bus.
- New engineers ramped up faster because the service template made the codebase predictable.
