'use client'

type Field = {
  label: string
  value: string | number | boolean
}

type Props = {
  title: string
  fields: Field[]
  onClose: () => void
}

export default function ViewRecordModal({ title, fields, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#0b1d4a]">{title}</h2>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#0b1d4a] text-2xl transition-colors">&times;</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f, i) => (
            <div key={i}>
              <p className="text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: '#0b1d4a' }}>{f.label}</p>
              <p className="text-[#111827] font-semibold text-sm border-2 border-black rounded-md px-2.5 py-1.5 bg-white">
                {typeof f.value === 'boolean' ? (f.value ? 'Sí' : 'No') : (f.value || '—')}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-[#374151] text-sm font-medium"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
