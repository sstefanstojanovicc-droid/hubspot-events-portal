"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import {
  clearSidebarLogoAction,
  saveSidebarLogoAction,
  type BrandingActionState,
} from "@/src/lib/platform/actions/branding-actions";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

interface BrandingLogoFormProps {
  initialSrc: string | null;
}

export function BrandingLogoForm({ initialSrc }: BrandingLogoFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialSrc);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = useCallback(async (file: File | undefined) => {
    setError(null);
    if (!file || file.size === 0) return;
    if (file.size > 350_000) {
      setError("File too large (max ~350KB).");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreview(dataUrl);
      const fd = new FormData();
      fd.set("dataUrl", dataUrl);
      startTransition(async () => {
        const res: BrandingActionState = await saveSidebarLogoAction(undefined, fd);
        if (!res.ok) {
          setError(res.message);
        }
      });
    } catch {
      setError("Could not read file.");
    }
  }, []);

  const onClear = useCallback(() => {
    setError(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(async () => {
      const res = await clearSidebarLogoAction();
      if (!res.ok) setError(res.message);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-full max-w-[200px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-2">
          {preview ? (
            <img src={preview} alt="" className="max-h-20 w-auto max-w-full object-contain" />
          ) : (
            <span className="text-center text-xs text-slate-400">No logo</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-hub-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-hub-ink hover:file:bg-orange-100"
            onChange={(e) => void onFile(e.target.files?.[0])}
            disabled={pending}
          />
          {preview ? (
            <button
              type="button"
              onClick={onClear}
              disabled={pending}
              className="w-fit text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
            >
              Remove logo
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {pending ? <p className="text-xs text-slate-500">Saving…</p> : null}
    </div>
  );
}
