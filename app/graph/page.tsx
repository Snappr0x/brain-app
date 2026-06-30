'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const Graph = dynamic(() => import('@/app/components/Graph'), { ssr: false })

export default function GraphPage() {
  return (
    <div className="w-full h-screen bg-slate-900">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
          ← Retour
        </Link>
      </div>
      <Graph />
    </div>
  )
}