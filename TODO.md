# Verio TODO before final

## Must have

- [x] Add all documented injections, and implement edge cases
- [ ] Finish memo grading agent
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

Unprocessed agent prompts exist in /backend/files/grading_agents/. I say unprocessed because the output schema needs to be stripped of redundant parts, converted to a proper tool schema, and converted to camelCase. The prompts may also have to be reviewed for inaccuracies related to the changes made.

You can use the memo grading agent as a reference for the available utilities, settings, structure, etc.