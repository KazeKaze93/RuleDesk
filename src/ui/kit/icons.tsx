import type { JSX, SVGAttributes } from "preact";

type IconProps = {
  readonly size?: number;
  readonly className?: string;
  readonly title?: string;
};

const DEFAULT_SIZE = 16;

function baseProps(
  size: number,
  className: string | undefined,
  title: string | undefined,
): SVGAttributes<SVGSVGElement> {
  const props: SVGAttributes<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": title === undefined ? true : undefined,
    role: title === undefined ? undefined : "img",
  };
  if (className !== undefined) {
    props.className = className;
  }
  if (title !== undefined) {
    props["aria-label"] = title;
  }
  return props;
}

export function IconStar(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconStarFilled(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg
      {...baseProps(size, props.className, props.title)}
      fill="currentColor"
      stroke="none"
    >
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconPlus(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconCheck(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconX(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconArrowUp(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function IconExternalLink(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconDroplet(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

export function IconPencil(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconFlag(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

export function IconNote(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

export function IconSettings(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function IconSearch(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconTrash(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconEye(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconImage(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function IconVideo(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function IconShuffle(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="m18 14 4 4-4 4" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
      <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
      <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </svg>
  );
}

export function IconOriginalOrder(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M21 6H3" />
      <path d="M7 12H3" />
      <path d="M7 18H3" />
      <path d="M12 18a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L11 14" />
      <path d="M11 10v4h4" />
    </svg>
  );
}

export function IconPalette(props: IconProps): JSX.Element {
  const size = props.size ?? DEFAULT_SIZE;
  return (
    <svg {...baseProps(size, props.className, props.title)}>
      {props.title !== undefined ? <title>{props.title}</title> : null}
      <path d="M12 2a10 10 0 1 0 10 10c0-1.5-1.5-2-2.5-2-1 0-1.5.5-2.5.5s-1.5-.5-1.5-1.5.5-2 1.5-2.5S18.5 5 18.5 3.5A10 10 0 0 0 12 2z" />
      <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
