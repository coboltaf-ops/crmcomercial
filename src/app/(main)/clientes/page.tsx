'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import EnviarCorreoModal from '@/shared/components/enviar-correo-modal'
import { useClientesStore, Cliente, generarCodigoAcceso } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { fmtMoney } from '@/shared/lib/format-number'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import ReportPanel from '@/shared/components/report-panel'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { useAsistenteStore } from '@/shared/stores/asistente-store'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'

// ── Datos DIVIPOLA (Region/Departamento/Ciudad) embebidos para evitar problemas de resolucion de modulos en Vercel ──
// Datos DIVIPOLA (DANE): Regiones, Departamentos y Municipios de Colombia.
// Generado automaticamente desde el dataset oficial. NO editar a mano.
interface DepartamentoData { nombre: string; ciudades: string[] }
interface RegionData { region: string; departamentos: DepartamentoData[] }

const COLOMBIA_REGIONES: RegionData[] = [{"region":"Andina","departamentos":[{"nombre":"Antioquia","ciudades":["Abejorral","Abriaquí","Alejandría","Amagá","Amalfi","Andes","Angelópolis","Angostura","Anorí","Anzá","Apartadó","Arboletes","Argelia","Armenia","Barbosa","Bello","Belmira","Betania","Betulia","Briceño","Buriticá","Cáceres","Caicedo","Caldas","Campamento","Cañasgordas","Caracolí","Caramanta","Carepa","Carolina del Príncipe","Caucasia","Chigorodó","Cisneros","Ciudad Bolívar","Cocorná","Concepción","Concordia","Copacabana","Dabeiba","Donmatías","Ebéjico","El Bagre","El Carmen de Viboral","El Peñol","El Retiro","El Santuario","Entrerríos","Envigado","Fredonia","Frontino","Giraldo","Girardota","Gómez Plata","Granada","Guadalupe","Guarne","Guatapé","Heliconia","Hispania","Itagüí","Ituango","Jardín","Jericó","La Ceja","La Estrella","La Pintada","La Unión","Liborina","Maceo","Marinilla","Medellín","Montebello","Murindó","Mutatá","Nariño","Nechí","Necoclí","Olaya","Peque","Pueblorrico","Puerto Berrío","Puerto Nare","Puerto Triunfo","Remedios","Rionegro","Sabanalarga","Sabaneta","Salgar","San Andrés de Cuerquia","San Carlos","San Francisco","San Jerónimo","San José de la Montaña","San Juan de Urabá","San Luis","San Pedro de los Milagros","San Pedro de Urabá","San Rafael","San Roque","San Vicente","Santa Bárbara","Santa Fe de Antioquia","Santa Rosa de Osos","Santo Domingo","Segovia","Sonsón","Sopetrán","Támesis","Tarazá","Tarso","Titiribí","Toledo","Turbo","Uramita","Urrao","Valdivia","Valparaíso","Vegachí","Venecia","Vigía del Fuerte","Yalí","Yarumal","Yolombó","Yondó","Zaragoza"]},{"nombre":"Boyacá","ciudades":["Almeida","Aquitania","Arcabuco","Belén","Berbeo","Betéitiva","Boavita","Boyacá","Briceño","Buenavista","Busbanzá","Caldas","Campohermoso","Cerinza","Chinavita","Chiquinquirá","Chíquiza","Chiscas","Chita","Chitaraque","Chivatá","Chivor","Ciénega","Cómbita","Coper","Corrales","Covarachía","Cubará","Cucaita","Cuítiva","Duitama","El Cocuy","El Espino","Firavitoba","Floresta","Gachantivá","Gámeza","Garagoa","Guacamayas","Guateque","Guayatá","Güicán","Iza","Jenesano","Jericó","La Capilla","La Uvita","La Victoria","Labranzagrande","Macanal","Maripí","Miraflores","Mongua","Monguí","Moniquirá","Motavita","Muzo","Nobsa","Nuevo Colón","Oicatá","Otanche","Pachavita","Páez","Paipa","Pajarito","Panqueba","Pauna","Paya","Paz del Río","Pesca","Pisba","Puerto Boyacá","Quípama","Ramiriquí","Ráquira","Rondón","Saboyá","Sáchica","Samacá","San Eduardo","San José de Pare","San Luis de Gaceno","San Mateo","San Miguel de Sema","San Pablo de Borbur","Santa María","Santa Rosa de Viterbo","Santa Sofía","Santana","Sativanorte","Sativasur","Siachoque","Soatá","Socha","Socotá","Sogamoso","Somondoco","Sora","Soracá","Sotaquirá","Susacón","Sutamarchán","Sutatenza","Tasco","Tenza","Tibaná","Tibasosa","Tinjacá","Tipacoque","Toca","Togüí","Tópaga","Tota","Tunja","Tununguá","Turmequé","Tuta","Tutazá","Úmbita","Ventaquemada","Villa de Leyva","Viracachá","Zetaquira"]},{"nombre":"Caldas","ciudades":["Aguadas","Anserma","Aranzazu","Belalcázar","Chinchiná","Filadelfia","La Dorada","La Merced","Manizales","Manzanares","Marmato","Marquetalia","Marulanda","Neira","Norcasia","Pácora","Palestina","Pensilvania","Riosucio","Risaralda","Salamina","Samaná","San José","Supía","Victoria","Villamaría","Viterbo"]},{"nombre":"Cundinamarca","ciudades":["Agua de Dios","Albán","Anapoima","Anolaima","Apulo","Arbeláez","Beltrán","Bituima","Bogotá","Bojacá","Cabrera","Cachipay","Cajicá","Caparrapí","Cáqueza","Carmen de Carupa","Chaguaní","Chía","Chipaque","Choachí","Chocontá","Cogua","Cota","Cucunubá","El Colegio","El Peñón","El Rosal","Facatativá","Fómeque","Fosca","Funza","Fúquene","Fusagasugá","Gachalá","Gachancipá","Gachetá","Gama","Girardot","Granada","Guachetá","Guaduas","Guasca","Guataquí","Guatavita","Guayabal de Síquima","Guayabetal","Gutiérrez","Jerusalén","Junín","La Calera","La Mesa","La Palma","La Peña","La Vega","Lenguazaque","Machetá","Madrid","Manta","Medina","Mosquera","Nariño","Nemocón","Nilo","Nimaima","Nocaima","Pacho","Paime","Pandi","Paratebueno","Pasca","Puerto Salgar","Pulí","Quebradanegra","Quetame","Quipile","Ricaurte","San Antonio del Tequendama","San Bernardo","San Cayetano","San Francisco","San Juan de Rioseco","Sasaima","Sesquilé","Sibaté","Silvania","Simijaca","Soacha","Sopó","Subachoque","Suesca","Supatá","Susa","Sutatausa","Tabio","Tausa","Tena","Tenjo","Tibacuy","Tibirita","Tocaima","Tocancipá","Topaipí","Ubalá","Ubaque","Ubaté","Une","Útica","Venecia","Vergara","Vianí","Villagómez","Villapinzón","Villeta","Viotá","Yacopí","Zipacón","Zipaquirá"]},{"nombre":"Huila","ciudades":["Acevedo","Agrado","Aipe","Algeciras","Altamira","Baraya","Campoalegre","Colombia","El Pital","Elías","Garzón","Gigante","Guadalupe","Hobo","Íquira","Isnos","La Argentina","La Plata","Nátaga","Neiva","Oporapa","Paicol","Palermo","Palestina","Pitalito","Rivera","Saladoblanco","San Agustín","Santa María","Suaza","Tarqui","Tello","Teruel","Tesalia","Timaná","Villavieja","Yaguará"]},{"nombre":"Norte de Santander","ciudades":["Ábrego","Arboledas","Bochalema","Bucarasica","Cáchira","Cácota","Chinácota","Chitagá","Convención","Cúcuta","Cucutilla","Duranía","El Carmen","El Tarra","El Zulia","Gramalote","Hacarí","Herrán","La Esperanza","La Playa de Belén","Labateca","Los Patios","Lourdes","Mutiscua","Ocaña","Pamplona","Pamplonita","Puerto Santander","Ragonvalia","Salazar de Las Palmas","San Calixto","San Cayetano","Santiago","Santo Domingo de Silos","Sardinata","Teorama","Tibú","Toledo","Villa Caro","Villa del Rosario"]},{"nombre":"Quindío","ciudades":["Armenia","Buenavista","Calarcá","Circasia","Córdoba","Filandia","Génova","La Tebaida","Montenegro","Pijao","Quimbaya","Salento"]},{"nombre":"Risaralda","ciudades":["Apía","Balboa","Belén de Umbría","Dosquebradas","Guática","La Celia","La Virginia","Marsella","Mistrató","Pereira","Pueblo Rico","Quinchía","Santa Rosa de Cabal","Santuario"]},{"nombre":"Santander","ciudades":["Aguada","Albania","Aratoca","Barbosa","Barichara","Barrancabermeja","Betulia","Bolívar","Bucaramanga","Cabrera","California","Capitanejo","Carcasí","Cepitá","Cerrito","Charalá","Charta","Chima","Chipatá","Cimitarra","Concepción","Confines","Contratación","Coromoro","Curití","El Carmen de Chucurí","El Guacamayo","El Peñón","El Playón","El Socorro","Encino","Enciso","Florián","Floridablanca","Galán","Gámbita","Girón","Guaca","Guadalupe","Guapotá","Guavatá","Güepsa","Hato","Jesús María","Jordán","La Belleza","La Paz","Landázuri","Lebrija","Los Santos","Macaravita","Málaga","Matanza","Mogotes","Molagavita","Ocamonte","Oiba","Onzaga","Palmar","Palmas del Socorro","Páramo","Piedecuesta","Pinchote","Puente Nacional","Puerto Parra","Puerto Wilches","Rionegro","Sabana de Torres","San Andrés","San Benito","San Gil","San Joaquín","San José de Miranda","San Miguel","San Vicente de Chucurí","Santa Bárbara","Santa Helena del Opón","Simacota","Suaita","Sucre","Suratá","Tona","Valle de San José","Vélez","Vetas","Villanueva","Zapatoca"]},{"nombre":"Tolima","ciudades":["Alpujarra","Alvarado","Ambalema","Anzoátegui","Armero","Ataco","Cajamarca","Carmen de Apicalá","Casabianca","Chaparral","Coello","Coyaima","Cunday","Dolores","El Espinal","Falán","Flandes","Fresno","Guamo","Herveo","Honda","Ibagué","Icononzo","Lérida","Líbano","Mariquita","Melgar","Murillo","Natagaima","Ortega","Palocabildo","Piedras","Planadas","Prado","Purificación","Rioblanco","Roncesvalles","Rovira","Saldaña","San Antonio","San Luis","Santa Isabel","Suárez","Valle de San Juan","Venadillo","Villahermosa","Villarrica"]}]},{"region":"Caribe","departamentos":[{"nombre":"Atlántico","ciudades":["Baranoa","Barranquilla","Campo de la Cruz","Candelaria","Galapa","Juan de Acosta","Luruaco","Malambo","Manatí","Palmar de Varela","Piojó","Polonuevo","Ponedera","Puerto Colombia","Repelón","Sabanagrande","Sabanalarga","Santa Lucía","Santo Tomás","Soledad","Suán","Tubará","Usiacurí"]},{"nombre":"Bolívar","ciudades":["Achí","Altos del Rosario","Arenal","Arjona","Arroyohondo","Barranco de Loba","Brazuelo de Papayal","Calamar","Cantagallo","Cartagena de Indias","Cicuco","Clemencia","Córdoba","El Carmen de Bolívar","El Guamo","El Peñón","Hatillo de Loba","Magangué","Mahates","Margarita","María la Baja","Mompós","Montecristo","Morales","Norosí","Pinillos","Regidor","Río Viejo","San Cristóbal","San Estanislao","San Fernando","San Jacinto","San Jacinto del Cauca","San Juan Nepomuceno","San Martín de Loba","San Pablo","Santa Catalina","Santa Rosa","Santa Rosa del Sur","Simití","Soplaviento","Talaigua Nuevo","Tiquisio","Turbaco","Turbaná","Villanueva","Zambrano"]},{"nombre":"Cesar","ciudades":["Aguachica","Agustín Codazzi","Astrea","Becerril","Bosconia","Chimichagua","Chiriguaná","Curumaní","El Copey","El Paso","Gamarra","González","La Gloria (Cesar)","La Jagua de Ibirico","La Paz","Manaure Balcón del Cesar","Pailitas","Pelaya","Pueblo Bello","Río de Oro","San Alberto","San Diego","San Martín","Tamalameque","Valledupar"]},{"nombre":"Córdoba","ciudades":["Ayapel","Buenavista","Canalete","Cereté","Chimá","Chinú","Ciénaga de Oro","Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Montería","Moñitos","Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador","Purísima","Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento","San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia"]},{"nombre":"La Guajira","ciudades":["Albania","Barrancas","Dibulla","Distracción","El Molino","Fonseca","Hatonuevo","La Jagua del Pilar","Maicao","Manaure","Riohacha","San Juan del Cesar","Uribia","Urumita","Villanueva"]},{"nombre":"Magdalena","ciudades":["Algarrobo","Aracataca","Ariguaní","Cerro de San Antonio","Chibolo","Chibolo","Ciénaga","Concordia","El Banco","El Piñón","El Retén","Fundación","Guamal","Nueva Granada","Pedraza","Pijiño del Carmen","Pivijay","Plato","Pueblo Viejo","Remolino","Sabanas de San Ángel","Salamina","San Sebastián de Buenavista","San Zenón","Santa Ana","Santa Bárbara de Pinto","Santa Marta","Sitionuevo","Tenerife","Zapayán","Zona Bananera"]},{"nombre":"Sucre","ciudades":["Buenavista","Caimito","Chalán","Colosó","Corozal","Coveñas","El Roble","Galeras","Guaranda","La Unión","Los Palmitos","Majagual","Morroa","Ovejas","Sampués","San Antonio de Palmito","San Benito Abad","San Juan de Betulia","San Marcos","San Onofre","San Pedro","Sincé","Sincelejo","Sucre","Tolú","Tolú Viejo"]}]},{"region":"Pacífica","departamentos":[{"nombre":"Cauca","ciudades":["Almaguer","Argelia","Balboa","Bolívar","Buenos Aires","Cajibío","Caldono","Caloto","Corinto","El Tambo","Florencia","Guachené","Guapí","Inzá","Jambaló","La Sierra","La Vega","López de Micay","Mercaderes","Miranda","Morales","Padilla","Páez","Patía","Piamonte","Piendamó","Popayán","Puerto Tejada","Puracé","Rosas","San Sebastián","Santa Rosa","Santander de Quilichao","Silvia","Sotará","Suárez","Sucre","Timbío","Timbiquí","Toribío","Totoró","Villa Rica"]},{"nombre":"Chocó","ciudades":["Acandí","Alto Baudó","Bagadó","Bahía Solano","Bajo Baudó","Bojayá","Cantón de San Pablo","Cértegui","Condoto","El Atrato","El Carmen de Atrato","El Carmen del Darién","Istmina","Juradó","Litoral de San Juan","Lloró","Medio Atrato","Medio Baudó","Medio San Juan","Nóvita","Nuquí","Quibdó","Río Iró","Río Quito","Riosucio","San José del Palmar","Sipí","Tadó","Unguía","Unión Panamericana"]},{"nombre":"Nariño","ciudades":["Aldana","Ancuyá","Arboleda","Barbacoas","Belén","Buesaco","Chachagüí","Colón","Consacá","Contadero","Córdoba","Cuaspud","Cumbal","Cumbitara","El Charco","El Peñol","El Rosario","El Tablón","El Tambo","Francisco Pizarro","Funes","Guachucal","Guaitarilla","Gualmatán","Iles","Imués","Ipiales","La Cruz","La Florida","La Llanada","La Tola","La Unión","Leiva","Linares","Los Andes","Magüí Payán","Mallama","Mosquera","Nariño","Olaya Herrera","Ospina","Pasto","Policarpa","Potosí","Providencia","Puerres","Pupiales","Ricaurte","Roberto Payán","Samaniego","San Bernardo","San José de Albán","San Lorenzo","San Pablo","San Pedro de Cartago","Sandoná","Santa Bárbara","Santacruz","Sapuyes","Taminango","Tangua","Tumaco","Túquerres","Yacuanquer"]},{"nombre":"Valle del Cauca","ciudades":["Alcalá","Andalucía","Ansermanuevo","Argelia","Bolívar","Buenaventura","Buga","Bugalagrande","Caicedonia","Cali","Calima","Candelaria","Cartago","Dagua","El Águila","El Cairo","El Cerrito","El Dovio","Florida","Ginebra","Guacarí","Jamundí","La Cumbre","La Unión","La Victoria","Obando","Palmira","Pradera","Restrepo","Riofrío","Roldanillo","San Pedro","Sevilla","Toro","Trujillo","Tuluá","Ulloa","Versalles","Vijes","Yotoco","Yumbo","Zarzal"]}]},{"region":"Orinoquía","departamentos":[{"nombre":"Arauca","ciudades":["Arauca","Arauquita","Cravo Norte","Fortul","Puerto Rondón","Saravena","Tame"]},{"nombre":"Casanare","ciudades":["Aguazul","Chámeza","Hato Corozal","La Salina","Maní","Monterrey","Nunchía","Orocué","Paz de Ariporo","Pore","Recetor","Sabanalarga","Sácama","San Luis de Palenque","Támara","Tauramena","Trinidad","Villanueva","Yopal"]},{"nombre":"Meta","ciudades":["Acacías","Barranca de Upía","Cabuyaro","Castilla la Nueva","Cubarral","Cumaral","El Calvario","El Castillo","El Dorado","Fuente de Oro","Granada","Guamal","La Macarena","La Uribe","Lejanías","Mapiripán","Mesetas","Puerto Concordia","Puerto Gaitán","Puerto Lleras","Puerto López","Puerto Rico","Restrepo","San Carlos de Guaroa","San Juan de Arama","San Juanito","San Martín","Villavicencio","Vista Hermosa"]},{"nombre":"Vichada","ciudades":["Cumaribo","La Primavera","Puerto Carreño","Santa Rosalía"]}]},{"region":"Amazonía","departamentos":[{"nombre":"Amazonas","ciudades":["Leticia","Puerto Nariño"]},{"nombre":"Caquetá","ciudades":["Albania","Belén de los Andaquíes","Cartagena del Chairá","Curillo","El Doncello","El Paujil","Florencia","La Montañita","Milán","Morelia","Puerto Rico","San José del Fragua","San Vicente del Caguán","Solano","Solita","Valparaíso"]},{"nombre":"Guainía","ciudades":["Inírida"]},{"nombre":"Guaviare","ciudades":["Calamar","El Retorno","Miraflores","San José del Guaviare"]},{"nombre":"Putumayo","ciudades":["Colón","Mocoa","Orito","Puerto Asís","Puerto Caicedo","Puerto Guzmán","Puerto Leguízamo","San Francisco","San Miguel","Santiago","Sibundoy","Valle del Guamuez","Villagarzón"]},{"nombre":"Vaupés","ciudades":["Carurú","Mitú","Taraira"]}]},{"region":"Insular","departamentos":[{"nombre":"San Andrés y Providencia","ciudades":["Providencia y Santa Catalina Islas","San Andrés"]}]}]

