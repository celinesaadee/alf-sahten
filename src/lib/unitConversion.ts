export type UnitSystem = "original" | "metric" | "us";
export type ConvertedUnit = "g" | "kg" | "ml" | "l" | "oz" | "lb" | "usFluidOunces";
type Unit = { dimension: "mass" | "volume"; factor: number };
const units = new Map<string, Unit>();
function register(names: string[], dimension: Unit["dimension"], factor: number) {
  for (const name of names) units.set(name, { dimension, factor });
}
register(["g", "gram", "grams", "gramme", "grammes", "غ", "غرام", "غرامات", "جرام", "جرامات"], "mass", 1);
register(["kg", "kilogram", "kilograms", "kilogramme", "kilogrammes", "كغ", "كيلوغرام", "كيلوجرام"], "mass", 1000);
register(["oz", "ounce", "ounces", "once", "onces", "أونصة", "أونصات"], "mass", 28.349523125);
register(["lb", "lbs", "pound", "pounds", "livre", "livres", "رطل", "أرطال"], "mass", 453.59237);
register(["ml", "milliliter", "milliliters", "millilitre", "millilitres", "مل", "ملليلتر", "مليلتر"], "volume", 1);
register(["l", "liter", "liters", "litre", "litres", "ل", "لتر", "لترات"], "volume", 1000);
// Unqualified cups, spoons and fluid ounces vary by region. Never guess.
register(["us fl oz", "us fluid ounce", "us fluid ounces"], "volume", 29.5735295625);

export function convertMeasurement(quantity: number, unit: string, system: UnitSystem): { quantity: number; unit: ConvertedUnit } | null {
  if (system === "original" || !Number.isFinite(quantity) || quantity < 0) return null;
  const source = units.get(unit.trim().toLowerCase().replace(/\.$/, ""));
  if (!source) return null;
  const base = quantity * source.factor;
  if (!Number.isFinite(base)) return null;
  if (source.dimension === "mass") {
    if (system === "metric") return base >= 1000 ? { quantity: base / 1000, unit: "kg" } : { quantity: base, unit: "g" };
    return base >= 453.59237 ? { quantity: base / 453.59237, unit: "lb" } : { quantity: base / 28.349523125, unit: "oz" };
  }
  if (system === "metric") return base >= 1000 ? { quantity: base / 1000, unit: "l" } : { quantity: base, unit: "ml" };
  return { quantity: base / 29.5735295625, unit: "usFluidOunces" };
}
