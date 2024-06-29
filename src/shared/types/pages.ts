import { PAGE_TYPES } from "../constants/pages";
import type {OneOfValues} from "./generics";

export type TEventsGroup = OneOfValues<typeof PAGE_TYPES>
