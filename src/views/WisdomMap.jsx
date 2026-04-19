import { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink } from 'd3-force'
import { drag } from 'd3-drag'
import { select } from 'd3-selection'
import { useLorekeeperState } from '../hooks/useLorekeeperState'
import { ThemeContext } from '../context/ThemeContext'
import { loadMapAssets, getLandmarkType } from '../utils/mapImages'
import { MapFilters } from '../components/MapFilters'
import { RelationshipPanel } from '../components/RelationshipPanel'
import { LucidePlus, LucideLink, LucideMerge } from 'lucide-react'
import { DeduplicationPanel } from '../components/DeduplicationPanel'

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
  const { archive, books, entries, entities, mentions, relations, setRelations, mergeEntities } = useLorekeeperState()
  const { theme } = useContext(ThemeContext)
  const [assets, setAssets]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [selectedBook, setSelectedBook]   = useState('all')
  const [showFog, setShowFog] = useState(true);
  const [focusedNode, setFocusedNode] = useState(null);
  const [showRelPanel, setShowRelPanel] = useState(false);
  const [showMergePanel, setShowMergePanel] = useState(false);
  
  const [filters, setFilters] = useState({
    showLandmarks: true,
    showAutoEdges: true,
    showManualEdges: true,
    simplifyView: false,
    minWeight: 1
  });

  const svgRef    = useRef(null)
  const vpRef     = useRef({ x: 0, y: 0, scale: 1 })       // source of truth
  const [vp, setVpState] = useState({ x: 0, y: 0, scale: 1 })
  const [simPositions, setSimPositions] = useState({})
  const simRef = useRef(null)
  const simRunningRef = useRef(false)
  const nodeElemsRef = useRef(new Map())  // nodeName → <g> DOM element
  const edgeElemsRef = useRef(new Map())  // key → <line> DOM element

  // ── Hybrid Edges (Auto + Manual) ──
  const edges = useMemo(() => {
    const edgeMap = {}
    
    // 1. Auto-edges from mentions
    if (filters.showAutoEdges) {
      entries.forEach(entry => {
        if (selectedBook !== 'all' && entry.book !== selectedBook) return
        // Get all entities mentioned in this entry
        const entryMentions = mentions.filter(m => m.entryId === entry.id);
        const entityIds = entryMentions.map(m => m.entityId);
        
        for (let i = 0; i < entityIds.length; i++) {
          for (let j = i + 1; j < entityIds.length; j++) {
            const [idA, idB] = [entityIds[i], entityIds[j]].sort();
            const key = `auto|||${idA}|||${idB}`;
            edgeMap[key] = (edgeMap[key] || 0) + 1;
          }
        }
      });
    }

    const autoEdges = Object.entries(edgeMap)
      .filter(([_, weight]) => {
        if (filters.simplifyView && weight === 1) return false;
        return weight >= filters.minWeight;
      })
      .map(([key, weight]) => {
        const [_, a, b] = key.split('|||');
        return { source: a, target: b, weight, isManual: false, id: key };
      });

    // 2. Manual edges from relations
    const manualEdges = filters.showManualEdges 
      ? relations.map(r => ({
          source: r.sourceId,
          target: r.targetId,
          weight: r.weight,
          type: r.type,
          isManual: true,
          isDirectional: r.isDirectional,
          id: r.id
        }))
      : [];

    return [...autoEdges, ...manualEdges];
  }, [entries, mentions, relations, selectedBook, filters])

  // ── Build nodes ──
  const allEntities = useMemo(() => {
    let list = [
      ...archive.personajes.map(p => ({ ...p, kind: 'character', r: CHAR_SIZE / 2 + 8 })),
      ...archive.lugares.map(l => ({ ...l, kind: 'landmark', r: LANDMARK_SIZE / 2, landmarkType: getLandmarkType(l.name, l.tags) })),
    ];
    if (selectedBook !== 'all') {
      list = list.filter(n => n.mentions?.some(m => m.book === selectedBook));
    }
    if (!filters.showLandmarks) return list.filter(n => n.kind !== 'landmark');
    return list;
  }, [archive, filters.showLandmarks, selectedBook])

  // Keep ref + state in sync (useEffect avoids accessing ref in state updater)
  useEffect(() => {
    vpRef.current = vp;
  }, [vp]);

  const setVp = useCallback((updater) => {
    setVpState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Clamp boundaries loosely or just keep focus
      return next;
    });
  }, []);

  // ── Scroll Lock ──
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
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

  // ── Alpha Pulse on Focus ──
  useEffect(() => {
    if (focusedNode && simRef.current) {
      simRef.current.alpha(0.2).restart()
    }
  }, [focusedNode])

  // ── d3-force simulation ──
  useEffect(() => {
    if (simRef.current) simRef.current.stop()
    nodeElemsRef.current.clear()
    edgeElemsRef.current.clear()
    if (allEntities.length === 0) return

    const nodes = allEntities.map(n => {
      const saved = simPositions[n.id]
      return {
        id: n.id,
        kind: n.kind,
        name: n.name,
        r: n.r,
        archetype: n.archetype,
        x: saved ? saved.x : MAP_W / 2 + (Math.random() - 0.5) * 200,
        y: saved ? saved.y : MAP_H / 2 + (Math.random() - 0.5) * 200,
        fx: saved ? saved.fx : null,
        fy: saved ? saved.fy : null,
      }
    })

    const idxMap = Object.fromEntries(nodes.map((n, i) => [n.id, i]))
    const links = edges
      .map(e => ({ 
        id: e.id,
        source: e.source, 
        target: e.target, 
        weight: e.weight,
        isManual: e.isManual,
        isDirectional: e.isDirectional
      }))
      .filter(l => idxMap[l.source] !== undefined && idxMap[l.target] !== undefined)

    const degreeMap = {};
    links.forEach(l => {
      degreeMap[l.source] = (degreeMap[l.source] || 0) + 1;
      degreeMap[l.target] = (degreeMap[l.target] || 0) + 1;
    });

    const simulationNodes = nodes.map(n => ({
      ...n,
      degree: degreeMap[n.id] || 0
    }));

    // Set initial positions so first render shows nodes (not stacked at 0,0)
    const initialPos = {}
    nodes.forEach(n => { initialPos[n.id] = { x: n.x, y: n.y } })
    setSimPositions(initialPos)

    simRunningRef.current = true

    const sim = forceSimulation(simulationNodes)
      .force('charge', forceManyBody().strength(d => -800 - (d.degree * 150)))
      .force('center', forceCenter(MAP_W / 2, MAP_H / 2).strength(0.06))
      .force('collide', forceCollide(n => n.r + 35 + (n.degree * 2)).iterations(3))
      .force('link', forceLink(links).id(d => d.id).strength(l => Math.min(0.2, 0.05 * l.weight)).distance(l => {
        // Safe access: l.source might be an object (from D3) or an ID string (initial)
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const degA = simulationNodes[idxMap[sourceId]]?.degree || 0;
        const degB = simulationNodes[idxMap[targetId]]?.degree || 0;
        return 160 + (degA + degB) * 10;
      }))
      .force('boundX', (alpha) => {
        simulationNodes.forEach(n => {
          if (n.x < 100) n.vx += (100 - n.x) * alpha * 0.1
          if (n.x > MAP_W - 100) n.vx += (MAP_W - 100 - n.x) * alpha * 0.1
        })
      })
      .force('boundY', (alpha) => {
        simulationNodes.forEach(n => {
          if (n.y < 100) n.vy += (100 - n.y) * alpha * 0.1
          if (n.y > MAP_H - 100) n.vy += (MAP_H - 100 - n.y) * alpha * 0.1
        })
      })
      .alphaDecay(0.04)

    // ── Drag behavior ──
    const dragBehavior = drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0)
        // Keep them pinned: fx/fy remain set
      })

    sim
      .on('tick', () => {
        // Direct DOM mutation — no React state update
        simulationNodes.forEach(n => {
          const el = nodeElemsRef.current.get(n.id)
          if (el) {
            el.setAttribute('transform', `translate(${n.x},${n.y})`)
            // Apply drag behavior if not already applied
            if (!el.__dragBound) {
              select(el).call(dragBehavior).datum(n)
              el.__dragBound = true
            }
          }
        })
        links.forEach(l => {
          const el = edgeElemsRef.current.get(l.id)
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
        simulationNodes.forEach(n => { 
          pos[n.id] = { x: n.x, y: n.y, fx: n.fx, fy: n.fy } 
        })
        setSimPositions(pos)
      })

    simRef.current = sim
    return () => {
      simRunningRef.current = false
      sim.stop()
    }
  }, [allEntities, edges])

  const resolvedNodes = useMemo(() => {
    // Re-calculate degree for the memoized nodes too
    const degreeMap = {};
    edges.forEach(l => {
      degreeMap[l.source] = (degreeMap[l.source] || 0) + 1;
      degreeMap[l.target] = (degreeMap[l.target] || 0) + 1;
    });

    return allEntities.map(n => {
      const saved = simPositions[n.id]
      return {
        ...n,
        degree: degreeMap[n.id] || 0,
        x: saved !== undefined ? saved.x : n.x,
        y: saved !== undefined ? saved.y : n.y,
        fx: saved !== undefined ? saved.fx : null,
        fy: saved !== undefined ? saved.fy : null,
      }
    })
  }, [allEntities, simPositions, edges])

  const charNodes     = resolvedNodes.filter(n => n.kind === 'character')
  const landmarkNodes = resolvedNodes.filter(n => n.kind === 'landmark')

  const nodeMap = useMemo(() => {
    const map = {}
    resolvedNodes.forEach(n => { map[n.id] = n })
    return map
  }, [resolvedNodes])

  // Maps directly connected neighbor IDs → { weight, isManual }
  const focusedNeighbors = useMemo(() => {
    if (!focusedNode) return null
    const neighbors = new Map()
    edges.forEach(({ source, target, weight, isManual }) => {
      if (source === focusedNode) neighbors.set(target, { weight, isManual })
      else if (target === focusedNode) neighbors.set(source, { weight, isManual })
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
    <div className="flex-1 min-h-0 flex flex-col relative">
      {/* ── Map canvas ── */}
      <div
        className="flex-1 relative mx-1 mt-1 mb-1 sm:mx-4 sm:mb-4 rounded-xl overflow-hidden border flex flex-col"
        style={{
          borderColor: theme === 'dark' ? 'rgba(245,158,11,0.25)' : 'var(--border-subtle)',
          background: isEmpty ? 'var(--bg-card)' : undefined,
          boxShadow: theme === 'dark' && !isEmpty ? 'inset 0 0 60px 20px rgba(0,0,0,0.55)' : undefined,
        }}
      >
        <MapFilters 
          filters={filters} 
          setFilters={setFilters}
          books={books}
          selectedBook={selectedBook}
          setSelectedBook={setSelectedBook}
          showFog={showFog}
          setShowFog={setShowFog}
          onNodeFocus={() => setFocusedNode(null)}
        />
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

            <filter id="fogBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
            </filter>

            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="21"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#b45309" opacity="0.6" />
            </marker>

            <mask id="fogMask">
              <rect width={MAP_W} height={MAP_H} fill="white" />
              <g filter="url(#fogBlur)">
                {resolvedNodes.map(n => (
                  <circle key={`fog-node-${n.id}`} cx={n.x} cy={n.y} r={n.r + 120} fill="black" />
                ))}
                {edges.map(({ source, target, id }) => {
                  const na = nodeMap[source], nb = nodeMap[target];
                  if (!na || !nb) return null;
                  return <line key={`fog-link-${id}`} x1={na.x ?? 0} y1={na.y ?? 0} x2={nb.x ?? 0} y2={nb.y ?? 0} stroke="black" strokeWidth="60" strokeLinecap="round" />;
                })}
              </g>
            </mask>
          </defs>

          <rect width={MAP_W} height={MAP_H} fill="url(#mapGrid)" />
          
          <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>
            {/* The Map Background / Parchment texture is already the SVG background */}

            {/* Fog Layer */}
            {showFog && !isEmpty && (
              <rect 
                width={MAP_W} 
                height={MAP_H} 
                fill="#d4c9b0" 
                mask="url(#fogMask)" 
                opacity="0.85"
                style={{ pointerEvents: 'none', transition: 'opacity 1s' }}
              />
            )}

            {/* Connection lines */}
            {edges.map(({ source, target, weight, id, isManual, isDirectional }) => {
              const na = nodeMap[source], nb = nodeMap[target]
              if (!na || !nb) return null
              const isConnected = focusedNode && (source === focusedNode || target === focusedNode)
              const dimmed = focusedNode && !isConnected
              const baseOpacity = isManual ? 0.7 : (weight ? Math.max(0.3, Math.min(1.0, 0.1 + weight * 0.2)) : 0.6)
              const opacity = dimmed ? 0.02 : baseOpacity
              const strokeW = isManual ? (0.8 + weight * 0.8) : Math.min(3.5, 0.8 + weight * 0.45)
              const isStrong = weight > 3 || isManual
              
              return (
                <line
                  key={`edge-${id}`}
                  ref={el => {
                    if (el) edgeElemsRef.current.set(id, el)
                    else edgeElemsRef.current.delete(id)
                  }}
                  x1={simRunningRef.current ? undefined : na.x}
                  y1={simRunningRef.current ? undefined : na.y}
                  x2={simRunningRef.current ? undefined : nb.x}
                  y2={simRunningRef.current ? undefined : nb.y}
                  stroke={isManual ? "#8c4107" : "#b45309"}
                  strokeWidth={strokeW}
                  strokeOpacity={opacity}
                  strokeDasharray={isStrong ? "none" : "5 7"}
                  strokeLinecap="round"
                  markerEnd={isDirectional ? "url(#arrowhead)" : undefined}
                  filter="url(#inkLine)"
                  style={{ transition: 'stroke-opacity 0.25s' }}
                />
              )
            })}

            {/* Landmarks */}
            {landmarkNodes.map(node => {
              const src  = assets.landmarks[node.landmarkType] ?? assets.landmarks.village
              const half = LANDMARK_SIZE / 2
              const isFocused  = focusedNode === node.id
              const isNeighbor = focusedNeighbors?.has(node.id)
              const dimmed     = focusedNode && !isFocused && !isNeighbor
              return (
                <g
                  key={`lm-${node.name}`}
                  ref={el => {
                    if (el) nodeElemsRef.current.set(node.id, el)
                    else nodeElemsRef.current.delete(node.id)
                  }}
                  className={`cursor-pointer transition-opacity duration-500 ${focusedNode && !isFocused && !isNeighbor ? 'opacity-10 grayscale' : 'opacity-100'}`}
                  transform={simRunningRef.current ? undefined : `translate(${node.x},${node.y})`}
                  onClick={e => {
                    e.stopPropagation()
                    if (isFocused) {
                      setFocusedNode(null)
                    } else {
                      setFocusedNode(node.id)
                      navigator.vibrate?.(10)
                    }
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation()
                    if (!simRef.current) return
                    const simNode = simRef.current.nodes().find(n => n.id === node.id)
                    if (simNode) {
                      simNode.fx = null
                      simNode.fy = null
                      simRef.current.alpha(0.3).restart()
                    }
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {node.fx !== null && (
                    <circle r={half + 5} fill="none" stroke="#7a6545" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
                  )}
                  <g style={{ transform: isFocused ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <rect x={-half} y={-half} width={LANDMARK_SIZE} height={LANDMARK_SIZE} fill="transparent" />
                    <image href={src} x={-half} y={-half} width={LANDMARK_SIZE} height={LANDMARK_SIZE} style={{ pointerEvents: 'none' }} />
                    <text 
                      textAnchor="middle" 
                      y={half + 14} 
                      fontSize="11" 
                      fontFamily="'Playfair Display', serif" 
                      fill="#5c4a2a" 
                      style={{ 
                        pointerEvents: 'none', 
                        opacity: focusedNode ? (isFocused || isNeighbor ? 1 : 0) : 1,
                        transition: 'opacity 0.3s'
                      }}
                    >
                      {node.name?.length > 14 ? node.name.slice(0, 13) + '…' : (node.name || 'Sin nombre')}
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
              const isFocused  = focusedNode === node.id
              const isNeighbor = focusedNeighbors?.has(node.id)
              const dimmed     = focusedNode && !isFocused && !isNeighbor
              return (
                <g
                  key={`ch-${node.id}`}
                  ref={el => {
                    if (el) nodeElemsRef.current.set(node.id, el)
                    else nodeElemsRef.current.delete(node.id)
                  }}
                  className={`cursor-pointer transition-opacity duration-500 ${focusedNode && !isFocused && !isNeighbor ? 'opacity-10 grayscale' : 'opacity-100'}`}
                  transform={simRunningRef.current ? undefined : `translate(${node.x},${node.y})`}
                  onClick={e => {
                    e.stopPropagation()
                    if (isFocused) {
                      setFocusedNode(null)
                      setShowRelPanel(false)
                      setShowMergePanel(false)
                    } else {
                      setFocusedNode(node.id)
                      setShowRelPanel(false)
                      setShowMergePanel(false)
                      navigator.vibrate?.(10)
                    }
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation()
                    if (!simRef.current) return
                    const simNode = simRef.current.nodes().find(n => n.id === node.id)
                    if (simNode) {
                      simNode.fx = null
                      simNode.fy = null
                      simRef.current.alpha(0.3).restart()
                    }
                  }}
                  onMouseDown={e => e.stopPropagation()}
                >
                  {node.fx !== null && (
                    <circle r={half + 22} fill="none" stroke="#7a6545" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
                  )}
                  <circle r={half + 16} fill={aura} opacity={isFocused ? 0.6 : 0.14} style={{ transition: 'opacity 0.3s' }} />
                  <circle r={half + 9}  fill={aura} opacity={isFocused ? 0.4 : 0.10} style={{ transition: 'opacity 0.3s' }} />
                  <g style={{ transform: isFocused ? 'scale(1.2)' : 'scale(1)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <image href={src} x={-half} y={-half} width={CHAR_SIZE} height={CHAR_SIZE} filter="url(#sticker)" style={{ pointerEvents: 'none' }} />
                    <text 
                      textAnchor="middle" 
                      y={half + 14} 
                      fontSize="10" 
                      fontFamily="'Playfair Display', serif" 
                      fill="#5c4a2a" 
                      style={{ 
                        pointerEvents: 'none',
                        opacity: focusedNode ? (isFocused || isNeighbor ? 1 : 0) : 1,
                        transition: 'opacity 0.3s'
                      }}
                    >
                      {node.name?.length > 15 ? node.name.slice(0, 14) + '…' : (node.name || 'Sin nombre')}
                    </text>
                  </g>
                </g>
              )
            })}
          </g>
        </svg>

        {/* ── Focus Panel ── */}
        <AnimatePresence>
          {focusedNode && (() => {
            const node = nodeMap[focusedNode]
            if (!node) return null
            const connections = focusedNeighbors
              ? Array.from(focusedNeighbors.entries()).sort((a, b) => b[1].weight - a[1].weight)
              : []
            return (
              <motion.div
                role="region"
                aria-label="Detalle del nodo"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="fixed bottom-[calc(var(--nav-height)+12px)] left-3 right-3 sm:bottom-auto sm:top-3 sm:left-auto sm:right-3 sm:w-80 rounded-sm shadow-2xl border-2 overflow-hidden flex flex-col max-h-[85vh]"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', zIndex: 100 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 p-3 pb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-serif font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                      {node.name}
                    </p>
                    {node.aliases?.length > 0 && (
                      <p className="text-[10px] mt-0.5 truncate italic" style={{ color: 'var(--text-muted)' }}>
                        aka {node.aliases.join(', ')}
                      </p>
                    )}
                    {node.book && (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{node.book}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setShowMergePanel(!showMergePanel); setShowRelPanel(false); }}
                      className={`p-1 rounded-full transition-colors ${showMergePanel ? 'bg-accent text-white' : 'text-accent hover:bg-accent/10'}`}
                      aria-label="Fusionar entidad"
                    >
                      <LucideMerge size={14} />
                    </button>
                    <button
                      onClick={() => { setShowRelPanel(!showRelPanel); setShowMergePanel(false); }}
                      className={`p-1 rounded-full transition-colors ${showRelPanel ? 'bg-accent text-white' : 'text-accent hover:bg-accent/10'}`}
                    >
                      <LucidePlus size={14} />
                    </button>
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
                      onClick={() => { setFocusedNode(null); setShowRelPanel(false); setShowMergePanel(false); }}
                      className="text-[10px] leading-none p-1 rounded"
                      style={{ color: 'var(--text-muted)' }}
                    >✕</button>
                  </div>
                </div>

                {showMergePanel ? (
                  <DeduplicationPanel
                    sourceEntity={node}
                    allEntities={entities}
                    onCancel={() => setShowMergePanel(false)}
                    onMerge={(absorbedId) => {
                      mergeEntities(node.id, absorbedId);
                      setShowMergePanel(false);
                      setFocusedNode(null);
                    }}
                  />
                ) : showRelPanel ? (
                  <RelationshipPanel
                    sourceNode={node}
                    entities={resolvedNodes}
                    onCancel={() => setShowRelPanel(false)}
                    onSave={(rel) => {
                      setRelations(prev => [...prev, { ...rel, id: crypto.randomUUID() }]);
                      setShowRelPanel(false);
                    }}
                  />
                ) : (
                  <>
                    {/* Tags + archetype chip */}
                    {(() => {
                      const chips = Array.isArray(node.tags) ? node.tags.slice(0, 5) : []
                      const archLabel = node.archetype && node.archetype !== 'person'
                        ? node.archetype
                        : null
                      if (!archLabel && chips.length === 0) return null
                      return (
                        <div className="flex flex-wrap gap-1 px-3 pb-2">
                          {archLabel && (
                            <span
                              className="text-[10px] rounded-full px-1.5 py-0.5 font-serif italic"
                              style={{
                                background: 'color-mix(in srgb, var(--text-accent) 8%, transparent)',
                                color: 'var(--text-accent)',
                                border: '1px solid color-mix(in srgb, var(--text-accent) 20%, transparent)',
                              }}
                            >
                              {archLabel}
                            </span>
                          )}
                          {chips.map(tag => (
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
                      )
                    })()}

                    {/* Description */}
                    {node.description && (
                      <p className="text-[11px] px-3 pb-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {node.description}
                      </p>
                    )}

                    {/* Mentions — list of entries, not just count */}
                    {node.mentions?.length > 0 && (
                      <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <p className="text-[10px] font-serif uppercase tracking-wider px-3 pt-2 pb-1" style={{ color: 'var(--text-muted)' }}>
                          {node.mentions.length} {node.mentions.length === 1 ? 'mención' : 'menciones'}
                        </p>
                        <div className="flex flex-col pb-1 max-h-36 overflow-y-auto">
                          {node.mentions.slice(0, 6).map((m, i) => (
                            <div key={i} className="px-3 py-1.5 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                {m.date && <span className="font-serif tabular-nums" style={{ color: 'var(--text-accent)', opacity: 0.7 }}>{m.date}</span>}
                                {m.book && <span style={{ color: 'var(--text-muted)' }}>· {m.book}</span>}
                              </div>
                              {m.text && (
                                <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                  {m.text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
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
                          {connections.map(([id, info]) => {
                            const neighbor = nodeMap[id];
                            if (!neighbor) return null;
                            return (
                              <button
                                key={id}
                                onClick={() => setFocusedNode(id)}
                                className="flex items-center justify-between text-[10px] px-3 py-1.5 text-left transition-colors group"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--text-accent) 6%, transparent)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {info.isManual && <LucideLink size={10} className="text-accent opacity-60" />}
                                  <span className="font-serif truncate">{neighbor.name}</span>
                                </div>
                                <span className="shrink-0 ml-2 tabular-nums opacity-40 group-hover:opacity-100">
                                  ×{info.weight}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* ── Zoom controls ── */}
        {!isEmpty && <div className="absolute bottom-3 right-3 flex flex-col gap-1.5" style={{ zIndex: 20 }}>
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
