// icon: a name of IconSvg; the #icon slot draws any other icon.
// title: a tooltip with more than the label says.
export type SegmentedOption<T extends string | number | boolean = string> = {
  value: T
  label: string
  icon?: string
  count?: number | null
  disabled?: boolean
  title?: string
}
