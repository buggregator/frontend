import { initialize } from "./inicialize";
// TODO: no need anymore
import { prepareData as buildData } from "./prepare-data";

export const useCytoscape = () => ({
  initialize,
  buildData
})
