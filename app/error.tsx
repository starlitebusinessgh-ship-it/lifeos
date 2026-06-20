"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#FAFAF9] px-5 py-16">
      <h1 className="text-2xl font-semibold text-[#1C1C1E]">
        Something went wrong
      </h1>
      <p className="mt-2 text-center text-[15px] text-[#1C1C1E99]">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[16px] bg-[#5B6EE8] px-5 py-3 text-[15px] font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/today"
          className="rounded-[16px] bg-[#F0F0F2] px-5 py-3 text-[15px] font-semibold text-[#1C1C1E]"
        >
          Go to Today
        </Link>
      </div>
    </div>
  );
}
