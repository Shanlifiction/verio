import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef, useState, type SubmitEvent } from "react";

async function serverFetch(path: string, method: string, body?: any) {
    return fetch(`/server${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: body
            ? {
                  "Content-Type": "application/json",
              }
            : undefined,
    });
}

async function sendMessage(message: string) {
    const response = await serverFetch("/message", "POST", { message });

    return (await response.json()).response as Message;
}

async function createSession() {
    await serverFetch("/create-session", "POST");
}

async function getHistory() {
    const response = await serverFetch("/history", "GET");
    return response.json() as Promise<Message[]>;
}

interface Message {
    role: "user" | "assistant";
    content: { text: string }[];
}

function Message({ message }: { message: Message }) {
    const isUser = message.role == "user";

    const content = message.content.map(({ text }) => text).join("");

    return (
        <li className={isUser ? "ml-auto text-right" : ""}>
            <div>{isUser ? "You" : "FinRec"}</div>
            <div
                className={`${isUser ? "bg-zinc-50 text-zinc-900 rounded-tr-none" : "bg-zinc-700 rounded-tl-none"} px-4 py-2 rounded-lg`}>
                {content}
            </div>
        </li>
    );
}

await createSession();
const initialHistory = await getHistory();

export function App() {
    const [history, setHistory] = useState<Message[]>(initialHistory);
    const [message, setMessage] = useState("");
    const messageContainerRef = useRef<HTMLOListElement>(null);

    function scrollToBottom() {
        messageContainerRef.current?.scrollTo({
            top: messageContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    }

    async function handleMessage(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setHistory((previous) => [
            ...previous,
            { role: "user", content: [{ text: message }] },
        ]);

        setMessage("");

        const response = await sendMessage(message);

        setHistory((previous) => [...previous, response]);
    }

    useEffect(scrollToBottom, [history]);

    return (
        <div className="flex w-full h-screen bg-zinc-900 text-zinc-50 p-8 gap-8">
            <div className="grow bg-zinc-800 rounded-2xl border border-zinc-700 p-8"></div>
            <div className="max-w-lg w-full bg-zinc-800 rounded-2xl border border-zinc-700 p-8 flex flex-col gap-4">
                <ol
                    className="flex flex-col grow gap-2 overflow-scroll"
                    ref={messageContainerRef}>
                    {history.map((message, index) => (
                        <Message message={message} key={index} />
                    ))}
                </ol>
                <form onSubmit={handleMessage} className="flex flex-col">
                    <textarea
                        className="border border-zinc-600 rounded-lg focus:outline-none focus:border-zinc-200 p-4"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key == "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                (
                                    event.target as HTMLTextAreaElement
                                ).form?.requestSubmit();
                            }
                        }}
                    />
                    <button
                        type="submit"
                        className="bg-zinc-50 text-gray-900 rounded-lg mt-1 ml-auto font-medium pl-4 pr-3 py-2 flex items-center gap-1">
                        Send
                        <PaperAirplaneIcon className="size-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
