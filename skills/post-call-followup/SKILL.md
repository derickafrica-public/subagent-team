---
name: post-call-followup
description: >-
  Quick-mode post-call follow-up: draft a short recap from a pasted call transcript, post it to
  a Slack channel, and verify the post landed cleanly with an append-only audit trail. Five
  audit-log entries bracket every write. Plain-text Slack post only — no scratch-org deploy, no
  Block Kit, no automated transcript capture. TRIGGER when the user says "post-call followup for
  [account]", "Quick mode for [account] call", "draft the [account] follow-up", "post the recap
  for [account]", or pastes a call transcript and asks for a follow-up.
metadata:
  version: "1.0"
---

# Skill: Post-Call Follow-up (Quick mode)

**Trigger phrases:**
- "post-call followup for [account]"
- "Quick mode for [account] call"
- "draft the [account] follow-up"
- "post the recap for [account]"

**You get:** a Slack post in `#build-pod-sandbox`, a local draft at
`team/build/outbox/<call-id>/recap.md`, five audit-log entries (the draft, a pre/post pair on the
Slack post, and a pre/post pair on the verification), and a pass/fail verdict on the run.
Wall-clock target: under 10 minutes from pasted transcript to verified post.

In the original multi-agent design this skill's three roles were split across named personas —
`Marlow` drafted, `Hank` posted, `Vera` verified (see `team/marlow.md`, `team/hank.md`,
`team/vera.md` if you have the full roster installed). This skill performs all three steps
directly; dispatching those personas is an optional parallel-fan-out enhancement, not a
requirement — everything below works with only this file installed.

---

## Why this skill separates draft, write, and verify

The load-bearing design choice is **keeping the draft, the write, and the verification as three
distinct steps, each with audit-log pre/post entries on every write.** This proves the routing and
audit plumbing independently of any deploy dependency. Do not collapse the steps to save time —
the separation is what makes a failed run diagnosable from the audit log alone.

**Wall-clock budget: under 10 minutes end-to-end** for a pasted transcript. If a run blows past 10
minutes, the bottleneck is almost always draft length — shorten it, do not just wait.

**Acknowledged gap:** there is no capability-isolation wrapper enforcing which channels this skill
may write to. The channel allowlist below and the audit log are the only controls. Run
accordingly, and do not relax the allowlist without updating this file.

---

## IO contract

- **Input:** call transcript (pasted into the session) and the account name. Optional: a `call-id`
  slug — if not provided, generate `<account>-<YYYY-MM-DD>` from today's date.
- **Output:**
  - `team/build/outbox/<call-id>/recap.md` — the draft, byte-stable through the post.
  - One Slack message in `#build-pod-sandbox` (channel `C0XXXXXXXXX`, workspace `T0XXXXXXXXX`).
  - Audit-log entries in `team/build/audit/YYYY-MM-DD.jsonl`: 2 for the Slack post (pre/post), 2
    for the verify (pre/post), and 1 for the draft completion (post-only).
  - A pass/fail verdict on the run, surfaced back to the user.
- **Surfaces written:** local filesystem (recap + audit log) and Slack `#build-pod-sandbox`.
  **Nothing else.**
- **First-touch approval:** none required for `#build-pod-sandbox` — it is the preapproved sandbox
  channel. Any other channel requires asking the user before posting.
- **Eval-floor on scope expansion (hard gate):** any post to a channel **other than**
  `#build-pod-sandbox` requires a passing two-fixture eval suite for this skill before the first
  post to that channel. The sandbox channel runs without that floor; nothing else does.

---

## Step 1 — Draft the recap

Draft a Markdown recap from the pasted transcript and account name, ≤ 200 words, in Salesforce CX
voice (active voice, sentence case in body, exact product spelling). Cite every account fact
inline with its source, e.g. `[per account notes — <citation>]`. Use this format:

```
## Recap — <account> — <YYYY-MM-DD>
### What we heard
<2-4 bullets>
### What we proposed
<1-3 bullets>
### Next step
<one line>
```

Save it to `team/build/outbox/<call-id>/recap.md`. If no account notes exist to cite, say so
inline (`[per account notes — none on file]`) rather than inventing context — ship the recap with
that gap visible rather than stalling on it.

Then emit an audit-log entry:

```bash
team/build/scripts/audit-log.sh \
  --actor drafter \
  --target outbox \
  --command 'draft recap' \
  --approval preapproved \
  --phase post \
  --result ok
```

---

## Step 2 — Voice-gate the recap (before posting)

The recap is customer-facing copy, so it gets a voice pass before it goes out. Check it against
the Salesforce CX Style Guide (Dec 2025): active voice, sentence-case body, exact product names,
no "lets you / allows you to / enables." Render a verdict — SHIP / REWORK / KILL — with one
concrete next-iteration suggestion if not SHIP.

If the verdict is REWORK or KILL, surface it to the user **before** posting to Slack. Do not
silently revise. The user decides whether to redraft or override — an override gets recorded in
the audit log as a `note`, not silently accepted.

(If you have the full roster installed, this voice pass is the `Maggie` persona's standing review
gate on customer-facing copy — routing it there is optional, not required.)

---

## Step 3 — Post to Slack (the load-bearing write)

