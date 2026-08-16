---
title: "HTTP Methods in the Wild: When to Reach for Each"
description: "What the spec says, what production teaches, and the idempotency traps that show up in the logs at 3 AM."
pubDate: 2026-08-16
tags: ["http", "api-design", "rest", "backend"]
draft: false
---

The HTTP spec defines nine methods, but in production you'll touch five of them ninety-five percent of the time. This is the cheat sheet I keep open: what each one is for, when to reach for it, and the traps that catch even senior teams.

## The five you actually use

`GET`, `POST`, `PUT`, `PATCH`, `DELETE`. Everything else — `HEAD`, `OPTIONS`, `TRACE`, `CONNECT` — is plumbing you can ignore until you don't.

The decision matrix is short:

| Method | Purpose | Idempotent | Cacheable | Body in request |
|---|---|---|---|---|
| `GET` | Read | yes | yes | no |
| `POST` | Create / action | **no** | no | yes |
| `PUT` | Replace entire resource | yes | no | yes |
| `PATCH` | Partial update | depends | no | yes |
| `DELETE` | Remove | yes | no | usually no |

Idempotent means: doing it twice has the same effect as doing it once. That's the property that makes retries safe. Network blips, browser refreshes, mobile app re-launches — they all cause duplicate requests. Idempotency is what keeps your system from creating two of everything.

## `GET` — read, don't touch

`GET` is **safe** and **idempotent**. Safe means the request must not change server state. If your `GET /users` sends a welcome email, you've broken the contract, and you're going to spend a weekend explaining it to the security team.

What that buys you:
- Browsers, CDNs, and proxies cache `GET` responses by default
- Retry on network failure is always safe
- Pre-fetching, link previews, search engine crawlers all expect `GET` to be safe

Practical rule: if it changes anything on the server — even a counter, even a log line in a way that matters — it's not a `GET`. Use `POST`.

Status codes for `GET`:
- `200 OK` — here's the resource
- `304 Not Modified` — your cached version is still good (with `ETag` / `If-None-Match`)
- `404 Not Found` — no such resource
- `403 Forbidden` — you can't see this, and I won't say if it exists

## `POST` — create, or do something with side effects

`POST` is the workhorse. It's not idempotent, which means retrying it is dangerous by default.

Use `POST` when:
- You're creating a new resource and the server assigns the ID
- The action is non-idempotent (charging a card, sending a notification, starting a workflow)
- You're tunneling an RPC call through HTTP (search, complex queries, anything that doesn't fit a resource)

The non-idempotency is the trap. A user clicks "Pay" twice, the network blips, you retry — and the customer gets charged twice. This is not a theoretical problem. This is the kind of thing that ends up in your company's quarterly review.

**The fix: idempotency keys.** The client sends a unique key (UUID) in a header, usually `Idempotency-Key`. The server stores the key alongside the result. If the same key comes in again, the server returns the stored result instead of running the action again. Stripe made this famous; now it's table stakes for any payment-adjacent API.

If you can't use idempotency keys (legacy clients, complex flows), at minimum:
- Make the action naturally idempotent (e.g., "set status to X" instead of "advance status")
- Show the user the result of the first request and disable the button after click

Status codes for `POST`:
- `201 Created` — here's the new resource (with `Location` header pointing to it)
- `200 OK` — the action ran, returning whatever the convention is (often the resource or just `{ ok: true }`)
- `202 Accepted` — I queued it, the result isn't ready yet (long-running jobs)
- `400 Bad Request` — your payload is malformed
- `409 Conflict` — same request was already processed, or state machine rejected the transition
- `422 Unprocessable Entity` — payload is syntactically valid but semantically wrong (validation failed)
- `429 Too Many Requests` — back off, here's a `Retry-After`

## `PUT` — replace the whole thing

`PUT` is idempotent. The client sends the complete resource representation, and the server replaces whatever was there with exactly that. If you `PUT` the same payload twice, the second call doesn't change anything.

Use `PUT` when:
- The client knows the full state of the resource
- You want simple caching: `PUT` is naturally idempotent, so retries are safe
- The resource is small enough to send in full

Common mistake: using `PUT` for partial updates. If the client only knows a subset of fields, sending `PUT` with those fields will wipe out everything else on the server. This is a classic data-loss bug.

