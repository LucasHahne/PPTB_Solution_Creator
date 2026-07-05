import { cn } from "../cn";

export function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={cn("h-3.5 w-3.5 shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.439A3 3 0 0 0 8.379 4.5H7v-1Z"
        clipRule="evenodd"
      />
      <path d="M5 6.5A1.5 1.5 0 0 0 3.5 8v7A1.5 1.5 0 0 0 5 16.5h6.5A1.5 1.5 0 0 0 13 15V8a1.5 1.5 0 0 0-1.5-1.5H5Z" />
    </svg>
  );
}
