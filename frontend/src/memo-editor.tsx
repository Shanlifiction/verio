import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    InsertTable,
    ListsToggle,
    MDXEditor,
    Separator,
    UndoRedo,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    tablePlugin,
    toolbarPlugin,
} from "@mdxeditor/editor";
import { finish, pasteEvent } from "./server";
import { useEffect, useRef, useState } from "react";

export function MemoEditor() {
    const [value, setValue] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handlePaste(event: ClipboardEvent) {
            if (!ref.current?.contains(event.target as Element)) {
                return;
            }

            const wordCount = event.clipboardData
                ?.getData("text/plain")
                .split(" ").length;

            if (!wordCount) {
                return;
            }

            pasteEvent(wordCount);
        }

        addEventListener("paste", handlePaste);

        return () => removeEventListener("paste", handlePaste);
    }, []);

    return (
        <div className="contents" ref={ref}>
            <MDXEditor
                className="dark grow overflow-hidden flex flex-col"
                markdown=""
                onChange={setValue}
                contentEditableClassName="h-full overflow-auto"
                plugins={[
                    toolbarPlugin({
                        toolbarContents: () => (
                            <div className="h-full flex">
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <Separator />
                                <ListsToggle />
                                <Separator />
                                <BlockTypeSelect />
                                <Separator />
                                <InsertTable />
                            </div>
                        ),
                    }),
                    tablePlugin(),
                    headingsPlugin(),
                    quotePlugin(),
                    listsPlugin(),
                ]}
            />
            <button type="button" onClick={() => finish(value)}>
                Finish
            </button>
        </div>
    );
}
