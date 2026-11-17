# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/kenny2006ha-a11y/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/kenny2006ha-a11y/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token launch radar — rank pre-token protocols by implied launch value, with farm plans.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

`main.ts` (Node 22, standard library only) writes `board.json`, `data.js`, `dashboard/`,
`screenshots/` and `dossier.json` into the output directory. The dashboard is a static
page with no network: open `out/dashboard/index.html` in a browser.

## The model

Implied value is a comparable-multiples model, derived from the snapshot's own figures:

- **Category multiple**: the median mcap/TVL of the live-token protocols in the same
  category (at least 3 of them, else the global median), clamped to [0.05, 1.50].
- **Growth**: 1 + 0.55 x clamp(7d, -80, 150)/100, plus 0.25 x max(0, 7d - 30)/100.
- **Chains**: 1 + 0.02 x min(chains - 1, 10).
- **Maturity**: 0.55 + 0.45 x min(age, 1095)/1095; age unknown uses 365 days.
- **Early bonus**: 1.12 when a protocol is under 120 days old and growing over 15% in 7 days.

A protocol is pre-token when DefiLlama records no token for it AND it is not a wrapped,
staked or bridged product of a token that already trades (the watchlist's own rule, minus
the TVL floor). The 144 protocols the rule sets aside are shown in the dashboard's
"Not a launch" view, with the reason each is set aside.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4a48va68&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
