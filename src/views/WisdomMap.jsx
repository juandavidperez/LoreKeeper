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

function seedPos(name, salt, pad = 130) {
  let h1 = salt, h2 = salt * 17
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i)
    h1 = Math.imul(31, h1) + c | 0
    h2 = Math.imul(37, h2) + c | 0
  }
  return {
    x: pad + (Math.abs(h1) % (MAP_W - 2 * pad)),
    y: pad + (Math.abs(h2) % (MAP_H - 2 * pad)),
  }
}


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
  const [tappedNode, setTappedNode]       = useState(null)   // touch tooltip
  const [showConnections, setShowConnections] = useState(true)
  const svgRef    = useRef(null)
  const vpRef     = useRef({ x: 0, y: 0, scale: 1 })       // source of truth
  const [vp, setVpState] = useState({ x: 0, y: 0, scale: 1 })
  const [simPositions, setSimPositions] = useState({})
  const simRef = useRef(null)

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
      r: CHAR_SIZE / 2 + 8, ...seedPos(char.name, 7),
    }))
    const lmNodes = places.map(place => ({
      ...place, kind: 'landmark',
      landmarkType: getLandmarkType(place.name, place.tags),
      r: LANDMARK_SIZE / 2, ...seedPos(place.name, 13),
    }))
    return [...charNodes, ...lmNodes]
  }, [characters, places])

  // ── d3-force simulation ──
  useEffect(() => {
    if (simRef.current) simRef.current.stop()
    if (allNodes.length === 0) { setSimPositions({}); return }

    const nodes = allNodes.map(n => ({ id: n.name, r: n.r, x: n.x, y: n.y }))
    const idxMap = Object.fromEntries(nodes.map((n, i) => [n.id, i]))
    const links = edges
      .map(e => ({ source: idxMap[e.a], target: idxMap[e.b], weight: e.weight }))
      .filter(l => l.source !== undefined && l.target !== undefined)

    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(MAP_W / 2, MAP_H / 2).strength(0.04))
      .force('collide', forceCollide(n => n.r + 22).iterations(2))
      .force('link', forceLink(links).strength(l => Math.min(0.3, 0.06 * l.weight)))
      .alphaDecay(0.025)
      .on('tick', () => {
        const pos = {}
        nodes.forEach(n => {
          pos[n.id] = {
            x: Math.max(80, Math.min(MAP_W - 80, n.x)),
            y: Math.max(80, Math.min(MAP_H - 80, n.y)),
          }
        })
        setSimPositions({ ...pos })
      })

    simRef.current = sim
    return () => sim.stop()
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
          onChange={e => { setSelectedBook(e.target.value); setTappedNode(null) }}
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
          onClick={() => setTappedNode(null)}
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
              const opacity = Math.min(0.55, 0.12 + weight * 0.09)
              const strokeW = Math.min(2.5, 0.6 + weight * 0.35)
              return (
                <line
                  key={`edge-${a}-${b}`}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke="#9c845a"
                  strokeWidth={strokeW}
                  strokeOpacity={opacity}
                  strokeDasharray="5 7"
                  strokeLinecap="round"
                />
              )
            })}

            {/* Landmarks */}
            {landmarkNodes.map(node => {
              const src  = assets.landmarks[node.landmarkType] ?? assets.landmarks.village
              const half = LANDMARK_SIZE / 2
              return (
                <g
                  key={`lm-${node.name}`}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setTappedNode(node) }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <image href={src} x={-half} y={-half} width={LANDMARK_SIZE} height={LANDMARK_SIZE} style={{ pointerEvents: 'none' }} />
                  <text y={half + 16} textAnchor="middle" fontSize="11" fontFamily="'Playfair Display', serif" fontStyle="italic" fill="#7a6545">
                    {node.name.length > 15 ? node.name.slice(0, 14) + '…' : node.name}
                  </text>
                </g>
              )
            })}

            {/* Characters */}
            {charNodes.map(node => {
              const src  = assets.characters[node.archetype] ?? assets.characters.person
              const aura = AURA_COLORS[node.archetype] ?? AURA_COLORS.person
              const half = CHAR_SIZE / 2
              return (
                <g
                  key={`ch-${node.name}`}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); setTappedNode(node) }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  <circle r={half + 16} fill={aura} opacity={0.14} />
                  <circle r={half + 9}  fill={aura} opacity={0.10} />
                  <image href={src} x={-half} y={-half} width={CHAR_SIZE} height={CHAR_SIZE} filter="url(#sticker)" style={{ pointerEvents: 'none' }} />
                  <text y={half + 16} textAnchor="middle" fontSize="10" fontFamily="'Playfair Display', serif" fill="#7a6545">
                    {node.name.length > 15 ? node.name.slice(0, 14) + '…' : node.name}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* ── Tooltip (tap/click on node) ── */}
        {tappedNode && (
          <div
            className="absolute bottom-12 left-3 right-3 sm:bottom-auto sm:top-3 sm:left-auto sm:right-3 sm:w-52 rounded-xl p-3 shadow-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                {tappedNode.name}
              </p>
              <button
                onClick={() => setTappedNode(null)}
                className="shrink-0 text-[10px] leading-none p-1 rounded"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Cerrar"
              >✕</button>
            </div>
            {tappedNode.book && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{tappedNode.book}</p>
            )}
            {tappedNode.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tappedNode.tags.slice(0, 4).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] rounded-full px-1.5 py-0.5"
                    style={{ background: 'color-mix(in srgb, var(--text-accent) 12%, transparent)', color: 'var(--text-accent)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {tappedNode.mentions?.length > 0 && (
              <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-muted)' }}>
                {tappedNode.mentions.length} {tappedNode.mentions.length === 1 ? 'mención' : 'menciones'}
              </p>
            )}
          </div>
        )}

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
