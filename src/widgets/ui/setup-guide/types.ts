// The content file (setup-help.json, from the docs writer, #5940/#5965).
export type SetupStack = {
  id: string
  label: string
  file: string
  lang: string
  code: string
  // Shown under the code; `note` in the file is internal and never shown.
  hint: string | null
  // Replaces the section's steps for this stack (OpenTelemetry tabs of Sentry, #6523).
  steps?: string[]
}

export type SetupSection = {
  id: string
  title: string
  lead: string
  docs: string
  steps: string[]
  stacks: SetupStack[]
}

export type SetupContent = {
  defaults: Record<string, number>
  sections: SetupSection[]
}
