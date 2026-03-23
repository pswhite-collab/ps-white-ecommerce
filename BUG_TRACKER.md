# PS White E-Commerce - Bug Tracker

Track every bug with reproducible steps and a verified resolution.

## Status Legend
- `Open`: Reproduced, not fixed
- `In Progress`: Fix under implementation
- `Blocked`: Waiting on dependency or external system
- `Resolved`: Code fix done, pending QA
- `Closed`: Fix validated by testing

## Active Bugs
| ID | Severity | Area | Description | Steps to Reproduce | Root Cause | Fix | Status | Owner | Date |
|---|---|---|---|---|---|---|---|---|---|
| BUG-001 | High | Auth/OAuth | Google callback crashed with `Expected "payload" to be a plain object.` | 1) Click customer Google sign-in 2) Complete consent 3) Callback failed on token generation | JWT helper passed Mongo `ObjectId` directly as payload in some flows | Updated `generateToken` to always sign a plain object and normalize user identifiers | Closed | Codex | 2026-03-22 |

## Bug Report Template
Copy this block for every new issue:

```markdown
### BUG-XXX
- Severity: Low / Medium / High / Critical
- Area: Auth / Reader / Payment / Admin / UI / API
- Description:
- Steps to Reproduce:
  1.
  2.
  3.
- Expected:
- Actual:
- Root Cause:
- Fix:
- Test Evidence:
- Status: Open
- Owner:
- Date:
```

## Regression Checklist
- [ ] Auth flows tested (email/password + Google)
- [ ] Checkout flow tested end-to-end
- [ ] Reader progress and bookmarks retested
- [ ] Admin CRUD retested after fixes
- [ ] Mobile smoke test retested

