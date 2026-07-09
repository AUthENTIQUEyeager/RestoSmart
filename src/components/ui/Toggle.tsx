'use client'
import clsx from 'clsx'

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx('relative h-6 w-11 rounded-full transition', checked ? 'bg-green' : 'bg-border')}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
          checked ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  )
}
