export type ToolValues = Record<string, number | string>;
export interface ToolInput {
  key: string;
  label: string;
  unit?: string;
  type?: 'number' | 'select' | 'text';
  default?: number | string;
  min?: number;
  max?: number;
  step?: number | 'any';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
}
export interface ToolResult {
  values: Array<{ label: string; value: number | string; unit?: string }>;
  formula: string;
  notes: string[];
  warnings: string[];
  status: 'calculated' | 'incomplete' | 'unsupported';
  sources: string[];
  series?: Array<Record<string, number | string>>;
}
export interface EngineeringTool {
  id: string;
  title: string;
  category: string;
  description: string;
  inputs: ToolInput[];
  exampleInputs: ToolValues;
  calculate: (values: ToolValues) => ToolResult;
}
