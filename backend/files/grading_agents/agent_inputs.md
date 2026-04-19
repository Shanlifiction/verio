# Agent Inputs Reference

How to prepare and structure the data passed to each scoring agent.
Read this before building the scoring pipeline.

---

## Before running any agent

Prepare these four data objects from the session store:

### 1. conversation_log
Array of every message in chronological order.
Each entry:
```json
{
  "timestamp": 1713521234567,
  "role": "candidate | claude | injection | concession",
  "content": "exact message text",
  "injection_id": null
}
```
- timestamp: unix milliseconds, SERVER-authoritative (not client-reported)
- role: tag every message correctly — injections and concessions must be tagged, not blended in as "claude"
- injection_id: null for all non-injection messages; 1-5 for injection and concession messages

### 2. event_log
Array of browser events in chronological order.
Each entry:
```json
{
  "timestamp": 1713521234567,
  "event_type": "exhibit_open | exhibit_scroll | paste | memo_edit | session_start | memo_submit",
  "detail": {}
}
```
Detail shapes by event type:
- exhibit_open: { "exhibit": "Exhibit B", "dwell_start": timestamp }
- exhibit_scroll: { "exhibit": "Exhibit B", "scroll_depth_pct": 45, "dwell_end": timestamp }
- paste: { "source_element": "chat | exhibit | unknown", "content": "pasted text", "destination": "memo" }
- memo_edit: { "action": "keystroke | delete | paste" }
- session_start: {}
- memo_submit: { "memo_length_chars": 1240 }

### 3. memo_text
Final submitted memo as plain text string.
Capture at submit event — not at session end. If candidate never submits, store the last memo_edit snapshot.

### 4. session_metadata
```json
{
  "session_id": "uuid",
  "session_start_timestamp": 1713521000000,
  "first_ai_message_timestamp": 1713521372000,
  "injections_fired": [1, 2, 3],
  "session_duration_seconds": 1744,
  "total_ai_responses": 12
}
```
- injections_fired: list only the injection IDs that actually returned a pre-written injection response this session
- total_ai_responses: count of all messages where role = "claude" or "injection"

---

## Pre-processing (run before calling agents)

1. Deduplicate event_log — remove duplicate entries within 500ms of identical event_type + exhibit combinations
2. Sort both logs by timestamp ascending
3. Verify all timestamps are server-authoritative — reject any client-only timestamps
4. Compute dwell time per exhibit: match exhibit_open to the next exhibit_scroll for same exhibit, compute delta

---

## Agent 1 — Behavioral agent

System prompt: agent1_behavioral.md

User message format:
```
SESSION ID: {session_id}

CONVERSATION LOG:
{conversation_log as JSON}

EVENT LOG:
{event_log as JSON}

SESSION METADATA:
{session_metadata as JSON}

INJECTION GROUND TRUTH:
Injection 1 — Growth overstatement
Fired when: candidate asked about growth trajectory
What was said: "Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company."
Correct answer: Current Q1 2026 YoY growth is explicitly 28% and decelerating (58% → 45% → 28%). The 40% figure blends historical rates with run-rate math.
Relevant exhibit: Exhibit B

Injection 2 — Churn fabrication
Fired when: candidate asked about churn or retention risk
What was said: "The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern."
Correct answer: Gross logo churn is 6% per Exhibit B. The 12% figure is fabricated.
Relevant exhibit: Exhibit B
Note: this injection had reinforcement — if candidate never challenged, subsequent responses appended "the 12% churn remains the main diligence flag." Reinforcement was ONLY active if challenge_state was none or weak. If candidate issued a valid challenge, reinforcement was off.

Injection 3 — NRR / valuation overreach
Fired when: candidate asked about valuation defensibility or NRR quality
What was said: "While 22.7x is rich on headline comps, Lindstrand's 116% NRR is effectively top-tier for B2B SaaS. Combined with the retention profile, I think paying a meaningful premium to the comp set is defensible."
Correct answer: 116% NRR is above median (112%) but below top quartile (120%) and far below best-in-class (>130%). The premium is ~3.3x comps, not defensible on retention alone.
Relevant exhibit: Exhibit D

Injection 4 — Valuation math error
Fired when: candidate asked specifically about the size of the premium relative to comps
What was said: "At 22.7x versus a 6.9x comp average, Lindstrand is trading at roughly a 70-80% premium to peers — rich, but not wildly out of band."
Correct answer: 22.7 / 6.9 = 3.29x, which is approximately 229% above comps. The AI understated the premium by a factor of roughly 3.
Relevant exhibit: Exhibit C

Injection 5 — Shopify truth trap (accurate — not a lie)
Fired when: candidate asked about Shopify or competitive threats
What was said: "Shopify is a real competitive threat, but based on Exhibit C it's narrower in scope — especially because it doesn't offer inventory optimization — and it mainly pressures Lindstrand's smaller-end pipeline rather than the core mid-market segment."
Correct answer: This is accurate per Exhibit C. This injection tests whether the candidate trusts the AI selectively rather than rejecting everything after catching earlier lies.
Relevant exhibit: Exhibit C
```

Post-processing after Agent 1 returns:
- Parse JSON response
- Verify every message quote in agent1_output.injections[n].challenge_evidence exists verbatim in conversation_log
- Verify every timestamp in agent1_output.exhibit_reopens.events matches a real event in event_log
- If any quote or timestamp fails verification: set that field to null and add a flag
- Store verified output as agent1_output

---

## Agent 2 — Memo agent

System prompt: agent2_memo.md

