import { useRef, useState } from 'react'

interface Props {
  onFile: (content: string, filename: string) => void
}

export function FileUpload({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const buffer = e.target?.result as ArrayBuffer
      const bytes = new Uint8Array(buffer)
      // Detect UTF-16 BOM (0xFF 0xFE = LE, 0xFE 0xFF = BE); fall back to UTF-8
      let encoding = 'utf-8'
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) encoding = 'utf-16le'
      else if (bytes[0] === 0xFE && bytes[1] === 0xFF) encoding = 'utf-16be'
      const text = new TextDecoder(encoding).decode(buffer)
      onFile(text, file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm"
        className="hidden"
        onChange={handleChange}
      />
      <div className="mb-3 text-5xl">📄</div>
      <p className="text-lg font-semibold text-slate-700">
        Drop 12d HTML report here, or click to browse
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Accepts .html or .htm files exported from 12d Model
      </p>
    </div>
  )
}
