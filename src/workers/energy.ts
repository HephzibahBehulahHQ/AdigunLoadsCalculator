import { simulateEnergy } from "../engine/simulation";
self.onmessage = (event: MessageEvent) => {
  try {
    self.postMessage({
      result: simulateEnergy(event.data.project, event.data.options),
    });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
