import { Message, Session } from "../sessions.js";
import { injectionTriggers, injections } from "./injections.js";

export interface MatchExpression {
    type: "and" | "or";
    values: Match[];
}

export type Match = MatchExpression | string | null;

export function and(...values: Match[]): MatchExpression {
    return { type: "and", values };
}

export function or(...values: Match[]): MatchExpression {
    return { type: "or", values };
}

export interface Injection {
    matches: Match;
    antiMatches: Match;
    challengeMatches: Match;
    exhibitChallengeMatches: Match;
    weakChallengeMatches: Match;
    response: string;
    concessionResponse: string;
    weakConcessionResponse: string;
}

export interface InjectionState {
    fired: boolean;
    concessionIssued: boolean;
    weakConcessionIssued: boolean;
}

function match(prompt: string, expression: Match): boolean {
    if (expression === null) {
        return true;
    }

    if (typeof expression == "string") {
        return prompt.includes(expression);
    }

    if (expression.type == "and") {
        return expression.values.every((value) => match(prompt, value));
    }

    if (expression.type == "or") {
        return expression.values.some((value) => match(prompt, value));
    }

    return false;
}

export interface InjectionResult {
    message: Message;
    index: number;
    isConcession: boolean;
    isWeak: boolean;
}

export function inject(
    session: Session,
    prompt: string,
): InjectionResult | null {
    const normalizedPrompt = prompt.toLowerCase().trim();

    const unresolved = session.injectionState.map(
        (state) => state.fired && !state.concessionIssued,
    );
    const unresolvedCount = unresolved.filter((state) => state).length;

    for (let i = 0; i < injections.length; i++) {
        if (!unresolved[i]) {
            continue;
        }

        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (!match(normalizedPrompt, injection.weakChallengeMatches)) {
            continue;
        }

        if (
            match(normalizedPrompt, injection.challengeMatches) ||
            (unresolvedCount == 1 &&
                match(normalizedPrompt, injection.exhibitChallengeMatches))
        ) {
            injectionState.concessionIssued = true;

            return {
                message: {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: injection.concessionResponse,
                        },
                    ],
                },
                index: i,
                isConcession: true,
                isWeak: false,
            };
        }

        if (unresolvedCount > 1) {
            continue;
        }

        if (injectionState.weakConcessionIssued) {
            continue;
        }

        injectionState.weakConcessionIssued = true;

        return {
            message: {
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: injection.weakConcessionResponse,
                    },
                ],
            },
            index: i,
            isConcession: true,
            isWeak: true,
        };
    }

    if (!match(normalizedPrompt, injectionTriggers)) {
        return null;
    }

    for (let i = 0; i < injections.length; i++) {
        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (injectionState.fired) {
            continue;
        }

        if (!match(normalizedPrompt, injection.matches)) {
            continue;
        }

        if (match(normalizedPrompt, injection.antiMatches)) {
            continue;
        }

        injectionState.fired = true;

        return {
            message: {
                role: "assistant",
                content: [{ type: "text", text: injection.response }],
            },
            index: i,
            isConcession: false,
            isWeak: false,
        };
    }

    return null;
}
