const finite = (value: number, name: string) => {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`);
};

/** Converts a finite decimal to integer micro-units using decimal notation, not binary multiplication. */
function scaled(value: number, precision = 6): bigint {
  finite(value, "Decimal amount");
  const decimal = value.toFixed(precision);
  return BigInt(decimal.replace(".", ""));
}
const roundedDivision = (numerator: bigint, denominator: bigint): bigint => {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return sign * ((absolute + denominator / 2n) / denominator);
};
/** Round half away from zero to currency minor units. Internal energy/price products use 1e-12 currency units. */
export function roundCurrency(value: number, minorDigits = 2): number {
  const micro = scaled(value);
  const divisor = 10n ** BigInt(6 - minorDigits);
  return Number(roundedDivision(micro, divisor)) / 10 ** minorDigits;
}
export function energyCharge(entries: { kWh: number; rate: number }[]): number {
  // Accumulate physical energy per rate at full floating precision, then apply decimal billing once.
  const byRate = new Map<number, number>();
  for (const entry of entries) {
    finite(entry.kWh, "Billable energy");
    finite(entry.rate, "Energy rate");
    byRate.set(entry.rate, (byRate.get(entry.rate) ?? 0) + entry.kWh);
  }
  const decimal = (value: number): { numerator: bigint; places: number } => {
    const [mantissa, exponent = "0"] = value
      .toString()
      .toLowerCase()
      .split("e");
    const fraction = mantissa.split(".")[1]?.length ?? 0;
    let numerator = BigInt(mantissa.replace(".", ""));
    let places = fraction - Number(exponent);
    if (places < 0) {
      numerator *= 10n ** BigInt(-places);
      places = 0;
    }
    return { numerator, places };
  };
  let total = 0n;
  let places = 2;
  for (const [rate, energy] of byRate) {
    const a = decimal(energy);
    const b = decimal(rate);
    const productPlaces = a.places + b.places;
    if (productPlaces > places) {
      total *= 10n ** BigInt(productPlaces - places);
      places = productPlaces;
    }
    total += a.numerator * b.numerator * 10n ** BigInt(places - productPlaces);
  }
  return Number(roundedDivision(total, 10n ** BigInt(places - 2))) / 100;
}
