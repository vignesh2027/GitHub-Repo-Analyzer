import { useEffect, useRef } from 'react'

const GRADE_COLOR = {
  A: '#16A34A',
  B: '#65A30D',
  C: '#D97706',
  D: '#DC2626',
}

export default function HealthGauge({ score = 0, grade = 'C', size = 160 }) {
  const circleRef = useRef(null)

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const half = circumference / 2 // use only top half (semicircle)
  const arcLen = circumference * 0.75 // 270 degree arc
  const offset = arcLen - (score / 100) * arcLen

  const color = GRADE_COLOR[grade] || '#16A34A'

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.setProperty('--target-offset', `${offset}px`)
    }
  }, [offset])

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size * 0.85}
          viewBox="0 0 120 105"
          className="overflow-visible"
        >
          {/* Background arc */}
          <circle
            cx="60"
            cy="65"
            r={radius}
            fill="none"
            stroke="#EDE8DC"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circumference}`}
            transform="rotate(135 60 65)"
          />
          {/* Score arc */}
          <circle
            ref={circleRef}
            cx="60"
            cy="65"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(135 60 65)"
            className="gauge-arc transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-3xl font-extrabold text-stone-900" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-stone-500 font-medium -mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className="mt-1 px-4 py-1 rounded-full text-white font-bold text-sm shadow-sm"
        style={{ backgroundColor: color }}
      >
        Grade {grade}
      </div>
      <p className="text-xs text-stone-500 mt-1.5 font-medium">Repository Health</p>
    </div>
  )
}
