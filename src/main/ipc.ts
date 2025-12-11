// src/main/ipc.ts

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { DbService } from './db/db-service';
import { Artist, NewArtist } from './db/schema';

// --- 1. Определение API контрактов ---
// Мы не определяем их здесь, чтобы избежать циклической зависимости. 
// Но здесь будет логика вызова API и Drizzle.

// --- 2. Типизированные обработчики ---
// Пример обработчика, который Main Process будет вызывать напрямую.
const handleGetAppVersion = async (event: IpcMainInvokeEvent): Promise<string> => {
    return '1.0.0-dev'; 
};

/**
 * Регистрирует все асинхронные и синхронные обработчики IPC.
 * @param dbService - Инстанс сервиса для работы с БД.
 */
export function registerIpcHandlers(dbService: DbService) {
// --- DB HANDLERS (определяем внутри, чтобы захватить dbService) ---
    
const handleGetTrackedArtists = async (): Promise<Artist[]> => {
    return dbService.getTrackedArtists(); 
};

const handleAddArtist = async (event: IpcMainInvokeEvent, artistData: NewArtist): Promise<Artist | undefined> => {
    return dbService.addArtist(artistData);
};

// --- REGISTRATION ---

ipcMain.handle('app:get-version', handleGetAppVersion);
ipcMain.handle('db:get-artists', handleGetTrackedArtists);
ipcMain.handle('db:add-artist', handleAddArtist);


}