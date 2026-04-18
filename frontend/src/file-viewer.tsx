import { useEffect, useState } from "react";

import { Markdown } from "./markdown";
import { setActiveTab } from "./server";

export interface File {
    filename: string;
    content: string;
}

export function FileViewer({ files }: { files: File[] }) {
    const [activeFile, setActiveFile] = useState<number>(0);

    useEffect(() => {
        setActiveTab(activeFile);
    }, [activeFile]);

    return (
        <div className="grow flex flex-col gap-2">
            <ul className="flex gap-2">
                {files.map(({ filename }, index) => (
                    <li key={filename}>
                        <button
                            onClick={() => setActiveFile(index)}
                            className={`${index == activeFile ? "bg-zinc-600" : "bg-zinc-800"} px-2 py-1 rounded`}>
                            {filename}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8 grow overflow-auto">
                <Markdown>{files[activeFile]?.content}</Markdown>
            </div>
        </div>
    );
}
