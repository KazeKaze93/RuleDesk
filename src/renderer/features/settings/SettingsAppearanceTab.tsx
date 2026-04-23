import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";

type ThemePreference = "system" | "light" | "dark";

interface SettingsAppearanceTabProps {
  theme: ThemePreference;
  isThemeSaving: boolean;
  onThemeChange: (value: ThemePreference) => void;
}

export const SettingsAppearanceTab = ({
  theme,
  isThemeSaving,
  onThemeChange,
}: SettingsAppearanceTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose the visual theme for RuleDesk.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
};
