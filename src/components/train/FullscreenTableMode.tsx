import { type ReactNode, useEffect } from "react";

export default function FullscreenTableMode({
  active,
  onExit,
  children
}: {
  active: boolean;
  onExit: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!active) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onExit]);

  if (!active) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col gap-3 overflow-y-auto bg-[#f6f9f2] p-4">
      {children}
    </div>
  );
}
