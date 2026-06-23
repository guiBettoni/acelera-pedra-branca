import { useState, useEffect, useRef, useCallback } from 'react'

const ZOOM_LEVELS = [100, 115, 130, 150]
const ZOOM_KEY = 'apb_zoom'
const TTS_LANG = 'pt-BR'

function getPageText() {
  const main = document.getElementById('main-content')
  if (!main) return ''
  // coleta só texto visível, ignora aria-hidden
  const walker = document.createTreeWalker(
    main,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const el = node.parentElement
        if (!el) return NodeFilter.FILTER_REJECT
        if (el.closest('[aria-hidden="true"]')) return NodeFilter.FILTER_REJECT
        if (getComputedStyle(el).display === 'none') return NodeFilter.FILTER_REJECT
        if (getComputedStyle(el).visibility === 'hidden') return NodeFilter.FILTER_REJECT
        const text = node.textContent.trim()
        return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    }
  )
  const parts = []
  let node
  while ((node = walker.nextNode())) {
    const t = node.textContent.trim()
    if (t) parts.push(t)
  }
  return parts.join(' ')
}

export default function AccessibilityPanel() {
  const [open,    setOpen]    = useState(false)
  const [zoomIdx, setZoomIdx] = useState(() => {
    const saved = parseInt(localStorage.getItem(ZOOM_KEY) || '0')
    const idx = ZOOM_LEVELS.indexOf(saved)
    return idx >= 0 ? idx : 0
  })
  const [speaking,  setSpeaking]  = useState(false)
  const [paused,    setPaused]    = useState(false)
  const [ttsSupport, setTtsSupport] = useState(false)
  const uttRef = useRef(null)

  // aplica zoom via font-size raiz
  useEffect(() => {
    const pct = ZOOM_LEVELS[zoomIdx]
    document.documentElement.style.fontSize = pct === 100 ? '' : `${pct}%`
    localStorage.setItem(ZOOM_KEY, pct)
  }, [zoomIdx])

  useEffect(() => {
    setTtsSupport('speechSynthesis' in window)
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  const zoomIn  = () => setZoomIdx(i => Math.min(i + 1, ZOOM_LEVELS.length - 1))
  const zoomOut = () => setZoomIdx(i => Math.max(i - 1, 0))

  const speak = useCallback(() => {
    if (!ttsSupport) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
      return
    }
    window.speechSynthesis.cancel()
    const text = getPageText()
    if (!text) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = TTS_LANG
    utt.rate = 0.95
    utt.pitch = 1
    // tenta voz pt-BR
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utt.voice = ptVoice
    utt.onstart  = () => setSpeaking(true)
    utt.onend    = () => { setSpeaking(false); setPaused(false) }
    utt.onerror  = () => { setSpeaking(false); setPaused(false) }
    uttRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [ttsSupport, paused])

  const pause = () => {
    window.speechSynthesis.pause()
    setPaused(true)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  const pct = ZOOM_LEVELS[zoomIdx]

  return (
    <div className="a11y-wrap" role="region" aria-label="Painel de acessibilidade">
      {/* botão flutuante */}
      <button
        className={`a11y-fab${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Fechar painel de acessibilidade' : 'Abrir painel de acessibilidade'}
        title="Acessibilidade"
      >
        <span aria-hidden="true">♿</span>
      </button>

      {/* painel */}
      {open && (
        <div className="a11y-panel" role="dialog" aria-label="Opções de acessibilidade" aria-modal="false">
          <div className="a11y-panel-title">Acessibilidade</div>

          {/* zoom */}
          <div className="a11y-section">
            <div className="a11y-label" id="zoom-label">Tamanho do texto</div>
            <div className="a11y-row" role="group" aria-labelledby="zoom-label">
              <button
                className="a11y-btn"
                onClick={zoomOut}
                disabled={zoomIdx === 0}
                aria-label="Diminuir texto"
                title="Diminuir texto"
              >A−</button>
              <span className="a11y-val" aria-live="polite" aria-atomic="true">{pct}%</span>
              <button
                className="a11y-btn"
                onClick={zoomIn}
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                aria-label="Aumentar texto"
                title="Aumentar texto"
              >A+</button>
            </div>
          </div>

          {/* TTS */}
          {ttsSupport && (
            <div className="a11y-section">
              <div className="a11y-label">Leitura em voz alta</div>
              <div className="a11y-row">
                {!speaking ? (
                  <button className="a11y-btn a11y-btn--primary" onClick={speak} aria-label="Ler página em voz alta">
                    ▶ Ler página
                  </button>
                ) : (
                  <>
                    <button className="a11y-btn" onClick={paused ? speak : pause} aria-label={paused ? 'Retomar leitura' : 'Pausar leitura'}>
                      {paused ? '▶' : '⏸'}
                    </button>
                    <button className="a11y-btn a11y-btn--stop" onClick={stop} aria-label="Parar leitura">
                      ⏹ Parar
                    </button>
                  </>
                )}
              </div>
              {speaking && (
                <div className="a11y-reading" role="status" aria-live="polite">
                  {paused ? 'Leitura pausada' : 'Lendo página...'}
                </div>
              )}
            </div>
          )}

          {!ttsSupport && (
            <div className="a11y-section">
              <div className="a11y-label" style={{ opacity: 0.5 }}>Leitura em voz alta não suportada neste navegador</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
