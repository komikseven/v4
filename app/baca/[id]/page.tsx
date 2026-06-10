import { SiteHeader } from "@/components/site-header"
import { Reader } from "@/components/reader"

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Reader id={Number(id)} />
      </main>
    </div>
  )
}
