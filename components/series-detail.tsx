"use client"

import useSWR from "swr"
import Link from "next/link"
import { getSeriesBySlug, getChaptersByCategory, type Chapter, formatDate, proxyImage } from "@/lib/api"
import { ErrorState } from "@/components/states"
import { ChevronRight, Clock, Layers } from "lucide-react"

export function SeriesDetail({ slug }: { slug: string }) {
  const { data: series, error: seriesError } = useSWR(
    ["series-slug", slug],
    () => getSeriesBySlug(slug),
    { revalidateOnFocus: false },
  )

  const {
    data: chapters,
    error: chaptersError,
    isLoading,
    mutate,
  } = useSWR(
    series ? ["chapters", series.id] : null,
    () => getChaptersByCategory(series!.id, 100),
    { revalidateOnFocus: false },
  )

  const list: Chapter[] = chapters ?? []
  const thumbnail = series?.thumbnail || list[0]?.thumbnail
  const error = seriesError || chaptersError

  return (
    <section>
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/series" className="hover:text-primary">Komik</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{series?.name ?? "..."}</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative h-48 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxyImage(thumbnail) || "/placeholder.svg"}
              alt={series?.name ?? "Series"}
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-muted" />
          )}
        </div>
        <div className="flex flex-col justify-center gap-2">
          <h1 className="text-balance text-xl font-bold text-card-foreground md:text-2xl">
            {series?.name ?? "Memuat..."}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
              <Layers className="h-3.5 w-3.5" />
              {series?.count ?? list.length} Chapter
            </span>
          </div>
          {series?.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{series.description}</p>
          ) : null}
        </div>
      </div>

      <div className="section-title mb-3">Daftar Chapter</div>

      {isLoading || !series ? (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 skeleton rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Belum ada chapter.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/baca/${c.id}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-primary/40 hover:shadow-sm"
            >
              <span className="font-medium text-card-foreground group-hover:text-primary">
                Chapter {c.chapterNumber || "?"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(c.date)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
