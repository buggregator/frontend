import type { FlameChartNode } from "flame-chart-js/dist/types";
import type { ProfilerCost, ProfilerEdges } from "~/src/entities/profiler/types";
import { GraphTypes } from "~/src/shared/types";

type FlameChartData = FlameChartNode & {
  cost: ProfilerCost
}
export const build = (edges: ProfilerEdges, field: GraphTypes): FlameChartData => {
  return buildWaterfall(edges)[0]
}

// TODO: add types
function buildWaterfall(events) {
  const waterfall = [];
  const eventCache = {};

  // First pass to create each event and find its parent.
  for (const key of Object.keys(events)) {
    const event = events[key];
    const duration = event.cost.wt || 0;
    const eventData = {
      name: event.callee,
      cost: event.cost,
      start: 0,  // Temporarily zero, will adjust based on the parent later
      duration: duration,
      type: 'task',
      children: [],
      color: getColorForPercentCount(event.cost.p_wt),
    };

    eventCache[event.id] = eventData;

    if (event.parent) {
      // If there's a parent, add to its children list.
      const parentEventData = eventCache[event.parent];
      if (parentEventData) {
        parentEventData.children.push(eventData);
      }
    } else {
      // No parent implies it is a top-level event.
      waterfall.push(eventData);
    }
  }

  // Second pass to adjust start times based on the order in the children array.
  function adjustStartTimes(eventList, startTime) {
    for (let i = 0; i < eventList.length; i++) {
      const event = eventList[i];
      event.start = startTime;
      startTime += event.duration;  // Next event starts after the current event ends.

      // Recursively adjust times for children.
      adjustStartTimes(event.children, event.start);
    }
  }

  // Start the adjustment from the root events.
  adjustStartTimes(waterfall, 0);

  return waterfall;
}

const getColorForPercentCount = (percent: number): string => {
  if (percent <= 10) {
    return '#B3E5FC'; // Light Blue
  }
  if (percent <= 20) {
    return '#81D4FA'; // Light Sky Blue
  }
  if (percent <= 30) {
    return '#4FC3F7'; // Vivid Light Blue
  }
  if (percent <= 40) {
    return '#29B6F6'; // Bright Light Blue
  }
  if (percent <= 50) {
    return '#FFCDD2'; // Pink (Light Red)
  }
  if (percent <= 60) {
    return '#FFB2B2'; // Lighter Red
  }
  if (percent <= 70) {
    return '#FF9E9E'; // Soft Red
  }
  if (percent <= 80) {
    return '#FF8989'; // Soft Coral
  }
  if (percent <= 90) {
    return '#FF7474'; // Soft Tomato
  }

  return '#FF5F5F'; // Light Coral
};