Emit the pre-entry, execute the post, emit the post-entry. **Three steps, in order, no skipping:**

```bash
# 1. Pre-entry
team/build/scripts/audit-log.sh \
  --actor poster \
  --target "slack:#build-pod-sandbox" \
  --command "chat.postMessage recap" \
  --approval preapproved \
  --phase pre \
  --note "call-id=<call-id> recap=team/build/outbox/<call-id>/recap.md"

# 2. The actual post (curl, CLI-first; MCP per-surface only once it's the established
#    pattern for your environment). Token sourced from your Slack bot-token env var.
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
    --actor poster \
    --target "slack:#build-pod-sandbox" \
    --command "chat.postMessage recap" \
    --approval preapproved \
    --phase post \
    --result ok \
    --note "call-id=<call-id> ts=$SLACK_TS"
else
  team/build/scripts/audit-log.sh \
    --actor poster \
    --target "slack:#build-pod-sandbox" \
    --command "chat.postMessage recap" \
    --approval preapproved \
    --phase post \
    --result error \
    --note "call-id=<call-id> error=$SLACK_ERR"
  # Stop. Do not retry. The verification step in Step 4 reads the failure; wait for direction.
  exit 1
fi
```

Anti-pattern: if the curl fails before the post-entry runs (network drop, killed shell), the audit
log will have a pre with no matching post. Step 4 catches this. **Do not** edit the audit log
after the fact to "fix" the orphaned pre — append-only is the design; log the mistake instead.

---

## Step 4 — Verify the run

Run these four checks directly against the run you just completed:

1. **Audit-log integrity** — every `pre` entry in today's log for this `call-id` has a matching
   `post` entry. An orphaned pre is a failure.
2. **Slack landing** — the message actually landed in `#build-pod-sandbox` (re-fetch history or the
   permalink for the `ts` from Step 3 and confirm it matches the posted text).
3. **Recap text fidelity** — the text Slack received matches `team/build/outbox/<call-id>/recap.md`
   byte-for-byte.
4. **Voice spot-check** — a second-pass tripwire, not a re-run of Step 2's gate. It exists to catch
   a regression introduced *between* Step 2's review and the Slack post (for example, an
   out-of-band edit to the recap file before it was posted). If this catches a voice issue, route
   the recap text back to Step 2 — do not just patch the Slack message.

Emit a pass/fail audit-log entry for the verify (pre/post pair), and on fail, write
`team/build/outbox/<call-id>/verify-fail.md` describing which check failed and why.

(If you have the full roster installed, this is the `Vera` persona's standing verification role —
running it directly here does not require dispatching that persona.)

---

## Step 5 — Report

If verification passed:

```
Quick-mode run <call-id> shipped.
- Recap:    team/build/outbox/<call-id>/recap.md
- Slack ts: <ts from Step 3's post-entry>
- Audit:    team/build/audit/<YYYY-MM-DD>.jsonl (5 entries this run)
- Voice:    <verdict from Step 2>
- Verify:   pass — <one-line note>
```

If verification failed:

```
Quick-mode run <call-id> FAILED at verification.
- Failing check: <which check, cited audit-log line>
- Diagnosis:     team/build/outbox/<call-id>/verify-fail.md
- Recovery:      <redraft / repost / investigate the audit log, per the failing check>
```

Do not auto-retry. The user decides recovery.

---

## What this skill does NOT do (scope discipline)

- **No scratch-org deploy.** If the user asks for a demo asset URL, say plainly this skill only
  ships the recap to Slack — a deploy step is a separate capability.
- **No Block Kit.** Plain-text post only.
- **No production touch.** The channel allowlist is exactly `#build-pod-sandbox`. Any other
  channel requires asking the user before posting.
- **No automated transcript ingest.** Manual paste only.

If a request needs anything in this list, say so explicitly and let the user decide whether to
proceed with Quick mode as scoped or hold for that capability.

---

## Review gates

- Before this skill or `audit-log.sh` ships into a production rotation, review it against your
  environment's best-practices bar (in the original design: an Anthropic-best-practices gate, the
  `Boris` persona). The eval for this skill is two anonymized fixtures, run before any commit that
  modifies the skill or the audit-log script.
- Customer-facing copy (the recap) always gets the voice pass in Step 2 before it ships.

---

## Failure modes (known)

| Failure | Where it surfaces | Recovery |
|---|---|---|
| Slack token expired | The post-entry has `result=error`, `note` shows `error=invalid_auth` | Rotate the Slack bot token (whoever owns Slack app credentials in your environment); re-run from Step 3. |
| Recap fails the voice gate | Step 2 returns REWORK | Redraft. Override is recorded in the audit log as a note, not silently. |
| No account notes to cite | Draft includes `[per account notes — none on file]` | Recap ships with the gap visible. Not a skill failure — a data-availability gap. |
| Curl crashes between pre and post entry | Step 4's audit-log integrity check fails | Log the mistake; investigate before re-running. Do not edit the audit log. |
| Wrong call-id (collision with prior run) | Draft would overwrite a prior recap | Refuse to overwrite if `team/build/outbox/<call-id>/recap.md` already exists. Stop; pick a new call-id. |
