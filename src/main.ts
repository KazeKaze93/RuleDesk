import { bootEarly } from "./boot/early";
import { applyLayoutBeforePaint, startEarlyLayout } from "./boot/layout";
import { scheduleAfterFirstPaint, whenDomReady } from "./boot/ready";
import { log } from "./log";

bootEarly();
startEarlyLayout();

whenDomReady(() => {
  applyLayoutBeforePaint();
  scheduleAfterFirstPaint(() => {
    import("./boot/app")
      .then(({ startApp }) => startApp())
      .catch((error: unknown) => {
        log.error("start failed", error);
      });
  });
});
