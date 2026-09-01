'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type Move, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'

const LEVELS = [
  { label: 'Easy', depth: 4, time: 100, elo: 1100 },
  { label: 'Medium', depth: 8, time: 500, elo: 1500 },
  { label: 'Hard', depth: 16, time: 2000, elo: 2100 },
  { label: 'Extreme', depth: 22, time: 5000, elo: 2800 },
]
const PIECES: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
const START_FEN = new Chess().fen()

function gameStatus(game: Chess) {
  if (game.isCheckmate()) return `Checkmate • ${game.turn() === 'w' ? 'Black' : 'White'} wins`
  if (game.isStalemate()) return 'Stalemate • Draw'
  if (game.isThreefoldRepetition()) return 'Threefold repetition • Draw'
  if (game.isInsufficientMaterial()) return 'Insufficient material • Draw'
  if (game.isDraw()) return 'Draw'
  if (game.isCheck()) return `${game.turn() === 'w' ? 'White' : 'Black'} is in check`
  return `${game.turn() === 'w' ? 'White' : 'Black'} to move`
}

function capturedPieces(history: Move[]) {
  const captured: { w: string[]; b: string[] } = { w: [], b: [] }
  for (const move of history) {
    if (move.captured) {
      const taken = move.captured
      if (move.color === 'w') captured.w.push(PIECES[taken])
      else captured.b.push(PIECES[taken])
    }
  }
  return captured
}

