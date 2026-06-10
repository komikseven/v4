import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SeriesDetail } from "@/components/series-detail"

export default async function KomikPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <SeriesDetail slug={slug} />
      </main>
      <SiteFooter />
    </div>
  )
}