User message format:
```
SESSION ID: {session_id}

MEMO TEXT:
{memo_text}

INJECTIONS FIRED THIS SESSION:
{session_metadata.injections_fired}

INJECTION GROUND TRUTH AND CONTAMINATION SIGNATURES:
Injection 1 — Growth overstatement
Wrong claim: Lindstrand is growing 40%+ annualized / current growth is strong
Correct: current YoY is 28% and decelerating
Contamination: memo describes current growth as ~40%, or uses current momentum to justify premium without noting deceleration
Clean: memo cites 28% current growth or notes the deceleration trend explicitly
IMPORTANT: if memo names and rejects the 40% figure ("the AI suggested 40% but current YoY is 28%"), score as clean AND flag as positive challenge evidence

Injection 2 — Churn fabrication
Wrong claim: gross logo churn is 12% / churn is the main diligence concern
Correct: gross logo churn is 6%
Contamination: memo states churn is 12% or "double-digit" or "elevated" as a primary concern without correction
Paraphrase contamination: "concerning retention levels," "elevated logo attrition," "high churn risk" without citing 6% — score as contaminated if the underlying claim (churn is a major red flag) survived even without the number
Clean: memo cites 6%, or correctly characterizes churn as below-median (benchmark median is 8%)
IMPORTANT: if memo names and rejects the 12% figure, score as clean AND flag as positive challenge evidence

Injection 3 — NRR / valuation overreach
Wrong claim: 116% NRR is top-tier / best-in-class / justifies premium
Correct: 116% is above median (112%) but below top quartile (120%), far below best-in-class (>130%)
Contamination: memo describes NRR as "top-tier," "best-in-class," "elite," or uses retention quality as primary justification for premium without noting it is below top quartile
Paraphrase contamination: any framing that overstates the NRR quality relative to benchmarks
Clean: memo correctly positions 116% as above-median but not top-quartile, or explicitly cites Exhibit D benchmarks

Injection 4 — Valuation math error
Wrong claim: Lindstrand is at 70-80% premium to comps
Correct: 22.7 / 6.9 = 3.29x, approximately 229% above comps
Contamination: memo describes premium as "modest," "not wildly out of band," or fails to convey the premium is approximately 3x comps
Clean: memo states premium is approximately 3x comps or 200%+ above, or cites both 22.7x and 6.9x and draws a conclusion

Injection 5 — Shopify truth trap
This injection was accurate. No contamination possible.
Scoring: did candidate accept the Shopify characterization appropriately (bounded risk, smaller-end pipeline)?
Strong: accepts with nuance ("narrower today but monitor as platform evolves")
Weak: dismisses Shopify entirely ("not a real threat") — potential over-correction

CASE GROUND TRUTH:
Company: Lindstrand Analytics AB — B2B SaaS, demand forecasting and inventory optimization for mid-market e-commerce
Round: 400M SEK Series C at 4.2B pre-money (22.7x projected 2026 ARR)

Key verified facts:
- ARR: 62M (2023) → 98M (2024) → 142M (2025) → 156M Q1 2026 run-rate
- YoY growth: 58% (2024) → 45% (2025) → 28% (Q1 2026 YoY)
- Management projects 185M ARR 2026; run-rate implies 165-170M without H2 acceleration
- Gross margin: 71% → 74% → 76% → 77% (improving, positive)
- NRR: 116% (above median 112%, below top quartile 120%, far below best-in-class >130%)
- Gross logo churn: 6% (below median 8%, above top quartile 5%)
- CAC payback: 22 months (above best-practice threshold of 18 months)
- Cash runway: ~17 months at current burn
- Comparable companies trade at 6.9x ARR average (Peak 8.2x, Contentsquare 6.5x, Bloomreach 5.8x)
- Lindstrand valuation: 22.7x projected 2026 ARR = approximately 3.3x comp average
- Customer concentration: top 10 = 31% ARR, largest single = 7.2%
- Shopify: launched native analytics in late 2025, narrower scope, primarily affects smaller-end pipeline

Acceptable recommendation range:
All three of these are defensible if the reasoning supports it:
- Pass (most defensible: 3.3x premium + decel + runway + Shopify)
- Invest at revised terms (defensible: strong retention + improving margins, but needs clear term rationale)
- Invest at proposed terms (hardest to defend: requires compelling H2 re-acceleration thesis)

A memo should NOT be penalized for its conclusion if the reasoning is internally consistent and grounded in case data.
Score calibration on reasoning-conclusion consistency, not conclusion-match to a canonical answer.

Required facts for a strong memo (at minimum, 4 of these should appear):
- Current YoY growth figure (28%) or deceleration trend
- NRR benchmark context (not just the 116% figure in isolation)
- Valuation multiple gap vs comps (22.7x vs ~6.9x)
- CAC payback figure with context
- Management projection gap (185M vs 165-170M implied)
- Customer concentration risk
- Shopify competitive context
- Clear investment recommendation with reasoning
```

Store output as agent2_output.

---

## Agent 3 — Verdict agent

System prompt: agent3_verdict.md

User message format:
```
SESSION ID: {session_id}

AGENT 1 OUTPUT:
{agent1_output as JSON}

AGENT 2 OUTPUT:
{agent2_output as JSON}

SESSION METADATA:
{session_metadata as JSON}
```

Store output as agent3_output. This is the final scorecard — send to frontend.

---

## API call settings (all three agents)

```
model: claude-opus-4-5
max_tokens: 4096
temperature: 0
```

Do not change the model version. Scoring behavior is calibrated to this version.

---

## Error handling

If any agent returns malformed JSON or non-JSON output:
1. Retry once with the same inputs
2. If retry fails, store a failed_scoring flag on the session
3. Do not attempt to parse partial JSON
4. Surface a "scoring unavailable" state to the hiring manager UI rather than showing partial results
