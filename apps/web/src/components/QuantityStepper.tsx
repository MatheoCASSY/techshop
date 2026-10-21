import { MAX_QUANTITY_PER_ITEM } from '@techshop/shared';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { focusRing } from './ui';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}

export function QuantityStepper({ value, max, onChange, label }: QuantityStepperProps) {
  const { t } = useTranslation();
  const limit = Math.max(1, Math.min(max, MAX_QUANTITY_PER_ITEM));
  const button = `flex size-9 items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-800 ${focusRing}`;

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
      <button
        type="button"
        className={`${button} rounded-l-lg`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={t('cart.decrease')}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={limit}
        value={value}
        aria-label={label}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(Math.max(1, Math.min(next, limit)));
        }}
        className="w-12 border-x border-gray-300 bg-transparent py-1.5 text-center text-sm [appearance:textfield] focus:outline-none dark:border-gray-600 [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        className={`${button} rounded-r-lg`}
        onClick={() => onChange(value + 1)}
        disabled={value >= limit}
        aria-label={t('cart.increase')}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