const REGIONES_LISTA: string[] = COLOMBIA_REGIONES.map(r => r.region)

function departamentosDeRegion(region: string): string[] {
  const r = COLOMBIA_REGIONES.find(x => x.region === region)
  return r ? r.departamentos.map(d => d.nombre) : []
}

function ciudadesDeDepartamento(region: string, departamento: string): string[] {
  const r = COLOMBIA_REGIONES.find(x => x.region === region)
  const dp = r?.departamentos.find(x => x.nombre === departamento)
  return dp ? dp.ciudades : []
}

// Para datos existentes: deduce region y departamento a partir de una ciudad guardada.
function ubicacionDeCiudad(ciudad?: string): { region: string; departamento: string } | null {
  if (!ciudad) return null
  const c = ciudad.trim().toLowerCase()
  for (const r of COLOMBIA_REGIONES) for (const dp of r.departamentos) {
    if (dp.ciudades.some(x => x.toLowerCase() === c)) return { region: r.region, departamento: dp.nombre }
  }
  return null
}

// ── fin DIVIPOLA ──

import { Seguimiento } from '@/shared/types/seguimiento'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'

const today = todayColombia()

const emptyCliente = (codigo: string): Cliente => ({
  id: '', codigo, tipo_identificacion: 'NIT',
  nro_documento: '', razon_social: '', nombre_comercial: '', actividad: '',
  direccion: '', region: '', departamento: '', ciudad: '', pais: 'Colombia', codigo_postal: '', telefono: '', email: '', sitio_web: '',
  condicion_pago: 'Contado', tipo_moneda: 'Pesos Colombianos', observaciones: '',
  situacion: 'Activo', fecha_registro: today, seguimientos: [], codigo_acceso: generarCodigoAcceso(),
})

