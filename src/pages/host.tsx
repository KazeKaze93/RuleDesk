import { render as preactRender } from "preact";
import type { ComponentChild, JSX } from "preact";

import { resolveAppearancePalette } from "../skin/theme";
import { getAppearance } from "../storage/store";
import { KIT_CONTROL_FONT_VAR, KIT_CONTROL_HEIGHT_VAR } from "../ui/kit";
import { applyTokenProperties } from "../ui/tokens";
import {
  isCollectionDetailPage,
  MENU_LABEL,
  PAGE_CONTENT_MAX_WIDTH_PX,
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_STATS,
  type RdwPage,
} from "./constants";
import { PAGE_CONTENT_CSS } from "./page-css";
import { PAGE_CENTRE_PADDING } from "./view-mode";

const PAGE_CONTROL_HEIGHT_PX = 32;
const PAGE_CONTROL_FONT_PX = 13;
const PAGE_SHELL_CLASS = "rdw-page-shell";
const PAGE_TITLE_CLASS = "rdw-page-title";
/**
 * On the mount point of Collections and Following: the page spans the window
 * so that its tiles can; the page itself keeps the rest in the centred column.
 */
export const LAYOUT_WIDE_CLASS = "rdw-layout-wide";

/**
 * Structural shell only — palette tokens come from applyTokenProperties on the
 * host (same source as document :root via resolveAppearancePalette).
 */
const PAGE_HOST_CSS = `
:host {
  all: initial;
  font-family: var(--rdw-font);
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
  background: transparent;
  /* The script's own pages have room: their controls are a step larger. */
  ${KIT_CONTROL_HEIGHT_VAR}: ${String(PAGE_CONTROL_HEIGHT_PX)}px;
  ${KIT_CONTROL_FONT_VAR}: ${String(PAGE_CONTROL_FONT_PX)}px;
}
.${PAGE_SHELL_CLASS} {
  box-sizing: border-box;
  max-width: ${String(PAGE_CONTENT_MAX_WIDTH_PX)}px;
  margin: 0 auto;
  padding: 16px 12px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${LAYOUT_WIDE_CLASS} .${PAGE_SHELL_CLASS} {
  max-width: none;
  margin: 0;
  padding: 16px 20px 32px;
}
.${LAYOUT_WIDE_CLASS} .${PAGE_TITLE_CLASS} {
  padding-inline: ${PAGE_CENTRE_PADDING};
}
.${PAGE_TITLE_CLASS} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
${PAGE_CONTENT_CSS}
`;

type PageShellProps = {
  readonly title: string | null;
  readonly children: ComponentChild;
};

function PageShell(props: PageShellProps): JSX.Element {
  return (
    <>
      <style>{PAGE_HOST_CSS}</style>
      <div className={PAGE_SHELL_CLASS}>
        {props.title !== null ? (
          <h1 className={PAGE_TITLE_CLASS}>{props.title}</h1>
        ) : null}
        {props.children}
      </div>
    </>
  );
}

function titleForRoute(route: RdwPage): string | null {
  if (isCollectionDetailPage(route)) {
    return null;
  }
  if (route === RDW_ROUTE_COLLECTIONS) {
    return MENU_LABEL.collections;
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return MENU_LABEL.following;
  }
  if (route === RDW_ROUTE_STATS) {
    return MENU_LABEL.stats;
  }
  return MENU_LABEL.settings;
}

type PageFactory = () => Promise<JSX.Element>;

let settingsFactory: PageFactory | null = null;
let collectionsFactory: PageFactory | null = null;
let followingFactory: PageFactory | null = null;
let statsFactory: PageFactory | null = null;

function getSettingsFactory(): PageFactory {
  if (settingsFactory === null) {
    settingsFactory = async (): Promise<JSX.Element> => {
      const mod = await import("./settings-page");
      return <mod.SettingsPage />;
    };
  }
  return settingsFactory;
}

