import { useCytoscape } from "~/src/features/lib/cytoscape";

const { buildData, initialize } = useCytoscape();

export const useRenderGraph = () => ({
  prepare: buildData,
  initialize,
})
