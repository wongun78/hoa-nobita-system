import { type ReactNode } from 'react'

type TabsProps = Readonly<{
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
  children: ReactNode
}>

export function Tabs({ tabs, active, onChange, children }: TabsProps) {
  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${active === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">{children}</div>
    </div>
  )
}
