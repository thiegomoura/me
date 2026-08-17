---
title: "The Encrypted SQLite File That Wouldn't Open: A Windows/Mac Postmortem"
description: "A base created on Windows with better-sqlite3-multiple-ciphers 8.5.0 refused to open on macOS with 8.7.0. Same passphrase, same schema, different result. Root cause, the fix, and the format-version header every encrypted file should carry."
pubDate: 2026-08-15
tags: ["sqlite", "encryption", "nodejs", "ops", "security"]
draft: false
---

I shipped an encrypted SQLite database from my Windows dev box to a teammate on macOS. Same Node version, same `package.json`, same passphrase derivation. The file wouldn't open. `SqliteError: file is not a database`. The kind of error that lands in your inbox at 5 PM on a Friday.

This is the postmortem. The root cause is something I should have predicted on day one, and so should you if you're shipping encrypted SQLite to anyone.

## The setup

I'm building a desktop agent that runs locally on customer machines and stores a working database next to the binary. The data is sensitive enough to encrypt at rest, so the stack is:

- **`better-sqlite3-multiple-ciphers`** — fork of `better-sqlite3` that bundles multiple encryption ciphers (sqleet, SQLCipher, wxSQLite3) and lets you pick at runtime via `PRAGMA cipher=...`
- **sqleet** as the default cipher for the database file
- **AES-256-GCM** for individual string fields that need authenticated encryption
- **A unique hardware identification string** hashed to derive the database passphrase — a poor man's device binding, so a stolen `.db` file on a different machine won't open
- **FTS5 virtual tables** for full-text search over the encrypted content

All Node, all local, no server. The base file is created once, then opened and updated for the lifetime of the install.

## The incident

I built and seeded the base on Windows with `better-sqlite3-multiple-ciphers@8.5.0`. The agent ran fine. Then I handed the same `.db` to a teammate on a Mac running `8.7.0` — a newer minor, pulled by `npm install` because I had `^8.5.0` in `package.json`. The agent started, called `db.pragma('cipher = ...')`, then `db.open()`.

```
SqliteError: file is not a database
```

The file _was_ a database — a perfectly valid encrypted sqleet database, on Windows. On Mac, with the newer binary, the same bytes were rejected as garbage.

## What I tried first (and why it didn't work)

I assumed it was the passphrase. It wasn't. I logged the derived key, ran a known-answer test against the cipher primitives on both machines, and the bytes matched. Same input, same hash, same KDF. The key was right.

I assumed it was the FTS5 schema. It wasn't. I created a fresh, FTS5-free base on Windows, copied it to Mac, same error. Even an empty `CREATE TABLE` base failed.

I assumed it was the Node version. It wasn't. Both machines were on Node 20.x.

The clue was in the version jump: **8.5.0 → 8.7.0 across two machines, both pinning to `^8.5.0`**. The semver range let each machine pull a different minor.

## The real root cause

`better-sqlite3-multiple-ciphers` is a native Node addon. `npm install` runs `node-gyp` and produces a binding specific to:

1. The host platform (Windows x64, macOS arm64, macOS x64, Linux glibc, Linux musl…)
2. The host Node ABI version (Node 20 vs 22 differ)
3. **The bundled SQLite version and the bundled cipher version**

A prebuilt binary exists for the common combos, but if you're on a less common matrix (Node 22 on Linux musl, say), it falls back to a local compile. Either way, the binary embeds a specific version of SQLite plus a specific cipher implementation.

Between 8.5.0 and 8.7.0, the library bumped the bundled SQLite. The bump changed:

- The default page size heuristic
- The default text encoding settings
- A handful of on-disk format details

The combination was enough that the older `8.5.0` file format was rejected by the newer `8.7.0` reader as "not a database". The error message is technically correct — from the perspective of the 8.7.0 parser, those bytes don't match any version of the format it understands.

**The library didn't break. The format did. I just didn't carry a record of which version produced the file.**

## Why the "encryption" framing hid the bug

I kept thinking of this as a crypto problem. Derive the right key, decrypt the bytes, done. But encryption at rest is two problems:

