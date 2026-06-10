"use client"

import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getChapter,
  getSeries,
  getChaptersByCategory,
  getSeriesGenres,
  type Chapter,
  type Series,
  formatDate,
  proxyImage,
} from "@/lib/api"
import { useFavorites } from "@/lib/storage"
import { ErrorState } from "@/components/states"
import {
  Heart,
  ChevronRight,
  Clock,
  BookOpen,
  Star,
  Tag,
} from "lucide-react"

/** Load from a chapter ID, resolve the series, then show full detail. */
export function ComikDetail({ chapterId }: { chapterId: number }) {
  const router = useRouter()

  // 1️⃣ Fetch the chapter to get seriesId / categoryId
  const { data: chapter, error: chapterError } = useSWR(
    ["chapter", chapterId],
    () => getChapter(chapterId),
    { revalidateOnFocus: false },
  )

  const seriesId = chapter?.categoryId ?? chapter?.seriesId ?? 0

  // 2️⃣ Fetch the series info
  const { data: series, error: seriesError } = useSWR(
    seriesId ? ["series", seriesId] : null,
    () => getSeries(seriesId),
    { revalidateOnFocus: false },
  )

  // 3️⃣ Fetch chapter list for this series
  const { data: chapters, error: chaptersError, isLoading } = useSWR(
    seriesId ? ["chapters", seriesId] : null,
    () => getChaptersByCategory(seriesId, 100),
    { revalidateOnFocus: false },
  )

  // 4️⃣ Fetch genres
  const { data: genres } = useSWR(
    seriesId ? ["series-genres", seriesId] : null,
    () => getSeriesGenres(seriesId),
    { revalidateOnFocus: false, revalidateIfStale: false },
  )

  const list: Chapter[] = chapters ?? []
  const thumbnail = series?.thumbnail || list[0]?.thumbnail || chapter?.thumbnail

  // Favorites
  const { isFavorite, toggleFavorite, ready: favReady } = useFavorites()
  const bookmarked = favReady && series ? isFavorite(series.id) : false

  function onToggleFav(e: React.MouseEvent) {
    e.preventDefault()
    if (!series) return
    toggleFavorite({
      id: series.id,
      name: series.name,
      slug: series.slug,
      thumbnail,
      count: series.count,
    })
  }

  const error = chapterError || seriesError || chaptersError

  if (error && !series && !chapter) {
    return (
      <ErrorState
        message={(error as Error).message || "Gagal memuat detail komik"}
        onRetry={() => router.refresh()}
      />
    )
  }

  const isLoadingSeries = !chapter || !series

  return (
    <section className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{series?.name ?? "Detail Komik"}</span>
      </nav>

      {/* ── Hero Card ─────────────────────────────── */}
      {isLoadingSeries ? (
        <HeroSkeleton />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Banner background blur */}
          <div className="relative h-36 overflow-hidden">
            {thumbnail && (
              <img
                src={proxyImage(thumbnail)}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-40"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/95" />
            {/* Report bug pill */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              <span>🐛</span>
              <span className="font-medium">Lapor Bug dan Saran</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-70" />
            </div>
          </div>

          <div className="relative px-4 pb-5">
            {/* Cover + title row */}
            <div className="flex gap-4 -mt-16">
              {/* Cover image */}
              <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-card shadow-lg bg-muted">
                {thumbnail ? (
                  <img
                    src={proxyImage(thumbnail)}
                    alt={series?.name}
                    crossOrigin="anonymous"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-muted" />
                )}
              </div>

              {/* Title + genre badges */}
              <div className="flex flex-1 flex-col justify-end gap-1.5 min-w-0 pt-4">
                <h1 className="text-balance text-base font-bold leading-snug text-foreground md:text-xl line-clamp-2">
                  {series?.name ?? "Memuat..."}
                </h1>
                <div className="flex flex-wrap gap-1">
                  {genres && genres.length > 0 ? (
                    genres.slice(0, 4).map((g) => (
                      <Link
                        key={g.id}
                        href={`/genre/${g.slug}`}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {g.name}
                      </Link>
                    ))
                  ) : (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">Manga</span>
                  )}
                </div>
              </div>

              {/* Favorite / Love button */}
              <button
                type="button"
                onClick={onToggleFav}
                aria-label={bookmarked ? "Hapus dari favorit" : "Tambah ke favorit"}
                aria-pressed={bookmarked}
                className={`mt-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
                  bookmarked
                    ? "bg-rose-500 text-white shadow-rose-200"
                    : "bg-card border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-300"
                }`}
              >
                <Heart
                  className={`h-5 w-5 transition-all ${bookmarked ? "fill-white" : ""}`}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: <Star className="h-4 w-4 text-yellow-400" />, label: "Rating", value: "7.00" },
                { icon: <Clock className="h-4 w-4 text-primary" />, label: "Status", value: "Ongoing" },
                { icon: <BookOpen className="h-4 w-4 text-muted-foreground" />, label: "Chapter", value: `${series?.count ?? list.length}` },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-3 px-2 text-center border border-border">
                  {s.icon}
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  <span className="text-sm font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Sinopsis */}
            {series?.description && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Sinopsis</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {series.description}
                </p>
              </div>
            )}

            {/* All genres */}
            {genres && genres.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Genre</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/genre/${g.slug}`}
                      className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Read button */}
            {list.length > 0 && (
              <Link
                href={`/baca/${list[list.length - 1]?.id}`}
                className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3 text-sm rounded-xl"
              >
                <BookOpen className="h-4 w-4" />
                Baca Chapter 1
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Chapter List ──────────────────────────── */}
      <div>
        <div className="section-title mb-3">Daftar Chapter</div>

        {isLoading || !series ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 skeleton rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Belum ada chapter.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((c) => (
              <ChapterRow key={c.id} chapter={c} isActive={c.id === chapterId} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ChapterRow({ chapter, isActive }: { chapter: Chapter; isActive: boolean }) {
  return (
    <Link
      href={`/baca/${chapter.id}`}
      className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-all hover:shadow-sm ${
        isActive
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isActive && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        <span className={`font-medium text-sm ${isActive ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
          Chapter {chapter.chapterNumber || "?"}
        </span>
      </div>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3.5 w-3.5" />
        {formatDate(chapter.date)}
      </span>
    </Link>
  )
}

function HeroSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="skeleton h-36 w-full" />
      <div className="px-4 pb-5">
        <div className="flex gap-4 -mt-16">
          <div className="skeleton h-32 w-24 rounded-xl shrink-0 border-2 border-card" />
          <div className="flex flex-1 flex-col justify-end gap-2 pt-4">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="skeleton mt-auto h-10 w-10 rounded-full shrink-0" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
        <div className="mt-4 skeleton h-20 rounded-xl" />
        <div className="mt-4 skeleton h-12 rounded-xl" />
      </div>
    </div>
  )
}