function getCollectionsFactory(): PageFactory {
  if (collectionsFactory === null) {
    collectionsFactory = async (): Promise<JSX.Element> => {
      const mod = await import("./collections-page");
      return <mod.CollectionsPage />;
    };
  }
  return collectionsFactory;
}

function getFollowingFactory(): PageFactory {
  if (followingFactory === null) {
    followingFactory = async (): Promise<JSX.Element> => {
      const mod = await import("./following-page");
      return <mod.FollowingPage />;
    };
  }
  return followingFactory;
}

function getStatsFactory(): PageFactory {
  if (statsFactory === null) {
    statsFactory = async (): Promise<JSX.Element> => {
      const mod = await import("./stats-section");
      return <mod.StatsPage />;
    };
  }
  return statsFactory;
}

function collectionDetailFactory(collectionId: string): PageFactory {
  return async (): Promise<JSX.Element> => {
    const mod = await import("./collection-detail-page");
    return (
      <mod.CollectionDetailPage
        key={collectionId}
        collectionId={collectionId}
      />
    );
  };
}

function pageFactoryForRoute(route: RdwPage): PageFactory {
  if (isCollectionDetailPage(route)) {
    return collectionDetailFactory(route.collectionId);
  }
  if (route === RDW_ROUTE_COLLECTIONS) {
    return getCollectionsFactory();
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return getFollowingFactory();
  }
  if (route === RDW_ROUTE_STATS) {
    return getStatsFactory();
  }
  return getSettingsFactory();
}

/** The pages whose tiles span the window. */
function hasTiles(route: RdwPage): boolean {
  return route === RDW_ROUTE_COLLECTIONS || route === RDW_ROUTE_FOLLOWING;
}

let shownRoute: RdwPage | null = null;

/** Gives the shown page its width. */
function syncRdwPageLayout(): void {
  if (mountPoint === null || shownRoute === null) {
    return;
  }
  mountPoint.classList.toggle(LAYOUT_WIDE_CLASS, hasTiles(shownRoute));
}

let hostElement: HTMLElement | null = null;
let mountPoint: HTMLElement | null = null;
let renderGeneration = 0;

function syncHostTokens(host: HTMLElement): void {
  applyTokenProperties(host, resolveAppearancePalette(getAppearance()));
}

function ensureHost(header: HTMLElement): {
  host: HTMLElement;
  mount: HTMLElement;
} {
  if (hostElement !== null && mountPoint !== null) {
    if (hostElement.parentElement !== header.parentElement) {
      header.after(hostElement);
    }
    return { host: hostElement, mount: mountPoint };
  }

  const existing = document.getElementById(RDW_PAGE_ROOT_ID);
  if (existing !== null) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = RDW_PAGE_ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");
  shadow.append(mount);
  header.after(host);

  hostElement = host;
  mountPoint = mount;
  return { host, mount };
}

/** Mount Preact page for route into #rdw-page-root after div#header. */
export async function showRdwPage(
  route: RdwPage,
  header: HTMLElement,
): Promise<void> {
  const { host, mount } = ensureHost(header);
  syncHostTokens(host);
  const generation = ++renderGeneration;
  const page = await pageFactoryForRoute(route)();
  if (generation !== renderGeneration || mountPoint !== mount) {
    return;
  }
  shownRoute = route;
  syncRdwPageLayout();
  preactRender(
    <PageShell title={titleForRoute(route)}>{page}</PageShell>,
    mount,
  );
}

/** Unmount own page and remove #rdw-page-root. */
export function hideRdwPage(): void {
  renderGeneration += 1;
  if (mountPoint !== null) {
    preactRender(null, mountPoint);
  }
  if (hostElement !== null) {
    hostElement.remove();
  }
  hostElement = null;
  mountPoint = null;
  shownRoute = null;
  const stray = document.getElementById(RDW_PAGE_ROOT_ID);
  if (stray !== null) {
    stray.remove();
  }
}
