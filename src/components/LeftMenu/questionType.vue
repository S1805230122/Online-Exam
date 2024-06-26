<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";

const questionTypeList = [
  {
    id: 1,
    name: "单选题"
  },
  {
    id: 2,
    name: "多选题"
  },
  {
    id: 3,
    name: "判断题"
  },
  {
    id: 4,
    name: "填空题"
  },
  {
    id: 5,
    name: "简答题"
  },
  {
    id: 6,
    name: "问答题"
  }];

function clone(element: Record<"name" | "id", string>) {
  const len = questionFormList.value.length;
  return {
    name: `${element.name}-clone-${len}`,
    id: `${element.id}-clone-${len}`
  };
}

const questionFormList = ref();
const props = defineProps({
  questionFormList: {
    type: Array,
    required: true
  }
});
watch(() => props.questionFormList, (newVal, oldVal) => {
  // 当 questionSetId 发生变化时，调用 getQuestions
  questionFormList.value = props.questionFormList;
});
</script>

<template>
  <el-aside class="sidebar-container drawer-left-menu">
    <el-tabs :stretch="true">
      <el-tab-pane label="题型">
        <VueDraggable
          v-model="questionTypeList"
          animation="150"
          ghostClass="ghost"
          :group="{ name: 'people', pull: 'clone', put: false }"
          :clone="clone"
          :sort="false"
          class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded"
        >
          <div
            v-for="item in questionTypeList"
            :key="item.id"
            class="cursor-move h-50px bg-gray-500/5 rounded p-3"
          >
            {{ item.name }}
          </div>
        </VueDraggable>
      </el-tab-pane>
      <el-tab-pane label="大纲"></el-tab-pane>
    </el-tabs>
  </el-aside>
</template>

<style scoped lang="scss">
.drawer-left-menu {
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  width: 15% !important;
  background-color: #ffffff;
  margin: 0;
}
</style>
