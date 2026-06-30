'use client'

import { useEffect, useRef, useState } from 'react'

interface GraphData {
  nodes: { id: string; name: string; val: number; color: string }[]
  links: { source: string; target: string }[]
}

interface Node3D {
  id: string
  name: string
  x: number
  y: number
  z: number
  color: string
}

interface NoteContent {
  id: string
  title: string
  content: string
}

export default function Graph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node3D[]>([])
  const [links, setLinks] = useState<GraphData['links']>([])
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<NoteContent | null>(null)
  const rotation = useRef({ x: 0, y: 0 })
  const mouseDown = useRef(false)
  const mouseDelta = useRef({ x: 0, y: 0 })
  const projectedNodesRef = useRef<any[]>([])

  useEffect(() => {
    const fetchGraph = async () => {
      const res = await fetch('/api/graph')
      const data: GraphData = await res.json()
      setLinks(data.links)

      const newNodes: Node3D[] = data.nodes.map((node, i) => {
        const theta = Math.acos((2 * i) / data.nodes.length - 1)
        const phi = Math.sqrt(data.nodes.length * Math.PI) * theta
        const radius = 200

        return {
          id: node.id,
          name: node.name,
          x: radius * Math.sin(theta) * Math.cos(phi),
          y: radius * Math.sin(theta) * Math.sin(phi),
          z: radius * Math.cos(theta),
          color: node.color,
        }
      })
      setNodes(newNodes)
    }
    fetchGraph()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let animationId: number
    let currentRotation = rotation.current

    const rotateX = (point: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
      }
    }

    const rotateY = (point: { x: number; y: number; z: number }, angle: number) => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return {
        x: point.x * cos + point.z * sin,
        y: point.y,
        z: -point.x * sin + point.z * cos,
      }
    }

    const project = (point: { x: number; y: number; z: number }) => {
      const scale = 600 / (point.z + 400)
      return {
        x: point.x * scale + canvas.width / 2,
        y: point.y * scale + canvas.height / 2,
        scale,
      }
    }

    const animate = () => {
      currentRotation.x += mouseDelta.current.y * 0.005
      currentRotation.y += mouseDelta.current.x * 0.005
      mouseDelta.current = { x: 0, y: 0 }

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const projectedNodes = nodes.map((node) => {
        let point = { x: node.x, y: node.y, z: node.z }
        point = rotateX(point, currentRotation.x)
        point = rotateY(point, currentRotation.y)
        const proj = project(point)
        return { ...proj, id: node.id, name: node.name, color: node.color, z: point.z }
      })

      projectedNodesRef.current = projectedNodes

      projectedNodes.sort((a, b) => a.z - b.z)

      // Draw links
      ctx.strokeStyle = '#334155'
      ctx.lineWidth = 1
      links.forEach((link) => {
        const source = projectedNodes.find((n) => n.id === link.source)
        const target = projectedNodes.find((n) => n.id === link.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })

      // Draw nodes (Obsidian style)
projectedNodes.forEach((node) => {
  const isHovered = hoveredNodeId === node.id
  const size = isHovered ? 37 : 27

  // Glow effect
  if (isHovered) {
    ctx.shadowColor = node.color
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // Circle background
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'

  // Border
  ctx.strokeStyle = node.color
  ctx.lineWidth = isHovered ? 2.5 : 1.5
  ctx.stroke()

  // Text (affiche seulement au hover)
  if (isHovered) {
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.name.substring(0, 12), node.x, node.y)
  }
})

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseDown.current) {
        mouseDelta.current.x = e.movementX
        mouseDelta.current.y = e.movementY
      }

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const closest = projectedNodesRef.current.find((n) => {
        const dx = n.x - x
        const dy = n.y - y
        return Math.sqrt(dx * dx + dy * dy) < 25
      })

      setHoveredNodeId(closest?.id || null)
      canvas.style.cursor = closest ? 'pointer' : 'grab'
    }

    const handleMouseDown = () => {
      mouseDown.current = true
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseUp = () => {
      mouseDown.current = false
      canvas.style.cursor = 'grab'
    }

    const handleClick = (e: MouseEvent) => {
      if (mouseDown.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const clicked = projectedNodesRef.current.find((n) => {
        const dx = n.x - x
        const dy = n.y - y
        return Math.sqrt(dx * dx + dy * dy) < 25
      })

      if (clicked) {
        fetchNoteContent(clicked.id)
      }
    }

    const fetchNoteContent = async (noteId: string) => {
      const res = await fetch(`/api/notes/${noteId}`)
      const note = await res.json()
      setSelectedNote(note)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('click', handleClick)
    }
  }, [nodes, links, hoveredNodeId])

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
          ← Retour
        </a>
      </div>

      {/* Info */}
      <div className="absolute bottom-4 left-4 text-slate-400 text-sm">
        <p>Drag : tourner | Click : voir contenu</p>
      </div>

      {/* Modal note */}
      {selectedNote && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-slate-800 p-8 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">{selectedNote.title}</h2>
            <p className="text-slate-300 mb-6">{selectedNote.content}</p>
            <button
              onClick={() => setSelectedNote(null)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}