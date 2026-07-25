"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FolderPlus, Plus } from "lucide-react";
import {
  createCollection,
  deleteCollection,
  fetchCollections,
  type LibraryCollection,
} from "@/lib/learn/collections";
import type { LibraryBook } from "@/lib/learn/types";
import { haptic } from "@/lib/finance/haptics";

export function CollectionsList({ books }: { books: LibraryBook[] }) {
  const [collections, setCollections] = useState<LibraryCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setCollections(await fetchCollections());
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate() {
    const name = window.prompt("Collection name");
    if (!name?.trim()) return;
    const row = await createCollection(name.trim());
    if (row) {
      haptic("success");
      await reload();
    }
  }

  if (loading) return null;
  if (collections.length === 0) {
    return (
      <section className="ln-collections">
        <button type="button" className="ln-collections-empty" onClick={() => void handleCreate()}>
          <FolderPlus size={18} />
          Create a reading list
        </button>
      </section>
    );
  }

  return (
    <section className="ln-collections" aria-label="Reading lists">
      <div className="ln-collections-head">
        <h3>Reading lists</h3>
        <button type="button" aria-label="New list" onClick={() => void handleCreate()}>
          <Plus size={18} />
        </button>
      </div>
      <div className="ln-collections-grid">
        {collections.map((c) => {
          const count = c.book_ids.length;
          const firstBook = books.find((b) => b.id === c.book_ids[0]);
          return (
            <article key={c.id} className="ln-collection-card" style={{ borderColor: c.cover_color }}>
              <h4>{c.name}</h4>
              <p>{count} book{count === 1 ? "" : "s"}</p>
              {firstBook && (
                <Link href={`/learn/${firstBook.id}`} onClick={() => haptic("light")}>
                  Open {firstBook.title}
                </Link>
              )}
              <button
                type="button"
                className="ln-collection-delete"
                onClick={() => {
                  if (window.confirm(`Delete "${c.name}"?`)) void deleteCollection(c.id).then(reload);
                }}
              >
                Delete
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
