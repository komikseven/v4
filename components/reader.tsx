"use client"

import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { getChapter, getChaptersByCategory, type Chapter, proxyImage } from "@/lib/api"
import { ErrorState } from "@/components/states"
import { ChevronLeft, ChevronRight, List } from "lucide-react"

export function Reader({ id }: { id: number }) {
  const router = useRouter()
  const {
    data: chapter,
    error,
    isLoading,
    mutate,
  } = useSWR(["chapter", id], () => getChapter(id), { revalidateOnFocus: false })

  const categoryId = chapter?.categoryId ?? 0

  const { data: siblings } = useSWR(
    categoryId ? ["siblings", categoryId] : null,
    () => getChaptersByCategory(categoryId, 100),
    { revalidateOnFocus: false },
  )

  const { prev, next } = useMemo(() => {
    if (!chapter || !siblings) return { prev: null as Chapter | null, next: null as Chapter | null }
    // siblings come ordered desc by date; sort by chapter number ascending
    const sorted = [...siblings].sort(
      (a, b) => (Number.parseFloat(a.chapterNumber) || 0) - (Number.parseFloat(b.chapterNumber) || 0),
    )
    const idx = sorted.findIndex((c) => c.id === chapter.id)
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
    }
  }, [chapter, siblings])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mx-auto aspect-[3/4] w-full max-w-3xl animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (error || !chapter) {
    return <ErrorState message={error ? (error as Error).message : "Chapter tidak ditemukan"} onRetry={() => mutate()} />
  }

  const title = chapter.seriesTitle || chapter.title

  const NavBar = ({ sticky }: { sticky?: boolean }) => (
    <div
      className={
        sticky
          ? "sticky top-[57px] z-30 border-b border-border bg-card/95 backdrop-blur"
          : "border-t border-border bg-card"
      }
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={() => prev && router.push(`/baca/${prev.id}`)}
          disabled={!prev}
          className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <Link
          href={`/series/${chapter.categoryId}`}
          className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-90"
        >
          <List className="h-4 w-4" />
          Daftar Chapter
        </Link>
        <button
          onClick={() => next && router.push(`/baca/${next.id}`)}
          disabled={!next}
          className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center">
          <Link href={`/series/${chapter.categoryId}`} className="text-sm font-semibold text-primary hover:underline">
            {title}
          </Link>
          <h1 className="mt-1 text-lg font-bold text-card-foreground">Chapter {chapter.chapterNumber || "?"}</h1>
        </div>
      </div>

      <NavBar sticky />

      <div className="bg-background">
        <div className="mx-auto flex max-w-3xl flex-col">
          {chapter.images.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">Tidak ada gambar pada chapter ini.</p>
          ) : (
            chapter.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={proxyImage(src) || "/placeholder.svg"}
                alt={`${title} - halaman ${i + 1}`}
                loading="lazy"
                crossOrigin="anonymous"
                className="w-full"
              />
            ))
          )}
        </div>
      </div>

      <NavBar />
    </div>
  )
}
