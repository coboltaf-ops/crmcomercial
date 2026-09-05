// El módulo Ofertas (.po-root) ya renderiza con sus propios estilos inline/Tailwind,
// porque el CSS global agresivo se EXCLUYE de .po-root en globals.css (igual que en
// Operaciones/Borinquen, que no tienen ese CSS). Por eso aquí NO se re-aplican colores
// con selectores costosos [style*=...] (que bloqueaban el render del modal "Ver").
// Solo se refuerza el texto blanco de los chips/selects de concepto (clase barata).
export const PRESUPUESTO_CSS = `
.po-concepto, .po-concepto *, .po-concepto option { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
`
