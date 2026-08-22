# Studio and run structure

The creator workspace is separate from this skills repository:

```text
creator-project/
└── .favstash-studio/
    ├── studio.json
    ├── preferences.md
    ├── broll/
    ├── broll-index.v1.json
    ├── fonts/
    ├── logos/
    ├── styles/
    ├── assets/favstash-sfx-starter/
    ├── runtime/
    └── edits/
        └── 2026-08-22-231530-productivity-hook-a1b2c3/
            ├── edit.json
            ├── edit-plan.json
            ├── asset-ledger.json
            ├── input/
            ├── references/
            ├── analysis/
            ├── assets/
            ├── work/
            ├── previews/
            ├── exports/
            └── reports/
```

Run IDs sort chronologically and include a slug plus random suffix. Treat a completed run as an evidence record. A major reinterpretation should become a new run; a normal revision becomes `preview-v02.mp4` or `final-v02.mp4` inside the same run.

Never put access tokens or browser cookies in preferences, manifests, or reports. The hidden studio directory is ignored when it lives inside this repository; creators should also add it to their own project's ignore rules if needed.
