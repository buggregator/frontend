<script setup lang="ts">
import type { Project } from "~/src/shared/types";
import { useEvents } from "~/src/shared/lib/use-events";
import { computed } from "vue";

type Props = {
  projects: Project[];
  default: null
};
const props = defineProps<Props>();

const {events} = useEvents();

const switchProject = (project: Project): void => {
  events.getAll(project.key);
}

const defaultProject = computed(() => {
  // find a project
  const found = props.projects.reverse()
})

switchProject(props.default)
</script>

<template>
  <div>
    <div>{{ defaultProject.name }}</div>
    <ul>
      <li v-for="project in projects" :class="{'project-default': default}">
        <button type="button" @click="switchProject(project)">{{ project.name }}</button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">

</style>
