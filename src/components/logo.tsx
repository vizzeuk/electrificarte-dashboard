import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

/** Bolt mark — mismo acento cyan que electrificarteweb (#00E5E5). */
export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"
        fill="#00E5E5"
        stroke="#00E5E5"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
