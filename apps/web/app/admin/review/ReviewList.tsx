"use client";

import { useState, useTransition } from "react";
import type { ContentItemRow } from "@/types";
import { approveContent, rejectContent, needsChangesContent } from "./actions";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import UpdateContentPanel from "./UpdateContentPanel";

interface ReviewListProps {
  initialDrafts: ContentItemRow[];
}

export default function ReviewList({ initialDrafts }: ReviewListProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<ContentItemRow[]>(initialDrafts);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveContent(id);
      if (result.error) {
        toast.error(`Approval failed: ${result.error}`);
      } else {
        toast.success("Draft approved and published successfully!");
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectContent(id);
      if (result.error) {
        toast.error(`Rejection failed: ${result.error}`);
      } else {
        toast.success("Draft marked as rejected.");
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    });
  };

  const handleNeedsChanges = (id: string) => {
    const noteText = notes[id] || "";
    if (!noteText.trim()) {
      toast.warning("Please enter review feedback notes first.");
      return;
    }

    startTransition(async () => {
      const result = await needsChangesContent(id, noteText);
      if (result.error) {
        toast.error(`Failed to update status: ${result.error}`);
      } else {
        toast.info("Feedback submitted. Item remains in drafts with review notes.");
        setDrafts((prev) => prev.filter((d) => d.id !== id));
        setActiveNotesId(null);
      }
    });
  };

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-white/10 bg-zinc-900/30 p-12 rounded-xl text-center">
        <span className="text-4xl mb-4" role="img" aria-label="party popper">🎉</span>
        <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase text-white">
          Inbox Zero!
        </h3>
        <p className="text-sm text-white/45 mt-2 max-w-md">
          There are no content drafts waiting for review. Use the ingest script to fetch more releases from IGDB.
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/55">
            Showing <span className="text-white font-bold">{drafts.length}</span> pending drafts
          </p>
        </div>

        <div className="grid gap-6">
          {drafts.map((draft) => {
            const isEditingNotes = activeNotesId === draft.id;
            const isEditing = editingId === draft.id;

            // ── Edit mode: full-width UpdateContentPanel ──
            if (isEditing) {
              return (
                <UpdateContentPanel
                  key={draft.id}
                  draft={draft}
                  onSaved={(updated) => {
                    setDrafts((prev) =>
                      prev.map((d) => (d.id === updated.id ? updated : d))
                    );
                  }}
                  onPublished={(id) => {
                    setDrafts((prev) => prev.filter((d) => d.id !== id));
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            // ── Review mode: existing card ──
            return (
              <div
                key={draft.id}
                className="border border-white/10 bg-zinc-900/40 hover:border-white/20 transition duration-300 rounded-xl overflow-hidden backdrop-blur-md flex flex-col md:flex-row gap-6 p-5 relative"
              >
                {/* Status indicator */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] border border-orange-500/25 bg-orange-500/10 text-orange-200 px-2 py-0.5 rounded">
                    {draft.status}
                  </span>
                  {draft.review_notes && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] border border-amber-500/25 bg-amber-500/10 text-amber-200 px-2 py-0.5 rounded">
                      Needs Changes
                    </span>
                  )}
                </div>

                {/* Thumbnail image */}
                <div className="w-full md:w-32 h-44 md:h-auto shrink-0 relative bg-zinc-950 rounded-lg overflow-hidden border border-white/5">
                  {draft.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.cover_url}
                      alt={draft.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/20 uppercase font-[family-name:var(--font-barlow-condensed)]">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content details */}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-barlow-condensed)] text-2xl font-extrabold uppercase leading-none tracking-tight text-white mb-2">
                      {draft.title}
                    </h3>

                    {draft.release_date && (
                      <p className="text-xs text-orange-300 font-semibold mb-3">
                        Release Date: {new Date(draft.release_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {draft.platforms.map((platform) => (
                        <span key={platform} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/70">
                          {platform}
                        </span>
                      ))}
                      {draft.genres.map((genre) => (
                        <span key={genre} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50">
                          {genre}
                        </span>
                      ))}
                    </div>

                    {draft.summary && (
                      <p className="text-sm leading-6 text-white/60 line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-pointer">
                        {draft.summary}
                      </p>
                    )}

                    {/* Existing review notes if any */}
                    {draft.review_notes && (
                      <div className="mt-3 border border-amber-500/25 bg-amber-500/5 p-3 rounded text-xs text-amber-200">
                        <span className="font-bold">Prior Feedback:</span> {draft.review_notes}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-4 mt-auto">
                    <div className="text-[11px] text-white/35 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Source: <span className="text-white/60 uppercase">{draft.source}</span></span>
                      <span>Source ID: <span className="text-white/60">{draft.source_id}</span></span>
                      {draft.external_url && (
                        <a
                          href={draft.external_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-orange-400 hover:text-orange-300 underline"
                        >
                          View External Link
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleReject(draft.id)}
                        disabled={isPending}
                        className="min-h-9 border border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-500 hover:text-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setActiveNotesId(isEditingNotes ? null : draft.id);
                        }}
                        disabled={isPending}
                        className={`min-h-9 border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 ${
                          isEditingNotes
                            ? "border-amber-400 bg-amber-400 text-zinc-950"
                            : "border-white/20 text-white/80 hover:bg-white/5"
                        }`}
                      >
                        {isEditingNotes ? "Cancel" : "Needs Changes"}
                      </button>
                      {/* ── NEW: Edit button ── */}
                      <button
                        onClick={() => {
                          setActiveNotesId(null);
                          setEditingId(draft.id);
                        }}
                        disabled={isPending}
                        className="min-h-9 border border-sky-500/30 bg-sky-950/20 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleApprove(draft.id)}
                        disabled={isPending}
                        className="min-h-9 border border-emerald-500/30 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-500 hover:text-white px-4 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:opacity-50"
                      >
                        Approve & Publish
                      </button>
                    </div>
                  </div>

                  {/* Needs changes feedback form */}
                  {isEditingNotes && (
                    <div className="border border-amber-500/25 bg-amber-500/5 p-4 rounded-xl flex flex-col gap-3 mt-3">
                      <label className="text-xs text-amber-200 font-bold uppercase tracking-wider">
                        Review Feedback Notes
                      </label>
                      <textarea
                        value={notes[draft.id] || ""}
                        onChange={(e) => {
                          setNotes((prev) => ({
                            ...prev,
                            [draft.id]: e.target.value,
                          }));
                        }}
                        placeholder="Explain what changes are needed (e.g. adjust title, date, add tags)..."
                        rows={2}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleNeedsChanges(draft.id)}
                          disabled={isPending}
                          className="border border-amber-400 bg-amber-400/10 text-amber-200 hover:bg-amber-400 hover:text-zinc-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded disabled:opacity-50"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
