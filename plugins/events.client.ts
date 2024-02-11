import { storeToRefs } from "pinia";
import { useApiTransport } from '~/src/shared/lib/use-api-transport'
import { useLockedIdsStore } from "~/stores/locked-ids";

export default defineNuxtPlugin(() => {
  const lockedIdsStore = useLockedIdsStore();

  const {
    lockedIds,
  } = storeToRefs(lockedIdsStore)

  const {
    rayContinueExecution,
    rayStopExecution,
  } = useApiTransport();

  return {
    provide: {
      rayExecution: {
        continue: rayContinueExecution,
        stop: rayStopExecution,
      },
      lockedIds: {
        items: lockedIds,
        add: lockedIdsStore.add,
        remove: lockedIdsStore.remove,
      }
    }
  }
})
