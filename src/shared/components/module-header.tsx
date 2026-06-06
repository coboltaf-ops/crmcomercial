'use client'
import { useEmpresaStore } from '@/features/empresa/store/empresa-store'

interface ModuleHeaderProps {
  title: string
  subtitle?: string
}

export default function ModuleHeader({ title, subtitle }: ModuleHeaderProps) {
  const empresas = useEmpresaStore(s => s.empresas)
  const empresa = empresas[0]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      marginBottom: 32,
      padding: '20px',
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #e0e7ff'
    }}>
      {/* Logo */}
      {empresa?.logo_url ? (
        <img
          src={empresa.logo_url}
          alt="Logo"
          style={{
            width: 100,
            height: 100,
            borderRadius: 12,
            objectFit: 'contain',
            background: '#f3f4f6',
            padding: 8,
            flexShrink: 0
          }}
        />
      ) : (
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 12,
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          LOGO
        </div>
      )}

      {/* Texto */}
      <div>
        <h1 style={{
          color: '#013978',
          fontSize: 28,
          fontWeight: 700,
          margin: 0,
          marginBottom: 8
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            color: '#6b7280',
            fontSize: 14,
            margin: 0
          }}>
            {subtitle}
          </p>
        )}
        {empresa?.nombre && (
          <p style={{
            color: '#1e40af',
            fontSize: 13,
            fontWeight: 600,
            margin: '8px 0 0 0'
          }}>
            {empresa.nombre}
          </p>
        )}
      </div>
    </div>
  )
}
