import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'

async function cropImageToBase64(imageSrc, croppedAreaPixels, size = 300) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, size, size
      )
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    })
    image.addEventListener('error', reject)
    image.src = imageSrc
  })
}

export default function PhotoCropModal({ src, onConfirm, onCancel, onError }) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 })
  const [zoom, setZoom]       = useState(1)
  const [croppedArea, setCroppedArea] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setLoadError(false)
    const img = new Image()
    img.onerror = () => {
      setLoadError(true)
      onError?.(new Error('Não foi possível abrir essa imagem — formato não suportado pelo navegador (comum em fotos HEIC do iPhone). Exporte como JPG ou PNG e tente de novo.'))
    }
    img.src = src
    return () => { img.onerror = null }
  }, [src])

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    try {
      const b64 = await cropImageToBase64(src, croppedArea, 300)
      onConfirm(b64)
    } catch (err) {
      onError?.(err)
      onCancel?.()
    }
  }

  if (loadError) {
    return (
      <div className="crop-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
        <div className="crop-modal">
          <p className="crop-title">Não foi possível abrir essa foto</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 1rem' }}>
            O formato do arquivo não é suportado pelo navegador — isso é comum em fotos HEIC tiradas por iPhone. Exporte a foto como JPG ou PNG e envie novamente.
          </p>
          <div className="crop-actions">
            <button type="button" className="btn-o crop-btn" onClick={onCancel}>Fechar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="crop-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="crop-modal">
        <p className="crop-title">Ajustar foto</p>
        <div className="crop-area">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="crop-zoom-row">
          <span className="crop-zoom-label">Zoom</span>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="crop-zoom-slider"
          />
        </div>
        <div className="crop-actions">
          <button type="button" className="btn-o crop-btn" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn-p crop-btn" onClick={handleConfirm}>Usar foto</button>
        </div>
      </div>
    </div>
  )
}
