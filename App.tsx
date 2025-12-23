
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { History, Delete, RotateCcw, Plus, Minus, X, Divide, Percent, ChevronRight, Calculator as CalcIcon } from 'lucide-react';
import { HistoryItem, CalculatorState, Operator } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<CalculatorState>({
    currentValue: '0',
    previousValue: '',
    operator: null,
    waitingForNextValue: false,
    history: [],
    expression: ''
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) {
      setState(prev => ({ ...prev, history: JSON.parse(savedHistory) }));
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(state.history));
  }, [state.history]);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
  };

  const formatDisplayValue = (val: string) => {
    if (val === 'Error') return val;
    if (val === '0' || val === '') return '0';
    
    // Split for decimals
    const parts = val.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleDigit = useCallback((digit: string) => {
    triggerAnimation();
    setState(prev => {
      if (prev.waitingForNextValue) {
        return {
          ...prev,
          currentValue: digit,
          waitingForNextValue: false,
          expression: prev.expression + digit
        };
      }

      const newValue = prev.currentValue === '0' ? digit : prev.currentValue + digit;
      return {
        ...prev,
        currentValue: newValue,
        expression: prev.expression + (prev.currentValue === '0' && digit !== '.' ? '' : '')
      };
    });
  }, []);

  const handleDecimal = useCallback(() => {
    triggerAnimation();
    setState(prev => {
      if (prev.waitingForNextValue) {
        return {
          ...prev,
          currentValue: '0.',
          waitingForNextValue: false,
          expression: prev.expression + '0.'
        };
      }
      if (!prev.currentValue.includes('.')) {
        return {
          ...prev,
          currentValue: prev.currentValue + '.',
          expression: prev.expression + '.'
        };
      }
      return prev;
    });
  }, []);

  const calculate = (a: number, b: number, op: Operator): number | string => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 'Error' : a / b;
      default: return b;
    }
  };

  const handleOperator = useCallback((nextOp: Operator) => {
    triggerAnimation();
    setState(prev => {
      const current = parseFloat(prev.currentValue);
      
      if (prev.operator && prev.waitingForNextValue) {
        return { ...prev, operator: nextOp };
      }

      if (prev.previousValue === '') {
        return {
          ...prev,
          previousValue: prev.currentValue,
          operator: nextOp,
          waitingForNextValue: true,
          expression: prev.currentValue + ' ' + (nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp) + ' '
        };
      }

      const prevVal = parseFloat(prev.previousValue);
      const result = calculate(prevVal, current, prev.operator);
      
      if (result === 'Error') {
        return {
          ...prev,
          currentValue: 'Error',
          previousValue: '',
          operator: null,
          waitingForNextValue: true,
          expression: ''
        };
      }

      return {
        ...prev,
        currentValue: String(result),
        previousValue: String(result),
        operator: nextOp,
        waitingForNextValue: true,
        expression: String(result) + ' ' + (nextOp === '*' ? '×' : nextOp === '/' ? '÷' : nextOp) + ' '
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    triggerAnimation();
    setState(prev => {
      if (!prev.operator || prev.waitingForNextValue) return prev;

      const current = parseFloat(prev.currentValue);
      const prevVal = parseFloat(prev.previousValue);
      const result = calculate(prevVal, current, prev.operator);
      
      if (result === 'Error') {
        return {
          ...prev,
          currentValue: 'Error',
          previousValue: '',
          operator: null,
          waitingForNextValue: true,
          expression: ''
        };
      }

      const fullExpression = `${prevVal} ${prev.operator === '*' ? '×' : prev.operator === '/' ? '÷' : prev.operator} ${current}`;
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: fullExpression,
        result: String(result),
        timestamp: Date.now()
      };

      return {
        ...prev,
        currentValue: String(result),
        previousValue: '',
        operator: null,
        waitingForNextValue: true,
        history: [newHistoryItem, ...prev.history].slice(0, 50),
        expression: String(result)
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    triggerAnimation();
    setState(prev => ({
      ...prev,
      currentValue: '0',
      previousValue: '',
      operator: null,
      waitingForNextValue: false,
      expression: ''
    }));
  }, []);

  const handleDelete = useCallback(() => {
    triggerAnimation();
    setState(prev => {
      if (prev.waitingForNextValue) return prev;
      if (prev.currentValue.length === 1 || prev.currentValue === '0') {
        return { ...prev, currentValue: '0' };
      }
      return {
        ...prev,
        currentValue: prev.currentValue.slice(0, -1)
      };
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    triggerAnimation();
    setState(prev => ({
      ...prev,
      currentValue: prev.currentValue.startsWith('-') ? prev.currentValue.slice(1) : '-' + prev.currentValue
    }));
  }, []);

  const handlePercent = useCallback(() => {
    triggerAnimation();
    setState(prev => {
      const val = parseFloat(prev.currentValue);
      return {
        ...prev,
        currentValue: String(val / 100)
      };
    });
  }, []);

  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
    if (e.key === '.') handleDecimal();
    if (e.key === '+') handleOperator('+');
    if (e.key === '-') handleOperator('-');
    if (e.key === '*') handleOperator('*');
    if (e.key === '/') handleOperator('/');
    if (e.key === 'Enter' || e.key === '=') handleEquals();
    if (e.key === 'Backspace') handleDelete();
    if (e.key === 'Escape') handleClear();
  }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleDelete, handleClear]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const useHistoryItem = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      currentValue: item.result,
      expression: item.result,
      waitingForNextValue: false,
      operator: null,
      previousValue: ''
    }));
    setIsHistoryOpen(false);
  };

  const clearHistory = () => {
    setState(prev => ({ ...prev, history: [] }));
  };

  const currentResultPreview = (() => {
    if (!state.operator || state.waitingForNextValue) return '';
    const prev = parseFloat(state.previousValue);
    const curr = parseFloat(state.currentValue);
    const res = calculate(prev, curr, state.operator);
    return res === 'Error' ? '' : ` = ${formatDisplayValue(String(res))}`;
  })();

  return (
    <div className="relative max-w-md w-full mx-auto px-4">
      {/* Background Glow */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full"></div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>

      <div className="glass rounded-[32px] overflow-hidden shadow-2xl relative z-10">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl flex items-center justify-center neon-glow">
              <CalcIcon className="text-white w-6 h-6" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">NeonFlow</h1>
          </div>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors relative group"
          >
            <History className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Display */}
        <div className="p-8 flex flex-col items-end justify-end h-56 bg-gradient-to-b from-transparent to-white/5">
          <div className="w-full text-right mb-2">
            <span className="text-gray-500 text-lg jetbrains-mono break-all whitespace-nowrap overflow-hidden">
              {state.expression || '\u00A0'}
            </span>
          </div>
          <div className={`w-full text-right transition-all duration-150 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
            <span className="text-5xl md:text-6xl font-medium tracking-tighter jetbrains-mono block overflow-hidden text-ellipsis">
              {formatDisplayValue(state.currentValue)}
            </span>
            <div className="text-sm text-purple-400/80 font-medium jetbrains-mono h-5 mt-2">
              {currentResultPreview}
            </div>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3 p-6 pt-2">
          {/* Row 1 */}
          <CalcButton label="AC" onClick={handleClear} variant="functional" />
          <CalcButton label="+/−" onClick={handleToggleSign} variant="functional" />
          <CalcButton label="%" onClick={handlePercent} variant="functional" />
          <CalcButton label={<Divide className="w-6 h-6" />} onClick={() => handleOperator('/')} variant="operator" active={state.operator === '/'} />

          {/* Row 2 */}
          <CalcButton label="7" onClick={() => handleDigit('7')} />
          <CalcButton label="8" onClick={() => handleDigit('8')} />
          <CalcButton label="9" onClick={() => handleDigit('9')} />
          <CalcButton label={<X className="w-6 h-6" />} onClick={() => handleOperator('*')} variant="operator" active={state.operator === '*'} />

          {/* Row 3 */}
          <CalcButton label="4" onClick={() => handleDigit('4')} />
          <CalcButton label="5" onClick={() => handleDigit('5')} />
          <CalcButton label="6" onClick={() => handleDigit('6')} />
          <CalcButton label={<Minus className="w-6 h-6" />} onClick={() => handleOperator('-')} variant="operator" active={state.operator === '-'} />

          {/* Row 4 */}
          <CalcButton label="1" onClick={() => handleDigit('1')} />
          <CalcButton label="2" onClick={() => handleDigit('2')} />
          <CalcButton label="3" onClick={() => handleDigit('3')} />
          <CalcButton label={<Plus className="w-6 h-6" />} onClick={() => handleOperator('+')} variant="operator" active={state.operator === '+'} />

          {/* Row 5 */}
          <CalcButton label="0" onClick={() => handleDigit('0')} className="col-span-1" />
          <CalcButton label="." onClick={handleDecimal} />
          <CalcButton label={<Delete className="w-5 h-5" />} onClick={handleDelete} variant="functional" />
          <CalcButton label="=" onClick={handleEquals} variant="equals" />
        </div>
      </div>

      {/* History Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isHistoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsHistoryOpen(false)}
      ></div>

      {/* History Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm glass z-50 transition-transform duration-500 transform ${isHistoryOpen ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-purple-400" />
              History
            </h2>
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 opacity-50">
                <RotateCcw className="w-12 h-12 mb-2" />
                <p>No history yet</p>
              </div>
            ) : (
              state.history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => useHistoryItem(item)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="text-sm text-gray-400 mb-1 jetbrains-mono">{item.expression} =</div>
                  <div className="text-xl font-medium text-white jetbrains-mono">{formatDisplayValue(item.result)}</div>
                </div>
              ))
            )}
          </div>

          {state.history.length > 0 && (
            <div className="p-6 border-t border-white/10">
              <button 
                onClick={clearHistory}
                className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-medium transition-all"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: 'number' | 'operator' | 'functional' | 'equals';
  active?: boolean;
  className?: string;
}

const CalcButton: React.FC<ButtonProps> = ({ label, onClick, variant = 'number', active = false, className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'operator':
        return active 
          ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
          : 'bg-white/5 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300';
      case 'functional':
        return 'bg-white/5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300';
      case 'equals':
        return 'bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-105';
      default:
        return 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${getStyles()}
        ${className}
        h-16 rounded-2xl flex items-center justify-center
        text-xl font-medium transition-all duration-200
        btn-active border border-white/5
      `}
    >
      {label}
    </button>
  );
};

export default App;
