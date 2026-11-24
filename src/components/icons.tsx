import type { JSX } from 'preact';

type IconProps = JSX.SVGAttributes<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </Svg>
);

export const GuestsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16 14.6c2.3 0 4 1.5 4.5 4.4" />
  </Svg>
);

export const BasketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 10h17l-1.6 9.5H5.1z" />
    <path d="M8 10l3-6M16 10l-3-6" />
    <path d="M9.5 13.5v3M14.5 13.5v3" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
