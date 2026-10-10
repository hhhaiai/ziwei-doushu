# ziwei-samples-toolkit v3 full package

Package date: 2026-04-25

Contents:
- `samples-out/`: 518,400 full generated samples, sharded by year and month, stored as 720 `.jsonl.gz` files.
- `lib/ziwei/`: v3 strict Tianji-style calculation and topic generation code.
- `scripts/`: full generation, validation, and audit scripts.
- `full-run-v3.log`: full generation run log.
- `validation-v3.log`: `npm run validate:nihaixia` result.
- `audit-v3.log`: random 20-sample audit output.
- `full-samples-audit-report.txt`: full corpus audit summary.
- `package.json`, `package-lock.json`, `tsconfig.json`: reproducible Node/TypeScript setup.

Excluded:
- `node_modules/`

Verified results:
- Total samples: 518,400
- Shards: 720 `.jsonl.gz`
- Raw `.jsonl` files remaining: 0
- Validation failures: 0
- Audit failures: 0
- `daXians[].siHua`: absent
- `daXians[].stemIndex`: absent
- `palace.selfSihua`: absent
- `topics.overview` flying-star forbidden terms: 0 hits
- Female health text includes `妇科/经期/孕产`: 100%
- Male/female wealth topic pairs differ: 100%
