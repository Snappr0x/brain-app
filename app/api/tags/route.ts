import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET all tags
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { label: 'asc' },
    })
    return NextResponse.json(tags)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST create tag
export async function POST(req: NextRequest) {
  try {
    const { label } = await req.json()
    
    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Label required' }, { status: 400 })
    }

    const tag = await prisma.tag.upsert({
      where: { label: label.toLowerCase() },
      update: {},
      create: { label: label.toLowerCase() },
    })
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}