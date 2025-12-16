// Cursor: select file:src/main/db/db-worker-client.ts

/**
 * Database Worker Client
 * Manages communication with the DB Worker thread
 */

import { Worker } from "worker_threads";
import { randomUUID } from "crypto";
import type { DbMethod, WorkerRequest, WorkerResponse } from "./worker-types";
import { logger } from "../lib/logger";
import * as fs from "fs/promises";
import * as path from "path";

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timer: NodeJS.Timeout;
}

/**
 * Client for communicating with the DB Worker thread
 */
export class DbWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private dbPath: string | null = null; // 🔥 FIX 1: Объявляем приватное поле для хранения пути к миграциям
  private migrationsPath: string | null = null; // Конструктор публичен для Фабричного метода.

  constructor() {}
  /**
   * Статический Фабричный метод. Создает инстанс и гарантирует его инициализацию.
   */

  public static async initialize(
    dbPath: string,
    migrationsPath: string
  ): Promise<DbWorkerClient> {
    const client = new DbWorkerClient(); // 🔥 FIX 2: Сохраняем путь в новом приватном поле
    client.migrationsPath = migrationsPath;
    await client._initializeWorker(dbPath, migrationsPath);
    return client;
  }
  /**
   * Приватный нестатический метод, содержащий логику запуска Worker.
   */

  private async _initializeWorker(
    dbPath: string,
    migrationsPath: string
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    } // Устранение ESLint 'no-async-promise-executor'

    this.initPromise = new Promise((resolve, reject) => {
      (async () => {
        try {
          this.dbPath = dbPath;

          const workerPath = path.join(__dirname, "db-worker.cjs");

          logger.info(`DbWorkerClient: Spawning worker from ${workerPath}`);

          this.worker = new Worker(workerPath);

          this.worker.on("message", (response: WorkerResponse) => {
            this.handleWorkerMessage(response);
          });

          this.worker.on("error", (error) => {
            logger.error("DbWorkerClient: Worker error", error);
            this.rejectAllPending("Worker thread error");
            reject(error);
          });

          this.worker.on("exit", (code) => {
            if (code !== 0) {
              logger.error(`DbWorkerClient: Worker exited with code ${code}`);
              this.rejectAllPending("Worker thread exited unexpectedly");
              reject(new Error(`Worker exited with code ${code}`));
            }
            this.worker = null;
            this.isInitialized = false;
            this.initPromise = null;
          });

          const initId = randomUUID();
          await this.sendInitMessage(initId, dbPath, migrationsPath);

          this.isInitialized = true;
          this.initPromise = null;
          logger.info("DbWorkerClient: Worker initialized successfully");
          resolve();
        } catch (error) {
          logger.error("DbWorkerClient: Failed to initialize worker", error);
          this.initPromise = null;
          reject(error);
        }
      })();
    });

    return this.initPromise;
  }
  /**
   * Send initialization message to worker
   */

  private sendInitMessage(
    id: string,
    dbPath: string,
    migrationsPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not available"));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error("Database initialization timeout"));
      }, 60000); // 60s timeout

      this.pendingRequests.set(id, {
        resolve: () => {
          clearTimeout(timer);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          this.pendingRequests.delete(id);
          reject(error);
        },
        timer,
      });

      this.worker.postMessage({
        type: "init",
        dbPath,
        migrationsPath,
        id,
      });
    });
  }
  /**
   * Handle messages from the worker
   */

  private handleWorkerMessage(response: WorkerResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      logger.warn(
        `DbWorkerClient: Received response for unknown request ID: ${response.id}`
      );
      return;
    }

    this.pendingRequests.delete(response.id);
    clearTimeout(pending.timer);

    if (response.success) {
      pending.resolve(response.data);
    } else {
      pending.reject(new Error(response.error || "Unknown error"));
    }
  }
  /**
   * Reject all pending requests (e.g., on worker error/exit)
   */

  private rejectAllPending(reason: string): void {
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }
  /**
   * Call a database method
   */

  public async call<T>(method: DbMethod, payload?: unknown): Promise<T> {
    if (!this.isInitialized || !this.worker) {
      throw new Error("Worker not initialized. Call initialize() first.");
    }

    const id = randomUUID();
    const request: WorkerRequest = {
      id,
      type: method,
      payload: payload ?? null,
    };

    return new Promise<T>((resolve, reject) => {
      // Set up 60s timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Database operation timeout: ${method}`));
      }, 60000);

      this.pendingRequests.set(id, {
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data as T);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
        timer,
      }); // Send request to worker

      this.worker!.postMessage(request);
    });
  }
  /**
   * Terminate the worker gracefully (closes DB and exits)
   */

  public async terminate(): Promise<void> {
    const worker = this.worker;
    if (!worker) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const terminateId = randomUUID();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(terminateId); // Force terminate if graceful termination times out
        worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        this.initPromise = null;
        reject(new Error("Worker termination timeout"));
      }, 5000);

      this.pendingRequests.set(terminateId, {
        resolve: () => {
          clearTimeout(timeout);
          this.worker = null;
          this.isInitialized = false;
          this.initPromise = null;
          logger.info("DbWorkerClient: Worker terminated gracefully");
          resolve();
        },
        reject: (error) => {
          clearTimeout(timeout);
          this.pendingRequests.delete(terminateId);
          reject(error);
        },
        timer: timeout,
      }); // Send terminate message to worker

      worker.postMessage({
        type: "terminate",
        id: terminateId,
      }); // Wait for worker to exit

      worker.once("exit", () => {
        const pending = this.pendingRequests.get(terminateId);
        if (pending) {
          clearTimeout(timeout);
          this.pendingRequests.delete(terminateId);
          this.worker = null;
          this.isInitialized = false;
          this.initPromise = null;
          logger.info("DbWorkerClient: Worker exited");
          resolve();
        }
      });
    });
  }
  /**
   * Restore database from backup file
   */

  public async restore(backupPath: string): Promise<void> {
    if (!this.dbPath || !this.migrationsPath) {
      throw new Error("Database path not set. Cannot restore.");
    }

    logger.info(`DbWorkerClient: Starting restore from ${backupPath}`);

    if (this.worker) {
      await this.terminate();
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      await fs.copyFile(backupPath, this.dbPath);
      logger.info(`DbWorkerClient: Backup restored to ${this.dbPath}`);
    } catch (error) {
      logger.error("DbWorkerClient: Failed to copy backup file", error);
      throw new Error(
        `Failed to restore backup: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    await this._initializeWorker(this.dbPath, this.migrationsPath);
    logger.info("DbWorkerClient: Restore completed successfully");
  }
}
