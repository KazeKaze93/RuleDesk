import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Separator } from "../../components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { useAppearanceStore, type CardBorderStyle } from "../../store/appearanceStore";

type ThemePreference = "system" | "light" | "dark";

const APPEARANCE_SECTION_TITLE = "Appearance";
const APPEARANCE_SECTION_DESCRIPTION = "Choose the visual theme for RuleDesk.";
const THEME_LABEL = "Theme";
const THEME_SYSTEM_LABEL = "System";
const THEME_LIGHT_LABEL = "Light";
const THEME_DARK_LABEL = "Dark";
const CARD_BORDER_LABEL = "Card border style";
const CARD_BORDER_ROUNDED_ARIA = "Rounded border style";
const CARD_BORDER_SHARP_ARIA = "Sharp border style";
const GRID_LABEL = "Grid";

interface SettingsAppearanceTabProps {
  theme: ThemePreference;
  isThemeSaving: boolean;
  /** When false, omit theme radios (shown in Setup section instead). Default true. */
  showTheme?: boolean;
  onThemeChange: (value: ThemePreference) => void;
}

const isCardBorderStyle = (value: string): value is CardBorderStyle => {
  return value === "rounded" || value === "sharp";
};

const parseThemePreference = (value: string): ThemePreference | null => {
  if (value === "system" || value === "light" || value === "dark") {
    return value;
  }
  return null;
};

export const SettingsAppearanceTab = ({
  theme,
  isThemeSaving,
  showTheme = true,
  onThemeChange,
}: SettingsAppearanceTabProps) => {
  const cardBorderStyle = useAppearanceStore((state) => state.cardBorderStyle);
  const gridColumns = useAppearanceStore((state) => state.gridColumns);
  const setCardBorderStyle = useAppearanceStore((state) => state.setCardBorderStyle);
  const setGridColumns = useAppearanceStore((state) => state.setGridColumns);

  const handleCardBorderStyleChange = (value: string | string[]): void => {
    if (typeof value !== "string") {
      return;
    }
    if (isCardBorderStyle(value)) {
      setCardBorderStyle(value);
    }
  };

  const handleGridColumnsChange = (value: string): void => {
    if (value === "2") {
      setGridColumns(2);
      return;
    }
    if (value === "3") {
      setGridColumns(3);
      return;
    }
    if (value === "4") {
      setGridColumns(4);
      return;
    }
    if (value === "auto") {
      setGridColumns("auto");
    }
  };

  const handleThemeChange = (value: string): void => {
    const next = parseThemePreference(value);
    if (next === null) {
      return;
    }
    onThemeChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{APPEARANCE_SECTION_TITLE}</CardTitle>
        <CardDescription>{APPEARANCE_SECTION_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showTheme ? (
          <>
            <section className="space-y-2">
              <Label>{THEME_LABEL}</Label>
              <RadioGroup
                value={theme}
                onValueChange={handleThemeChange}
                disabled={isThemeSaving}
                className="space-y-2"
              >
                <Label htmlFor="theme-system" className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="system" id="theme-system" />
                  {THEME_SYSTEM_LABEL}
                </Label>
                <Label htmlFor="theme-light" className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="light" id="theme-light" />
                  {THEME_LIGHT_LABEL}
                </Label>
                <Label htmlFor="theme-dark" className="flex items-center gap-2 font-normal">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  {THEME_DARK_LABEL}
                </Label>
              </RadioGroup>
            </section>

            <Separator />
          </>
        ) : null}

        <section className="space-y-4">
          <div className="space-y-2">
            <Label>{CARD_BORDER_LABEL}</Label>
            <ToggleGroup
              type="single"
              value={cardBorderStyle}
              onValueChange={handleCardBorderStyleChange}
              className="justify-start"
            >
              <ToggleGroupItem value="rounded" aria-label={CARD_BORDER_ROUNDED_ARIA}>
                Rounded
              </ToggleGroupItem>
              <ToggleGroupItem value="sharp" aria-label={CARD_BORDER_SHARP_ARIA}>
                Sharp
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <Label>{GRID_LABEL}</Label>
          <RadioGroup
            value={String(gridColumns)}
            onValueChange={handleGridColumnsChange}
            className="space-y-2"
          >
            <Label htmlFor="grid-columns-2" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="2" id="grid-columns-2" />
              2
            </Label>
            <Label htmlFor="grid-columns-3" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="3" id="grid-columns-3" />
              3
            </Label>
            <Label htmlFor="grid-columns-4" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="4" id="grid-columns-4" />
              4
            </Label>
            <Label htmlFor="grid-columns-auto" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="auto" id="grid-columns-auto" />
              Auto
            </Label>
          </RadioGroup>
        </section>
      </CardContent>
    </Card>
  );
};
