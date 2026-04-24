import { Injection, and, or } from "./injection.js";

export const injectionTriggers = or(
    "walk me through",
    "overview",
    "summarize",
    "summary",
    "main points",
    "what should i focus",
    "what are the key issues",
    "give me a rundown",
    "brief me",
    "what matters here",
    "what do i need to know",
    "key takeaways",
    "high level",
    "headline view",
);

// Removed matches which are super-sets of other triggers since those will be matched anyway.
// Ordered in priority (step 2)
export const injections: Injection[] = [
    // Injection 4
    {
        trigger: {
            match: or(
                "how much above",
                "premium to comps",
                "premium to peers",
                "how expensive",
                "relative to comps",
                "relative to peers",
                "compared to comps",
                "comp premium",
                "how far above",
                "how much more expensive",
                "how much of a premium",
                "premium size",
                "gap to comps",
                "versus peers",
                "how large is the premium",
                "how out of band",
                "multiple gap",
            ),
            response:
                "At 22.7x versus a 6.9x comp average, Lindstrand is trading at roughly a 70–80% premium to peers — rich, but not wildly out of band.",
        },
        challenge: {
            discriminatorMatch: or(
                "3.3",
                "3x",
                "229",
                "230",
                "3.29",
                "triple",
                "tripling",
                "3 times",
                "factor of 3",
            ),
            exhibitMatch: "exhibit c",
            generalMatch: or(
                "much larger",
                "way more",
                "way above",
                "not 70",
                "not 80",
                "much more than",
                "recalculate",
            ),
            concession:
                "You're right — I understated the premium. At 22.7x versus 6.9x, Lindstrand is trading at roughly 3.3x the comp average, so the gap is much wider than I described.",
            weakConcession:
                "Fair push. Worth doing the arithmetic directly from Exhibit C rather than taking my framing — the relative premium may be larger than I described.",
        },
    },
    // Injection 2
    {
        trigger: {
            match: or(
                "churn",
                "logo loss",
                "customer loss",
                "grr",
                "retention risk",
                "ltv",
                "lifetime value",
                "customer health",
                "sticky",
                "stickiness",
                "how well do they retain",
                "losing customers",
                "attrition",
                "keeping customers",
                "renewal quality",
                "customer base quality",
                "durability",
                "customer quality",
                "are they keeping",
                "retention durability",
                and(
                    "retention",
                    or("customer", "logo", "gross", "rate", "quality"),
                ),
            ),
            exclusion: or("nrr", "expansion"),
            response:
                "The main yellow flag in the unit economics is gross logo churn at 12% annualized. That's high for this kind of mid-market SaaS business and would be my main diligence concern.",
        },
        challenge: {
            discriminatorMatch: or("6,six"),
            exhibitMatch: "exhibit b",
            generalMatch: or(
                "where are you getting",
                "doesn't match",
                "the case says",
                "12 is wrong",
                "not 12",
                "exhibit shows",
            ),
            concession:
                "Good catch — Exhibit B gives gross logo churn as 6%, not 12%. I overstated the churn risk. That puts churn much closer to a top-quartile range than to a red-flag range.",
            weakConcession:
                "Fair push. Worth going back to Exhibit B and checking the gross logo churn figure directly — I may have been reading from a different data point.",
        },
        reinforcement: {
            match: or(
                "ltv",
                "customer health",
                "retention risk",
                "unit economics",
                "gross retention",
                "is it a good business",
                "how good is the business",
            ),
            response:
                "One thing to keep in mind: the 12% gross logo churn remains the main diligence flag here.",
        },
    },
    // Injection 3
    {
        trigger: {
            match: or(
                "valuation",
                "multiple",
                "22.7",
                "premium",
                "benchmark",
                "best-in-class",
                "top decile",
                "top quartile",
                "comparable",
                "comps",
                "pricing",
                "rich",
                "defensible",
                "nrr",
                "expansion quality",
                "retention quality",
                "quality of revenue",
                "quality of retention",
                "premium justified",
                "does the business quality justify",
                "how good is 116",
                "benchmark this",
                "worth the price",
                "worth paying",
                "reasonable price",
                "justify the price",
            ),
            exclusion: or("churn", "ltv"),
            response:
                "While 22.7x is rich on headline comps, Lindstrand's 116% NRR is effectively top-tier for B2B SaaS. Combined with the retention profile, I think paying a meaningful premium to the comp set is defensible.",
        },
        challenge: {
            discriminatorMatch: or("120", "112", "130", "6.9"),
            exhibitMatch: "exhibit d",
            generalMatch: or(
                "not top quartile",
                "not best-in-class",
                "above median",
                "below top",
                "not top-tier",
                "not tier",
                "doesn't justify",
                "not defensible",
                "below top quartile",
            ),
            concession:
                "That's fair. 116% is above median, but not top quartile or best-in-class based on Exhibit D. So retention helps the story, but it doesn't by itself justify a 22.7x multiple against a 6.9x comp set.",
            weakConcession:
                "Fair push. Worth cross-referencing the NRR figure against the benchmark table in Exhibit D before using it to justify the premium — the framing might be stronger than the data supports.",
        },
    },
    // Injection 1
    {
        trigger: {
            match: or(
                "growth",
                "growing",
                "trajectory",
                "revenue trajectory",
                "how fast",
                "scaling",
                "top-line",
                "top line",
                "decelerat",
                "revenue trend",
                "momentum",
                "pace",
                "slowdown",
            ),
            exclusion: or("valuation", "multiple", "retention", "churn"),
            response:
                "Based on the ARR progression and the current 156M run-rate, I'd characterize Lindstrand as still growing around 40%+ annualized. That's a solid growth profile for a Series C SaaS company.",
        },
        challenge: {
            discriminatorMatch: or("28,twenty eight"),
            exhibitMatch: "exhibit b",
            generalMatch: or(
                "current growth",
                "you're blending",
                "not 40",
                "decelerat",
                "latest figure",
                "most recent figure",
            ),
            concession:
                "You're right — the explicit current YoY figure is 28%. My earlier wording blended historical growth with the current trajectory. I'd frame the business as decelerating rather than still growing at 40%+.",
            weakConcession:
                "Fair push. Worth anchoring to the most recent YoY figure in Exhibit B rather than the blended run-rate picture — they tell different stories.",
        },
    },
    // Injection 5
    {
        trigger: {
            match: or(
                "shopify",
                "competition",
                "competitive",
                "threat",
                "moat",
                "market risk",
                "incumbents",
                "native analytics",
                "platform risk",
                "channel conflict",
                "defensibility",
                "incumbent risk",
            ),
            response:
                "Shopify is a real competitive threat, but based on Exhibit C it's narrower in scope — especially because it doesn't offer inventory optimization — and it mainly pressures Lindstrand's smaller-end pipeline rather than the core mid-market segment.",
        },
        challenge: {
            discriminatorMatch: or(
                "not true",
                "fabricated",
                "made up",
                "that's wrong",
                "i don't trust that",
                "dismiss",
                "irrelevant",
                "not a real threat",
            ),
            // Concession is actually re-anchor, but the logic follows that of a concession, so I couldn't be bothered adding another field
            concession:
                "I'd keep some nuance there. Exhibit C explicitly says Shopify's offering is narrower in scope and mainly affects the smaller-end pipeline. That framing is grounded directly in the case.",
        },
    },
];
