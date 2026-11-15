import { bootEarly } from "./boot/early";
import { applyLayoutBeforePaint, startEarlyLayout } from "./boot/layout";
import { scheduleAfterFirstPaint, whenDomReady } from "./boot/ready";

bootEarly();
startEarlyLayout();

whenDomReady(() => {
  applyLayoutBeforePaint();
  scheduleAfterFirstPaint(() => {
    void import("./boot/app").then(({ startApp }) => {
      void startApp();
    });
  });
});
