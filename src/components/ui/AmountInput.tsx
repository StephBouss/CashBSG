import { useEffect, useState, type ChangeEvent } from "react";

const groupFormatter = new Intl.NumberFormat("fr-FR");

function toDisplay(value: number | undefined): string {
  return value === undefined || value === null || Number.isNaN(value) ? "" : groupFormatter.format(value);
}

interface AmountInputProps {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
}

/** Champ montant qui affiche des séparateurs de milliers pendant la saisie
 * (ex: 15 000 000) tout en exposant une valeur numérique brute au formulaire. */
export function AmountInput({ id, value, onChange, placeholder, className }: AmountInputProps) {
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");

    if (digitsOnly === "") {
      setDisplay("");
      onChange(undefined);
      return;
    }

    const numeric = Number(digitsOnly);
    setDisplay(groupFormatter.format(numeric));
    onChange(numeric);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