export default function ClientesPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('clientes')
  const currentUser = useCurrentUserStore(s => s.user)
  const router = useRouter()
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientesStore()
  const loadClientes = useClientesStore(s => s.loadClientes)
  const contactos = useContactosStore(s => s.contactos)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const pqrs = usePQRSStore(s => s.pqrs)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Cliente | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Cliente | null>(null)
  const [verLectura, setVerLectura] = useState(false)
  const [correoModal, setCorreoModal] = useState<{ to: string; ref: string } | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [detailTab, setDetailTab] = useState<'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets'>('info')
  const [search, setSearch] = useState('')
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

  useEffect(() => {
    const viewId = searchParams.get('view')
    const editId = searchParams.get('edit')
    const tabParam = searchParams.get('tab')
    if (viewId) {
      const cli = clientes.find(c => c.id === viewId)
      if (cli) {
        setViewDetail(cli)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    } else if (editId) {
      const cli = clientes.find(c => c.id === editId)
      if (cli) {
        setSelected(cli); setIsForm(true)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    }
  }, [searchParams, clientes])

  const filtered = clientes.filter(c =>
    !search || c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.nro_documento.includes(search)
  )

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'clientes',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (selected.id) {
      const anterior = clientes.find(c => c.id === selected.id)
      updateCliente(selected.id, selected)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: computarDiff(anterior as unknown as Record<string, unknown>, selected as unknown as Record<string, unknown>) })
    } else {
      const id = crypto.randomUUID()
      addCliente({ ...selected, id, fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: `Cliente creado` })
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'activo': { background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa' },
      'inactivo': { background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b' },
      'prospecto': { background: 'transparent', color: '#facc15', border: '1px solid #facc15' },
      'prospectando': { background: 'transparent', color: '#facc15', border: '1px solid #facc15' },
    }
    return map[(s || '').trim().toLowerCase()] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })

  // View detail
  if (viewDetail) {
    const fields = [
      { label: t('lbl.codigo'), value: viewDetail.codigo },
      { label: t('lbl.tipoIdentificacion'), value: viewDetail.tipo_identificacion },
      { label: t('lbl.nroDocumento'), value: viewDetail.nro_documento },
      { label: t('lbl.razonSocial'), value: viewDetail.razon_social },
      { label: t('lbl.nombreComercial'), value: viewDetail.nombre_comercial },
      { label: t('lbl.actividad'), value: viewDetail.actividad },
      { label: t('lbl.telefono'), value: viewDetail.telefono },
      { label: t('lbl.email'), value: viewDetail.email },
      { label: t('lbl.sitioWeb'), value: viewDetail.sitio_web },
      { label: t('lbl.condicionPago'), value: viewDetail.condicion_pago },
      { label: t('lbl.moneda'), value: viewDetail.tipo_moneda },
      { label: t('lbl.situacion'), value: viewDetail.situacion },
      { label: t('lbl.fechaRegistro'), value: fDate(viewDetail.fecha_registro) },
      { label: t('lbl.observaciones'), value: viewDetail.observaciones },
    ]
    const cId = viewDetail.id
    const misContactos = contactos.filter(c => c.cliente_id === cId)
    const misCotizaciones = cotizaciones.filter(c => c.cliente_id === cId)
    const misOportunidades = oportunidades.filter(o => o.cliente_id === cId)
    const misTickets = pqrs.filter(p => p.cliente_id === cId)
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setViewDetail(null); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{viewDetail.razon_social}</h2>

          {/* Creado por — arriba, bien visible */}
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fde68a', borderRadius: 12, border: '2px solid #000000', textAlign: 'left' }}>
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>👤 CREADO POR</p>
            <p style={{ color: '#000000', fontSize: 24, fontWeight: 900 }}>
              {viewDetail.creado_por || '—'}{viewDetail.creado_por_usuario ? ` (${viewDetail.creado_por_usuario})` : ''}{viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}
            </p>
          </div>

          {/* Sub-tabs de la vista detalle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
            <button onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Ver Contactos ({misContactos.length})</button>
            <button onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Ver Cotizaciones ({misCotizaciones.length})</button>
            <button onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Ver Oportunidades ({misOportunidades.length})</button>
            <button onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Ver Tickets ({misTickets.length})</button>
          </div>

          {detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'info' && (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 16, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: t('lbl.direccion'), value: viewDetail.direccion },
                { label: t('lbl.ciudad'), value: viewDetail.ciudad },
                { label: t('lbl.pais'), value: viewDetail.pais },
                { label: t('lbl.codigoPostal'), value: viewDetail.codigo_postal },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                  <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Código de acceso PQRS */}
          {viewDetail.codigo_acceso && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.1)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#f97316', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Código de Acceso para PQRS Público</p>
                <p style={{ color: '#013978', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{viewDetail.codigo_acceso}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(viewDetail.codigo_acceso); alert('Código copiado al portapapeles') }}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12 }}>Copiar</button>
            </div>
          )}

          <div style={{ marginTop: 16, padding: '12px 16px', background: '#eef2ff', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>👤 Creado por</p>
            <p style={{ color: '#000000', fontSize: 24, fontWeight: 900 }}>
              {viewDetail.creado_por || '—'}{viewDetail.creado_por_usuario ? ` (${viewDetail.creado_por_usuario})` : ''}{viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}
            </p>
          </div>
          {permisos.editar && (
            <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6', marginTop: 16 }}>{t('btn.editar')}</button>
          )}
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refData.situacion_cliente.filter(r => r.situacion).map(r => r.descripcion)}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateCliente(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="clientes" registroId={viewDetail.id} />
          </>
          )}
        </div>
      </div>
    )
  }

  // Form
  if (isForm && selected) {
    const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    // Ubicación Colombia (cascada Región → Departamento → Ciudad). Para registros antiguos deduce desde la ciudad guardada.
    const ubicDed = (!selected.region && selected.ciudad) ? ubicacionDeCiudad(selected.ciudad) : null
    const regionEff = selected.region || ubicDed?.region || ''
    const deptoEff = selected.departamento || ubicDed?.departamento || ''
    const ciudadesDepto = ciudadesDeDepartamento(regionEff, deptoEff)
    const cId = selected.id
    const misContactos = cId ? contactos.filter(c => c.cliente_id === cId) : []
    const misCotizaciones = cId ? cotizaciones.filter(c => c.cliente_id === cId) : []
    const misOportunidades = cId ? oportunidades.filter(o => o.cliente_id === cId) : []
    const misTickets = cId ? pqrs.filter(p => p.cliente_id === cId) : []
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{verLectura ? (idioma === 'en' ? 'View Company' : 'Ver Empresa') : (selected.id ? t('fmt.editarCliente') : t('fmt.nuevoCliente'))} {selected.razon_social ? `— ${selected.razon_social}` : ''}</h2>

          {/* Sub-tabs en modo edición (solo si ya existe el cliente) */}
          {cId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
              <button type="button" onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Contactos ({misContactos.length})</button>
              <button type="button" onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Cotizaciones ({misCotizaciones.length})</button>
              <button type="button" onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Oportunidades ({misOportunidades.length})</button>
              <button type="button" onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Tickets ({misTickets.length})</button>
            </div>
          )}

          {cId && detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {(detailTab === 'info' || !cId) && (
        <form onSubmit={handleSave}>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigo')}</label>
              <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRegistro')}</label>
              <input value={fDate(selected.fecha_registro || today)} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.tipoIdentificacion')}</label>
              <select value={selected.tipo_identificacion} onChange={e => setSelected({ ...selected, tipo_identificacion: e.target.value })} style={inputStyle}>
                {refOptions('tipo_identificacion').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nroDocumento')} *</label>
              <input value={selected.nro_documento} onChange={e => setSelected({ ...selected, nro_documento: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.razonSocial')} *</label>
              <input value={selected.razon_social} onChange={e => setSelected({ ...selected, razon_social: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nombreComercial')}</label>
              <input value={selected.nombre_comercial} onChange={e => setSelected({ ...selected, nombre_comercial: e.target.value.toUpperCase() })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.actividad')}</label>
              <select value={selected.actividad} onChange={e => setSelected({ ...selected, actividad: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('actividad_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.telefono')}</label>
              <input value={selected.telefono} onChange={e => setSelected({ ...selected, telefono: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.email')}</label>
              <input type="email" value={selected.email} onChange={e => setSelected({ ...selected, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.sitioWeb')}</label>
              <input value={selected.sitio_web} onChange={e => setSelected({ ...selected, sitio_web: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.condicionPago')}</label>
              <select value={selected.condicion_pago} onChange={e => setSelected({ ...selected, condicion_pago: e.target.value })} style={inputStyle}>
                {refOptions('condiciones_pago').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.moneda')}</label>
              <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                {refOptions('tipo_moneda').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 20, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.direccion')}</label>
                <input value={selected.direccion} onChange={e => setSelected({ ...selected, direccion: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Región</label>
                <select value={regionEff} onChange={e => { const v = e.target.value; const same = v === regionEff; setSelected({ ...selected, region: v, departamento: same ? deptoEff : '', ciudad: same ? selected.ciudad : '' }) }} style={inputStyle}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {REGIONES_LISTA.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Departamento</label>
                <select value={deptoEff} onChange={e => { const v = e.target.value; const same = v === deptoEff; setSelected({ ...selected, region: regionEff, departamento: v, ciudad: same ? selected.ciudad : '' }) }} disabled={!regionEff} style={{ ...inputStyle, opacity: regionEff ? 1 : 0.5 }}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {departamentosDeRegion(regionEff).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.ciudad')}</label>
                <select value={selected.ciudad} onChange={e => setSelected({ ...selected, region: regionEff, departamento: deptoEff, ciudad: e.target.value })} disabled={!deptoEff} style={{ ...inputStyle, opacity: deptoEff ? 1 : 0.5 }}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {selected.ciudad && !ciudadesDepto.includes(selected.ciudad) && <option value={selected.ciudad}>{selected.ciudad}</option>}
                  {ciudadesDepto.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.pais')}</label>
                <select value={selected.pais} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {refOptions('pais').map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigoPostal')}</label>
                <input value={selected.codigo_postal || ''} onChange={e => setSelected({ ...selected, codigo_postal: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Código de acceso PQRS */}
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.08)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#f97316', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'Public PQRS Access Code' : 'Código de Acceso PQRS Público'}</label>
                <input value={selected.codigo_acceso || ''} readOnly style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }} />
              </div>
              <button type="button" onClick={() => setSelected({ ...selected, codigo_acceso: generarCodigoAcceso() })}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12, marginTop: 18 }}>Regenerar</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>Este código permite a la empresa radicar PQRS desde el formulario público</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.observaciones')}</label>
              <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          </fieldset>
          {/* Creado por — pequeño, al final después de Observaciones (solo en modo Ver) */}
          {verLectura && (
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 700, marginTop: 14 }}>
              👤 Creado por: {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? t('btn.volver') : t('btn.cancelar')}</button>
          </div>
        </form>
          )}
          {selected.id && <DocumentosPanel modulo="clientes" registroId={selected.id} />}
        </div>
      </div>
    )
  }

  // Report data
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Razón Social', key: 'razon_social', width: 25 },
    { header: 'NIT/Doc', key: 'nro_documento', width: 14 },
    { header: 'Ciudad', key: 'ciudad', width: 12 },
    { header: 'Teléfono', key: 'telefono', width: 12 },
    { header: 'Email', key: 'email', width: 18 },
    { header: 'Actividad', key: 'actividad', width: 14 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(c => ({
    codigo: c.codigo, razon_social: c.razon_social, nro_documento: c.nro_documento,
    ciudad: c.ciudad, telefono: c.telefono, email: c.email, actividad: c.actividad, situacion: c.situacion,
  }))
  const reportFilters = [
    { label: 'Situación', key: 'situacion', options: [...new Set(clientes.map(c => c.situacion).filter(Boolean))] },
    { label: 'Ciudad', key: 'ciudad', options: [...new Set(clientes.map(c => c.ciudad).filter(Boolean))] },
    { label: 'Actividad', key: 'actividad', options: [...new Set(clientes.map(c => c.actividad).filter(Boolean))] },
  ]

  return (
    <div>
      <ModuleHeader title={t('page.clientes.title')} subtitle={t('page.clientes.subtitle')} />

      {permisos.editar && tab === 'registros' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.clientes.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarCliente')}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 16 }} />

          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('lbl.codigo'), t('lbl.razonSocial'), t('lbl.tipoIdentificacion'), t('lbl.nroDocumento'), t('lbl.direccion'), t('lbl.ciudad'), t('lbl.pais'), t('lbl.telefono'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.razon_social}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.tipo_identificacion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.nro_documento}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.direccion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.ciudad}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.pais}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.telefono}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(c.situacion) }}>{ts(c.situacion)}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setSelected(c); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                        <button onClick={() => setCorreoModal({ to: c.email || '', ref: c.codigo })} title="Enviar correo" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#0ea5e9', color: '#ffffff', border: '1px solid #38bdf8' }}>✉</button>
                        {isValidPhone(c.telefono) && (
                          <a href={buildWhatsAppLink(c.telefono, idioma === 'en' ? `Hi ${c.razon_social}, this is a quick message from us.` : `Hola ${c.razon_social}, te escribimos desde nuestra empresa.`)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                        )}
                        {permisos.editar && <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Edit</button>}
                        {permisos.eliminar && <button onClick={() => {
                          if (!confirm(`¿Eliminar cliente "${c.razon_social}"?`)) return
                          deleteCliente(c.id)
                          logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: c.codigo, registro_nombre: c.razon_social, detalle: 'Cliente eliminado' })
                        }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Elim</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay empresas registradas</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Clientes" columns={reportColumns} rows={reportRows} filters={reportFilters} />
      )}

      {correoModal && (
        <EnviarCorreoModal destinatario={correoModal.to} modulo="clientes" referencia={correoModal.ref} onClose={() => setCorreoModal(null)} />
      )}
    </div>
  )
}
