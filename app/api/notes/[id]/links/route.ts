import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// POST add link to another note
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { toId } = await req.json()
    const fromId = parseInt(id)

    if (fromId === toId) {
      return NextResponse.json({ error: 'Cannot link note to itself' }, { status: 400 })
    }

    const link = await prisma.noteLink.create({
      data: { fromId, toId },
    })
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }
}

// DELETE remove link
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { toId } = await req.json()
    const fromId = parseInt(id)

    await prisma.noteLink.deleteMany({
      where: {
        OR: [
          { fromId, toId },
          { fromId: toId, toId: fromId },
        ],
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}