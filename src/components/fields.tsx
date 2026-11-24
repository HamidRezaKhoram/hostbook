import type { ComponentChildren, JSX } from 'preact';
import { useId } from 'preact/hooks';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ComponentChildren;
}) {
  return (
    <label class="field">
      <span class="field__label">{label}</span>
      {children}
      {hint && <span class="field__hint">{hint}</span>}
    </label>
  );
}

type InputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onInput' | 'type'> & {
  value: string;
  onValue: (v: string) => void;
  type?: string;
};

export function Input({ value, onValue, type = 'text', ...rest }: InputProps) {
  return (
    <input
      class="input"
      type={type}
      value={value}
      onInput={(e) => onValue(e.currentTarget.value)}
      {...rest}
    />
  );
}

export function TextArea({
  value,
  onValue,
  rows = 4,
  ...rest
}: Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onInput' | 'rows'> & {
  value: string;
  onValue: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      class="input input--area"
      rows={rows}
      value={value}
      onInput={(e) => onValue(e.currentTarget.value)}
      {...rest}
    />
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** One-of-several choice as a row of segments (radio buttons underneath). */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  const name = useId();
  return (
    <fieldset class="field">
      <legend class="field__label">{label}</legend>
      <div class="segmented">
        {options.map((o) => (
          <label key={o.value} class="segmented__item">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Many-of-several choice as toggle chips (checkboxes underneath). */
export function Chips<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  values: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset class="field">
      <legend class="field__label">{label}</legend>
      <div class="chips">
        {options.map((o) => (
          <label key={o.value} class="chip-toggle">
            <input
              type="checkbox"
              checked={values.includes(o.value)}
              onChange={(e) =>
                onChange(
                  e.currentTarget.checked
                    ? [...values, o.value]
                    : values.filter((v) => v !== o.value),
                )
              }
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const options = <T extends string>(labels: Record<T, string>): Option<T>[] =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
