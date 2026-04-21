import { readFileSync } from "node:fs";

export function loadSystemPrompt(name: string) {
    return readFileSync(
        `${process.cwd()}/src/system-prompts/${name}.md`,
        "utf-8",
    );
}
