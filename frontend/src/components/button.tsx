import type { ComponentProps } from "react";

export function Button({
    className = "",
    type = "button",
    ...props
}: ComponentProps<"button">) {
    return (
        <button
            type={type}
            className={`${className} bg-lime-200 hover:bg-lime-100 transition-colors text-stone-900 rounded-lg font-medium px-4 py-2 flex items-center gap-1 cursor-pointer`}
            {...props}
        />
    );
}
