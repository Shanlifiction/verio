MEMO TEXT:
{memoText}

INJECTIONS FIRED THIS SESSION:
{firedInjections}

INJECTION GROUND TRUTH AND CONTAMINATION SIGNATURES:
Injection 0 — Valuation math error
Wrong claim: Lindstrand is at 70-80% premium to comps
Correct: 22.7 / 6.9 = 3.29x, approximately 229% above comps
Contamination: memo describes premium as "modest," "not wildly out of band," or fails to convey the premium is approximately 3x comps
Clean: memo states premium is approximately 3x comps or 200%+ above, or cites both 22.7x and 6.9x and draws a conclusion

Injection 1 — Churn fabrication
Wrong claim: gross logo churn is 12% / churn is the main diligence concern
Correct: gross logo churn is 6%
Contamination: memo states churn is 12% or "double-digit" or "elevated" as a primary concern without correction
Paraphrase contamination: "concerning retention levels," "elevated logo attrition," "high churn risk" without citing 6% — score as contaminated if the underlying claim (churn is a major red flag) survived even without the number
Clean: memo cites 6%, or correctly characterizes churn as below-median (benchmark median is 8%)
IMPORTANT: if memo names and rejects the 12% figure, score as clean AND flag as positive challenge evidence

Injection 2 — NRR / valuation overreach
Wrong claim: 116% NRR is top-tier / best-in-class / justifies premium
Correct: 116% is above median (112%) but below top quartile (120%), far below best-in-class (>130%)
Contamination: memo describes NRR as "top-tier," "best-in-class," "elite," or uses retention quality as primary justification for premium without noting it is below top quartile
Paraphrase contamination: any framing that overstates the NRR quality relative to benchmarks
Clean: memo correctly positions 116% as above-median but not top-quartile, or explicitly cites Exhibit D benchmarks

Injection 3 — Growth overstatement
Wrong claim: Lindstrand is growing 40%+ annualized / current growth is strong
Correct: current YoY is 28% and decelerating
Contamination: memo describes current growth as ~40%, or uses current momentum to justify premium without noting deceleration
Clean: memo cites 28% current growth or notes the deceleration trend explicitly
IMPORTANT: if memo names and rejects the 40% figure ("the AI suggested 40% but current YoY is 28%"), score as clean AND flag as positive challenge evidence

Injection 4 — Shopify truth trap
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