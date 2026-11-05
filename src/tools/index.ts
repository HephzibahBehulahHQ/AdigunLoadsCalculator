import { fundamentals } from "./fundamentals";
import { motors } from "./motors";
import { cables } from "./cables";
import { supply, powerQuality } from "./supply";
import { renewables } from "./renewables";
import { profiles } from "./profiles";
import { economics } from "./economics";

export type {
  EngineeringTool,
  ToolInput,
  ToolResult,
  ToolValues,
} from "./types";
export const tools = [
  ...fundamentals,
  ...motors,
  ...cables,
  ...supply,
  ...powerQuality,
  ...renewables,
  ...profiles,
  ...economics,
];
export const toolCategories = [...new Set(tools.map((tool) => tool.category))];
export function getTool(id: string) {
  const tool = tools.find((entry) => entry.id === id);
  if (!tool) throw new Error(`Unknown engineering tool: ${id}`);
  return tool;
}
