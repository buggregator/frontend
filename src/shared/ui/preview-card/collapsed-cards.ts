import { ref } from 'vue'

// Cards the person collapsed, by event id. Kept outside the card: the
// virtual feed unmounts cards that scroll away and mounts them again.
export const collapsedCardIds = ref(new Set<string>())
