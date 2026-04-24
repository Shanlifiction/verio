import {
    MessageParam,
    TextBlockParam,
    Tool,
    ToolUseBlock,
} from "@anthropic-ai/sdk/resources";

import { Session } from "../sessions.js";

export async function grade<T>({
    session,
    system,
    messages,
    schema,
}: {
    session: Session;
    system: TextBlockParam[];
    messages: MessageParam[];
    schema: Tool.InputSchema;
}) {
    const response = await session.client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        cache_control: { type: "ephemeral" },
        system,
        messages,
        tools: [
            {
                name: "output",
                input_schema: schema,
            },
        ],
        tool_choice: { type: "tool", name: "output" },
    });

    const block = response.content.find(
        (block) => block.type == "tool_use" && block.name == "output",
    ) as ToolUseBlock;
    return (block?.input as T) ?? null;
}

export function populateUserPrompt(
    prompt: string,
    properties: Record<string, string>,
) {
    let result = prompt;

    for (const [property, value] of Object.entries(properties)) {
        result = result.replaceAll(`{${property}}`, value);
    }

    return result;
}
