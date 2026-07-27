import demoConfig from "@demo/demo.config.json";
import company from "@demo/config/company.json";
import theme from "@demo/config/theme.json";
import industry from "@demo/config/industry.json";
import navigation from "@demo/config/navigation.json";
import dashboards from "@demo/config/dashboards.json";
import workflows from "@demo/config/workflows.json";
import ai from "@demo/config/ai.json";

export type DemoConfig = typeof demoConfig;
export type CompanyConfig = typeof company;
export type ThemeConfig = typeof theme;
export type NavigationConfig = typeof navigation;

export {
  demoConfig,
  company,
  theme,
  industry,
  navigation,
  dashboards,
  workflows,
  ai,
};

/** CSS custom-property string for :root injection from theme.json */
export function themeTokensToCss(vars: Record<string, string>, map: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => {
      const cssVar = map[key];
      return cssVar ? `  ${cssVar}: ${value};` : null;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildThemeCss(): string {
  const dark = themeTokensToCss(theme.tokens, theme.cssVarMap);
  const light = themeTokensToCss(theme.lightOverrides, theme.cssVarMap);
  return `:root {\n${dark}\n}\n\n.light {\n${light}\n}\n`;
}
