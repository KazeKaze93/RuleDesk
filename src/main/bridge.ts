import { contextBridge, ipcRenderer } from "electron";
import { Artist, NewArtist, Settings, Post } from "./db/schema";

export interface IpcBridge {
  // App
  getAppVersion: () => Promise<string>;

  // Settings
  getSettings: () => Promise<Settings | undefined>;
  saveSettings: (creds: { userId: string; apiKey: string }) => Promise<boolean>;

  // Artists
  getTrackedArtists: () => Promise<Artist[]>;
  addArtist: (artist: NewArtist) => Promise<Artist | undefined>;
  getArtistPosts: (artistId: number, page?: number) => Promise<Post[]>;
  deleteArtist: (id: number) => Promise<void>;

  openExternal: (url: string) => Promise<void>;

  // Sync
  syncAll: () => Promise<boolean>;
}

const ipcBridge: IpcBridge = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),

  getSettings: () => ipcRenderer.invoke("app:get-settings"),
  saveSettings: (creds) => ipcRenderer.invoke("app:save-settings", creds),

  getTrackedArtists: () => ipcRenderer.invoke("db:get-artists"),
  addArtist: (artist) => ipcRenderer.invoke("db:add-artist", artist),
  getArtistPosts: (id, page) =>
    ipcRenderer.invoke("db:get-posts", { artistId: id, page }),
  deleteArtist: (id) => ipcRenderer.invoke("db:delete-artist", id),

  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),

  syncAll: () => ipcRenderer.invoke("db:sync-all"),
};

contextBridge.exposeInMainWorld("api", ipcBridge);
