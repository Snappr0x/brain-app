import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET single note
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
      include: { tags: true },
    })
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

// PUT update note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, content } = await req.json()
    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: { title, content },
      include: { tags: true },
    })
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.note.delete({
      where: { id: parseInt(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}