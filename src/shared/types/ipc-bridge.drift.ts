/**
 * Compile-time drift guard: ``Window.api`` must stay identical to ``IpcBridge``.
 *
 * ``skipLibCheck`` can hide ambient ``.d.ts`` mistakes; this ``.ts`` file is
 * always typechecked by ``npm run typecheck`` / ``npm run validate``.
 */
import type { IpcBridge } from "./ipc-bridge";

type ExactEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <
  T,
>() => T extends B ? 1 : 2
  ? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
    ? true
    : false
  : false;

type WindowApi = Window["api"];

type _AssertWindowApiIsIpcBridge = ExactEqual<WindowApi, IpcBridge>;
const _windowApiMatchesBridge: _AssertWindowApiIsIpcBridge = true;

void _windowApiMatchesBridge;
