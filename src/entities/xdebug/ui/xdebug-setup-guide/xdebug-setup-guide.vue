<script lang="ts" setup>
import { computed } from 'vue'
import { xdebugSetup } from '../../lib'
import type { XdebugConfig } from '../../types'

// What to set so the first session reaches Buggregator: PHP on this machine
// and PHP in Docker side by side (task #5394).
const props = defineProps<{
  config: XdebugConfig
}>()

const setup = computed(() => xdebugSetup(props.config))
const callsIde = computed(() => props.config.mode !== 'standalone')
</script>

<template>
  <div class="xdebug-setup">
    <p>
      Point Xdebug at Buggregator on port <b>{{ setup.phpPort }}</b>, not at your IDE.
      <template v-if="callsIde">
        Buggregator passes the session on: your IDE listens on port <b>{{ setup.idePort }}</b>
        (<code>XDEBUG_PROXY_IDE_ADDR</code>).
      </template>
    </p>
    <div class="xdebug-setup__cols">
      <section class="xdebug-setup__col">
        <h3>PHP on this machine</h3>
        <pre
          class="xdebug-setup__pre"
          aria-label="php.ini for PHP on this machine"
        >{{
          setup.host
        }}</pre>
      </section>
      <section class="xdebug-setup__col">
        <h3>PHP in Docker</h3>
        <pre
          class="xdebug-setup__pre"
          aria-label="php.ini for PHP in Docker"
        >{{
          setup.docker
        }}</pre>
        <p class="xdebug-setup__hint">
          <code>buggregator</code> is Buggregator's service name in your Compose file. Its container
          needs:
        </p>
        <pre
          class="xdebug-setup__pre"
          aria-label="Environment of the Buggregator container"
        >{{
          setup.dockerEnv
        }}</pre>
      </section>
    </div>
    <p class="xdebug-setup__hint">
      With <code>xdebug.start_with_request=trigger</code>, the request must carry
      <code>XDEBUG_TRIGGER</code>.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.xdebug-setup {
  @apply flex flex-col gap-2 w-full;
}

.xdebug-setup__cols {
  @apply grid gap-3 w-full text-left sm:grid-cols-2;
}

.xdebug-setup__col {
  @apply flex flex-col gap-1.5 min-w-0;

  h3 {
    @apply text-xs font-semibold text-gray-900 dark:text-white;
  }
}

.xdebug-setup__pre {
  @apply w-full p-3 rounded text-left font-mono text-xs overflow-x-auto bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200;
}

.xdebug-setup__hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

code {
  @apply font-mono text-xs px-1 rounded bg-gray-100 dark:bg-gray-800;
}
</style>
