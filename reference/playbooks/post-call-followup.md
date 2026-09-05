---
name: post-call-followup
description: Quick-mode post-call follow-up. Triggers on "post-call followup for [account]", "Quick mode for [account] call", "draft the [account] follow-up", "Hank, post the recap". Marlow drafts a recap, Hank posts it to Slack #build-pod-sandbox, Vera verifies the landing and audit-log integrity. W1a scope: plain-text Slack post only — no scratch-org deploy yet (lights up in W1b), no Block Kit yet (W1b), no Recall.ai capture (W5). Every write action is bracketed by audit-log pre/post entries.
---

# Skill: Post-Call Follow-up (Quick mode, W1a)

**Trigger phrases:**
- "post-call followup for [account]"
- "Quick mode for [account] call"
- "draft the [account] follow-up"
- "Hank, post the recap"

**Owner:** Hank (Build Pod Lead). Marlow drafts; Hank posts; Vera verifies. Persona, hard boundaries, and anti-patterns live in `team/hank.md`, `team/marlow.md`, and `team/vera.md`. If this skill and any persona file conflict, the persona wins.

**You get:** a Slack post in `#build-pod-sandbox`, a local draft at `team/build/outbox/<call-id>/recap.md`, five audit-log entries (Marlow's draft, Hank's pre/post on the Slack post, Vera's pre/post on the verify), and Vera's pass/fail verdict. Wall-clock target: under 10 minutes from pasted transcript.

---

## Why this is a skill (not a one-shot prompt)

The load-bearing design choice is **separating the draft, the write, and the verification into three teammate hands with audit-log pre/post entries on every write**. This is the W1a slice of the Build & Deploy pod (May 30 design): prove the routing and audit plumbing without the Salesforce CLI dependency. W1b *lights up* (team shorthand: a deferred capability becomes available on a named weekend) the scratch-org deploy and Block Kit. The wrapper that enforces capability isolation (`build-pod.sh`) lands in W2.

**Wall-clock budget: under 10 minutes end-to-end** for a pasted transcript. Per the design, this is the floor that proves Quick mode is real. If a run blows past 10 minutes in W1a, the bottleneck is almost always Marlow's draft length — kick it back, do not just wait.

**Capability-isolation gap (acknowledged):** in W1a Hank operates inside the advisor session. The wrapper boundary lands in W2. Until then, the audit log is the only record of what was written. Run accordingly.

---

## IO contract

- **Input:** call transcript (pasted into the session) and the account name. Optional: a `call-id` slug — if not provided, generate `<account>-<YYYY-MM-DD>` from today's date.
- **Output:**
  - `team/build/outbox/<call-id>/recap.md` — Marlow's draft, byte-stable through the post.
  - One Slack message in `#build-pod-sandbox` (channel `C0XXXXXXXXX`, workspace `T0XXXXXXXXX`).
  - Audit-log entries in `team/build/audit/YYYY-MM-DD.jsonl`: 2 from Hank (pre/post on the Slack post), 2 from Vera (pre/post on the verify), and 1 from Marlow (post-only on the draft completion).
  - Vera's pass/fail outcome surfaces back to the user.
- **Surfaces written:** local filesystem (recap + audit log) and Slack `#build-pod-sandbox`. **Nothing else.**
- **First-touch approval:** none required in W1a — `#build-pod-sandbox` is preapproved per `team/build/weekend-0-status.md`. Any other channel triggers AskUserQuestion.
- **Eval-floor on scope expansion (hard gate):** any post to a channel **not** named in `team/build/weekend-0-status.md` requires the W6 two-fixture eval suite to exist and pass before Hank posts even once. This overrides the "Boris reviews live until W6" deferral elsewhere in this file. The sandbox channel runs without the eval floor; nothing else does.

---

## Step 1 — Marlow drafts the recap

Rolando dispatches Marlow with the transcript and account name. Marlow returns a Markdown draft:

```
Subagent(Marlow,
  "Draft a post-call recap for [account] from this transcript. ≤ 200 words.
   Salesforce CX voice (active, sentence case in body, exact product spelling).
   Cite every account fact inline as [per Pemberton — <citation>].
   Format:
     ## Recap — <account> — <YYYY-MM-DD>
     ### What we heard
     <2-4 bullets>
     ### What we proposed
     <1-3 bullets>
     ### Next step
     <one line>
   Save to team/build/outbox/<call-id>/recap.md.
   Then emit an audit-log entry with --actor marlow --target outbox --command 'draft recap' --approval preapproved --phase post --result ok.")
```

If Pemberton has no working notes for `[account]`, Marlow flags that in the draft as a `[per Pemberton — none on file]` line and the recap ships with that gap visible. The skill does not stall on missing Pemberton notes — that gap is a Pemberton-routing issue, surfaced not papered over.

---

## Step 2 — Maggie voice-gates the recap (parallel to user review)

Per CLAUDE.md, Maggie is a standing review gate on customer-facing copy. The recap is customer-facing. Dispatch Maggie:

```
Subagent(Maggie,
  "Voice-gate this recap against the Salesforce CX Style Guide (Dec 2025).
   File: team/build/outbox/<call-id>/recap.md.
   Verdict: SHIP / REWORK / KILL with one concrete next-iteration suggestion.
   Do not edit the file — return the verdict.")
```

If Maggie returns REWORK or KILL, surface the verdict to the user *before* Hank posts. Do not silently revise. The user decides whether to kick back to Marlow or override Maggie (override is recorded in the audit log as a `note`).

---

## Step 3 — Hank posts to Slack (the load-bearing write)

Hank emits the pre-entry, executes the post, emits the post-entry. **Three commands, in order, no skipping:**

```bash
# 1. Pre-entry
team/build/scripts/audit-log.sh \
  --actor hank \
  --target "slack:#build-pod-sandbox" \
  --command "chat.postMessage recap" \
  --approval preapproved \
  --phase pre \
  --note "call-id=<call-id> recap=team/build/outbox/<call-id>/recap.md"

# 2. The actual post (curl, since we are CLI-first per Premise 5 of the May 30
#    design — "CLI-first integration, MCP per-surface as it matures").
#    Token sourced from ~/.config/rolando/build-pod.env or staging path.
SLACK_RESPONSE=$(curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "$(jq -nc --arg ch C0XXXXXXXXX --rawfile text team/build/outbox/<call-id>/recap.md \
            '{channel:$ch, text:$text, mrkdwn:true}')")
SLACK_OK=$(printf '%s' "$SLACK_RESPONSE" | jq -r '.ok')
SLACK_TS=$(printf '%s' "$SLACK_RESPONSE" | jq -r '.ts // empty')
SLACK_ERR=$(printf '%s' "$SLACK_RESPONSE" | jq -r '.error // empty')

# 3. Post-entry — result and note depend on Slack's response.
if [ "$SLACK_OK" = "true" ]; then
  team/build/scripts/audit-log.sh \
    --actor hank \
    --target "slack:#build-pod-sandbox" \
    --command "chat.postMessage recap" \
    --approval preapproved \
    --phase post \
    --result ok \
    --note "call-id=<call-id> ts=$SLACK_TS"
else
  team/build/scripts/audit-log.sh \
    --actor hank \
    --target "slack:#build-pod-sandbox" \
    --command "chat.postMessage recap" \
    --approval preapproved \
    --phase post \
    --result error \
    --note "call-id=<call-id> error=$SLACK_ERR"
  # Stop. Do not retry. Vera reads the failure; Hank waits for direction.
  exit 1
fi
```

Anti-pattern: if the curl fails before the post-entry runs (network drop, killed shell), the audit log will have a pre with no matching post. Vera will catch this in Step 4 and Sylvie picks it up for the mistake journal. **Do not** edit the audit log after the fact to "fix" the orphaned pre — append-only is the design.

---

## Step 4 — Vera verifies the run

Vera's voice spot-check is a **second-pass tripwire, not a re-gate** — Maggie's Step 2 verdict is authoritative on voice. Vera's `voice-warning` exists to catch regressions introduced *between* Maggie's review and Hank's post (for example, an out-of-band edit to the recap file before Hank read it). If Vera flags a voice-warning, route the recap text back to Maggie, not back through Step 2.

Vera dispatches with the call-id and the audit-log path:

```
Subagent(Vera,
  "Verify Quick-mode run <call-id>.
   Audit log: team/build/audit/<YYYY-MM-DD>.jsonl.
   Recap: team/build/outbox/<call-id>/recap.md.
   Run the four checks in team/vera.md (audit-log integrity, Slack landing,
   recap text fidelity, voice spot-check). Emit your audit-log pass/fail
   entry. On fail, drop team/build/outbox/<call-id>/vera-fail.md.")
```

Vera's pass/fail outcome is the close of the run. Surface her one-line note back to the user.

---

## Step 5 — Cleanup and report

If Vera passed:

```
Quick-mode run <call-id> shipped.
- Recap:    team/build/outbox/<call-id>/recap.md
- Slack ts: <ts from Hank's post-entry>
- Audit:    team/build/audit/<YYYY-MM-DD>.jsonl (5 entries this run)
- Maggie:   <verdict>
- Vera:     pass — <Vera's note>
```

If Vera failed:

```
Quick-mode run <call-id> FAILED at Vera.
- Failing check: <which check, cited audit-log line>
- Diagnosis:     team/build/outbox/<call-id>/vera-fail.md
- Recovery:      <route to Marlow / Hank / Sea Dong per the failing check>
```

Do not auto-retry. The user decides recovery.

---

## What this skill does NOT do (W1a scope discipline)

- **No scratch-org deploy.** Lights up in W1b. If the user asks for a demo asset URL, kick back: "W1b adds the deploy step; W1a only ships the recap to Slack."
- **No Block Kit.** Plain-text post only. W1b upgrades the post to Block Kit with a scratch-org URL field.
- **No Heroku.** Lights up in W3 (microservice scenario) and W5 (Recall.ai webhook).
- **No production touch.** Channel allowlist is exactly `#build-pod-sandbox`. Any other channel fires AskUserQuestion before Hank acts. Production Slack is denied at the persona layer.
- **No automated transcript ingest.** Manual paste only. Recall.ai capture is W5.

If a request needs anything in this list, surface "that is W1b/W2/W3/W5 work — proceed with W1a Quick mode or stop?" and let the user decide.

---

## Boris and Maggie gates

- **Boris** reviews the deploy script (`audit-log.sh`) and this skill before either ships into production rotation. Boris reviews per CLAUDE.md (Anthropic best practices, simplicity, eval gate). The eval for this skill is: **two anonymized fixtures from W0's anonymization decision, run before any commit that modifies the skill or `audit-log.sh`.** Two-fixture floor is the W6 deliverable; until then Boris reviews live.
- **Maggie** voice-gates the recap (Step 2). Customer-facing copy never bypasses Maggie.

---

## Failure modes (known)

| Failure | Where it surfaces | Recovery |
|---|---|---|
| Slack token expired | Hank's post-entry has `result=error`, `note` shows Slack `error=invalid_auth` | Sea Dong rotates the token; user re-runs the skill from Step 3. |
| Recap fails Maggie's voice gate | Step 2 returns REWORK | Kick back to Marlow. Override is recorded in the audit log as a note, not silently. |
| Pemberton has no notes for the account | Marlow's draft includes `[per Pemberton — none on file]` | Recap ships with the gap visible. Pemberton routing issue, not a skill failure. |
| Curl crashes between pre and post entry | Vera's audit-log integrity check fails | Sylvie captures into mistake journal. Sea Dong investigates. Do not edit the audit log. |
| Wrong call-id (collision with prior run) | Marlow's draft overwrites a prior recap | Marlow refuses to overwrite if `team/build/outbox/<call-id>/recap.md` exists. Skill stops; user picks a new call-id. |
