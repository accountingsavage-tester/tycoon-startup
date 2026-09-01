'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'

type Difficulty = { label: string; depth: number; movetime: number }
const DIFFICULTIES: Difficulty[] = [
  { label: 'Casual', depth: 8, movetime: 180 },
  { label: 'Balanced', depth: 12, movetime: 450 },
  { label: 'Strong', depth: 16, movetime: 900 },
  { label: 'Brutal', depth: 20, movetime: 1600 },
]

const PIECES: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
}
const FILES = ['a','b','c','d','e','f','g','h']
const RANKS = [8,7,6,5,4,3,2,1]

function square(file: number, rank: number) { return `${FILES[file]}${rank}` as Square }

export default function Home() {
  const gameRef = useRef(new Chess())
  const workerRef = useRef<Worker | null>(null)
  const workerUrlRef = useRef<string | null>(null)
  const [fen, setFen] = useState(gameRef.current.fen())
  const [selected, setSelected] = useState<Square | null>(null)
  const [legalTargets, setLegalTargets] = useState<Square[]>([])
  const [thinking, setThinking] = useState(false)
  const [difficulty, setDifficulty] = useState(1)
  const [humanColor, setHumanColor] = useState<Color>('w')
  const [history, setHistory] = useState<Move[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [evalText, setEvalText] = useState('0.0')
  const [engineReady, setEngineReady] = useState(false)
  const [status, setStatus] = useState('Your move')

  const game = gameRef.current
  const board = useMemo(() => game.board(), [fen])

  const cleanupEngine = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    if (workerUrlRef.current) URL.revokeObjectURL(workerUrlRef.current)
    workerUrlRef.current = null
  }, [])

  const createEngine = useCallback(() => {
    cleanupEngine()
    const code = `importScripts('https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-lite-single.js');`
    const blob = new Blob([code], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    workerUrlRef.current = url
    const worker = new Worker(url)
    workerRef.current = worker
    worker.onmessage = (event) => {
      const line = typeof event.data === 'string' ? event.data : ''
      if (line.startsWith('uciok')) setEngineReady(true)
      if (line.startsWith('info') && line.includes('score')) {
        const cp = line.match(/score cp (-?\d+)/)?.[1]
        const mate = line.match(/score mate (-?\d+)/)?.[1]
        if (mate) setEvalText(`M${mate}`)
        else if (cp) setEvalText((Number(cp) / 100).toFixed(2))
      }
      const match = line.match(/^bestmove\s([a-h][1-8])([a-h][1-8])([qrbn])?/) 
      if (match) {
        const current = gameRef.current
        try {
          const move = current.move({ from: match[1] as Square, to: match[2] as Square, promotion: (match[3] || 'q') as 'q'|'r'|'b'|'n' })
          if (move) {
            setHistory([...current.history({ verbose: true })])
            setLastMove({ from: move.from as Square, to: move.to as Square })
            setFen(current.fen())
            setSelected(null)
            setLegalTargets([])
            setThinking(false)
            setStatus(current.isGameOver() ? resultText(current) : 'Your move')
          } else setThinking(false)
        } catch { setThinking(false) }
      }
    }
    worker.onerror = () => { setThinking(false); setStatus('Engine failed to load') }
    worker.postMessage('uci')
    return worker
  }, [cleanupEngine])

  useEffect(() => {
    const worker = createEngine()
    return () => { worker.terminate(); if (workerUrlRef.current) URL.revokeObjectURL(workerUrlRef.current) }
  }, [createEngine])

  const askEngine = useCallback(() => {
    if (!workerRef.current || !engineReady || gameRef.current.isGameOver()) return
    setThinking(true)
    setStatus('Stockfish is thinking…')
    const d = DIFFICULTIES[difficulty]
    workerRef.current.postMessage('stop')
    workerRef.current.postMessage(`setoption name Threads value 1`)
    workerRef.current.postMessage(`position fen ${gameRef.current.fen()}`)
    workerRef.current.postMessage(`go depth ${d.depth} movetime ${d.movetime}`)
  }, [difficulty, engineReady])

  useEffect(() => {
    if (!thinking && gameRef.current.turn() === humanColor && !gameRef.current.isGameOver()) setStatus('Your move')
  }, [fen, humanColor, thinking])

  const selectPiece = (sq: Square) => {
    if (thinking || game.turn() !== humanColor || game.isGameOver()) return
    const piece = game.get(sq)
    if (selected) {
      if (legalTargets.includes(sq)) {
        try {
          const move = game.move({ from: selected, to: sq, promotion: 'q' })
          if (move) {
            setHistory([...game.history({ verbose: true })])
            setLastMove({ from: move.from as Square, to: move.to as Square })
            setFen(game.fen())
            setSelected(null); setLegalTargets([])
            setStatus('Stockfish is thinking…')
            setTimeout(askEngine, 30)
            return
          }
        } catch {}
      }
      if (piece?.color === humanColor) {
        setSelected(sq)
        setLegalTargets(game.moves({ square: sq, verbose: true }).map(m => m.to as Square))
      } else { setSelected(null); setLegalTargets([]) }
      return
    }
    if (piece?.color === humanColor) {
      setSelected(sq)
      setLegalTargets(game.moves({ square: sq, verbose: true }).map(m => m.to as Square))
    }
  }

  const newGame = (color: Color = humanColor) => {
    const next = new Chess()
    gameRef.current = next
    setHumanColor(color)
    setFen(next.fen()); setHistory([]); setSelected(null); setLegalTargets([]); setLastMove(null); setEvalText('0.0'); setThinking(false)
    setStatus(color === 'w' ? 'Your move' : 'Stockfish is thinking…')
    setTimeout(() => { if (color === 'b') askEngine() }, 50)
  }

  const flipColor = () => newGame(humanColor === 'w' ? 'b' : 'w')
  const isCheck = game.isCheck()

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="king-mark">♞</span><div><strong>VHX CHESS</strong><small>STOCKFISH 18</small></div></div>
        <div className="engine-pill"><span className={engineReady ? 'dot ready' : 'dot'} /> {engineReady ? 'ENGINE READY' : 'LOADING ENGINE'}</div>
      </header>

      <section className="layout">
        <div className="board-wrap">
          <div className="rank-labels">{RANKS.map(r => <span key={r}>{r}</span>)}</div>
          <div className="board" aria-label="Chess board">
            {RANKS.flatMap((rank, ri) => FILES.map((file, fi) => {
              const sq = square(fi, rank)
              const piece = game.get(sq)
              const dark = (ri + fi) % 2 === 1
              const selectedHere = selected === sq
              const target = legalTargets.includes(sq)
              const last = lastMove?.from === sq || lastMove?.to === sq
              return <button key={sq} className={`square ${dark ? 'dark' : 'light'} ${selectedHere ? 'selected' : ''} ${last ? 'last' : ''}`} onClick={() => selectPiece(sq)} aria-label={sq}>
                {piece && <span className={`piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>{PIECES[piece.color + piece.type]}</span>}
                {target && <span className={piece ? 'capture-dot' : 'move-dot'} />}
                {fi === 0 && <span className="coord rank">{rank}</span>}
                {ri === 7 && <span className="coord file">{FILES[fi]}</span>}
              </button>
            }))}
          </div>
        </div>

        <aside className="panel">
          <div className="status-card"><div className="status-title"><span className={thinking ? 'pulse' : 'status-dot'} />{status}</div><div className="eval">Eval <b>{evalText}</b></div></div>
          <div className="control-block"><label>DIFFICULTY</label><div className="segmented">{DIFFICULTIES.map((d, i) => <button key={d.label} className={difficulty === i ? 'active' : ''} onClick={() => setDifficulty(i)}>{d.label}</button>)}</div></div>
          <div className="actions"><button onClick={() => newGame()} className="primary">NEW GAME</button><button onClick={flipColor}>PLAY AS {humanColor === 'w' ? 'BLACK' : 'WHITE'}</button></div>
          <div className="moves"><div className="moves-head"><span>MOVE HISTORY</span><span>{Math.ceil(history.length / 2)} moves</span></div><div className="move-list">{Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => <div className="move-row" key={i}><span>{i + 1}.</span><b>{history[i*2]?.san || ''}</b><b>{history[i*2+1]?.san || ''}</b></div>)}</div></div>
          <div className="tip">{isCheck && !game.isGameOver() ? 'CHECK' : game.isGameOver() ? resultText(game) : 'Click a piece, then a highlighted square.'}</div>
        </aside>
      </section>
      <footer><span>LOCAL ENGINE</span><span>•</span><span>STOCKFISH 18 LITE SINGLE-THREADED</span><span>•</span><span>NO ACCOUNT REQUIRED</span></footer>
    </main>
  )
}

function resultText(game: Chess) {
  if (game.isCheckmate()) return `Checkmate • ${game.turn() === 'w' ? 'Black' : 'White'} wins`
  if (game.isDraw()) return 'Draw'
  return 'Game over'
}
