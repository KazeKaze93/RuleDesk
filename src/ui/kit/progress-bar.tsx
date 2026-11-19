import type { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { KitStyle } from "./kit-style";

const PROGRESS_WIDTH_VAR = "--rdw-progress-width";

export type ProgressBarProps = {
  /** 0–1 when determinate; omit or null leaves the bar empty unless waiting. */
  readonly value?: number | null;
  /** Explicit waiting animation; not implied by a missing value. */
  readonly waiting?: boolean;
  readonly label?: string;
  readonly className?: string;
};

export const PROGRESS_BAR_CSS = `
.rdw-progress {
  display: grid;
  gap: 4px;
  width: 100%;
}
.rdw-progress__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-progress__track {
  height: 6px;
  border-radius: 999px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  overflow: hidden;
}
.rdw-progress__fill {
  height: 100%;
  width: var(${PROGRESS_WIDTH_VAR}, 0%);
  background: var(--rdw-accent);
  border-radius: inherit;
  transition: width 0.2s ease;
}
.rdw-progress__fill--indeterminate {
  width: 40%;
  animation: rdw-progress-indeterminate 1.1s ease-in-out infinite;
}
@keyframes rdw-progress-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(280%); }
}
`;

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element {
  const fillRef = useRef<HTMLDivElement>(null);
  const waiting = props.waiting === true;
  const hasValue = props.value !== undefined && props.value !== null;
  const ratio = hasValue ? clampUnit(props.value) : 0;
  const className = ["rdw-progress", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  useEffect(() => {
    const fill = fillRef.current;
    if (fill === null) {
      return;
    }
    if (waiting || !hasValue) {
      fill.style.removeProperty(PROGRESS_WIDTH_VAR);
      return;
    }
    fill.style.setProperty(PROGRESS_WIDTH_VAR, `${Math.round(ratio * 100)}%`);
  }, [waiting, hasValue, ratio]);

  return (
    <>
      <KitStyle css={PROGRESS_BAR_CSS} />
      <div className={className}>
        {props.label !== undefined ? (
          <div className="rdw-progress__label">{props.label}</div>
        ) : null}
        <div
          className="rdw-progress__track"
          role="progressbar"
          aria-label={props.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={hasValue && !waiting ? Math.round(ratio * 100) : undefined}
        >
          <div
            ref={fillRef}
            className={
              waiting
                ? "rdw-progress__fill rdw-progress__fill--indeterminate"
                : "rdw-progress__fill"
            }
          />
        </div>
      </div>
    </>
  );
}
