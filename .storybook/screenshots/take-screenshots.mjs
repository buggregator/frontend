/**
 * Takes screenshots of Storybook stories for components changed in the current PR.
 *
 * How it works:
 *   1. Runs `git diff` against the base branch to find changed .vue files
 *   2. For each changed .vue file, looks for a sibling .stories.ts file
 *   3. Reads the stories index from Storybook to find matching story IDs
 *   4. Captures a screenshot of each matched story
 *
 * Usage:
 *   node .storybook/screenshots/take-screenshots.mjs [storybook-url] [output-dir] [base-branch]
 *
 * Defaults:
 *   storybook-url = http://localhost:6006
 *   output-dir    = ./screenshots
 *   base-branch   = origin/master
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { execSync } from 'node:child_process'

const STORYBOOK_URL = process.argv[2] || 'http://localhost:6006'
const OUTPUT_DIR = process.argv[3] || './screenshots'
const BASE_BRANCH = process.argv[4] || 'origin/master'
const VIEWPORT = { width: 1920, height: 1080 }

function getChangedVueFiles() {
  try {
    const diff = execSync(`git diff --name-only ${BASE_BRANCH}...HEAD -- '*.vue'`, {
      encoding: 'utf8',
    }).trim()

    if (!diff) return []
    return diff.split('\n').filter(Boolean)
  } catch {
    console.log('Could not determine changed files from git, falling back to all Screens stories')
    return null
  }
}

function findRelatedStoryFiles(vueFiles) {
  const storyFiles = new Set()

  for (const vueFile of vueFiles) {
    const dir = dirname(vueFile)
    const name = basename(vueFile, '.vue')

    // Check for sibling story file
    const storyPath = join(dir, `${name}.stories.ts`)
    if (existsSync(storyPath)) {
      storyFiles.add(storyPath)
    }
  }

  return [...storyFiles]
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Step 1: Find changed .vue files
  const changedFiles = getChangedVueFiles()

  let storyTitlesToCapture = null

  if (changedFiles !== null && changedFiles.length > 0) {
    console.log(`Changed .vue files:\n  ${changedFiles.join('\n  ')}`)

    // Step 2: Find related story files
    const storyFiles = findRelatedStoryFiles(changedFiles)

    if (storyFiles.length === 0) {
      console.log('No story files found for changed components. Nothing to screenshot.')
      writeFileSync(join(OUTPUT_DIR, 'manifest.json'), '[]')
      return
    }

    console.log(`Related story files:\n  ${storyFiles.join('\n  ')}`)

    // Step 3: Extract story titles
    storyTitlesToCapture = new Set()
    for (const sf of storyFiles) {
      const content = readFileSync(sf, 'utf8')
      const match = content.match(/title:\s*["']([^"']+)["']/)
      if (match) storyTitlesToCapture.add(match[1])
    }

    console.log(`Story titles to capture:\n  ${[...storyTitlesToCapture].join('\n  ')}`)
  } else if (changedFiles !== null && changedFiles.length === 0) {
    console.log('No .vue files changed. Nothing to screenshot.')
    writeFileSync(join(OUTPUT_DIR, 'manifest.json'), '[]')
    return
  }
  // If changedFiles is null (git failed), we fall back to all Screens stories

  // Step 4: Launch browser and fetch story index
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  })

  const page = await context.newPage()
  let stories

  try {
    const res = await page.goto(`${STORYBOOK_URL}/index.json`, { waitUntil: 'load' })
    const data = await res.json()
    stories = Object.values(data.entries || data.stories || {})
  } catch {
    console.error('Could not fetch stories index. Is Storybook running?')
    await browser.close()
    process.exit(1)
  }

  // Step 5: Filter stories
  let targets
  if (storyTitlesToCapture) {
    targets = stories.filter(
      (s) => s.type === 'story' && storyTitlesToCapture.has(s.title)
    )
  } else {
    // Fallback: all Screens stories
    targets = stories.filter(
      (s) => s.type === 'story' && /^Screens\//i.test(s.title)
    )
  }

  if (targets.length === 0) {
    console.log('No matching stories found in Storybook index.')
    writeFileSync(join(OUTPUT_DIR, 'manifest.json'), '[]')
    await browser.close()
    return
  }

  console.log(`\nTaking ${targets.length} screenshots...`)
  const manifest = []

  for (const story of targets) {
    const storyId = story.id
    const url = `${STORYBOOK_URL}/iframe.html?id=${storyId}&viewMode=story&shortcuts=false&singleStory=true`
    const filename = `${storyId}.png`
    const filepath = join(OUTPUT_DIR, filename)

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(1500)

      await page.screenshot({ path: filepath, fullPage: true, clip: { x: 0, y: 0, width: 1920, height: 1080 } })

      const label = `${story.title} / ${story.name}`
      console.log(`  ✓ ${label}`)
      manifest.push({ id: storyId, title: story.title, name: story.name, filename, label })
    } catch (err) {
      console.error(`  ✗ ${story.title} / ${story.name}: ${err.message}`)
    }
  }

  writeFileSync(join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await browser.close()
  console.log(`\nDone. ${manifest.length} screenshots saved to ${OUTPUT_DIR}/`)
}

main()
