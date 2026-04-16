import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink } from 'd3-force'
import { useLorekeeperState } from '../hooks/useLorekeeperState'
import { loadMapAssets, getCharacterArchetype, getLandmarkType } from '../utils/mapImages'

// ─── Layout constants ──────────────────────────────────────────────────────

const MAP_W = 1400
const MAP_H = 900
const CHAR_SIZE = 72
const LANDMARK_SIZE = 110
const PARCHMENT_BG    = '#f0e6ce'
const PARCHMENT_LINES = '#d9c9a0'

const AURA_COLORS = {
  monster:  '#7f1d1d',
  antihero: '#6b21a8',
  master:   '#b45309',
  scholar:  '#1d4ed8',
  hero:     '#f59e0b',
  warrior:  '#dc2626',
  creature: '#15803d',
  person:   '#78716c',
}

// ─── Helpers ───────────────────────────────────────────────────────────────



function touchDist(t1, t2) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function touchCenter(t1, t2) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

// ─── Component ────────────────────────────────────────────────────────────

export function WisdomMap() {
  const { archive, books, entries } = useLorekeeperState()
  const [assets, setAssets]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [selectedBook, setSelectedBook]   = useState('all')
  const [showConnections, setShowConnections] = useState(true)
  const [focusedNode, setFocusedNode] = useState(null)
  const svgRef    = useRef(null)
  const vpRef     = useRef({ x: 0, y: 0, scale: 1 })       // source of truth
  const [vp, setVpState] = useState({ x: 0, y: 0, scale: 1 })
  const [simPositions, setSimPositions] = useState({})
  const simRef = useRef(null)
  const simRunningRef = useRef(false)
  const nodeElemsRef = useRef(new Map())  // nodeName → <g> DOM element
  const edgeElemsRef = useRef(new Map())  // 'a|||b' sorted key → <line> DOM element

  // ── Co-occurrence edges ──
  const edges = useMemo(() => {
    const edgeMap = {}
    entries.forEach(entry => {
      if (selectedBook !== 'all' && entry.book !== selectedBook) return
      const names = [
        ...(entry.characters || []).map(c => c.name),
        ...(entry.places     || []).map(p => p.name),
      ]
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const key = [names[i], names[j]].sort().join('|||')
          edgeMap[key] = (edgeMap[key] || 0) + 1
        }
      }
    })
    return Object.entries(edgeMap).map(([key, weight]) => {
      const [a, b] = key.split('|||')
      return { a, b, weight }
    })
  }, [entries, selectedBook])

  // ── Build nodes ──
  const characters = useMemo(
    () => archive.personajes.filter(e => selectedBook === 'all' || e.book === selectedBook),
    [archive.personajes, selectedBook]
  )
  const places = useMemo(
    () => archive.lugares.filter(e => selectedBook === 'all' || e.book === selectedBook),
    [archive.lugares, selectedBook]
  )

  const allNodes = useMemo(() => {
    const charNodes = characters.map(char => ({
      ...char, kind: 'character',
      archetype: getCharacterArchetype(char.tags, char.name),
      r: CHAR_SIZE / 2 + 8,
    }))
    const lmNodes = places.map(place => ({
      ...place, kind: 'landmark',
      landmarkType: getLandmarkType(place.name, place.tags),
      r: LANDMARK_SIZE / 2,
    }))
    return [...charNodes, ...lmNodes]
  }, [characters, places])

  // Keep ref + state in sync (useEffect avoids accessing ref in state updater)
  useEffect(() => {
    vpRef.current = vp;
  }, [vp]);

  const setVp = useCallback((updater) => {
    setVpState(v => typeof updater === 'function' ? updater(v) : updater);
  }, []);

  // Touch state
  const touchRef = useRef({ type: 'none', touches: [], prevDist: 0 })

  useEffect(() => {
    let cancelled = false
    loadMapAssets()
      .then(result => { if (!cancelled) setAssets(result) })
      .catch(() => { if (!cancelled) setAssets(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // ── Non-passive wheel (required so preventDefault works) ──
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setVp(v => {
        const newScale = Math.min(4, Math.max(0.25, v.scale * factor))
        const ratio = newScale / v.scale
        return { scale: newScale, x: mx - ratio * (mx - v.x), y: my - ratio * (my - v.y) }
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [setVp])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setFocusedNode(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // ── d3-force simulation ──
  useEffect(() => {
    if (simRef.current) simRef.current.stop()
    nodeElemsRef.current.clear()
    edgeElemsRef.current.clear()
    if (allNodes.length === 0) return

    const nodes = allNodes.map(n => ({
      id: n.name,
      r: n.r,
      x: MAP_W / 2 + (Math.random() - 0.5) * 200,
      y: MAP_H / 2 + (Math.random() - 0.5) * 200,
    }))

    const idxMap = Object.fromEntries(nodes.map((n, i) => [n.id, i]))
    const links = edges
      .map(e => ({ source: e.a, target: e.b, weight: e.weight }))
      .filter(l => idxMap[l.source] !== undefined && idxMap[l.target] !== undefined)

    // Set initial positions so first render shows nodes (not stacked at 0,0)
    const initialPos = {}
    nodes.forEach(n => { initialPos[n.id] = { x: n.x, y: n.y } })
    setSimPositions(initialPos)

    simRunningRef.current = true

    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-800))
      .force('center', forceCenter(MAP_W / 2, MAP_H / 2).strength(0.06))
      .force('collide', forceCollide(n => n.r + 30).iterations(3))
      .force('link', forceLink(links).id(d => d.id).strength(l => Math.min(0.2, 0.05 * l.weight)).distance(160))
      .force('boundX', (alpha) => {
        nodes.forEach(n => {
          if (n.x < 100) n.vx += (100 - n.x) * alpha * 0.1
          if (n.x > MAP_W - 100) n.vx += (MAP_W - 100 - n.x) * alpha * 0.1
        })
      })
      .force('boundY', (alpha) => {
        nodes.forEach(n => {
          if (n.y < 100) n.vy += (100 - n.y) * alpha * 0.1
          if (n.y > MAP_H - 100) n.vy += (MAP_H - 100 - n.y) * alpha * 0.1
        })
      })
      .alphaDecay(0.04)
      .on('tick', () => {
        // Direct DOM mutation — no React state update
        nodes.forEach(n => {
          const el = nodeElemsRef.current.get(n.id)
          if (el) el.setAttribute('transform', `translate(${n.x},${n.y})`)
        })
        links.forEach(l => {
          const key = [l.source.id, l.target.id].sort().join('|||')
          const el = edgeElemsRef.current.get(key)
          if (el) {
            el.setAttribute('x1', l.source.x)
            el.setAttribute('y1', l.source.y)
            el.setAttribute('x2', l.target.x)
            el.setAttribute('y2', l.target.y)
          }
        })
      })
      .on('end', () => {
        simRunningRef.current = false
        // Persist final positions to state (for re-mount)
        const pos = {}
        nodes.forEach(n => { pos[n.id] = { x: n.x, y: n.y } })
        setSimPositions(pos)
      })

    simRef.current = sim
    return () => {
      simRunningRef.current = false
      sim.stop()
    }
  }, [allNodes, edges])

  const resolvedNodes = useMemo(() => {
    return allNodes.map(n => ({
      ...n,
      x: simPositions[n.name] !== undefined ? simPositions[n.name].x : n.x,
      y: simPositions[n.name] !== undefined ? simPositions[n.name].y : n.y,
    }))
  }, [allNodes, simPositions])

  const charNodes     = resolvedNodes.filter(n => n.kind === 'character')
  const landmarkNodes = resolvedNodes.filter(n => n.kind === 'landmark')

  // ── Node lookup map for edge rendering ──
  const nodeMap = useMemo(() => {
    const map = {}
    resolvedNodes.forEach(n => { map[n.name] = n })
    return map
  }, [resolvedNodes])

  // Maps directly connected neighbor names → co-occurrence weight
  const focusedNeighbors = useMemo(() => {
    if (!focusedNode) return null
    const neighbors = new Map()
    edges.forEach(({ a, b, weight }) => {
      if (a === focusedNode) neighbors.set(b, weight)
      else if (b === focusedNode) neighbors.set(a, weight)
    })
    return neighbors
  }, [focusedNode, edges])


  // ── Mouse pan ──
  const isPanning  = useRef(false)
  const panAnchor  = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    isPanning.current = true
    panAnchor.current = { x: e.clientX - vpRef.current.x, y: e.clientY - vpRef.current.y }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return
    setVp(v => ({ ...v, x: e.clientX - panAnchor.current.x, y: e.clientY - panAnchor.current.y }))
  }, [setVp])

  const stopMousePan = useCallback(() => { isPanning.current = false }, [])

  // ── Touch pan + pinch zoom ──
  const handleTouchStart = useCallback((e) => {
    const t = Array.from(e.touches)
    if (t.length === 1) {
      touchRef.current = { type: 'pan', touches: t }
    } else if (t.length === 2) {
      touchRef.current = { type: 'pinch', touches: t, prevDist: touchDist(t[0], t[1]) }
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    const t = Array.from(e.touches)
    const state = touchRef.current

    if (state.type === 'pan' && t.length === 1) {
      const prev = state.touches[0]
      const dx = t[0].clientX - prev.clientX
      const dy = t[0].clientY - prev.clientY
      setVp(v => ({ ...v, x: v.x + dx, y: v.y + dy }))
      touchRef.current = { ...state, touches: t }

    } else if (state.type === 'pinch' && t.length === 2) {
      const dist   = touchDist(t[0], t[1])
      const factor = dist / (state.prevDist || dist)
      const center = touchCenter(t[0], t[1])
      const rect   = svgRef.current.getBoundingClientRect()
      const mx = center.x - rect.left
      const my = center.y - rect.top
      setVp(v => {
        const newScale = Math.min(4, Math.max(0.25, v.scale * factor))
        const ratio = newScale / v.scale
        return { scale: newScale, x: mx - ratio * (mx - v.x), y: my - ratio * (my - v.y) }
      })
      touchRef.current = { ...state, touches: t, prevDist: dist }
    }
  }, [setVp])

  const handleTouchEnd = useCallback((e) => {
    touchRef.current = { type: 'none', touches: Array.from(e.touches) }
  }, [])

  // ── Loading / empty states ──
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="font-serif italic text-sm" style={{ color: 'var(--text-muted)' }}>
        Invocando el Mapa de Sabiduría…
      </p>
    </div>
  )

  if (!assets) return (
    <div className="flex items-center justify-center py-32">
      <p className="font-serif italic text-sm" style={{ color: 'var(--text-muted)' }}>
        El mapa no pudo ser conjurado.
      </p>
    </div>
  )

  const isEmpty = charNodes.length === 0 && landmarkNodes.length === 0

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 10rem)' }}>

      {/* ── Book filter + connections toggle ── */}
      <div className="px-4 pt-1 pb-2 shrink-0 flex items-center gap-2">
        <select
          value={selectedBook}
          onChange={e => { setSelectedBook(e.target.value); setFocusedNode(null) }}
          className="text-xs font-serif rounded-lg border px-3 py-1.5 outline-none transition-colors"
          style={{
            borderColor: selectedBook !== 'all' ? 'var(--text-accent)' : 'var(--border-subtle)',
            color:       selectedBook !== 'all' ? 'var(--text-accent)' : 'var(--text-muted)',
            background:  'var(--bg-card)',
          }}
        >
          <option value="all">Todo el archivo</option>
          {books.map(b => <option key={b.id} value={b.title}>{b.title}</option>)}
        </select>
        <button
          onClick={() => setShowConnections(v => !v)}
          aria-label={showConnections ? 'Ocultar conexiones' : 'Mostrar conexiones'}
          className="text-[10px] font-serif italic rounded-lg border px-2.5 py-1.5 transition-colors"
          style={{
            borderColor: showConnections ? 'var(--text-accent)' : 'var(--border-subtle)',
            color:       showConnections ? 'var(--text-accent)' : 'var(--text-muted)',
            background:  'var(--bg-card)',
          }}
        >
          hilos
        </button>
      </div>

      {/* ── Map canvas ── */}
      <div
        className="flex-1 relative mx-2 mb-2 sm:mx-4 sm:mb-4 rounded-xl overflow-hidden border flex flex-col"
        style={{ borderColor: 'var(--border-subtle)', background: isEmpty ? 'var(--bg-card)' : undefined }}
      >
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className="font-serif italic text-sm" style={{ color: 'var(--text-muted)' }}>El mapa está vacío.</p>
            <p className="text-xs text-center px-8" style={{ color: 'var(--text-muted)' }}>
              {selectedBook === 'all'
                ? 'Forja tus primeras crónicas para que los personajes y lugares aparezcan aquí.'
                : 'Este libro no tiene personajes ni lugares registrados.'}
            </p>
          </div>
        )}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopMousePan}
          onMouseLeave={stopMousePan}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setFocusedNode(null)}
          style={{
            cursor: 'grab',
            display: isEmpty ? 'none' : 'block',
            background: PARCHMENT_BG,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          aria-label="Mapa de Sabiduría"
        >
          <defs>
            <pattern id="mapGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke={PARCHMENT_LINES} strokeWidth="0.5" opacity="0.5" />
            </pattern>
            <filter id="sticker" x="-30%" y="-30%" width="160%" height="160%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="expanded" />
              <feFlood floodColor="white" floodOpacity="0.9" result="white" />
              <feComposite in="white" in2="expanded" operator="in" result="outline" />
              <feMerge>
                <feMergeNode in="outline" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width={MAP_W} height={MAP_H} fill="url(#mapGrid)" />

          <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>

            {/* Connection lines */}
            {showConnections && edges.map(({ a, b, weight }) => {
              const na = nodeMap[a], nb = nodeMap[b]
              if (!na || !nb) return null
              const edgeKey = [a, b].sort().join('|||')
              const isConnected = focusedNode && (a === focusedNode || b === focusedNode)
              const dimmed = focusedNode && !isConnected
              const opacity = dimmed ? 0.04 : Math.min(0.55, 0.12 + weight * 0.09)
              const strokeW = Math.min(2.5, 0.6 + weight * 0.35)
              return (
                <line
                  key={`edge-${a}-${b}`}
                  ref={el => {
                    if (el) edgeElemsRef.current.set(edgeKey, el)
                    else edgeElemsRef.current.delete(edgeKey)
                  }}
                  x1={simRunningRef.current ? undefined : na.x}
                  y1={simRunningRef.current ? undefined : na.y}
                  x2={simRunningRef.current ? undefined : nb.x}
                  y2={simRunningRef.current ? undefined : nb.y}
                  stroke="#9c845a"
                  strokeWidth={strokeW}
                  strokeOpacity={opacity}
                  strokeDasharray="5 7"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-opacity 0.25s' }}
                />
              )
            })}

            {/* Landmarks */}
            {landmarkNodes.map(node => {
              const src  = assets.landmarks[node.landmarkType] ?? assets.landmarks.village
              const half = LANDMARK_SIZE / 2
              const isFocused  = focusedNode === node.name
              const isNeighbor = focusedNeighbors?.has(node.name)
              const dimmed     = focusedNode && !isFocused && !isNeighbor
              return (
                <g
                  key={`lm-${node.name}`}
                  ref={el => {
                    if (el) nodeElemsRef.current.set(node.name, el)
                    else nodeElemsRef.current.delete(node.name)
                  }}
                  transform={simRunningRef.current ? undefined : `translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer', opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.25s' }}
                  onClick={e => { e.stopPropagation(); setFocusedNode(node.name === focusedNode ? null : node.name) }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <g style={{ transform: isFocused ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.2s' }}>
                    <image href={src} x={-half} y={-half} width={LANDMARK_SIZE} height={LANDMARK_SIZE} style={{ pointerEvents: 'none' }} />
                    <text y={half + 16} textAnchor="middle" fontSize="11" fontFamily="'Playfair Display', serif" fontStyle="italic" fill="#7a6545">
                      {node.name.length > 15 ? node.name.slice(0, 14) + '…' : node.name}
                    </text>
                  </g>
                </g>
              )
            })}

            {/* Characters */}
            {charNodes.map(node => {
              const src  = assets.characters[node.archetype] ?? assets.characters.person
              const aura = AURA_COLORS[node.archetype] ?? AURA_COLORS.person
              const half = CHAR_SIZE / 2
              const isFocused  = focusedNode === node.name
              const isNeighbor = focusedNeighbors?.has(node.name)
              const dimmed     = focusedNode && !isFocused && !isNeighbor
              return (
                <g
                  key={`ch-${node.name}`}
                  ref={el => {
                    if (el) nodeElemsRef.current.set(node.name, el)
                    else nodeElemsRef.current.delete(node.name)
                  }}
                  transform={simRunningRef.current ? undefined : `translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer', opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.25s' }}
                  onClick={e => { e.stopPropagation(); setFocusedNode(node.name === focusedNode ? null : node.name) }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <circle r={half + 16} fill={aura} opacity={isFocused ? 0.45 : 0.14} style={{ transition: 'opacity 0.25s' }} />
                  <circle r={half + 9}  fill={aura} opacity={isFocused ? 0.28 : 0.10} style={{ transition: 'opacity 0.25s' }} />
                  <g style={{ transform: isFocused ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.2s' }}>
                    <image href={src} x={-half} y={-half} width={CHAR_SIZE} height={CHAR_SIZE} filter="url(#sticker)" style={{ pointerEvents: 'none' }} />
                    <text y={half + 16} textAnchor="middle" fontSize="10" fontFamily="'Playfair Display', serif" fill="#7a6545">
                      {node.name.length > 15 ? node.name.slice(0, 14) + '…' : node.name}
                    </text>
                  </g>
                </g>
              )
            })}
          </g>
        </svg>

        {/* ── Focus Panel ── */}
        {focusedNode && (() => {
          const node = nodeMap[focusedNode]
          if (!node) return null
          const connections = focusedNeighbors
            ? Array.from(focusedNeighbors.entries()).sort((a, b) => b[1] - a[1])
            : []
          return (
            <div
              className="absolute bottom-14 left-3 right-3 sm:bottom-auto sm:top-3 sm:left-auto sm:right-3 sm:w-64 rounded-xl shadow-xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 p-3 pb-2">
                <div className="min-w-0">
                  <p className="text-sm font-serif font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {node.name}
                  </p>
                  {node.book && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{node.book}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-serif italic"
                    style={{
                      background: 'color-mix(in srgb, var(--text-accent) 10%, transparent)',
                      color: 'var(--text-accent)',
                    }}
                  >
                    {node.kind === 'character' ? 'Personaje' : 'Lugar'}
                  </span>
                  <button
                    onClick={() => setFocusedNode(null)}
                    className="text-[10px] leading-none p-1 rounded"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Cerrar panel de enfoque"
                  >✕</button>
                </div>
              </div>

              {/* Tags */}
              {node.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 px-3 pb-2">
                  {node.tags.slice(0, 6).map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] rounded-full px-1.5 py-0.5"
                      style={{
                        background: 'color-mix(in srgb, var(--text-accent) 12%, transparent)',
                        color: 'var(--text-accent)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Mentions */}
              {node.mentions?.length > 0 && (
                <p className="text-[10px] px-3 pb-2 italic" style={{ color: 'var(--text-muted)' }}>
                  {node.mentions.length} {node.mentions.length === 1 ? 'mención' : 'menciones'}
                </p>
              )}

              {/* Connected entities */}
              {connections.length > 0 && (
                <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p
                    className="text-[10px] font-serif uppercase tracking-wider px-3 pt-2 pb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Conexiones
                  </p>
                  <div className="flex flex-col pb-1 max-h-40 overflow-y-auto">
                    {connections.map(([name, weight]) => (
                      <button
                        key={name}
                        onClick={() => setFocusedNode(name)}
                        className="flex items-center justify-between text-[10px] px-3 py-1.5 text-left transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--text-accent) 6%, transparent)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <span className="font-serif truncate">{name}</span>
                        <span className="shrink-0 ml-2 tabular-nums" style={{ color: 'var(--text-muted)' }}>×{weight}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Zoom controls ── */}
        {!isEmpty && <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          {[
            { label: '+', action: () => setVp(v => ({ ...v, scale: Math.min(4, v.scale * 1.25) })), aria: 'Acercar' },
            { label: '−', action: () => setVp(v => ({ ...v, scale: Math.max(0.25, v.scale * 0.8) })), aria: 'Alejar' },
            { label: '↺', action: () => setVp({ x: 0, y: 0, scale: 1 }),                            aria: 'Restablecer vista' },
          ].map(({ label, action, aria }) => (
            <button
              key={label}
              onClick={action}
              aria-label={aria}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              {label}
            </button>
          ))}
        </div>}

        {/* ── Node count ── */}
        {!isEmpty && (
          <div className="absolute bottom-3 left-3 text-[10px] font-serif italic" style={{ color: '#9c845a' }}>
            {charNodes.length} personajes · {landmarkNodes.length} lugares
          </div>
        )}
      </div>
    </div>
  )
}
