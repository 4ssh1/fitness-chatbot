export function detectGender(message: string): "male" | "female" | null {
  const lower = message.toLowerCase();

  if (
    lower.includes("female") ||
    lower.includes("woman") ||
    lower.includes("lady") ||
    lower.includes("girl") ||
    /\bi'?m a (lady|woman|girl|female)\b/.test(lower)
  ) {
    return "female";
  }

  if (
    lower.includes("male") ||
    lower.includes("man") ||
    lower.includes("guy") ||
    lower.includes("boy") ||
    /\bi'?m a (guy|man|boy|male)\b/.test(lower)
  ) {
    return "male";
  }

  return null;
}

