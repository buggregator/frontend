import { initialize } from "./inicialize";
import { prepareData as buildData } from "./prepare-data";

export const useCytoscape = () => ({
  initialize,
  buildData
})
