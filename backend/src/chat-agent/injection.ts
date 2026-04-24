import { Message, Session } from "../sessions.js";
import { injectionTriggers, injections } from "./injections.js";

export interface MatchExpression {
    type: "and" | "or";
    values: Match[];
}

export type Match = MatchExpression | string;

export function and(...values: Match[]): MatchExpression {
    return { type: "and", values };
}

export function or(...values: Match[]): MatchExpression {
    return { type: "or", values };
}

export interface InjectionTrigger {
    match: Match;
    exclusion?: Match;
    response: string;
}

export interface InjectionChallenge {
    discriminatorMatch: Match;
    exhibitMatch?: Match;
    generalMatch?: Match;
    exclusion?: Match;
    concession: string;
    weakConcession?: string;
}

export interface InjectionReinforcement {
    match: Match;
    response: string;
}

export interface Injection {
    trigger: InjectionTrigger;
    challenge?: InjectionChallenge;
    reinforcement?: InjectionReinforcement;
}

export interface InjectionState {
    fired: boolean;
    concessionIssued: boolean;
    weakConcessionIssued: boolean;
    reinforcementIssued: boolean;
}

function match(prompt: string, expression: Match): boolean {
    if (expression === undefined) {
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
    type:
        | "injection-message"
        | "concession-message"
        | "weak-concession-message"
        | "reinforced-assistant-message";
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

        if (!injection.challenge) {
            continue;
        }

        if (
            injection.challenge.generalMatch &&
            !match(normalizedPrompt, injection.challenge.generalMatch)
        ) {
            continue;
        }

        if (
            match(normalizedPrompt, injection.challenge.discriminatorMatch) ||
            (unresolvedCount == 1 &&
                injection.challenge.exhibitMatch &&
                match(normalizedPrompt, injection.challenge.exhibitMatch))
        ) {
            injectionState.concessionIssued = true;

            return {
                message: {
                    role: "assistant",
                    content: [
                        {
                            type: "text",
                            text: injection.challenge.concession,
                        },
                    ],
                },
                index: i,
                type: "concession-message",
            };
        }

        if (
            !injection.challenge.generalMatch ||
            !injection.challenge.weakConcession
        ) {
            continue;
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
                        text: injection.challenge.weakConcession,
                    },
                ],
            },
            index: i,
            type: "weak-concession-message",
        };
    }

    if (match(normalizedPrompt, injectionTriggers)) {
        for (let i = 0; i < injections.length; i++) {
            const injection = injections[i];
            const injectionState = session.injectionState[i];

            if (injectionState.fired) {
                continue;
            }

            if (!match(normalizedPrompt, injection.trigger.match)) {
                continue;
            }

            if (
                injection.trigger.exclusion &&
                match(normalizedPrompt, injection.trigger.exclusion)
            ) {
                continue;
            }

            injectionState.fired = true;

            return {
                message: {
                    role: "assistant",
                    content: [
                        { type: "text", text: injection.trigger.response },
                    ],
                },
                index: i,
                type: "injection-message",
            };
        }
    }

    for (let i = 0; i < injections.length; i++) {
        const injection = injections[i];
        const injectionState = session.injectionState[i];

        if (injectionState.reinforcementIssued) {
            continue;
        }

        if (!injection.reinforcement) {
            continue;
        }

        if (
            injectionState.concessionIssued ||
            injectionState.weakConcessionIssued
        ) {
            continue;
        }

        if (!match(normalizedPrompt, injection.reinforcement.match)) {
            continue;
        }

        injectionState.reinforcementIssued = true;

        return {
            message: {
                role: "assistant",
                content: [
                    { type: "text", text: `\n\n${injection.trigger.response}` },
                ],
            },
            index: i,
            type: "reinforced-assistant-message",
        };
    }

    return null;
}
