// Funções financeiras compartilhadas. Valores monetários devem ser arredondados apenas na apresentação.
export const parseMoney = (value) => {
  const raw = String(value ?? '').trim().replace(/\s/g, '');
  if (!raw || !/^-?[\d.,]+$/.test(raw)) throw new Error('Valor monetário inválido');
  const comma = raw.lastIndexOf(',');
  const dot = raw.lastIndexOf('.');
  let normalized;
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    normalized = raw.split(thousands).join('').replace(decimal, '.');
  } else if (comma >= 0 || dot >= 0) {
    const separator = comma >= 0 ? ',' : '.';
    const pieces = raw.split(separator);
    if (pieces.length > 2) {
      if (!pieces.slice(1).every((part) => part.length === 3)) throw new Error('Formato monetário ambíguo');
      normalized = pieces.join('');
    } else if (pieces[1]?.length === 3) {
      throw new Error('Formato monetário ambíguo: informe separadores de milhar e centavos');
    } else {
      normalized = raw.replace(separator, '.');
    }
  } else normalized = raw;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new Error('Valor monetário inválido');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error('Valor monetário fora do limite');
  return parsed;
};

export const parseNonNegative = (value, label) => {
  const number = parseMoney(value);
  if (number < 0) throw new Error(`${label} não pode ser negativo`);
  return number;
};

export const parsePositive = (value, label) => {
  const number = parseMoney(value);
  if (number <= 0) throw new Error(`${label} deve ser maior que zero`);
  return number;
};

export const parseMarkup = (value) => {
  const percentage = parseNonNegative(value, 'Markup');
  if (percentage >= 100) throw new Error('Markup deve ser inferior a 100%');
  return percentage;
};

export const applyMarginMarkup = (baseFare, percentage) => {
  if (!Number.isFinite(baseFare) || baseFare < 0) throw new Error('Tarifa base inválida');
  const markup = parseMarkup(percentage);
  return baseFare / (1 - markup / 100);
};

export const roundCurrency = (value) => {
  if (!Number.isFinite(value)) throw new Error('Resultado financeiro inválido');
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
