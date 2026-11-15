import type { JSX } from "preact";
import { render } from "preact";
import { useEffect, useId, useRef, useState } from "preact/hooks";

import { getSiteSkinCss } from "../skin/site-skin";
import {
  applyAppearanceTheme,
  clampBackgroundDim,
  createDefaultCustomTheme,
  DEFAULT_BACKGROUND_DIM,
  getScreenPixelSize,
  prepareBackgroundImageFile,
} from "../skin/theme";
import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
} from "../config/constants";
import { gridDensityFeature } from "../features/grid-density";
import { applyCssOnlyFeatureChoice } from "../features/runtime";
import {
  APPEARANCE_CUSTOM_BASE_DARK,
  APPEARANCE_CUSTOM_BASE_LIGHT,
  AppearanceThemeSchema,
  type Appearance,
  type AppearanceCustom,
  type AppearanceCustomBase,
} from "../storage/schema";
import {
  clearBackground,
  loadBackground,
  saveBackground,
} from "../storage/background-store";
import {
  getAppearance,
  getFeatureChoiceValue,
  setAppearance,
  setFeatureChoiceValue,
} from "../storage/store";
import { Button } from "./kit/button";
import { SectionLabel } from "./kit/section-label";
import { Select, type SelectOption } from "./kit/select";
import { Segmented, type SegmentedOption } from "./kit/segmented";
import { TextField } from "./kit/text-field";
import { KIT_FOCUS_CSS } from "./kit/shared";

const GRID_FEATURE_ID = gridDensityFeature.id;

const THEME_OPTIONS: readonly SelectOption[] = [
  { value: APPEARANCE_THEME_SITE, label: "Site default" },
  { value: APPEARANCE_THEME_SITE_DARK, label: "Site dark" },
  { value: APPEARANCE_THEME_LIGHT, label: "Light" },
  { value: APPEARANCE_THEME_DARK, label: "Dark" },
  { value: APPEARANCE_THEME_CUSTOM, label: "Custom" },
];

const GRID_OPTIONS: readonly SelectOption[] = [
  { value: "default", label: "Default" },
  { value: "compact", label: "Compact" },
  { value: "large", label: "Large" },
];

const BASE_OPTIONS: readonly SegmentedOption[] = [
  { value: APPEARANCE_CUSTOM_BASE_LIGHT, label: "Light" },
  { value: APPEARANCE_CUSTOM_BASE_DARK, label: "Dark" },
];

const SECTION_TITLE = "Appearance";
const THEME_ROW_LABEL = "Site theme";
const THEME_ROW_HINT = "Light, dark or your own";
const BASE_ROW_LABEL = "Base";
const BG_IMAGE_LABEL = "Background image";
const BG_IMAGE_HINT = "From a link or a file";
const BG_URL_PLACEHOLDER = "https://… or data URL";
const BG_DIM_LABEL = "Dim";
const CHOOSE_LABEL = "Choose…";
const REMOVE_LABEL = "Remove";
const RESET_LABEL = "Reset to defaults";
const GRID_ROW_LABEL = "Grid";
const SCREEN_HINT_PREFIX = "For this screen use at least ";
const IMAGE_SIZE_PREFIX = "Image size: ";
const IMAGE_TOO_SMALL_WARN =
  "This image is smaller than your screen; it may look soft when stretched.";

const ACCEPT_IMAGE = "image/*";

export const APPEARANCE_SECTION_CSS = `
${KIT_FOCUS_CSS}
.rdw-appearance {
  display: grid;
  gap: 2px;
}
.rdw-appearance__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
  color: var(--rdw-text);
}
.rdw-appearance__row--top {
  align-items: flex-start;
}
.rdw-appearance__row:nth-child(even) {
  background: var(--rdw-surface-2);
}
.rdw-appearance__row-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.rdw-appearance__row-text small {
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__select {
  width: 110px;
  flex: none;
}
.rdw-appearance__base {
  width: 140px;
  flex: none;
}
.rdw-appearance__bg {
  display: grid;
  gap: 6px;
  width: 100%;
}
.rdw-appearance__bg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.rdw-appearance__dim {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--rdw-muted);
}
.rdw-appearance__dim input[type="range"] {
  flex: 1;
  min-width: 80px;
  accent-color: var(--rdw-accent);
}
.rdw-appearance__hint {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__warn {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-danger-soft);
  color: var(--rdw-danger);
  font-size: 12px;
}
.rdw-appearance__file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.rdw-appearance__footer {
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px 0;
}
`;

