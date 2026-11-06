import type { Project } from "../domain/types";
import {
  compareScenarioPeriod,
  type ComparisonOptions,
} from "../engine/comparison";
self.onmessage = (
  event: MessageEvent<{
    baseline: Project;
    current: Project;
    options: ComparisonOptions;
  }>,
) => {
  try {
    self.postMessage({
      baseline: compareScenarioPeriod(event.data.baseline, event.data.options),
      current: compareScenarioPeriod(event.data.current, event.data.options),
    });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