Status codes for `PUT`:
- `200 OK` or `204 No Content` — updated, here's the resource (or nothing, your choice)
- `404 Not Found` — no resource at that ID
- `409 Conflict` — concurrent modification, your `If-Match` ETag is stale

## `PATCH` — partial update, the land of footguns

`PATCH` is for partial updates. The client sends only the fields it wants to change. The server applies the diff.

Sounds simple. It isn't. The trap is **idempotency**:

```http
PATCH /users/42
{ "email": "a@example.com" }
```

Run that twice. First call sets email to `a@example.com`. Second call... sets it to `a@example.com` again. Idempotent, in this case.

```http
PATCH /users/42
{ "balance": { "op": "inc", "value": 100 } }
```

Run that twice. First call adds 100. Second call adds 100 again. **Not idempotent.** The state changed between calls.

The fix: pick a PATCH format that gives you the semantics you need:

- **JSON Merge Patch** (RFC 7396) — JSON object where keys are fields. `null` means "delete this field". Simple. Idempotent for whole-value replacements. Not idempotent for operations.
- **JSON Patch** (RFC 6902) — array of operations (`add`, `remove`, `replace`, `move`, `copy`, `test`). Explicit. `test` gives you optimistic concurrency. Idempotent if you stick to `replace` and `remove`.
- **Custom verbs** — `POST /users/42:increment-balance` with `{ "amount": 100 }`. Google does this. RPC-flavored, but honest.

For most CRUD apps, JSON Merge Patch is enough. Reach for JSON Patch when you need optimistic concurrency or operations. Reach for custom verbs when the operation doesn't fit a "set field" mental model.

My default: JSON Merge Patch for the common case, JSON Patch (`test` op) when the user is editing and I need to detect concurrent edits.

Status codes for `PATCH`:
- `200 OK` — updated, here's the new representation
- `204 No Content` — updated, no body
- `409 Conflict` — concurrent modification (your `If-Match` ETag lost the race)
- `422 Unprocessable Entity` — patch would put the resource in an invalid state

## `DELETE` — remove, idempotently

`DELETE` is idempotent. Calling it on a resource that doesn't exist returns `404`, which is fine — the end state is the same (the resource isn't there). Some teams return `204` for both "deleted" and "already gone" to make clients simpler; both are defensible.

For batch deletes (`DELETE /users?ids=1,2,3`), pick a convention: `200 OK` with a summary, or `207 Multi-Status` if you want per-item results. Don't return `404` just because one of the three IDs was already missing.

If deletion is expensive or asynchronous (cascade through services), return `202 Accepted` and process in the background. The client polls or gets a webhook.

## The status code cheat sheet

You don't need all of them. You need these:

- `200 OK` — success, body present
- `201 Created` — resource created, send `Location`
- `204 No Content` — success, no body
- `400 Bad Request` — payload is malformed (JSON doesn't parse, missing required field)
- `401 Unauthorized` — no credentials, or credentials are wrong
- `403 Forbidden` — credentials are fine, but you can't do this
- `404 Not Found` — no such resource
- `409 Conflict` — state machine rejected this (duplicate, version mismatch)
- `422 Unprocessable Entity` — payload is valid but semantically wrong
- `429 Too Many Requests` — back off
- `500 Internal Server Error` — something blew up on the server
- `503 Service Unavailable` — we're down for maintenance

Distinction worth memorizing: `400` is "I can't parse this", `422` is "I parsed it but it doesn't make sense". Many APIs conflate them. Pick one and document it.

## The two traps that bite everyone

**Trap 1: `POST` for everything.** It's tempting because `POST` always works. But every `POST` is a custom action with no cache, no idempotency, no safe retry. If your endpoint reads a resource, it should be `GET`. If it creates one, `POST`. Reach for `POST` only when the action doesn't fit the resource model.

**Trap 2: Treating `PUT` and `PATCH` as interchangeable.** They aren't. `PUT` replaces, `PATCH` modifies. Using `PUT` for partial updates is the bug that silently zeroes out user fields. Using `PATCH` for full updates means retries multiply fields. Pick one per endpoint and document it.

## Closing

Most of HTTP method design is restraint. The five methods cover nearly every case if you stop reaching for `POST` by default. Add idempotency keys for anything that touches money, status, or notifications. Pick a `PATCH` format and stick with it. Your future on-call self will thank you.
