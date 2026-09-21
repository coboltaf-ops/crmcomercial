'use client'
import { useState } from 'react'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { REFERENCE_TABLES, ReferenceTableId } from '@/features/referencias/types'
import { exportToPDF, exportToExcel } from '@/shared/lib/export-report'
import { useIdioma } from '@/shared/i18n/use-t'

export default function ReferenciasPage() {
  const idioma = useIdioma()
  const L = (es: string, en: string) => (idioma === 'en' ? en : es)
  const { data, addItem, updateItem, deleteItem, vendedores, addVendedor, updateVendedor, deleteVendedor } = useReferenceStore()
  const [selectedTable, setSelectedTable] = useState<ReferenceTableId>('pais')
  const [editId, setEditId] = useState<string | null>(null)
  const [desc, setDesc] = useState('')

  // Vendedores fields
  const [vNombre, setVNombre] = useState('')
  const [vApellido, setVApellido] = useState('')
  const [vCorreo, setVCorreo] = useState('')
  const [vMovil, setVMovil] = useState('')

  const isVendedores = selectedTable === 'vendedores'
  const items = data[selectedTable] || []
  const tableLabel = REFERENCE_TABLES.find(t => t.id === selectedTable)?.label || selectedTable

  const handleAdd = () => {
    if (!desc.trim()) return
    if (items.some(i => i.descripcion.toLowerCase() === desc.trim().toLowerCase())) { alert(L('Ya existe', 'Already exists')); return }
    addItem(selectedTable, { id: crypto.randomUUID(), descripcion: desc.trim(), situacion: true })
    setDesc('')
  }

  const handleUpdate = () => {
    if (!editId || !desc.trim()) return
    updateItem(selectedTable, editId, { descripcion: desc.trim() })
    setEditId(null); setDesc('')
  }

  const nextVendedorCodigo = () => {
    const nums = vendedores.map(v => { const m = v.codigo.match(/^VEN-(\d+)$/); return m ? parseInt(m[1]) : 0 })
    const max = nums.length ? Math.max(...nums) : 0
    return `VEN-${String(max + 1).padStart(3, '0')}`
  }

  const handleAddVendedor = () => {
    if (!vNombre.trim() || !vApellido.trim()) { alert(L('Nombre y Apellido son obligatorios', 'First name and Last name are required')); return }
    addVendedor({ id: crypto.randomUUID(), codigo: nextVendedorCodigo(), nombre: vNombre.trim(), apellido: vApellido.trim(), correo: vCorreo.trim(), nro_movil: vMovil.trim(), situacion: true })
    setVNombre(''); setVApellido(''); setVCorreo(''); setVMovil('')
  }

  const handleUpdateVendedor = () => {
    if (!editId || !vNombre.trim() || !vApellido.trim()) return
    updateVendedor(editId, { nombre: vNombre.trim(), apellido: vApellido.trim(), correo: vCorreo.trim(), nro_movil: vMovil.trim() })
    setEditId(null); setVNombre(''); setVApellido(''); setVCorreo(''); setVMovil('')
  }

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

  const reportOpts = isVendedores ? {
    title: L('Tabla de Referencia: Vendedores', 'Reference Table: Salespeople'),
    columns: [{ header: L('Código', 'Code'), key: 'codigo', width: 12 }, { header: L('Nombre', 'First Name'), key: 'nombre', width: 18 }, { header: L('Apellido', 'Last Name'), key: 'apellido', width: 18 }, { header: L('Correo', 'Email'), key: 'correo', width: 22 }, { header: L('Nro Móvil', 'Mobile No.'), key: 'nro_movil', width: 15 }, { header: L('Estado', 'Status'), key: 'estado', width: 15 }],
    rows: vendedores.map(v => ({ codigo: v.codigo, nombre: v.nombre, apellido: v.apellido, correo: v.correo || '', nro_movil: v.nro_movil || '', estado: v.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive') })),
    filename: 'referencias_vendedores',
  } : {
    title: L(`Tabla de Referencia: ${tableLabel}`, `Reference Table: ${tableLabel}`),
    columns: [{ header: L('Descripción', 'Description'), key: 'descripcion', width: 60 }, { header: L('Estado', 'Status'), key: 'estado', width: 20 }],
    rows: items.map(i => ({ descripcion: i.descripcion, estado: i.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive') })),
    filename: `referencias_${selectedTable}`,
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{L('Tablas de Referencias', 'Reference Tables')}</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 }}>{L('Valores de listas desplegables del sistema', 'Values for the system dropdown lists')}</p>

      {/* Table selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {[...REFERENCE_TABLES].sort((a, b) => a.label.localeCompare(b.label, 'es')).map(t => (
          <button key={t.id} onClick={() => { setSelectedTable(t.id); setEditId(null); setDesc(''); setVNombre(''); setVApellido(''); setVCorreo(''); setVMovil('') }}
            style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff', border: selectedTable === t.id ? '2px solid #60a5fa' : '1px solid #1e3a8a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {isVendedores ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={vNombre} onChange={e => setVNombre(e.target.value)} placeholder={L('Nombre', 'First Name')} style={{ ...inputStyle, width: 160 }} />
          <input value={vApellido} onChange={e => setVApellido(e.target.value)} placeholder={L('Apellido', 'Last Name')} style={{ ...inputStyle, width: 160 }} />
          <input value={vCorreo} onChange={e => setVCorreo(e.target.value)} placeholder={L('Correo', 'Email')} style={{ ...inputStyle, width: 200 }} />
          <input value={vMovil} onChange={e => setVMovil(e.target.value)} placeholder={L('Nro Móvil', 'Mobile No.')} style={{ ...inputStyle, width: 140 }}
            onKeyDown={e => e.key === 'Enter' && (editId ? handleUpdateVendedor() : handleAddVendedor())} />
          {editId ? (
            <>
              <button onClick={handleUpdateVendedor} style={{ ...btnStyle, background: '#0f1b3d', color: '#ffffff' }}>{L('Actualizar', 'Update')}</button>
              <button onClick={() => { setEditId(null); setVNombre(''); setVApellido(''); setVCorreo(''); setVMovil('') }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{L('Cancelar', 'Cancel')}</button>
            </>
          ) : (
            <button onClick={handleAddVendedor} style={{ ...btnStyle, background: '#000000', color: '#ffffff' }}>+ {L('Agregar', 'Add')}</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={L(`Nueva ${tableLabel}...`, `New ${tableLabel}...`)} style={{ ...inputStyle, flex: 1, maxWidth: 400 }} onKeyDown={e => e.key === 'Enter' && (editId ? handleUpdate() : handleAdd())} />
          {editId ? (
            <>
              <button onClick={handleUpdate} style={{ ...btnStyle, background: '#0f1b3d', color: '#ffffff' }}>{L('Actualizar', 'Update')}</button>
              <button onClick={() => { setEditId(null); setDesc('') }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{L('Cancelar', 'Cancel')}</button>
            </>
          ) : (
            <button onClick={handleAdd} style={{ ...btnStyle, background: '#000000', color: '#ffffff' }}>+ {L('Agregar', 'Add')}</button>
          )}
        </div>
      )}

      {/* Report buttons */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button onClick={() => exportToPDF(reportOpts)} style={{ ...btnStyle, background: '#b91c1c', color: '#ffffff', border: '1px solid #dc2626' }}>PDF</button>
        <button onClick={() => exportToExcel(reportOpts)} style={{ ...btnStyle, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Excel</button>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
        {isVendedores ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Código', 'Code')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Nombre', 'First Name')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Apellido', 'Last Name')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Correo', 'Email')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Nro Móvil', 'Mobile No.')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'center', width: 100 }}>{L('Estado', 'Status')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'center', width: 150 }}>{L('Acciones', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {vendedores.map((v, i) => (
                <tr key={v.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#4ade80', fontSize: 13, fontFamily: 'monospace' }}>{v.codigo}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 13 }}>{v.nombre}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 13 }}>{v.apellido}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{v.correo || '—'}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{v.nro_movil || '—'}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <button onClick={() => updateVendedor(v.id, { situacion: !v.situacion })}
                      style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: v.situacion ? '#1e3a8a' : '#dc2626', color: '#ffffff', border: v.situacion ? '1px solid #2563eb' : '1px solid #ef4444' }}>
                      {v.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive')}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => { setEditId(v.id); setVNombre(v.nombre); setVApellido(v.apellido); setVCorreo(v.correo || ''); setVMovil(v.nro_movil || '') }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>{L('Editar', 'Edit')}</button>
                      <button onClick={() => { if (confirm(L(`¿Eliminar "${v.nombre} ${v.apellido}"?`, `Delete "${v.nombre} ${v.apellido}"?`))) deleteVendedor(v.id) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{L('Eliminar', 'Delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendedores.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{L('Sin registros', 'No records')}</td></tr>}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left' }}>{L('Descripción', 'Description')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'center', width: 100 }}>{L('Estado', 'Status')}</th>
                <th style={{ padding: '12px 16px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'center', width: 150 }}>{L('Acciones', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 13 }}>{item.descripcion}</td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <button onClick={() => updateItem(selectedTable, item.id, { situacion: !item.situacion })}
                      style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: item.situacion ? '#1e3a8a' : '#dc2626', color: '#ffffff', border: item.situacion ? '1px solid #2563eb' : '1px solid #ef4444' }}>
                      {item.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive')}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => { setEditId(item.id); setDesc(item.descripcion) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>{L('Editar', 'Edit')}</button>
                      <button onClick={() => { if (confirm(L(`¿Eliminar "${item.descripcion}"?`, `Delete "${item.descripcion}"?`))) deleteItem(selectedTable, item.id) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{L('Eliminar', 'Delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{L('Sin registros', 'No records')}</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