1. **Confidentiality** — the right key on the right file produces the right plaintext. My key derivation was correct.
2. **Format versioning** — the writer and the reader have to agree on what a valid file looks like. The cipher, the SQLite version, the page layout, the FTS5 options. None of this lives in the passphrase.

The encryption makes the format problem invisible: when the wrong key is used, you get the same "not a database" error as when the wrong format is used. The error can't tell you which one is wrong, because the bytes look the same after a wrong-key decrypt.

## The fix: three rules for shipping encrypted SQLite

### 1. Pin the exact version — for the library and for Node

```json
{
    "dependencies": {
        "better-sqlite3-multiple-ciphers": "8.5.0"
    },
    "engines": {
        "node": "20.11.1"
    }
}
```

No caret, no tilde. `^8.5.0` is a lie when the native binding is part of the package — minor bumps can change on-disk format. Pair the lock with a `.nvmrc` so every machine builds against the same Node ABI.

In CI and on the customer's machine, install with:

```bash
npm ci
```

`npm ci` reads `package-lock.json` exactly. `npm install` is allowed to negotiate within the semver range — which is exactly the bug.

### 2. Set the cipher explicitly — don't trust the default

The library's default cipher can change between releases. I've seen forks flip from `sqleet` to `sqlcipher` between minors. Set it in code every time you open:

```ts
import Database from "better-sqlite3-multiple-ciphers";

const db = new Database(path, {
    /* ... */
});
db.pragma(`cipher='sqlcipher'`);
db.pragma(`key="x'${hexKey}'"`);
db.pragma("journal_mode = WAL");
db.pragma(`cipher_compatibility = 4`);
```

Pick a cipher, pin the library version, set the cipher explicitly, and the writer's intent is recorded in the file header regardless of which version of the library you upgrade to later.

### 3. Write a format version into the file itself

This is the part I should have done on day one. Add a metadata table on first open, and check it on every subsequent open:

```ts
const FORMAT_VERSION = 1;
const CIPHER_NAME = "sqlcipher";
const CREATED_WITH = "better-sqlite3-multiple-ciphers@8.5.0";

function assertCompatible(db: Database.Database) {
    const row = db
        .prepare(`SELECT version, cipher, created_with FROM _format`)
        .get() as
        | { version: number; cipher: string; created_with: string }
        | undefined;

    if (!row) {
        // First run on a fresh base — write the marker.
        db.exec(`
            CREATE TABLE _format (
                version INTEGER NOT NULL,
                cipher TEXT NOT NULL,
                created_with TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            INSERT INTO _format VALUES (
                ${FORMAT_VERSION},
                '${CIPHER_NAME}',
                '${CREATED_WITH}',
                '${new Date().toISOString()}'
            );
        `);
        return;
    }

    if (row.version !== FORMAT_VERSION) {
        throw new Error(
            `Format version mismatch: file is v${row.version}, code expects v${FORMAT_VERSION}. ` +
                `Open this base with the version that created it, then run a migration.`,
        );
    }

    if (row.cipher !== CIPHER_NAME) {
        throw new Error(
            `Cipher mismatch: file uses ${row.cipher}, code expects ${CIPHER_NAME}. ` +
                `Set cipher explicitly before opening.`,
        );
    }
}
```

Now the error message tells you what went wrong instead of the generic "file is not a database". And a future migration becomes a `BUMP_FORMAT_VERSION` plus a migration step, not a guessing game.

## The lesson, generalized

Any time you're shipping a file that another process (or a future version of the same process) has to read, the file has to know what it is. Encryption makes this urgent because the failure mode is silent and the error message is generic.

Three things to put in every encrypted file you ship:

1. **A format version** — what version of your writer produced this
2. **A cipher identifier** — what algorithm and parameters to use
3. **A writer fingerprint** — the exact library and version, so future you can reproduce it

Without these, the file is a one-time artifact that only the original machine can read. With them, the file is a versioned artifact that the rest of the pipeline can validate before trying to decrypt.

## Closing

The whole thing was avoidable with three habits: pin the version, set the cipher explicitly, write a format marker. None of them is hard. All of them are easy to skip on day one when "it works on my machine" and you don't think about the customer opening the file two years from now on a different OS.

I lost an afternoon to this. You don't have to.

