import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Separator } from "../../components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/toggle-group";
import { useAppearanceStore, type CardBorderStyle } from "../../store/appearanceStore";

type ThemePreference = "system" | "light" | "dark";

interface SettingsAppearanceTabProps {
  theme: ThemePreference;
  isThemeSaving: boolean;
  onThemeChange: (value: ThemePreference) => void;
}

const isCardBorderStyle = (value: string): value is CardBorderStyle => {
  return value === "rounded" || value === "sharp";
};

export const SettingsAppearanceTab = ({
  theme,
  isThemeSaving,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose the visual theme for RuleDesk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <Label>Theme</Label>
          <RadioGroup
            value={theme}
            onValueChange={onThemeChange}
            disabled={isThemeSaving}
            className="space-y-2"
          >
            <Label htmlFor="theme-system" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="system" id="theme-system" />
              System
            </Label>
            <Label htmlFor="theme-light" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="light" id="theme-light" />
              Light
            </Label>
            <Label htmlFor="theme-dark" className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="dark" id="theme-dark" />
              Dark
            </Label>
          </RadioGroup>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-2">
            <Label>Card border style</Label>
            <ToggleGroup
              type="single"
              value={cardBorderStyle}
              onValueChange={handleCardBorderStyleChange}
              className="justify-start"
            >
              <ToggleGroupItem value="rounded" aria-label="Rounded border style">
                Rounded
              </ToggleGroupItem>
              <ToggleGroupItem value="sharp" aria-label="Sharp border style">
                Sharp
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <Label>Grid</Label>
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
