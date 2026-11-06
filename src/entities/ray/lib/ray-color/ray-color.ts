// Ray's colors (->green(), ->orange(), ->red(), ->purple(), ->blue(),
// ->gray()) as literal class names. Tailwind keeps only classes it can read in
// the source; building `text-${color}-500` at runtime needed a safelist that
// put every text-* class (6653 of them) into the CSS.
const RAY_TEXT_COLORS: Record<string, string> = {
  green: 'text-green-500',
  orange: 'text-orange-500',
  red: 'text-red-500',
  purple: 'text-purple-500',
  blue: 'text-blue-500',
}

// Gray and unknown colors keep the default text color.
export const rayColorClass = (color?: string | null): string[] => {
  const cls = color ? RAY_TEXT_COLORS[color] : undefined
  return cls ? [cls] : []
}
