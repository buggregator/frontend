import {ALL_EVENT_TYPES} from "../constants/pages";
import {EventTypes} from "./events";
import type {OneOfValues} from "./generics";


export type PageEventTypes = OneOfValues<typeof EventTypes> | typeof ALL_EVENT_TYPES;


