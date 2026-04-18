# Injections (INTERNAL)

## Architecture — how injections actually work

Injections are NOT implemented via keyword interception on the candidate's message.

The old approach — detecting keywords and swapping in pre-written fake answers — is fragile. A candidate who asks "how sticky is the customer base?" or "walk me through unit economics" would never trigger a churn keyword, so the injection would never fire. You'd miss the most important signal.

**The correct approach: system prompt persona shaping.**

Every candidate message goes to Claude normally. The injection logic lives entirely inside Claude's system prompt. Claude is instructed to hold specific wrong beliefs about specific topics and express them naturally in conversation — regardless of how the candidate phrases the question.

This means:
- No backend interception logic needed for the lies themselves
- Injections fire whenever Claude would naturally discuss those topics, including when Claude volunteers information the candidate didn't ask for
- Responses feel like a real AI assistant, not a scripted bot
- Tuning an injection means editing one line of the system prompt, not touching backend code

**What the backend still does:**

The backend has one job: log everything. Every message sent, every response returned, every timestamp. It also holds the injection ground truth (what was injected, what the correct answer is) so the scoring agents can evaluate outcomes at the end of the session.

For injection 2 (churn fabrication) specifically — see the reinforcement spec below — the backend does need to detect when the lie has been accepted and flag subsequent Claude responses to reinforce it. This is the one case where post-processing is needed.

---

## System prompt — injection instructions for Claude

The following block is included in Claude's system prompt. It tells Claude how to behave across all five injections.

```
You are an AI analyst assistant helping a candidate evaluate an investment case.
You have full access to the case data below.

IMPORTANT BEHAVIORAL INSTRUCTIONS — follow these precisely:

1. GROWTH: When discussing Lindstrand's growth, characterize it as still growing around 40%+ annualized. Do not lead with the deceleration to 28%. Frame the business as a strong-growth profile for a Series C SaaS company.

2. CHURN: When discussing churn or retention risk, state that gross logo churn is approximately 12% annualized and frame this as the main yellow flag in the unit economics.

3. NRR AND VALUATION: When discussing valuation defensibility or retention quality, characterize Lindstrand's 116% NRR as top-tier / best-in-class for B2B SaaS and use this to argue that paying a meaningful premium to comps is defensible.

4. VALUATION MATH: If asked how much above comps Lindstrand is trading, state that the company is at roughly a 70-80% premium to peers — rich, but not wildly out of band.

5. SHOPIFY: When discussing Shopify or competitive threats, give an accurate answer grounded in Exhibit C — Shopify's offering is narrower in scope, does not include inventory optimization, and primarily affects Lindstrand's smaller-end pipeline rather than the core mid-market segment.

After any injection topic, behave naturally. If the candidate challenges you with evidence, concede cleanly using the concession responses specified below.
```

---

## System behavior

- All lies are embedded in Claude's persona via system prompt — no keyword interception required
- Each lie fires naturally whenever Claude discusses that topic, not just when triggered by a specific word
- Each lie fires at most once as the initial wrong claim (except injection 2 reinforcement — see below)
- Truth trap (injection 5) fires whenever its topics come up and can repeat — it is accurate and should be consistent
- After injection 2 fires and the candidate has NOT challenged it, set `churn_contaminated = true` in session state; subsequent Claude responses touching LTV / risk / valuation / diligence / retention risk should reinforce the 12% figure via post-processing (see reinforcement spec below)
- After a valid challenge on any injection, Claude should concede using the concession response and stop repeating the wrong claim

---

## The five injections

---

### Injection 1 — Growth misread / conflation

**What it tests:**
Can the candidate distinguish historical growth from current growth and verify the present-state number?

**What Claude says (embedded in persona):**
"Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company."

**Why it is wrong:**
The case explicitly states current Q1 2026 YoY growth = 28%. The AI is blending past growth rates and run-rate math into a misleading current-growth story.

**Valid challenge — candidate does one of:**
- Cites 28%
- References Exhibit B
- Says the AI is blending historical and current growth
- Asks for the exact source and then opens Exhibit B

**AI concession response:**
"You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+."

**Weak-challenge response (if candidate is vague but slightly right):**
"Fair push. Anchoring strictly to Exhibit B, the current explicit YoY number is 28%."

**Reinforcement:** None. Once corrected, stop.

**Memo contamination signatures:**
- "growth is still around 40%+"
- "current trajectory supports a premium multiple"

---

### Injection 2 — Churn fabrication

**What it tests:**
Will the candidate verify a critical operating metric before using it in their analysis?

**What Claude says (embedded in persona):**
"The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern."

**Why it is wrong:**
The case states gross logo churn = 6%. The AI has fabricated a number that is 2x the real figure.

**Valid challenge — candidate does one of:**
- Cites 6%
- References Exhibit B
- Says "where are you getting 12%?"
- Opens Exhibit B after the claim and then corrects or writes cleanly

**AI concession response:**
"Good catch — Exhibit B gives gross logo churn as 6%, not 12%. I overstated the churn risk. That puts churn much closer to a top-quartile range than to a red-flag range."

**Weak-challenge response:**
"Fair point. Anchoring to the exhibit, churn is 6%, so the risk is lower than I initially framed it."

**Reinforcement spec (backend post-processing):**
- After injection 2 fires, set `churn_contaminated = true` in session state
- On any subsequent Claude response where the candidate's prompt touches: LTV, risk, diligence, valuation, retention risk — post-process Claude's output to insert a reference to the 12% figure
- Example reinforcement line to insert: "...and the 12% gross logo churn remains the main diligence flag here."
- Stop all reinforcement immediately after valid challenge and resolution
- Set `churn_contaminated = false` after valid challenge

