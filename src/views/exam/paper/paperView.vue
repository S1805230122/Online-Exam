<script lang="ts" setup>
/*预览按钮操作*/
import { PaperVO } from "@/api/exam/paper/types";
import { previewPaper } from "@/api/exam/paper";
const route = useRoute();

const previewPaperView = ref();
const paperId=ref()
const handlePreview = async (paperId: string) => {
  const res = await previewPaper(paperId);
  previewPaperView.value = res.data;
};
const props = defineProps({
  /*预览内容*/
  paperId: {
    type: undefined,
    required: true
  }
});
const getList = async (id) => {
  const res = await previewPaper(id);
  previewPaperView.value = res.data;
};
watch(() => props.paperId, (newVal, oldVal) => {
  getList(props.paperId)
  paperId.value = props.paperId;
})
onMounted(async () => {
});
</script>
<template>
  <div class="mt-5 w-50% ma">
    <!--        答题卡-->
    <div class="answer-sheet">
      <div class="answer-sheet-header">答题卡</div>
      <div class="answer-sheet-body">
        <div class="answer-sheet-content">
          <div v-for="(item, index) in previewPaperView.paperContentObj.children" class="answer-sheet-item">
            {{ index + 1 }}
          </div>
        </div>
      </div>
      <div class="answer-sheet-footer">
        <div class="finished">已答 <span>0</span></div>
        <div class="un-finished">未答 <span>0</span></div>
      </div>
    </div>
    <div class="question-edit">
      <div class="fixed-top question-edit p-2">
        <el-progress :percentage="50" />
      </div>
      <div class="pl-6 pr-6" v-for="(question, index) in previewPaperView.paperContentObj.children"
      >
        <div class="p-4 mt-2 vertical">
          <div class="form-item-title">
            <p class="question-title"><span><b>{{ index + 1 }}</b></span> {{ question.title }}</p>
          </div>
          <div v-if="question.description!==null&&question.description!==undefined" class="form-item-description">
            <p class=" question-title ml-10">{{ question.description }}</p>
          </div>
          <el-radio-group v-if="question.type === 'Radio' || question.type === 'TrueFalse'">
            <el-radio size="large" v-for="item in question.children" :value="item.id" :label="item.title" />
          </el-radio-group>
          <el-checkbox-group v-if="question.type === 'Checkbox'">
            <el-checkbox v-for="item in question.children" :value="item.id" :label="item.title" />
          </el-checkbox-group>
          <!--填空题-->
          <div v-if="question.type === 'MultipleBlank'" v-for="item in question.children">
            <input v-model="item.attribute.examCorrectAnswer" class="form-input" type="text" />
          </div>
          <!--简答题-->
          <div v-if="question.type==='Textarea'">
                   <textarea
                     v-model="question.attribute.examCorrectAnswer" class="form-input form-textarea"
                     type="textarea" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>

</style>

