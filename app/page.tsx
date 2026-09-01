'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type Move, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const LEVELS = [
  { name: 'Easy', elo: 1100, depth: 6, time: 150 },
  { name: 'Medium', elo: 1500, depth: 10, time: 500 },
  { name: 'Hard', elo: 2100, depth: 16, time: 1500 },
  { name: 'Extreme', elo: 2800, depth: 22, time: 3500 },
]

export default function Home() {
  const gameRef = useRef(new Chess())
  const workerRef = useRef<Worker | null>(null)
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState<Move[]>([])
  const [color, setColor] = useState<Color>('w')
  const [level, setLevel] = useState(1)
  const [thinking, setThinking] = useState(false)
  const [ready, setReady] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<Square | null>(null)
  const [legal, setLegal] = useState<Square[]>([])
  const [evaluation, setEvaluation] = useState(0)
  const [pv, setPv] = useState('')
  const [fenInput, setFenInput] = useState('')

  const game = gameRef.current
  const rows = useMemo(() => {
    const result: { n: number; w?: Move; b?: Move }[] = []
    history.forEach((m) => m.color === 'w' ? result.push({ n: result.length + 1, w: m }) : result[result.length - 1] && (result[result.length - 1].b = m))
    return result
  }, [history])

  const sync = () => {
    const g = gameRef.current
    setFen(g.fen())
    setHistory(g.history({ verbose: true }))
  }

  useEffect(() => {
    const worker = new Worker('/stockfish-worker.js')
    workerRef.current = worker
    worker.onmessage = (e) => {
      const line = String(e.data || '').trim()
      if (line === 'uciok') { worker.postMessage('isready'); return }
      if (line === 'readyok') { setReady(true); return }
      const cp = line.match(/score cp (-?\d+)/)?.[1]
      const mate = line.match(/score mate (-?\d+)/)?.[1]
      if (cp) setEvaluation(Number(cp) / 100)
      if (mate) setPv(`Mate in ${Math.abs(Number(mate))}`)
      const pvMatch = line.match(/ pv (.+)$/)
      if (pvMatch) setPv(pvMatch[1].split(' ').slice(0, 8).join(' '))
      const best = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn]?)/)
      if (best) {
        try {
          gameRef.current.move({ from: best[1] as Square, to: best[2] as Square, promotion: (best[3] || 'q') as 'q' | 'r' | 'b' | 'n' })
          sync(); setThinking(false)
        } catch { setThinking(false) }
      }
    }
    worker.onerror = () => { setReady(false); setThinking(false) }
    worker.postMessage('uci')
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (!ready || thinking || game.turn() === color || game.isGameOver()) return
    const worker = workerRef.current
    if (!worker) return
    const cfg = LEVELS[level]
    setThinking(true)
    worker.postMessage('stop')
    worker.postMessage('setoption name UCI_LimitStrength value true')
    worker.postMessage(`setoption name UCI_Elo value ${cfg.elo}`)
    worker.postMessage(`position fen ${game.fen()}`)
    worker.postMessage(`go depth ${cfg.depth} movetime ${cfg.time}`)
  }, [fen, ready, thinking, color, level, game])

  const selectSquare = (square: Square) => {
    if (thinking || game.turn() !== color || game.isGameOver()) return
    const piece = game.get(square)
    if (!selected) {
      if (piece?.color !== color) return
      setSelected(square)
      setLegal(game.moves({ square, verbose: true }).map(m => m.to as Square))
      return
    }
    if (piece?.color === color) {
      setSelected(square)
      setLegal(game.moves({ square, verbose: true }).map(m => m.to as Square))
      return
    }
    if (!legal.includes(square)) { setSelected(null); setLegal([]); return }
    try { game.move({ from: selected, to: square, promotion: 'q' }); sync(); setSelected(null); setLegal([]) } catch { setSelected(null); setLegal([]) }
  }

  const drop = ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => {
    if (thinking || game.turn() !== color || game.isGameOver()) return false
    const moves = game.moves({ square: sourceSquare, verbose: true })
    const move = moves.find(m => m.to === targetSquare)
    if (!move) return false
    try { game.move({ from: sourceSquare, to: targetSquare, promotion: move.promotion || 'q' }); sync(); setSelected(null); setLegal([]); return true } catch { return false }
  }

  const newGame = (nextColor: Color = color) => {
    workerRef.current?.postMessage('stop')
    gameRef.current = new Chess(); setColor(nextColor); setFen(gameRef.current.fen()); setHistory([]); setThinking(false); setEvaluation(0); setPv(''); setSelected(null); setLegal([])
  }

  const undo = () => {
    if (thinking || !history.length) return
    const g = new Chess()
    history.forEach(m => g.move({ from: m.from, to: m.to, promotion: m.promotion }))
    g.undo(); if (g.turn() !== color && g.history().length) g.undo()
    gameRef.current = g; sync(); setThinking(false)
  }

  const loadFen = () => {
    try { gameRef.current = new Chess(fenInput.trim()); sync(); setFenInput(''); setSelected(null); setLegal([]) } catch { /* invalid FEN */ }
  }

  const status = game.isCheckmate() ? 'Checkmate' : game.isStalemate() ? 'Stalemate' : game.isDraw() ? 'Draw' : game.isCheck() ? 'Check' : thinking ? 'Stockfish is thinking…' : `${color === game.turn() ? 'Your' : 'Stockfish'} move`
  const styles: Record<string, object> = {}
  legal.forEach(s => { styles[s] = { background: 'radial-gradient(circle, rgba(70,170,100,.72) 0 12%, transparent 13%)' } })
  if (selected) styles[selected] = { boxShadow: 'inset 0 0 0 4px #d2b36f' }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span>♞</span><div><b>VHX CHESS</b><small>STOCKFISH 18</small></div></div><div className="engine-state"><i className={ready ? 'ready' : ''}/> {ready ? 'ENGINE READY' : 'LOADING ENGINE'}</div></header>
    <section className="game-grid">
      <div><div className="player-strip"><span>{color === 'w' ? 'YOU · WHITE' : 'STOCKFISH · WHITE'}</span><span>{color === 'w' ? 'STOCKFISH · BLACK' : 'YOU · BLACK'}</span></div><div className="board-frame"><Chessboard options={{ position: fen, boardOrientation: flipped ? (color === 'w' ? 'black' : 'white') : (color === 'w' ? 'white' : 'black'), arePiecesDraggable: true, onPieceDrop: drop, onSquareClick: (args) => selectSquare(args.square), onPieceClick: (args) => selectSquare(args.square), customSquareStyles: styles, customDarkSquareStyle: { backgroundColor: '#59615f' }, customLightSquareStyle: { backgroundColor: '#ddd6c8' } }} /></div><div className="status-line"><span className={thinking ? 'thinking-dot' : 'status-dot'}/><b>{status}</b><span>{history.length} ply</span></div></div>
      <aside className="side-panel"><div className="eval-title"><span>EVALUATION</span><b>{evaluation >= 0 ? '+' : ''}{evaluation.toFixed(2)}</b></div><div className="eval-track"><div style={{ width: `${Math.max(4, Math.min(96, 50 + evaluation * 12))}%` }}/></div><small>{pv || 'Waiting for engine analysis'}</small><section className="control"><label>DIFFICULTY</label><div className="level-grid">{LEVELS.map((x, i) => <button key={x.name} className={level === i ? 'active' : ''} onClick={() => setLevel(i)}>{x.name}<small>{x.depth} ply</small></button>)}</div></section><div className="buttons"><button className="primary" onClick={() => newGame()}>NEW GAME</button><button onClick={undo}>UNDO</button><button onClick={() => setFlipped(v => !v)}>FLIP BOARD</button><button onClick={() => newGame(color === 'w' ? 'b' : 'w')}>PLAY {color === 'w' ? 'BLACK' : 'WHITE'}</button></div><section className="moves-panel"><label>MOVE HISTORY</label><div className="move-list">{rows.length ? rows.map(r => <div className="move-row" key={r.n}><span>{r.n}.</span><b>{r.w?.san || ''}</b><b>{r.b?.san || ''}</b></div>) : <div className="empty">No moves yet</div>}</div></section><section className="fen-panel"><label>LOAD FEN</label><div><input value={fenInput} onChange={e => setFenInput(e.target.value)} placeholder="Paste FEN…"/><button onClick={loadFen}>LOAD</button></div></section></aside>
    </section>
  </main>
}
