# Verio TODO before final

## Must have

- [x] Add all documented injections, and implement edge cases
- [x] Finish memo grading agent
- [ ] Add behavioral agent (for Adam)
- [ ] Add verdict agent (for Adam)
- [x] Complete the flow from creating to finishing a session

## Should have

- [ ] Mock dashboard for collecting test results
- [ ] Save results to database

## Nice to have

- [ ] Light/dark mode switch

## Behavioral and verdict details (for Adam)

A basic structure has been created in /backend/src/grading/(behavior|verdict).ts

These are the only TypeScript files that should have to be changed. With the possible exception of feeding the grading functions additional data from /backend/src/grading/report.ts.

Unprocessed agent prompts exist in /backend/files/grading_agents/. The prompts may also have to be reviewed for inaccuracies related to the spec deviations.

The processed agent prompts should be placed in /backend/src/system-prompts/.

You can use the memo grading agent as a reference for the available utilities, settings, structure, etc.

Some notable changes from the spec:

- Properties use camelCase instead of snake_case.
- Enums use kebab-case instead of snake_case.
- Agent output is handled via Claude json schema tools, instead of requesting it in the prompt.
- Injection ids have been replaced with indices in the injection array. They are also ordered according to their priority, so index 0 != id 1.
- Many smaller changes, to reduce redundancy and simplify logic.