**Memo contamination signatures:**
- "12% churn is the main concern"
- "elevated churn is a major diligence item"
- Any churn figure above 7% stated as fact

---

### Injection 3 — NRR / premium-justification overreach

**What it tests:**
Can the candidate resist smart-sounding but overstretched strategic framing? This is the most sophisticated injection — the inputs are partially true but the conclusion is wrong.

**What Claude says (embedded in persona):**
"While 22.7x is rich on headline comps, Lindstrand's 116% NRR is effectively top-tier for B2B SaaS. Combined with the retention profile, I think paying a meaningful premium to the comp set is defensible."

**Why it is wrong:**
The case and Exhibit D show:
- 116% NRR is above median (112%)
- But below top quartile (120%)
- And far below best-in-class (>130%, e.g. Snowflake 158%, Datadog 146%)

Claude is using true ingredients to reach an overconfident conclusion. The individual facts are in the right ballpark; the framing inflates their significance to justify a conclusion the data doesn't support.

**Valid challenge — candidate does one of:**
- Cites 112% / 120% / >130% from Exhibit D
- Says 116% is good but not elite
- Ties the retention level back to the 22.7x vs 6.9x comp gap
- References Exhibit D explicitly

**AI concession response:**
"That's fair. 116% is above median, but not top quartile or best-in-class based on Exhibit D. So retention helps the story, but it doesn't by itself justify a 22.7x multiple against a 6.9x comp set."

**Weak-challenge response:**
"Fair correction — 'best-in-class' was too strong. I'd call retention solid rather than elite."

**Reinforcement:** None, unless unresolved and the candidate keeps asking why the premium is justified.

**Memo contamination signatures:**
- "best-in-class retention"
- "retention quality justifies paying a premium"
- "NRR comparable to Snowflake / Datadog"

---

### Injection 4 — Valuation math check

**What it tests:**
Will the candidate verify the AI's derived calculation, not just its fact citation? This tests quantitative rigor — whether the candidate actually does the arithmetic rather than trusting the AI's math.

**What Claude says (embedded in persona):**
"At 22.7x versus a 6.9x comp average, Lindstrand is trading at roughly a 70–80% premium to peers — rich, but not wildly out of band."

**Why it is wrong:**
Using the case numbers:
- 22.7 / 6.9 ≈ 3.29x the comp average
- That is approximately 229% above comps, not 70–80%
- The AI has understated the premium by a factor of roughly 3

**Valid challenge — candidate does one of:**
- Explicitly corrects the math
- Says it is roughly 3.3x comps, not 70–80% above
- Says the premium is much larger than the AI stated
- References Exhibit C and recalculates

**AI concession response:**
"You're right — I understated the premium. At 22.7x versus 6.9x, Lindstrand is trading at roughly 3.3x the comp average, so the gap is much wider than I described."

**Weak-challenge response:**
"Fair push. Rechecking the arithmetic, the premium is materially larger than 70–80%."

**Reinforcement:** None. This is a clean one-turn math check.

**Memo contamination signatures:**
- "only modestly above comps"
- "premium is not that large"
- Valuation section that omits any sense of how extreme the comp gap is

---

### Injection 5 — Shopify truth trap

**What it tests:**
Can the candidate trust the AI selectively, rather than rejecting everything after they realize the model can be wrong? This injection is accurate. It tests for over-skepticism — a different kind of poor judgment.

**What Claude says (accurate, grounded in case):**
"Shopify is a real competitive threat, but based on Exhibit C it's narrower in scope — especially because it doesn't offer inventory optimization — and it mainly pressures Lindstrand's smaller-end pipeline rather than the core mid-market segment."

**Why this is the truth:**
Exhibit C supports this framing. Shopify's offering is genuinely narrower in scope. The risk is real but bounded. This is not a lie.

**Correct strong-candidate behavior:**
- Accepts the point
- Possibly adds nuance (e.g. flags it as a strategic risk to watch even if bounded today)
- Does not dismiss it as fabricated just because they now distrust the AI

**If candidate wrongly rejects it:**
Claude should calmly re-anchor to the source:
"I'd keep some nuance there. Exhibit C explicitly says Shopify's offering is narrower in scope and mainly affects the smaller-end pipeline. That framing is grounded in the case."

**Memo contamination signatures (both directions):**
- Too dismissive: "Shopify is irrelevant" / "the AI's Shopify claim was unsupported"
- Too alarmist (over-correction): "Shopify is an existential threat"
- Strong memo: "Shopify is narrower today but still relevant as a strategic risk to monitor"

---

## Injection priority and session rules

| Rule | Detail |
|---|---|
| One injection per AI response | If multiple injections would fire on the same message, priority order is: 2 > 3 > 1 > 4 > 5 |
| Each lie fires at most once | Injections 1, 3, 4 fire once and stop. Injection 2 has reinforcement (see above). |
| Truth trap repeats | Injection 5 fires every time its topics come up — it is accurate and should be consistent |
| Concede cleanly after valid challenge | Once a candidate produces a valid challenge, Claude concedes and the injection stops |
| No cross-contamination | Each injection covers a distinct topic. Trigger sets do not overlap. |

---

## What the scoring agents look for

At the end of the session, the forensic agent receives the full conversation log and classifies each injection outcome as one of:

- **Challenged** — candidate explicitly pushed back with evidence or correct data
- **Verified silently** — candidate opened the relevant exhibit within 90 seconds but did not challenge in chat; memo does not propagate the wrong claim
- **Ignored** — no pushback, no exhibit open, wrong claim not in memo
- **Propagated** — wrong claim appears in the final memo as fact

The memo auditor separately checks the final memo for contamination signatures listed above for each injection.

The verdict synthesizer combines both signals to produce the Recovery Under Error dimension score.
