// Restaura colores/estructura de Ofertas (portada TAMOIN) venciendo el CSS global. Scope: .po-root.
// En fondos oscuros (subtotales/totales/cabeceras) fuerza texto blanco intenso.
export const PRESUPUESTO_CSS = `
.po-root [style*="background: #0369a1"] { background: #0369a1 !important; }
.po-root [style*="background: #0369a1"], .po-root [style*="background: #0369a1"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #0b1d4a"] { background: #0b1d4a !important; }
.po-root [style*="background: #0b1d4a"], .po-root [style*="background: #0b1d4a"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #14532d"] { background: #14532d !important; }
.po-root [style*="background: #14532d"], .po-root [style*="background: #14532d"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #15803d"] { background: #15803d !important; }
.po-root [style*="background: #15803d"], .po-root [style*="background: #15803d"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #16a34a"] { background: #16a34a !important; }
.po-root [style*="background: #16a34a"], .po-root [style*="background: #16a34a"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #1e3a8a"] { background: #1e3a8a !important; }
.po-root [style*="background: #1e3a8a"], .po-root [style*="background: #1e3a8a"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #374151"] { background: #374151 !important; }
.po-root [style*="background: #374151"], .po-root [style*="background: #374151"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #3b5fd4"] { background: #3b5fd4 !important; }
.po-root [style*="background: #3b5fd4"], .po-root [style*="background: #3b5fd4"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #4338ca"] { background: #4338ca !important; }
.po-root [style*="background: #4338ca"], .po-root [style*="background: #4338ca"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #4c1d95"] { background: #4c1d95 !important; }
.po-root [style*="background: #4c1d95"], .po-root [style*="background: #4c1d95"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #6b7280"] { background: #6b7280 !important; }
.po-root [style*="background: #6b7280"], .po-root [style*="background: #6b7280"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #78350f"] { background: #78350f !important; }
.po-root [style*="background: #78350f"], .po-root [style*="background: #78350f"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #7c3aed"] { background: #7c3aed !important; }
.po-root [style*="background: #7c3aed"], .po-root [style*="background: #7c3aed"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #9a3412"] { background: #9a3412 !important; }
.po-root [style*="background: #9a3412"], .po-root [style*="background: #9a3412"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #a16207"] { background: #a16207 !important; }
.po-root [style*="background: #a16207"], .po-root [style*="background: #a16207"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #b45309"] { background: #b45309 !important; }
.po-root [style*="background: #b45309"], .po-root [style*="background: #b45309"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #bfdbfe"] { background: #bfdbfe !important; }
.po-root [style*="background: #c7d7f5"] { background: #c7d7f5 !important; }
.po-root [style*="background: #dbe4fb"] { background: #dbe4fb !important; }
.po-root [style*="background: #dc2626"] { background: #dc2626 !important; }
.po-root [style*="background: #dc2626"], .po-root [style*="background: #dc2626"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #e0e7ff"] { background: #e0e7ff !important; }
.po-root [style*="background: #e9f9ee"] { background: #e9f9ee !important; }
.po-root [style*="background: #ea580c"] { background: #ea580c !important; }
.po-root [style*="background: #ea580c"], .po-root [style*="background: #ea580c"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #eaf7ee"] { background: #eaf7ee !important; }
.po-root [style*="background: #ecfdf5"] { background: #ecfdf5 !important; }
.po-root [style*="background: #eef2ff"] { background: #eef2ff !important; }
.po-root [style*="background: #eef3ff"] { background: #eef3ff !important; }
.po-root [style*="background: #eef6fb"] { background: #eef6fb !important; }
.po-root [style*="background: #f0f3fa"] { background: #f0f3fa !important; }
.po-root [style*="background: #f1f2f4"] { background: #f1f2f4 !important; }
.po-root [style*="background: #f1f5f9"] { background: #f1f5f9 !important; }
.po-root [style*="background: #f3edff"] { background: #f3edff !important; }
.po-root [style*="background: #f3f4f6"] { background: #f3f4f6 !important; }
.po-root [style*="background: #f5f7fb"] { background: #f5f7fb !important; }
.po-root [style*="background: #f9fafb"] { background: #f9fafb !important; }
.po-root [style*="background: #fafbfe"] { background: #fafbfe !important; }
.po-root [style*="background: #fbf3e2"] { background: #fbf3e2 !important; }
.po-root [style*="background: #fdba74"] { background: #fdba74 !important; }
.po-root [style*="background: #fff"] { background: #fff !important; }
.po-root [style*="background: #fff"], .po-root [style*="background: #fff"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: #fff1e8"] { background: #fff1e8 !important; }
.po-root [style*="background: #fff7ed"] { background: #fff7ed !important; }
.po-root [style*="background: #ffffff"] { background: #ffffff !important; }
.po-root [style*="background: linear-gradient(135deg, #2d3f66, #5c80be)"] { background: linear-gradient(135deg, #2d3f66, #5c80be) !important; }
.po-root [style*="background: linear-gradient(135deg, #2d3f66, #5c80be)"], .po-root [style*="background: linear-gradient(135deg, #2d3f66, #5c80be)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(11,29,74,0.45)"] { background: rgba(11,29,74,0.45) !important; }
.po-root [style*="background: rgba(11,29,74,0.45)"], .po-root [style*="background: rgba(11,29,74,0.45)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(11, 29, 74, 0.45)"] { background: rgba(11, 29, 74, 0.45) !important; }
.po-root [style*="background: rgba(11, 29, 74, 0.45)"], .po-root [style*="background: rgba(11, 29, 74, 0.45)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(122,152,198,1)"] { background: rgba(122,152,198,1) !important; }
.po-root [style*="background: rgba(122,152,198,1)"], .po-root [style*="background: rgba(122,152,198,1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(122, 152, 198, 1)"] { background: rgba(122, 152, 198, 1) !important; }
.po-root [style*="background: rgba(122, 152, 198, 1)"], .po-root [style*="background: rgba(122, 152, 198, 1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(21,128,61,0.12)"] { background: rgba(21,128,61,0.12) !important; }
.po-root [style*="background: rgba(21,128,61,0.12)"], .po-root [style*="background: rgba(21,128,61,0.12)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(21, 128, 61, 0.12)"] { background: rgba(21, 128, 61, 0.12) !important; }
.po-root [style*="background: rgba(21, 128, 61, 0.12)"], .po-root [style*="background: rgba(21, 128, 61, 0.12)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(234,88,12,0.12)"] { background: rgba(234,88,12,0.12) !important; }
.po-root [style*="background: rgba(234,88,12,0.12)"], .po-root [style*="background: rgba(234,88,12,0.12)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(234, 88, 12, 0.12)"] { background: rgba(234, 88, 12, 0.12) !important; }
.po-root [style*="background: rgba(234, 88, 12, 0.12)"], .po-root [style*="background: rgba(234, 88, 12, 0.12)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(239,68,68,1)"] { background: rgba(239,68,68,1) !important; }
.po-root [style*="background: rgba(239,68,68,1)"], .po-root [style*="background: rgba(239,68,68,1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(239, 68, 68, 1)"] { background: rgba(239, 68, 68, 1) !important; }
.po-root [style*="background: rgba(239, 68, 68, 1)"], .po-root [style*="background: rgba(239, 68, 68, 1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(255,255,255,0.15)"] { background: rgba(255,255,255,0.15) !important; }
.po-root [style*="background: rgba(255, 255, 255, 0.15)"] { background: rgba(255, 255, 255, 0.15) !important; }
.po-root [style*="background: rgba(92,128,190,1)"] { background: rgba(92,128,190,1) !important; }
.po-root [style*="background: rgba(92,128,190,1)"], .po-root [style*="background: rgba(92,128,190,1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root [style*="background: rgba(92, 128, 190, 1)"] { background: rgba(92, 128, 190, 1) !important; }
.po-root [style*="background: rgba(92, 128, 190, 1)"], .po-root [style*="background: rgba(92, 128, 190, 1)"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root .bg-\[\#1e3a8a\] { background: #1e3a8a !important; }
.po-root .bg-\[\#1e3a8a\], .po-root .bg-\[\#1e3a8a\] * { color:#ffffff !important; }
.po-root .bg-\[\#f1f5f9\] { background: #f1f5f9 !important; }
.po-root .bg-\[\#f8fafc\] { background: #f8fafc !important; }
.po-root .text-white { color:#ffffff !important; }
.po-root .text-black { color:#000000 !important; }
.po-root [class*="text-[#000"] { color:#000000 !important; }
.po-root [class*="text-[#fff"] { color:#ffffff !important; }
.po-concepto, .po-concepto *, .po-concepto option { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
.po-root button[style*="background"], .po-root a[style*="background"], .po-root button[style*="background"] *, .po-root a[style*="background"] * { color:#ffffff !important; -webkit-text-fill-color:#ffffff !important; }
`
