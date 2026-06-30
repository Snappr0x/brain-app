import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      include: { tags: true, linksFrom: true, linksTo: true },
    })

    const tagColors: { [key: string]: string } = {}
    const colors = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6']
    let colorIndex = 0

    const nodes = notes.map((note) => {
      let color = '#4f46e5'
      if (note.tags.length > 0) {
        const tagLabel = note.tags[0].label
        if (!tagColors[tagLabel]) {
          tagColors[tagLabel] = colors[colorIndex % colors.length]
          colorIndex++
        }
        color = tagColors[tagLabel]
      }

      return {
        id: note.id.toString(),
        name: note.title,
        val: 10,
        color,
      }
    })

    const links = []
    for (const note of notes) {
      note.linksFrom.forEach((link) => {
        links.push({
          source: note.id.toString(),
          target: link.toId.toString(),
        })
      })
    }

    return NextResponse.json({ nodes, links })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 })
  }
}