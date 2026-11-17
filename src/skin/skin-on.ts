import { RDW_SKIN_CLASS } from "../config/constants";

/**
 * True in the script's own themes (Light, Dark, Custom), where the skin draws
 * the site. In Site default and Site dark the site looks the way it does
 * without the script, and the script does not dress the site's own controls
 * there: a field with the script's magnifier in it but the site's white box
 * around it is worse than either (Kaze, 17.11.2026). What the script adds of
 * its own (the search panel, the buttons, the menu) is there in every theme.
 */
export function skinIsOn(): boolean {
  return document.documentElement.classList.contains(RDW_SKIN_CLASS);
}
