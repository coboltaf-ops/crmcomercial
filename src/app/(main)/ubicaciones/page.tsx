'use client'
import { useState, useEffect } from 'react'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { BaseReference } from '@/features/referencias/types'
import { useIdioma } from '@/shared/i18n/use-t'

const TABLE = 'ubicaciones' as const
const NIVELES = ['País', 'Ciudad']

export default function UbicacionesPage() {
  const idioma = useIdioma()
  const L = (es: string, en: string) => (idioma === 'en' ? en : es)
  const { data, loaded, loadReferencias, addItem, updateItem, deleteItem } = useReferenceStore()

  useEffect(() => { if (!loaded) loadReferencias() }, [loaded, loadReferencias])

  const items = (data[TABLE] || []) as BaseReference[]
  const hijosDe = (pid: string | null) => items.filter(it => (it.padre_id || '') === (pid || '')).sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))

  const [rootText, setRootText] = useState('')
  const [addingUnder, setAddingUnder] = useState<string | null>(null)
  const [addText, setAddText] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editId, setEditId] = useState<string | null>(null)
  const [eDesc, setEDesc] = useState('')
  const [eLat, setELat] = useState('')
  const [eLon, setELon] = useState('')
  const [geoBuscando, setGeoBuscando] = useState<Set<string>>(new Set())
  const [buscar, setBuscar] = useState('')
  const [consultaPais, setConsultaPais] = useState('') // id del país a consultar; '' = todos

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btn: React.CSSProperties = { padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }
  const btnS: React.CSSProperties = { ...btn, padding: '4px 10px', fontSize: 11 }

  const toggleExp = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Geocoding: busca lat/lon de una ciudad (OpenStreetMap). Solo viaja "Ciudad, País".
  const geocodificar = async (id: string, ciudad: string, paisNombre: string) => {
    setGeoBuscando(prev => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/geocode?ciudad=${encodeURIComponent(ciudad)}&pais=${encodeURIComponent(paisNombre)}`)
      const j = await res.json()
      if (j && j.found && Number.isFinite(j.lat) && Number.isFinite(j.lon)) updateItem(TABLE, id, { lat: j.lat, lon: j.lon })
    } catch { /* respaldo manual */ }
    setGeoBuscando(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const addRoot = () => {
    const t = rootText.trim(); if (!t) return
    if (hijosDe(null).some(h => h.descripcion.toLowerCase() === t.toLowerCase())) { alert(L('Ese país ya existe', 'That country already exists')); return }
    addItem(TABLE, { id: crypto.randomUUID(), descripcion: t, situacion: true })
    setRootText('')
  }

  const confirmAddCiudad = (paisId: string) => {
    const t = addText.trim(); if (!t) return
    if (hijosDe(paisId).some(h => h.descripcion.toLowerCase() === t.toLowerCase())) { alert(L('Esa ciudad ya existe en este país', 'That city already exists in this country')); return }
    const nuevoId = crypto.randomUUID()
    addItem(TABLE, { id: nuevoId, descripcion: t, situacion: true, padre_id: paisId })
    setExpanded(prev => new Set(prev).add(paisId))
    const paisNombre = items.find(it => it.id === paisId)?.descripcion || ''
    geocodificar(nuevoId, t, paisNombre) // trae la coordenada sola
    setAddText(''); setAddingUnder(null)
  }

  const eliminarRama = (id: string) => {
    const ids: string[] = []
    const recolectar = (pid: string) => { ids.push(pid); items.filter(it => (it.padre_id || '') === pid).forEach(c => recolectar(c.id)) }
    recolectar(id)
    ids.forEach(x => deleteItem(TABLE, x))
  }

  const iniciarEdicion = (n: BaseReference) => {
    setEditId(n.id); setEDesc(n.descripcion)
    setELat(n.lat != null ? String(n.lat) : ''); setELon(n.lon != null ? String(n.lon) : '')
  }
  const guardarEdicion = (n: BaseReference) => {
    const d = eDesc.trim(); if (!d) return
    const esCiudad = !!n.padre_id
    const patch: Partial<BaseReference> = { descripcion: d }
    if (esCiudad) {
      const lat = parseFloat(eLat), lon = parseFloat(eLon)
      patch.lat = Number.isFinite(lat) ? lat : undefined
      patch.lon = Number.isFinite(lon) ? lon : undefined
    }
    updateItem(TABLE, n.id, patch)
    setEditId(null); setEDesc(''); setELat(''); setELon('')
  }

  const q = buscar.trim().toLowerCase()
  const todosPaises = hijosDe(null)
  const paises = todosPaises
    .filter(p => !consultaPais || p.id === consultaPais)
    .filter(p => !q || p.descripcion.toLowerCase().includes(q) || hijosDe(p.id).some(c => c.descripcion.toLowerCase().includes(q)))

  return (
    <div className="po-root" style={{ padding: 24 }}>
      <h1 style={{ color: '#013978', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>📍 {L('Ubicaciones', 'Locations')}</h1>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18 }}>
        {L('Administra País → Ciudad y sus coordenadas. Al agregar una ciudad se busca su ubicación automáticamente (para el mapa).',
           'Manage Country → City and their coordinates. Adding a city auto-finds its location (for the map).')}
      </p>

      {/* Agregar país + buscar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input value={rootText} onChange={e => setRootText(e.target.value)} placeholder={L('Nuevo país…', 'New country…')} style={{ ...inputStyle, minWidth: 200 }} onKeyDown={e => { if (e.key === 'Enter') addRoot() }} />
        <button onClick={addRoot} style={{ ...btn, background: '#0f1b3d', color: '#fff' }}>+ {L('Agregar país', 'Add country')}</button>
        <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder={L('Buscar país o ciudad…', 'Search country or city…')} style={{ ...inputStyle, minWidth: 220, marginLeft: 'auto' }} />
      </div>

      {/* Consultar por país: muestra SOLO las ciudades grabadas de ese país */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', padding: '10px 12px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
        <label style={{ color: '#013978', fontSize: 13, fontWeight: 700 }}>🔎 {L('Consultar País:', 'Query country:')}</label>
        <select value={consultaPais} onChange={e => { const v = e.target.value; setConsultaPais(v); if (v) setExpanded(prev => new Set(prev).add(v)) }} style={{ ...inputStyle, minWidth: 220 }}>
          <option value="">{L('— Todos los países —', '— All countries —')}</option>
          {[...todosPaises].sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es')).map(p => <option key={p.id} value={p.id}>{p.descripcion} ({hijosDe(p.id).length})</option>)}
        </select>
        {consultaPais && <button onClick={() => setConsultaPais('')} style={{ ...btnS, background: '#64748b', color: '#fff' }}>{L('Ver todos', 'Show all')}</button>}
        {consultaPais && <span style={{ color: '#0f766e', fontSize: 13, fontWeight: 700 }}>{hijosDe(consultaPais).length} {L('ciudades grabadas', 'cities saved')}</span>}
      </div>

      {/* Árbol */}
      <div style={{ borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff', overflow: 'hidden' }}>
        {paises.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#334155', fontSize: 14 }}>{L('No hay países registrados', 'No countries yet')}</div>}
        {paises.map(pais => {
          const ciudades = hijosDe(pais.id).filter(c => !q || c.descripcion.toLowerCase().includes(q) || pais.descripcion.toLowerCase().includes(q))
          const abierto = expanded.has(pais.id) || !!q
          const editandoPais = editId === pais.id
          return (
            <div key={pais.id}>
              {/* Fila País */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#eff6ff' }}>
                <button onClick={() => toggleExp(pais.id)} style={{ ...btnS, background: 'transparent', color: '#1e3a8a', fontSize: 15, padding: '0 6px' }}>{abierto ? '▾' : '▸'}</button>
                {editandoPais ? (
                  <>
                    <input value={eDesc} autoFocus onChange={e => setEDesc(e.target.value)} style={{ ...inputStyle, flex: 1, maxWidth: 320 }} onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(pais); if (e.key === 'Escape') setEditId(null) }} />
                    <button onClick={() => guardarEdicion(pais)} style={{ ...btnS, background: '#0f766e', color: '#fff' }}>{L('Guardar', 'Save')}</button>
                    <button onClick={() => setEditId(null)} style={{ ...btnS, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, color: '#000000', fontSize: 14, fontWeight: 700 }}>
                      <span style={{ color: '#64748b', fontSize: 11, marginRight: 6 }}>{NIVELES[0]}:</span>{pais.descripcion}
                      <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>({ciudades.length} {L('ciudades', 'cities')})</span>
                    </span>
                    <button onClick={() => { setAddingUnder(pais.id); setAddText('') }} style={{ ...btnS, background: '#000', color: '#fff' }}>+ {L('Ciudad', 'City')}</button>
                    <button onClick={() => updateItem(TABLE, pais.id, { situacion: !pais.situacion })} style={{ ...btnS, background: pais.situacion ? '#1e3a8a' : '#dc2626', color: '#fff' }}>{pais.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive')}</button>
                    <button onClick={() => iniciarEdicion(pais)} style={{ ...btnS, background: '#15803d', color: '#fff' }}>{L('Editar', 'Edit')}</button>
                    <button onClick={() => { const n = hijosDe(pais.id).length; if (confirm(n > 0 ? L(`"${pais.descripcion}" tiene ${n} ciudad(es). ¿Eliminar todo?`, `"${pais.descripcion}" has ${n} city(ies). Delete all?`) : L(`¿Eliminar "${pais.descripcion}"?`, `Delete "${pais.descripcion}"?`))) eliminarRama(pais.id) }} style={{ ...btnS, background: '#dc2626', color: '#fff' }}>{L('Eliminar', 'Delete')}</button>
                  </>
                )}
              </div>

              {/* Agregar ciudad */}
              {addingUnder === pais.id && (
                <div style={{ display: 'flex', gap: 8, padding: '8px 12px 8px 40px', background: '#f1f5f9' }}>
                  <input autoFocus value={addText} onChange={e => setAddText(e.target.value)} placeholder={L('Nueva ciudad…', 'New city…')} style={{ ...inputStyle, flex: 1, maxWidth: 320 }} onKeyDown={e => { if (e.key === 'Enter') confirmAddCiudad(pais.id); if (e.key === 'Escape') { setAddingUnder(null); setAddText('') } }} />
                  <button onClick={() => confirmAddCiudad(pais.id)} style={{ ...btnS, background: '#0f766e', color: '#fff' }}>{L('Agregar', 'Add')} 📍</button>
                  <button onClick={() => { setAddingUnder(null); setAddText('') }} style={{ ...btnS, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
                </div>
              )}

              {/* Ciudades */}
              {abierto && ciudades.map(c => {
                const editandoC = editId === c.id
                const tieneCoord = c.lat != null && c.lon != null
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 46px', borderBottom: '1px solid #e2e8f0' }}>
                    {editandoC ? (
                      <>
                        <input value={eDesc} autoFocus onChange={e => setEDesc(e.target.value)} placeholder={L('Ciudad', 'City')} style={{ ...inputStyle, flex: 1, maxWidth: 220 }} />
                        <input value={eLat} onChange={e => setELat(e.target.value)} placeholder="lat" style={{ ...inputStyle, width: 90 }} />
                        <input value={eLon} onChange={e => setELon(e.target.value)} placeholder="lon" style={{ ...inputStyle, width: 90 }} />
                        <button onClick={() => guardarEdicion(c)} style={{ ...btnS, background: '#0f766e', color: '#fff' }}>{L('Guardar', 'Save')}</button>
                        <button onClick={() => setEditId(null)} style={{ ...btnS, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, color: '#000000', fontSize: 13, fontWeight: 500 }}>
                          <span style={{ color: '#64748b', fontSize: 11, marginRight: 6 }}>{NIVELES[1]}:</span>{c.descripcion}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', color: geoBuscando.has(c.id) ? '#b45309' : (tieneCoord ? '#15803d' : '#b91c1c') }}>
                          {geoBuscando.has(c.id) ? '📍 ' + L('buscando…', 'finding…') : (tieneCoord ? `📍 ${c.lat!.toFixed(3)}, ${c.lon!.toFixed(3)}` : '📍 ' + L('sin coord.', 'no coord.'))}
                        </span>
                        <button onClick={() => geocodificar(c.id, c.descripcion, pais.descripcion)} title={L('Buscar / actualizar coordenada', 'Find / update coordinate')} style={{ ...btnS, background: '#0ea5e9', color: '#fff' }}>📍</button>
                        <button onClick={() => updateItem(TABLE, c.id, { situacion: !c.situacion })} style={{ ...btnS, background: c.situacion ? '#1e3a8a' : '#dc2626', color: '#fff' }}>{c.situacion ? L('Activo', 'Active') : L('Inactivo', 'Inactive')}</button>
                        <button onClick={() => iniciarEdicion(c)} style={{ ...btnS, background: '#15803d', color: '#fff' }}>{L('Editar', 'Edit')}</button>
                        <button onClick={() => { if (confirm(L(`¿Eliminar "${c.descripcion}"?`, `Delete "${c.descripcion}"?`))) deleteItem(TABLE, c.id) }} style={{ ...btnS, background: '#dc2626', color: '#fff' }}>{L('Eliminar', 'Delete')}</button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