export default function Home() {
  const gameRef = useRef(new Chess())
  const engineRef = useRef<Worker | null>(null)
  const requestRef = useRef(0)
  const [fen, setFen] = useState(START_FEN)
  const [history, setHistory] = useState<Move[]>([])
  const [level, setLevel] = useState(1)
  const [humanColor, setHumanColor] = useState<Color>('w')
  const [thinking, setThinking] = useState(false)
  const [engineReady, setEngineReady] = useState(false)
  const [evalCp, setEvalCp] = useState(0)
  const [bestLine, setBestLine] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<Square | null>(null)
  const [legalSquares, setLegalSquares] = useState<Square[]>([])
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null)
  const [fenInput, setFenInput] = useState('')
  const [notice, setNotice] = useState('')

  const game = gameRef.current
  const captured = useMemo(() => capturedPieces(history), [history])
  const movesByPair = useMemo(() => {
    const rows: { number: number; white?: Move; black?: Move }[] = []
    history.forEach((move, i) => {
      if (move.color === 'w') rows.push({ number: Math.floor(i / 2) + 1, white: move })
      else if (rows.length) rows[rows.length - 1].black = move
    })
    return rows
  }, [history])

  const sync = useCallback(() => {
    const current = gameRef.current
    setFen(current.fen())
    setHistory([...current.history({ verbose: true })])
  }, [])

  const sendEngine = useCallback(() => {
    const worker = engineRef.current
    const current = gameRef.current
    if (!worker || !engineReady || current.isGameOver() || current.turn() === humanColor) return
    const id = ++requestRef.current
    const cfg = LEVELS[level]
    setThinking(true)
    setNotice('Stockfish is thinking…')
    worker.postMessage('stop')
    worker.postMessage(`setoption name UCI_LimitStrength value true`)
    worker.postMessage(`setoption name UCI_Elo value ${cfg.elo}`)
    worker.postMessage(`position fen ${current.fen()}`)
    worker.postMessage(`go depth ${cfg.depth} movetime ${cfg.time}`)
    const timeout = window.setTimeout(() => {
      if (id === requestRef.current) worker.postMessage('stop')
    }, cfg.time + 3000)
    return () => window.clearTimeout(timeout)
  }, [engineReady, humanColor, level])

  useEffect(() => {
    const worker = new Worker('/stockfish-worker.js')
    engineRef.current = worker
    worker.onmessage = (event) => {
      const line = String(event.data ?? '').trim()
      if (line === 'uciok') { setEngineReady(true); worker.postMessage('isready'); return }
      if (line.startsWith('readyok')) { setEngineReady(true); return }
      if (line.startsWith('info') && line.includes('score')) {
        const cp = line.match(/score cp (-?\d+)/)?.[1]
        const mate = line.match(/score mate (-?\d+)/)?.[1]
        if (mate) setBestLine(`Mate in ${Math.abs(Number(mate))}`)
        else if (cp) setEvalCp(Number(cp))
        const pv = line.match(/ pv (.+)$/)?.[1]
        if (pv) setBestLine(pv.split(' ').slice(0, 6).join(' '))
      }
      const match = line.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?/) 
      if (!match) return
      const current = gameRef.current
      try {
        const move = current.move({ from: match[1] as Square, to: match[2] as Square, promotion: (match[3] || 'q') as 'q' | 'r' | 'b' | 'n' })
        if (move) { sync(); setThinking(false); setNotice('Your move'); setSelected(null); setLegalSquares([]) }
      } catch { setThinking(false); setNotice('Engine returned an invalid move') }
    }
    worker.onerror = () => { setEngineReady(false); setThinking(false); setNotice('Stockfish failed to load') }
    worker.postMessage('uci')
    return () => { worker.terminate(); engineRef.current = null }
  }, [sync])

  useEffect(() => {
    if (game.turn() !== humanColor && !game.isGameOver() && engineReady && !thinking) sendEngine()
  }, [fen, humanColor, engineReady, thinking, sendEngine, game])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vhx-chess-state')
      if (!saved) return
      const data = JSON.parse(saved) as { fen?: string; color?: Color; level?: number; flipped?: boolean }
      if (data.fen) { const restored = new Chess(data.fen); gameRef.current = restored; sync() }
      if (data.color === 'w' || data.color === 'b') setHumanColor(data.color)
      if (typeof data.level === 'number') setLevel(Math.max(0, Math.min(3, data.level)))
      if (typeof data.flipped === 'boolean') setFlipped(data.flipped)
    } catch { /* ignore corrupted local state */ }
  }, [sync])

  useEffect(() => {
    localStorage.setItem('vhx-chess-state', JSON.stringify({ fen, color: humanColor, level, flipped }))
  }, [fen, humanColor, level, flipped])

  const selectSquare = (sq: Square) => {
    if (thinking || game.turn() !== humanColor || game.isGameOver()) return
    const piece = game.get(sq)
    if (!selected) {
      if (piece?.color !== humanColor) return
      setSelected(sq)
      setLegalSquares(game.moves({ square: sq, verbose: true }).map(m => m.to as Square))
      return
    }
    if (selected === sq) { setSelected(null); setLegalSquares([]); return }
    if (piece?.color === humanColor) {
      setSelected(sq)
      setLegalSquares(game.moves({ square: sq, verbose: true }).map(m => m.to as Square))
      return
    }
    const move = game.moves({ square: selected, verbose: true }).find(m => m.to === sq)
    if (!move) { setSelected(null); setLegalSquares([]); return }
    const isPromotion = move.promotion || (move.piece === 'p' && (sq[1] === '8' || sq[1] === '1'))
    if (isPromotion) { setPromotion({ from: selected, to: sq }); return }
    try { game.move({ from: selected, to: sq }); sync(); setSelected(null); setLegalSquares([]); setNotice('Stockfish is thinking…') } catch { setNotice('Illegal move') }
  }

  const dropPiece = (from: string, to: string) => {
    if (thinking || game.turn() !== humanColor || game.isGameOver()) return false
    const legal = game.moves({ square: from as Square, verbose: true }).find(m => m.to === to)
    if (!legal) return false
    const isPromotion = legal.promotion || (legal.piece === 'p' && (to[1] === '8' || to[1] === '1'))
    if (isPromotion) { setPromotion({ from: from as Square, to: to as Square }); return false }
    try { game.move({ from: from as Square, to: to as Square }); sync(); setSelected(null); setLegalSquares([]); setNotice('Stockfish is thinking…'); return true } catch { return false }
  }

  const promote = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!promotion) return
    try { game.move({ from: promotion.from, to: promotion.to, promotion: piece }); sync(); setPromotion(null); setSelected(null); setLegalSquares([]); setNotice('Stockfish is thinking…') } catch { setNotice('Promotion failed') }
  }

  const newGame = (color: Color = humanColor) => {
    engineRef.current?.postMessage('stop'); requestRef.current++
    gameRef.current = new Chess(); setHumanColor(color); setFen(START_FEN); setHistory([]); setSelected(null); setLegalSquares([]); setPromotion(null); setEvalCp(0); setBestLine(''); setThinking(false); setNotice(color === 'w' ? 'Your move' : 'Stockfish is thinking…')
  }

  const undo = () => {
    if (thinking || history.length === 0) return
    engineRef.current?.postMessage('stop'); requestRef.current++
    const current = new Chess()
    for (const move of history) current.move({ from: move.from, to: move.to, promotion: move.promotion })
    current.undo()
    if (current.turn() !== humanColor && current.history().length) current.undo()
    gameRef.current = current; sync(); setThinking(false); setSelected(null); setLegalSquares([]); setNotice('Your move')
  }

  const loadFen = () => {
    try { gameRef.current = new Chess(fenInput.trim()); sync(); setFenInput(''); setSelected(null); setLegalSquares([]); setNotice('Position loaded') } catch { setNotice('Invalid FEN') }
  }

  const evalValue = Math.max(-1, Math.min(1, evalCp / 500))
  const boardStyles: any = {}
  for (const sq of legalSquares) boardStyles[sq] = { background: 'radial-gradient(circle, rgba(50,180,100,.72) 0 13%, transparent 15%)' }
  if (selected) boardStyles[selected] = { boxShadow: 'inset 0 0 0 4px rgba(218,177,93,.95)' }
  const kingSquare = game.isCheck() ? (game.turn() === 'w' ? Object.keys(game.board()).length ? null : null : null) : null
  void kingSquare

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-knight">♞</span><div><b>VHX CHESS</b><small>STOCKFISH 18</small></div></div><div className="engine-state"><i className={engineReady ? 'ready' : ''}/> {engineReady ? 'ENGINE READY' : 'LOADING ENGINE'}</div></header>
      <section className="game-grid">
        <div className="board-column">
          <div className="player-strip"><span>{humanColor === 'w' ? 'YOU' : 'STOCKFISH'}</span><span>{humanColor === 'w' ? 'WHITE' : 'WHITE'}</span></div>
          <div className="board-frame"><Chessboard options={{ id: 'vhx-board', position: fen, boardOrientation: flipped ? (humanColor === 'w' ? 'black' : 'white') : (humanColor === 'w' ? 'white' : 'black'), allowDragOutsideBoard: false, arePiecesDraggable: true, animationDuration: 180, autoPromoteToQueen: false, onPieceDrop: dropPiece, onSquareClick: (sq: Square) => selectSquare(sq), onPieceClick: (_piece: string, sq: Square) => selectSquare(sq), customSquareStyles: boardStyles, customDarkSquareStyle: { backgroundColor: '#5a625f' }, customLightSquareStyle: { backgroundColor: '#ddd6c8' }, customDropSquareStyle: { boxShadow: 'inset 0 0 0 5px rgba(218,177,93,.8)' }, showBoardNotation: true, showPromotionDialog: Boolean(promotion), promotionDialogVariant: 'modal', promotionToSquare: promotion?.to ?? null, onPromotionPieceSelect: (piece: string) => { const p = piece.toLowerCase().slice(-1) as 'q'|'r'|'b'|'n'; promote(p); return true }, onPromotionCheck: (_from: string, _to: string, _piece: string) => false }} /></div>
          <div className="captured"><span className="captured-label">CAPTURED</span><span>{captured.b.join(' ')}</span><span className="captured-spacer"/><span>{captured.w.join(' ')}</span></div>
          <div className="status-line"><span className={thinking ? 'thinking-dot' : 'status-dot'}/><b>{notice || gameStatus(game)}</b><span className="move-count">{Math.ceil(history.length / 2)} moves</span></div>
        </div>
        <aside className="side-panel">
          <div className="eval-panel"><div className="eval-title"><span>EVALUATION</span><b>{game.isCheckmate() ? 'MATE' : `${(evalCp / 100).toFixed(2)}`}</b></div><div className="eval-track"><div className="eval-center"/><div className="eval-fill" style={{ width: `${50 + evalValue * 50}%` }}/></div><small>{bestLine ? `PV  ${bestLine}` : 'Waiting for engine analysis'}</small></div>
          <div className="control"><label>DIFFICULTY</label><div className="level-grid">{LEVELS.map((item, i) => <button key={item.label} className={i === level ? 'active' : ''} onClick={() => setLevel(i)}>{item.label}<small>{item.depth}+ ply</small></button>)}</div></div>
          <div className="buttons"><button className="primary" onClick={() => newGame()}>NEW GAME</button><button onClick={undo}>UNDO</button><button onClick={() => setFlipped(v => !v)}>FLIP BOARD</button><button onClick={() => newGame(humanColor === 'w' ? 'b' : 'w')}>PLAY {humanColor === 'w' ? 'BLACK' : 'WHITE'}</button></div>
          <div className="moves-panel"><div className="panel-heading"><span>MOVE HISTORY</span><span>ALGEBRAIC / COORD</span></div><div className="move-list">{movesByPair.length === 0 && <div className="empty">No moves yet</div>}{movesByPair.map(row => <div className="move-row" key={row.number}><span>{row.number}.</span><b>{row.white?.san ?? ''}</b><small>{row.white ? `${row.white.from}–${row.white.to}` : ''}</small><b>{row.black?.san ?? ''}</b><small>{row.black ? `${row.black.from}–${row.black.to}` : ''}</small></div>)}</div></div>
          <div className="fen-panel"><label>LOAD FEN</label><div><input value={fenInput} onChange={e => setFenInput(e.target.value)} placeholder="Paste a FEN position…"/><button onClick={loadFen}>LOAD</button></div></div>
          <div className="footer-note">LOCAL AI • NO ACCOUNT • GAME SAVED LOCALLY</div>
        </aside>
      </section>
    </main>
  )
}
