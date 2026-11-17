import { ref } from 'vue'

// What the person set in the setup help, per browser (#5941).
const HOST_KEY = 'setup_host'
const STACK_KEY = 'setup_stack'

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}
const write = (key: string, value: string) => {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // Storage blocked: the choice lasts until the page reloads.
  }
}

export const pageHost = () => window.location.hostname || 'localhost'

// One value for every section and every open guide.
const storedHost = ref(read(HOST_KEY))
const stack = ref(read(STACK_KEY))

export const useSetupHost = () => ({
  storedHost,
  setHost: (host: string) => {
    storedHost.value = host.trim() === pageHost() ? '' : host.trim()
    write(HOST_KEY, storedHost.value)
  },
  resetHost: () => {
    storedHost.value = ''
    write(HOST_KEY, '')
  }
})

export const useSetupStack = () => ({
  stack,
  setStack: (id: string) => {
    stack.value = id
    write(STACK_KEY, id)
  }
})
