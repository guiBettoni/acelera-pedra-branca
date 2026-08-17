import { useState, useCallback, useEffect, useRef } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    setMsg(text)
    setVisible(true)
    clearTimeout(timer.current)
    const duration = Math.min(8000, Math.max(3000, text.length * 70))
    timer.current = setTimeout(() => setVisible(false), duration)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { msg, visible, showToast }
}

export default function Toast({ msg, visible }) {
  return (
    <div id="toast" className={visible ? 'show' : ''}>
      <span id="toast-msg">{msg}</span>
    </div>
  )
}