function resolveGridChoice(): string {
  const stored = getFeatureChoiceValue(GRID_FEATURE_ID);
  const options = gridDensityFeature.choice?.options ?? [];
  if (
    stored !== undefined &&
    options.some((option) => option.value === stored)
  ) {
    return stored;
  }
  return gridDensityFeature.choice?.defaultValue ?? "default";
}

function ensureCustom(appearance: Appearance): AppearanceCustom {
  return appearance.custom ?? createDefaultCustomTheme();
}

function persistAndApply(
  appearance: Appearance,
  backgroundDataUrl?: string | null,
): void {
  const parsed = setAppearance(appearance);
  applyAppearanceTheme({
    appearance: parsed,
    siteSkinCss: getSiteSkinCss(),
    ...(backgroundDataUrl !== undefined &&
    backgroundDataUrl !== null &&
    backgroundDataUrl.length > 0
      ? { backgroundDataUrl }
      : {}),
  });
}

function formatScreenHint(): string {
  const screen = getScreenPixelSize();
  return `${SCREEN_HINT_PREFIX}${String(screen.width)}x${String(screen.height)}`;
}

export type AppearanceSectionProps = {
  readonly className?: string;
  /** False when the host already shows the section title. */
  readonly includeHeading?: boolean;
};

export function AppearanceSection(
  props: AppearanceSectionProps,
): JSX.Element {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    getAppearance(),
  );
  const [gridValue, setGridValue] = useState<string>(() => resolveGridChoice());
  const [bgUrlDraft, setBgUrlDraft] = useState<string>(() => {
    const current = getAppearance();
    return current.custom?.backgroundImage ?? "";
  });
  const [storedBackgroundUrl, setStoredBackgroundUrl] = useState<string | null>(
    null,
  );
  const [fileError, setFileError] = useState<string>("");
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    belowScreen: boolean;
  } | null>(null);
  const [screenHint] = useState<string>(() => formatScreenHint());

  // First paint uses base palette colors only; stored image loads async after.
  useEffect(() => {
    let cancelled = false;
    void loadBackground().then((dataUrl) => {
      if (cancelled || dataUrl === null) {
        return;
      }
      setStoredBackgroundUrl(dataUrl);
      const current = getAppearance();
      if (current.theme !== APPEARANCE_THEME_CUSTOM) {
        return;
      }
      applyAppearanceTheme({
        appearance: current,
        siteSkinCss: getSiteSkinCss(),
        backgroundDataUrl: dataUrl,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const custom = ensureCustom(appearance);
  const isCustom = appearance.theme === APPEARANCE_THEME_CUSTOM;
  const hasBackground =
    (storedBackgroundUrl?.length ?? 0) > 0 ||
    (custom.backgroundImage?.length ?? 0) > 0 ||
    bgUrlDraft.length > 0;

  function commitAppearance(
    next: Appearance,
    backgroundDataUrl?: string | null,
  ): void {
    setAppearanceState(next);
    persistAndApply(next, backgroundDataUrl);
    setFileError("");
  }

  function onThemeChange(value: string): void {
    const parsed = AppearanceThemeSchema.safeParse(value);
    if (!parsed.success) {
      return;
    }
    const theme = parsed.data;
    if (theme === APPEARANCE_THEME_CUSTOM) {
      commitAppearance(
        {
          theme,
          custom: ensureCustom(appearance),
        },
        storedBackgroundUrl,
      );
      return;
    }
    commitAppearance({ theme });
  }

  function onBaseChange(value: string): void {
    if (
      value !== APPEARANCE_CUSTOM_BASE_LIGHT &&
      value !== APPEARANCE_CUSTOM_BASE_DARK
    ) {
      return;
    }
    const base: AppearanceCustomBase = value;
    const current = ensureCustom(getAppearance());
    const nextCustom: AppearanceCustom = {
      base,
      backgroundDim: clampBackgroundDim(
        current.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
      ),
      ...(current.backgroundImage !== undefined
        ? { backgroundImage: current.backgroundImage }
        : {}),
    };
    commitAppearance(
      {
        theme: APPEARANCE_THEME_CUSTOM,
        custom: nextCustom,
      },
      storedBackgroundUrl,
    );
  }

  function onBgUrlCommit(url: string): void {
    const trimmed = url.trim();
    setBgUrlDraft(trimmed);
    setImageMeta(null);
    const base = ensureCustom(getAppearance());
    const nextCustom: AppearanceCustom = {
      base: base.base,
      backgroundDim: clampBackgroundDim(
        base.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
      ),
      ...(trimmed.length > 0 ? { backgroundImage: trimmed } : {}),
    };
    if (trimmed.length > 0) {
      setStoredBackgroundUrl(null);
      void clearBackground();
    }
    commitAppearance({
      theme: APPEARANCE_THEME_CUSTOM,
      custom: nextCustom,
    });
  }

  function onDimChange(raw: number): void {
    const dim = clampBackgroundDim(raw);
    const base = ensureCustom(getAppearance());
    const nextCustom: AppearanceCustom = {
      base: base.base,
      backgroundDim: dim,
      ...(base.backgroundImage !== undefined
        ? { backgroundImage: base.backgroundImage }
        : {}),
    };
    commitAppearance(
      {
        theme: APPEARANCE_THEME_CUSTOM,
        custom: nextCustom,
      },
      storedBackgroundUrl,
    );
  }

  async function onFileSelected(file: File | undefined): Promise<void> {
    if (file === undefined) {
      return;
    }
    try {
      const prepared = await prepareBackgroundImageFile(file);
      await saveBackground(prepared.dataUrl);
      setStoredBackgroundUrl(prepared.dataUrl);
      setBgUrlDraft("");
      setImageMeta({
        width: prepared.sourceWidth,
        height: prepared.sourceHeight,
        belowScreen: prepared.belowScreen,
      });
      const base = ensureCustom(getAppearance());
      const nextCustom: AppearanceCustom = {
        base: base.base,
        backgroundDim: clampBackgroundDim(
          base.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
        ),
      };
      commitAppearance(
        {
          theme: APPEARANCE_THEME_CUSTOM,
          custom: nextCustom,
        },
        prepared.dataUrl,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not read image file";
      setFileError(message);
    }
  }

  function onRemoveBackground(): void {
    void clearBackground();
    setStoredBackgroundUrl(null);
    setBgUrlDraft("");
    setImageMeta(null);
    const base = ensureCustom(getAppearance());
    commitAppearance({
      theme: APPEARANCE_THEME_CUSTOM,
      custom: {
        base: base.base,
        backgroundDim: DEFAULT_BACKGROUND_DIM,
      },
    });
  }

  function onResetDefaults(): void {
    void clearBackground();
    setStoredBackgroundUrl(null);
    setBgUrlDraft("");
    setImageMeta(null);
    const defaults = createDefaultCustomTheme();
    commitAppearance({
      theme: APPEARANCE_THEME_CUSTOM,
      custom: defaults,
    });
  }

  function onGridChange(value: string): void {
    setGridValue(value);
    setFeatureChoiceValue(GRID_FEATURE_ID, value);
    applyCssOnlyFeatureChoice(GRID_FEATURE_ID, value);
  }

  const className = ["rdw-appearance", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{APPEARANCE_SECTION_CSS}</style>
      <section className={className} aria-label={SECTION_TITLE}>
        {props.includeHeading === false ? null : (
          <SectionLabel>{SECTION_TITLE}</SectionLabel>
        )}

        <div className="rdw-appearance__row">
          <div className="rdw-appearance__row-text">
            <span>{THEME_ROW_LABEL}</span>
            <small>{THEME_ROW_HINT}</small>
          </div>
          <Select
            className="rdw-appearance__select"
            options={THEME_OPTIONS}
            value={appearance.theme}
            onChange={onThemeChange}
          />
        </div>

        {isCustom ? (
          <>
            <div className="rdw-appearance__row">
              <div className="rdw-appearance__row-text">
                <span>{BASE_ROW_LABEL}</span>
              </div>
              <Segmented
                className="rdw-appearance__base"
                options={BASE_OPTIONS}
                value={custom.base}
                label={BASE_ROW_LABEL}
                onChange={onBaseChange}
              />
            </div>

            <div className="rdw-appearance__row rdw-appearance__row--top">
              <div className="rdw-appearance__row-text">
                <span>{BG_IMAGE_LABEL}</span>
                <small>{BG_IMAGE_HINT}</small>
              </div>
              <div
                className="rdw-appearance__bg"
                onFocusOut={(event) => {
                  const root = event.currentTarget;
                  const next = event.relatedTarget;
                  if (next instanceof Node && root.contains(next)) {
                    return;
                  }
                  onBgUrlCommit(bgUrlDraft);
                }}
              >
                <TextField
                  value={bgUrlDraft}
                  placeholder={BG_URL_PLACEHOLDER}
                  aria-label={BG_IMAGE_LABEL}
                  onChange={(value) => {
                    setBgUrlDraft(value);
                  }}
                />
                <div className="rdw-appearance__bg-actions">
                  <Button
                    variant="secondary"
                    size="s"
                    onClick={() => {
                      fileRef.current?.click();
                    }}
                  >
                    {CHOOSE_LABEL}
                  </Button>
                  {hasBackground ? (
                    <Button
                      variant="ghost"
                      size="s"
                      onClick={onRemoveBackground}
                    >
                      {REMOVE_LABEL}
                    </Button>
                  ) : null}
                  <input
                    ref={fileRef}
                    id={fileInputId}
                    className="rdw-appearance__file"
                    type="file"
                    accept={ACCEPT_IMAGE}
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      void onFileSelected(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
                <p className="rdw-appearance__hint">{screenHint}</p>
                {imageMeta !== null ? (
                  <p className="rdw-appearance__hint">
                    {IMAGE_SIZE_PREFIX}
                    {String(imageMeta.width)}x{String(imageMeta.height)}
                  </p>
                ) : null}
                {imageMeta?.belowScreen === true ? (
                  <div className="rdw-appearance__warn" role="status">
                    {IMAGE_TOO_SMALL_WARN}
                  </div>
                ) : null}
                {hasBackground ? (
                  <label className="rdw-appearance__dim">
                    <span>{BG_DIM_LABEL}</span>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.05}
                      value={custom.backgroundDim ?? DEFAULT_BACKGROUND_DIM}
                      aria-label={BG_DIM_LABEL}
                      onInput={(event) => {
                        onDimChange(Number(event.currentTarget.value));
                      }}
                    />
                    <span>
                      {String(
                        clampBackgroundDim(
                          custom.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
                        ),
                      )}
                    </span>
                  </label>
                ) : null}
                {fileError.length > 0 ? (
                  <div className="rdw-appearance__warn" role="status">
                    {fileError}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rdw-appearance__footer">
              <Button variant="ghost" size="s" onClick={onResetDefaults}>
                {RESET_LABEL}
              </Button>
            </div>
          </>
        ) : null}

        <div className="rdw-appearance__row">
          <div className="rdw-appearance__row-text">
            <span>{GRID_ROW_LABEL}</span>
          </div>
          <Select
            className="rdw-appearance__select"
            options={GRID_OPTIONS}
            value={gridValue}
            onChange={onGridChange}
          />
        </div>
      </section>
    </>
  );
}

/**
 * Mount the Appearance settings block into a host element for the panel.
 * B3 Settings tab should call this (or render `<AppearanceSection />` directly).
 */
export function createAppearanceSection(): HTMLElement {
  const host = document.createElement("div");
  host.className = "rdw-appearance-host";
  render(<AppearanceSection />, host);
  return host;
}
