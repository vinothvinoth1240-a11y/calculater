
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type Operator = '+' | '-' | '*' | '/' | null;

export interface CalculatorState {
  currentValue: string;
  previousValue: string;
  operator: Operator;
  waitingForNextValue: boolean;
  history: HistoryItem[];
  expression: string;
}
