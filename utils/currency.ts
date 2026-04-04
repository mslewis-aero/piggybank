export const formatCurrency = (amount: number): string => {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

export const formatSignedCurrency = (
  amount: number,
  type: "deposit" | "withdrawal"
): string => {
  const prefix = type === "deposit" ? "+" : "-";
  return `${prefix}$${Math.abs(amount).toFixed(2)}`;
};

export const parseCurrencyInput = (text: string): number => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return 0;
  if (parts[1] && parts[1].length > 2) {
    return parseFloat(`${parts[0]}.${parts[1].slice(0, 2)}`);
  }
  return parseFloat(cleaned) || 0;
};
