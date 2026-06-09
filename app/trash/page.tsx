"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";
import {
  getTrashedJourneys,
  permanentlyDeleteJourney,
  restoreJourney,
  revokeJourneyObjectUrls,
} from "@/lib/storage";
import { deriveTitle, formatDateRange } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import ConfirmModal from "@/components/ConfirmModal";

export default function TrashPage() {
  const router = useRouter();
  const [trashed, setTrashed] = useState<Journey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [actionError, setActionError] = useState("");

  // Restore state
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Permanent delete state
  const [permDeleteId, setPermDeleteId] = useState<string | null>(null);
  const [permDeleting, setPermDeleting] = useState(false);

  const loadTrashed = useCallback(() => {
    let loadedJourneys: Journey[] = [];
    void getTrashedJourneys()
      .then((found) => {
        loadedJourneys = found;
        setTrashed(found);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

    return () => {
      revokeJourneyObjectUrls(loadedJourneys);
    };
  }, []);

  useEffect(() => {
    const cleanup = loadTrashed();
    return cleanup;
  }, [loadTrashed]);

  const handleRestore = useCallback(
    async (id: string) => {
      setRestoringId(id);
      setActionError("");
      try {
        await restoreJourney(id);
        setTrashed((prev) => prev.filter((j) => j.id !== id));
      } catch {
        setActionError("Failed to restore this journey. Please try again.");
      } finally {
        setRestoringId(null);
      }
    },
    []
  );

  const handlePermanentDelete = useCallback(async () => {
    if (!permDeleteId) return;
    setPermDeleting(true);
    setActionError("");
    try {
      await permanentlyDeleteJourney(permDeleteId);
      setTrashed((prev) => prev.filter((j) => j.id !== permDeleteId));
      setPermDeleteId(null);
    } catch {
      setActionError(
        "Failed to permanently delete this journey. Please try again."
      );
    } finally {
      setPermDeleting(false);
    }
  }, [permDeleteId]);

  if (!loaded) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />

      <main className="mx-auto max-w-3xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          Trash
        </h1>
        <p className="mb-10 text-[15px] text-muted">
          Journeys in Trash are hidden from your homepage. Restore them or
          delete them permanently.
        </p>

        {actionError && (
          <p className="mb-6 text-sm text-red-600" role="alert">
            {actionError}
          </p>
        )}

        {trashed.length === 0 ? (
          <div className="rounded-panel bg-surface py-16 text-center">
            <p className="text-muted">Trash is empty.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-button border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-white"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trashed.map((journey) => {
              const title = deriveTitle(
                journey.title,
                journey.location,
                journey.startDate
              );
              const dateRange = formatDateRange(
                journey.startDate,
                journey.endDate
              );

              return (
                <div
                  key={journey.id}
                  className="flex flex-col gap-3 rounded-card border border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-foreground">
                      {title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-muted">
                      {dateRange && <span>{dateRange}</span>}
                      {journey.companions.length > 0 && (
                        <span>{journey.companions.join(", ")}</span>
                      )}
                      <span>{journey.photos.length} photos</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(journey.id)}
                      disabled={restoringId === journey.id}
                      className="rounded-button border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                    >
                      {restoringId === journey.id ? "Restoring…" : "Restore"}
                    </button>
                    <button
                      onClick={() => setPermDeleteId(journey.id)}
                      className="rounded-button border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        open={permDeleteId !== null}
        title="Delete Permanently"
        message="This will permanently remove this journey and all its photos from your browser storage. This action cannot be undone."
        confirmLabel={permDeleting ? "Deleting…" : "Delete Permanently"}
        confirmVariant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermDeleteId(null)}
      />
    </div>
  );
}
