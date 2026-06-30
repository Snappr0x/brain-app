import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST add tag to note
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tagId } = await req.json()

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
      include: { tags: true },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
  }
}

// DELETE remove tag from note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tagId } = await req.json()

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: { tags: true },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
  }
}