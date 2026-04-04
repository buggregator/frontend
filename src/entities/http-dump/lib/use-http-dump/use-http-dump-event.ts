import { computed, type Ref } from 'vue'
import type { NormalizedEvent } from '@/shared/types'
import type { HttpDump } from '../../types'

export const useHttpDumpEvent = (event: Ref<NormalizedEvent<HttpDump>>) => {
  const isProxy = computed(() => !!event.value.payload.proxy)
  const method = computed(() => event.value.payload.request.method)

  const uri = computed(() => {
    const rawUri = decodeURI(event.value.payload.request.uri)
    if (isProxy.value) {
      return `${event.value.payload.host}${rawUri}`
    }
    return rawUri
  })

  const host = computed(() => {
    const h = event.value.payload.request.headers?.host
    if (!h) return null
    return Array.isArray(h) ? h[0] : h
  })

  const contentType = computed(() => {
    const ct =
      event.value.payload.request.headers?.['content-type'] ||
      event.value.payload.request.headers?.['Content-Type']
    if (!ct) return null
    const val = Array.isArray(ct) ? ct[0] : ct
    return val?.split(';')[0]?.trim() || null
  })

  const statusCode = computed(() => event.value.payload.response?.status_code)
  const durationMs = computed(() => event.value.payload.duration_ms)
  const proxyError = computed(() => event.value.payload.error)

  const methodColor = computed(() => {
    const m = method.value?.toUpperCase()
    if (m === 'GET') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
    if (m === 'POST') return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
    if (m === 'PUT' || m === 'PATCH')
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
    if (m === 'DELETE') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/10'
  })

  const statusColor = computed(() => {
    const code = statusCode.value
    if (!code) return ''
    if (code >= 500) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
    if (code >= 400) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
    if (code >= 300) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10'
  })

  const borderStatusClass = computed(() => {
    if (!isProxy.value || !statusCode.value) return 'border-l-transparent'
    const code = statusCode.value
    if (code >= 500) return 'border-l-red-500'
    if (code >= 400) return 'border-l-amber-400'
    if (code >= 300) return 'border-l-blue-400'
    return 'border-l-green-500'
  })

  const queryCount = computed(() => Object.keys(event.value.payload.request.query || {}).length)
  const headerCount = computed(() => Object.keys(event.value.payload.request.headers || {}).length)
  const hasBody = computed(() => (event.value.payload.request.body?.length || 0) > 0)

  const bodySize = computed(() => {
    const len = event.value.payload.request.body?.length || 0
    if (!len) return null
    if (len < 1024) return `${len} B`
    if (len < 1024 * 1024) return `${(len / 1024).toFixed(1)} KB`
    return `${(len / (1024 * 1024)).toFixed(1)} MB`
  })

  const curlCommand = computed(() => {
    const req = event.value.payload.request
    let curl = `curl -X ${req.method}`

    if (isProxy.value) {
      curl += ` '${event.value.payload.host}${req.uri}'`
    } else if (host.value) {
      curl += ` '${host.value}${req.uri}'`
    } else {
      curl += ` '${req.uri}'`
    }

    const headers = req.headers || {}
    for (const [key, val] of Object.entries(headers)) {
      if (key.toLowerCase() === 'host') continue
      const v = Array.isArray(val) ? val[0] : val
      curl += ` \\\n  -H '${key}: ${v}'`
    }

    if (req.body) {
      curl += ` \\\n  -d '${req.body.replace(/'/g, "'\\''")}'`
    }

    return curl
  })

  const rawHttp = computed(() => {
    const req = event.value.payload.request
    let raw = `${req.method} ${req.uri} HTTP/1.1\n`

    const headers = req.headers || {}
    for (const [key, val] of Object.entries(headers)) {
      const v = Array.isArray(val) ? val[0] : val
      raw += `${key}: ${v}\n`
    }

    if (req.body) {
      raw += `\n${req.body}`
    }

    return raw
  })

  // Response helpers
  const response = computed(() => event.value.payload.response)
  const hasResponse = computed(() => !!response.value)

  const hasPostData = computed(
    () => event.value.payload.request.post && Object.keys(event.value.payload.request.post).length > 0,
  )

  const hasQuery = computed(
    () => event.value.payload.request.query && Object.keys(event.value.payload.request.query).length > 0,
  )

  const hasHeaders = computed(() => Object.keys(event.value.payload.request.headers || {}).length > 0)

  const hasCookies = computed(
    () => event.value.payload.request.cookies && Object.keys(event.value.payload.request.cookies).length > 0,
  )

  const hasAttachments = computed(
    () => event.value.payload.request.files && event.value.payload.request.files.length > 0,
  )

  const responseContentType = computed(() => {
    if (!response.value?.headers) return null
    const ct = response.value.headers['content-type'] || response.value.headers['Content-Type']
    if (!ct) return null
    const val = Array.isArray(ct) ? ct[0] : ct
    return val?.split(';')[0]?.trim() || null
  })

  const responseBodyLanguage = computed(() => {
    const ct = responseContentType.value
    if (!ct) return 'plaintext'
    if (ct.includes('json')) return 'json'
    if (ct.includes('xml') || ct.includes('svg')) return 'xml'
    if (ct.includes('html')) return 'html'
    if (ct.includes('css')) return 'css'
    if (ct.includes('javascript')) return 'javascript'
    return 'plaintext'
  })

  const responseBody = computed(() => {
    const body = response.value?.body
    if (!body) return null
    if (responseBodyLanguage.value === 'json') {
      try {
        return JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        return body
      }
    }
    return body
  })

  const isBinaryResponse = computed(() => {
    const ct = responseContentType.value
    if (!ct) return false
    return (
      ct.startsWith('image/') ||
      ct.startsWith('audio/') ||
      ct.startsWith('video/') ||
      ct.includes('octet-stream') ||
      ct.includes('zip') ||
      ct.includes('gzip') ||
      ct.includes('tar') ||
      ct.includes('pdf')
    )
  })

  const responseBodySize = computed(() => {
    const len = response.value?.body?.length || 0
    if (!len) return null
    if (len < 1024) return `${len} B`
    if (len < 1024 * 1024) return `${(len / 1024).toFixed(1)} KB`
    return `${(len / (1024 * 1024)).toFixed(1)} MB`
  })

  const hasResponseHeaders = computed(() => Object.keys(response.value?.headers || {}).length > 0)

  return {
    isProxy,
    method,
    uri,
    host,
    contentType,
    statusCode,
    durationMs,
    proxyError,
    methodColor,
    statusColor,
    borderStatusClass,
    queryCount,
    headerCount,
    hasBody,
    bodySize,
    curlCommand,
    rawHttp,
    response,
    hasResponse,
    hasPostData,
    hasQuery,
    hasHeaders,
    hasCookies,
    hasAttachments,
    responseContentType,
    responseBodyLanguage,
    responseBody,
    isBinaryResponse,
    responseBodySize,
    hasResponseHeaders,
  }
}
