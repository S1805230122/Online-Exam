<template>
  <el-container class="app-wrapper">
    <el-aside  class="sidebar-container drawer-left-menu">
      <el-tabs :stretch="true">
        <el-tab-pane label="题型">
          <VueDraggable
            v-model="questionTypeList"
            animation="150"
            ghostClass="ghost"
            :group="{ name: 'question', pull: 'clone', put: false }"
            :sort="false"
            class="question-type flex   w-100%  rounded"
          >
            <div
              v-for="item in questionTypeList"
              :key="item.questionType"
              class="question-type-item"
            >
              <div v-if="item.questionType==='Radio'">
                <div>
                  <svg-icon icon-class="radio" />
                </div>
                <span>单选题</span>
              </div>
              <div v-if="item.questionType==='Checkbox'">
                <div>
                  <svg-icon icon-class="checkbox" />
                </div>
                <span>多选题</span>
              </div>
              <div v-if="item.questionType==='TrueFalse'">
                <div>
                  <svg-icon icon-class="true-false" />
                </div>
                <span>判断题</span>
              </div>
              <div v-if="item.questionType==='MultipleBlank'">
                <div>
                  <svg-icon icon-class="multiple-blank" />
                </div>
                <span>填空题</span>
              </div>
              <div v-if="item.questionType==='Textarea'">
                <div>
                  <svg-icon icon-class="textarea" />
                </div>
                <span>简答题</span>
              </div>
            </div>
          </VueDraggable>
        </el-tab-pane>
        <el-tab-pane label="大纲">
          <VueDraggable
            v-model="questionFormList"
            animation="300"
            class="flex flex-col  m-auto"
            ghostClass="ghost"
            handle=".handle"
          >
            <div v-for="(question, index) in questionFormList" class="synopsis">
              <div class="outline-icon">
                <svg-icon class="handle cursor-move mr-1 " icon-class="drag-and-drop"></svg-icon>
              </div>
              <div v-if="index<9" class="outline-num mr-1">0{{ index + 1 }}</div>
              <div v-if="index>=9" class="outline-num mr-1">{{ index + 1 }}</div>
              <div class="outline-item">{{ question["templateObj"]["title"] }}</div>
            </div>
          </VueDraggable>
        </el-tab-pane>
      </el-tabs>
    </el-aside>
    <el-container>
      <el-header class="flex justify-between items-center">
        <el-button plain>总分{{ scoreTotal }}分</el-button>
        <el-button-group>
          <el-button type="danger" @click="cancel">关闭</el-button>
          <el-button :disabled="viewFlag" plain @click="editView">编辑</el-button>
          <el-button :disabled="!viewFlag" plain @click="jsonView">JSON</el-button>
          <el-button @click="previewView">预览</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
        </el-button-group>
      </el-header>
      <el-main>
        <el-scrollbar>
          <el-card shadow="hover">
            <VueDraggable
              v-model="questionFormList"
              animation="300"
              class="question-edit flex flex-col  w-90% m-auto rounded"
              ghostClass="ghost"
              group="question"
              handle=".handle-item"
            >
              <div v-for="(question, index) in questionFormList" v-if="viewFlag"
                   :class="{ 'hover-style': hoverQuestionIndex === index, 'clicked-style': clickedQuestionIndex === index }"
                   @click="handleClickQuestion(index)" @mouseenter="hoverQuestionIndex = index"
                   @mouseleave="hoverQuestionIndex = null"
              >
                <!--右侧工具栏-->
                <div class="right-tool-bar"><!--复制-->
                  <el-tooltip :effect="'light'" content="复制" placement="right">
                    <div @click="copyQuestion(index,question)">
                      <svg-icon icon-class="copy" color="#333333" />
                    </div>
                  </el-tooltip>
                  <el-tooltip :effect="'light'" content="移除" placement="right">
                    <div @click="removeQuestion(index)">
                      <svg-icon icon-class="delete" color="#DC143C" />
                    </div>
                  </el-tooltip>
                </div>

                <div class="ml-50% mr-50%">
                  <svg-icon style="font-size: 32px" class="handle-item cursor-move"
                            icon-class="drag-and-drop-transverse" />
                </div>
                <div class="p-4 mt--8" @click="handleQuestion(question.templateObj)">
                  <div class="form-item-title">
                    <span><b>{{ index + 1 }}</b></span>
                    <input v-model="question.templateObj.title" class="form-input question-title" type="text" />
                    <span class="score">最高分值: {{ question["templateObj"]["attribute"]["examScore"] }} 分</span>
                  </div>
                  <div v-if="question.templateObj.description!==null" class="form-item-description">
                    <input v-model="question.templateObj.description" class="form-input question-title ml-10"
                           type="text" placeholder="请输入题干说明" />
                  </div>
                  <VueDraggable
                    v-model="question.templateObj.children"
                    animation="300"
                    class="flex flex-col  p-4 w-100% rounded"
                    ghostClass="ghost"
                    handle=".handle"
                  >
                    <div v-for="(item,i) in question.templateObj.children"
                         :key="item.id"
                         class="item h-35px  rounded flex items-center px-4"
                         style="width: 80%;position: relative;">
                      <svg-icon class="handle cursor-move mr-5" icon-class="drag-and-drop"></svg-icon>
                      <svg-icon
                        v-if="question.templateObj.type==='Radio' || question.templateObj.type==='TrueFalse'"
                        class="ml-1"
                        icon-class="radio-hollow"></svg-icon>
                      <svg-icon v-if="question.templateObj.type==='Checkbox'" class="ml-1"
                                icon-class="checkbox-hollow"></svg-icon>
                      <input v-if="question.templateObj.type==='MultipleBlank'" class="form-input form-input-title"
                             v-model="item.title" type="text">
                      <!--单选题，多选题，判断题-->
                      <input
                        v-if="question.templateObj.type==='Radio'||question.templateObj.type==='Checkbox' ||question.templateObj.type==='TrueFalse'"
                        v-model="item.title" class="form-input" type="text" />
                      <!--填空题-->
                      <input v-if="question.templateObj.type==='MultipleBlank'"
                             v-model="item.attribute.examCorrectAnswer" class="form-input" type="text" />
                      <!--简答题-->
                      <textarea v-if="question.templateObj.type==='Textarea'"
                                v-model="item.attribute.examCorrectAnswer" class="form-input form-textarea"
                                type="textarea" />
                      <span
                        v-if="item.attribute.examCorrectAnswer!==null && question.templateObj.attribute.examAnswerMode!=='select' && question.templateObj.attribute.examAnswerMode!=='selectCorrect'  && question.templateObj.type!=='Textarea' && question.templateObj.type!=='MultipleBlank' "
                        class="form-answer">(正确答案)</span>
                      <span
                        v-if="item.attribute.examCorrectAnswer!==null && question.templateObj.attribute.examAnswerMode==='select' "
                        class="form-answer">(分值{{ item.attribute.examScore }})</span>
                      <span
                        v-if="item.attribute.examCorrectAnswer!==null && question.templateObj.attribute.examAnswerMode==='selectCorrect'"
                        class="form-answer">(分值{{ item.attribute.examScore }})</span>
                      <!--                          题目选项按钮组-->
                      <div class="form-remove">
                        <svg-icon class="cursor-pointer mr-2" icon-class="cancel"
                                  @click="remove(<number>index,<number>i)" color="#DC143C"></svg-icon>
                      </div>
                    </div>
                  </VueDraggable>
                  <div class="mb-4">
                    <div v-if="clickedQuestionIndex!==index" style="float: right">
                      <el-tag v-if="question.templateObj.tags.length===0" type="info">无</el-tag>
                      <el-tag
                        v-for="(tag,index) in question.templateObj.tags"
                        v-else :key="tag"
                        :style="{ 'background-color': getTagColor(index+1),'color': getFontColor(index+1),'border-color': getBorderColor(index+1), 'margin-right': '5px' }"
                        effect="light">
                        {{ tag }}
                      </el-tag>
                    </div>
                    <div v-if="clickedQuestionIndex!==index" style="float: right" class="mr-10">
                      <el-tag v-if="question.templateObj.difficultyName===''" type="info">无</el-tag>
                      <el-tag
                        v-else
                        type="success"
                        effect="light">
                        {{ question["templateObj"]["difficultyName"] }}
                      </el-tag>
                    </div>
                    <div v-if="clickedQuestionIndex===index" class="form-select">
                      <el-form>
                        <!--添加选项-->
                        <el-form-item
                          v-if="question.templateObj.type==='Radio'||question.templateObj.type==='Checkbox'||question.templateObj.type==='MultipleBlank'">
                          <el-button icon="plus" plain type="success" @click="addItem(index)">
                            添加选项
                          </el-button>
                        </el-form-item>

                        <div class="flex ">
                          <el-select v-model="questionInfo.difficultyName"
                                     style="width: 20%" class="mr-5" filterable allow-create @change="isTagsNull()">
                            <el-option v-for="item in difficultyTagOptions" :key="item.tagId" :label="item.tagName"
                                       :value="item.tagName">
                            </el-option>
                          </el-select>
                          <el-select
                            v-model="questionInfo.tags"
                            :max-collapse-tags="3"
                            :reserve-keyword="false"
                            allow-create
                            clearable
                            collapse-tags
                            collapse-tags-tooltip
                            filterable
                            multiple
                            placeholder="选择标签"
                            value-key="tagsName"
                            style="width: 70%"
                            @change="isTagsNull()"
                          >
                            <el-option v-for="item in tagTypeOptions" :key="item.tagId" :label="item.tagName"
                                       :value="item.tagName">
                            </el-option>
                          </el-select>
                        </div>
                      </el-form>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!viewFlag">
                <div class="json-viewer-box">
                  <!--  <pre class="json-viewer-lines">-->
                  <!--    <span v-for="(line, index) in jsonListString.split('\n')" :key="index" class="line-number">{{ index + 1 }}</span>-->
                  <!--  </pre>-->
                  <JsonViewer
                    :boxed="true"
                    :copyable="{copyText: '复制', copiedText: '已复制'}"
                    :expand-depth="10"
                    :expanded="true"
                    :value="jsonList"
                    theme="light"
                  />
                </div>
              </div>
              <div v-if="questionFormList.length===0" class="m-auto" v-html="DragDemonstration">
              </div>
            </VueDraggable>


          </el-card>
        </el-scrollbar>
      </el-main>
    </el-container>
    <el-aside class="sidebar-container drawer-shadow">
      <el-tabs :stretch="true">
        <el-tab-pane label="题目设置" :disabled="clickedQuestionIndex===null">
          <!--          题目配置-->
          <el-form v-if="questionInfoFlag" :label-position="'top'">
            <!--            计分方式-->
            <el-form-item v-if="questionInfo.type!=='TrueFalse' && questionInfo.type!=='Textarea'" label="计分方式">
              <el-select v-model="questionInfo.attribute.examAnswerMode" @change="handleSettingAnswerMode()">
                <el-option v-if="questionInfo.type==='Radio'" label="此问题有唯一答案和分值" value="onlyOne" />
                <el-option v-if="questionInfo.type==='Checkbox'|| questionInfo.type==='MultipleBlank'"
                           label="全部答对才得分" value="selectAll" />
                <el-option v-if="questionInfo.type==='Checkbox'" label="答对几项得几分，答错不得分"
                           value="selectCorrect" />
                <el-option label="每个选项都有对应的分值" value="select" />
              </el-select>
              <el-select v-if="questionInfo.type==='MultipleBlank'" v-model="questionInfo.attribute.examMatchRule"
                         class="mt-2">
                <el-option label="回答与答案完全相同得分" value="completeSame" />
                <el-option label="回答中包含答案即可得分" value="contain" />
              </el-select>
            </el-form-item>
            <!--            各选项分值-->
            <!--            单选题-->
            <div v-if="questionInfo['attribute']['examAnswerMode'] === 'select' && questionInfo.type==='Radio'">
              <div style="font-size: 14px">各选项分值</div>
              <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                <span style="font-size: 12px">{{ item.title }}</span>
                <el-input-number v-model="item['attribute']['examScore']"
                                 :precision="1" :step="0.5"
                                 size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])" />
              </div>
            </div>
            <!--            多选题-->
            <div v-if="questionInfo['attribute']['examAnswerMode']==='select'
              && questionInfo.type==='Checkbox'">
              <div style="font-size: 14px">各选项分值</div>
              <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                <span style="font-size: 12px">{{ item.title }}</span>
                <el-input-number v-model="item['attribute']['examScore']"
                                 :precision="1" :step="0.5"
                                 size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])" />
              </div>
            </div>
            <div v-if="questionInfo['attribute']['examAnswerMode']==='selectCorrect'
              && questionInfo.type==='Checkbox'">
              <div style="font-size: 14px">各选项分值</div>
              <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                <span style="font-size: 12px">{{ item.title }}</span>
                <el-input-number v-model="item['attribute']['examScore']"
                                 :precision="1" :step="0.5"
                                 size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])" />
              </div>
            </div>
            <!--            填空题-->
            <div v-if="questionInfo['attribute']['examAnswerMode']==='select'
              && questionInfo.type==='MultipleBlank'">
              <div style="font-size: 14px">各选项分值</div>
              <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                <span style="font-size: 12px">{{ item.title }}</span>
                <el-input-number v-model="item['attribute']['examScore']"
                                 :precision="1" :step="0.5"
                                 size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])" />
              </div>
            </div>
            <!--            答案配置-->
            <div style="font-size: 14px">
              <div>答案</div>
              <!--              单选题，判断题-->
              <div v-if="questionInfo.type==='Radio'||questionInfo.type==='TrueFalse'">
                <el-select v-model="questionRadioAnswerId" @change="handleQuestionRadioAnswer()">
                  <el-option v-for="item in questionInfo['children']" :label="item.title" :value="item.id">
                  </el-option>
                </el-select>
              </div>
              <!--              多选题-->
              <div v-for="item in questionInfo['children']" v-if="questionInfo.type==='Checkbox'" :key="item.id"
                   class="flex items-center">
                <el-checkbox v-model="item.attribute.examCorrectAnswer" :false-label="null" :true-label="item.id">
                  {{ item.title }}
                </el-checkbox>
              </div>
              <!--              填空题-->
              <div v-for="item in questionInfo['children']"
                   v-if="questionInfo.type==='MultipleBlank' || questionInfo.type==='Textarea'" :key="item.id"
                   class="flex justify-between items-center">
                <span class="w-30 mb-2" style="font-size: 12px">{{ item.title }}</span>
                <el-input v-model="item.attribute.examCorrectAnswer"
                          type="textarea"
                          :autosize="{ minRows: 2, maxRows: 4 }"
                          resize="none" class="mb-2" />
              </div>
            </div>
          </el-form>
          <el-form v-if="questionInfoFlag" :label-position="'left'" label-width="40%">
            <el-form-item label="题目类型" class="mt-5" label-width="60%">
              <el-select v-model="questionInfo.type" @change="handleSettingType">
                <el-option v-for="item in exam_question_type" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="作者" class="mt-5">
              <el-input v-model="questionInfo.author" />
            </el-form-item>
            <el-form-item
              v-if="questionInfo.attribute.examAnswerMode!=='select' && questionInfo.attribute.examAnswerMode!=='selectCorrect'"
              label="此题分值" label-width="55%">
              <el-input-number v-model="questionInfo['attribute']['examScore']"
                               :precision="1" :step="0.5"
                               size="small" />
            </el-form-item>
            <el-form-item label="题干说明" label-width="83%">
              <el-switch v-model="questionInfoDescriptionFlag" @change="handleQuestionDescription()" />
            </el-form-item>
          </el-form>
          <el-form v-if="questionInfoFlag" :label-position="'top'">
            <el-form-item label="答案解析">
              <el-input v-model="questionInfo.attribute.examAnalysis"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 4 }"
                        resize="none" class="mb-2" />
            </el-form-item>

          </el-form>

        </el-tab-pane>
        <el-tab-pane label="选项设置" :disabled="clickedQuestionIndex===null">
          <el-collapse accordion v-if="questionInfoFlag">
            <el-collapse-item v-for="item in questionInfo['children']" :key="item.id" :title="item.title">
              <el-input v-model="item.id">
                <template #append>
                  <el-button icon="copyDocument" @click="copyId(item.id)" />
                </template>
              </el-input>
            </el-collapse-item>
          </el-collapse>
        </el-tab-pane>
      </el-tabs>
    </el-aside>
  </el-container>
</template>
<script lang="ts" name="Question" setup>
import { batchUpdateQuestion, delQuestion, getQuestionList, listQuestion } from "@/api/exam/question";
import { QuestionForm, QuestionQuery, QuestionVO } from "@/api/exam/question/types";
import useSettingsStore from "@/store/modules/settings";
import { TagTypeVO } from "@/api/exam/tagType/types";
import { optionSelect as getTagTypeOptionSelect } from "@/api/exam/tagType";
import { getQuestionSet } from "@/api/exam/questionSet";
import { getBorderColor, getFontColor, getTagColor } from "@/utils/tagColor";
import { VueDraggable } from "vue-draggable-plus";
import { JsonViewer } from "vue3-json-viewer";
import "vue3-json-viewer/dist/index.css";
import { DragDemonstration } from "@/utils/svg";

const route = useRoute();
const settingsStore = useSettingsStore();
const needTagsView = computed(() => settingsStore.tagsView);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { exam_question_type } = toRefs<any>(proxy?.useDict("exam_question_type"));

const questionList = ref<QuestionVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const questionFormRef = ref<ElFormInstance>();
const tagTypeOptions = ref<TagTypeVO[]>([]);
const difficultyTagOptions = ref<TagTypeVO[]>([]);
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});

const initFormData: QuestionForm = {
  questionId: undefined,
  questionSetId: undefined,
  questionType: undefined,
  author: undefined,
  tagsIds: undefined,
  difficulty: undefined,
  orderNum: undefined,
  content: undefined,
  answer: undefined,
  score: undefined,
  remark: undefined,
  template: "",
  templateObj: undefined
};
const data = reactive<PageData<QuestionForm, QuestionQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    questionSetId: undefined,
    questionType: undefined,
    author: undefined,
    tagsIds: undefined,
    difficulty: undefined,
    difficultyName: undefined,
    orderNum: undefined,
    content: undefined,
    answer: undefined,
    score: undefined,
    params: {}
  },
  rules: {
    questionId: [
      { required: true, message: "题目ID不能为空", trigger: "blur" }
    ],
    questionSetId: [
      { required: true, message: "题库ID不能为空", trigger: "blur" }
    ],
    questionType: [
      { required: true, message: "题目类型不能为空", trigger: "change" }
    ],
    author: [
      { required: true, message: "作者不能为空", trigger: "blur" }
    ],
    tag: [
      { required: true, message: "题目标签不能为空", trigger: "blur" }
    ],
    difficulty: [
      { required: true, message: "难易程度不能为空", trigger: "blur" }
    ],
    orderNum: [
      { required: true, message: "显示顺序不能为空", trigger: "blur" }
    ],
    content: [
      { required: true, message: "题目不能为空", trigger: "blur" }
    ],
    choices: [
      { required: true, message: "题目选项不能为空", trigger: "blur" }
    ],
    answer: [
      { required: true, message: "答案不能为空", trigger: "blur" }
    ],
    score: [
      { required: true, message: "分值不能为空", trigger: "blur" }
    ],
    remark: [
      { required: true, message: "备注信息不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);


/*获取正确答案*/
function getCorrectAnswer(templateObj: any) {
  /*处理单选题或者判断题*/
  if (templateObj.type === "Radio" || templateObj.type === "TrueFalse") {
    for (const child of templateObj.children) {
      if (child.attribute?.examCorrectAnswer) {
        return child.title;
      }
    }
  }
  /*处理多选题*/
  if (templateObj.type === "Checkbox") {
    let answer = "";
    for (const child of templateObj.children) {
      if (child.attribute?.examCorrectAnswer) {
        if (answer === "") {
          answer = child.title;
        } else {
          answer = answer + "," + (child.title);
        }
      }
    }
    return answer;
  }
  /*处理填空题*/
  if (templateObj.type === "MultipleBlank") {
    let answer = "";
    for (const child of templateObj.children) {
      if (child.attribute?.examCorrectAnswer) {
        if (answer === "") {
          answer = child.attribute.examCorrectAnswer;
        } else {
          answer = answer + "," + (child.attribute.examCorrectAnswer);
        }
      }
    }
    return answer;
  }
  /*处理简答题*/
  if (templateObj.type === "Textarea") {
    for (const child of templateObj.children) {
      if (child.attribute?.examCorrectAnswer) {
        return child.attribute.examCorrectAnswer;
      }
    }
  }
}

/** 查询标签类型下拉列表 */
const getTagTypeList = async () => {
  const res = await getTagTypeOptionSelect("question");
  tagTypeOptions.value = res.data;
};
/*查询难度下拉列表*/
const getDifficultyTagList = async () => {
  const res = await getTagTypeOptionSelect("difficulty");
  difficultyTagOptions.value = res.data;
};

const drawer = reactive<DialogOption>({
  visible: false,
  title: ""
});
// 定义子组件要触发的事件
const emit = defineEmits(['update:drawer']);
const updateParent = () => {
  emit('update:drawer', drawer.visible);
};
/** 关闭按钮 */
const cancel = () => {
  // 重置
  reset();
  questionInfoFlag.value = false;
  clickedQuestionIndex.value = null;
  hoverQuestionIndex.value = null;
  questionInfoDescriptionFlag.value = false;
  drawer.visible = false;
  updateParent()
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  questionFormRef.value?.resetFields();
};

const questionFormList = ref([]);

/*选项配置展示抽屉*/
const questionInfo = ref();
const questionInfoFlag = ref(false);
const questionInfoDescriptionFlag = ref(false);
/*点击题目事件*/
const questionRadioAnswerId = ref();
const handleQuestion = (question: any) => {
  questionInfo.value = question;
  /*如果是单选题或者是判断题，获取正确答案id*/
  if (questionInfo.value.type === "Radio" || questionInfo.value.type === "TrueFalse") {
    questionInfo.value.children.forEach((item: any) => {
      if (item.attribute?.examCorrectAnswer) {
        questionRadioAnswerId.value = item.id;
      }
    });
  }
  /*获取是否显示题干说明*/
  if (questionInfo.value.description === null) {
    questionInfoDescriptionFlag.value = false;
  }
  if (questionInfo.value.description !== null) {
    questionInfoDescriptionFlag.value = true;
  }
  questionInfoFlag.value = true;
};

/*题干说明事件*/
const handleQuestionDescription = () => {
  if (questionInfoDescriptionFlag.value) {
    questionInfo.value.description = "";
  }
  if (!questionInfoDescriptionFlag.value) {
    questionInfo.value.description = null;
  }
};
/*题目选中事件*/
const hoverQuestionIndex = ref();
const clickedQuestionIndex = ref(null);

const handleClickQuestion = (index: any) => {
  clickedQuestionIndex.value = index;
};

// 生成四位随机字符的函数
const generateRandomId = () => {
  const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
/*添加选项按钮*/
const addItem = (index: any) => {
  questionFormList.value[index]["templateObj"]["children"].push({
    id: generateRandomId(), // 随机生成的id
    title: "",
    attribute: {
      examCorrectAnswer: null
    }
  });
};

/*标签为空时的事件*/
const isTagsNull = () => {
  if (questionInfo.value["difficultyName"] === "") {
    questionInfo.value["difficultyName"] = "无";
  }
  if (questionInfo.value["tags"].length === 0) {
    questionInfo.value["tags"] = ["无"];
  } else {
    questionInfo.value["tags"] = questionInfo.value["tags"].filter((item: string) => item !== "无");
  }
};
/*复制ID*/
const copyId = (id: any) => {
  try {
    navigator.clipboard.writeText(id);
    proxy?.$modal.msgSuccess("已复制ID");
  } catch (err) {
    proxy?.$modal.msgError("无法复制文本");
  }
};

/*计分方式选择事件*/
const handleSettingAnswerMode = () => {
  let mode = questionInfo.value["attribute"]["examAnswerMode"];
  let questionType = questionInfo.value.type;
  if (questionType === "Radio" && mode === "onlyOne") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = null;
      item["attribute"]["examScore"] = null;
    });
    questionInfo.value.children[0]["attribute"]["examCorrectAnswer"] = questionInfo.value.children[0]["id"];
  }
  if (questionType === "Radio" && mode === "select") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      item["attribute"]["examCorrectAnswer"] = item.id;
    });
  }
  if (questionType === "Checkbox" && mode === "select") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      item["attribute"]["examCorrectAnswer"] = item.id;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "Checkbox" && mode === "selectCorrect") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = item.id;
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "Checkbox" && mode === "selectAll") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = null;
    });
  }
  if (questionType === "MultipleBlank" && mode === "select") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "MultipleBlank" && mode === "selectAll") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = null;
    });
  }
};

/*题目类型选择时间*/
const handleSettingType = () => {
  if (questionInfo.value.type === "MultipleBlank") {
    let i = 1;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = item["title"];
      item["title"] = "填空" + i;
      i++;
    });
  }
  if (questionInfo.value.type === "Textarea") {
    questionInfo.value.children = [{
      id: questionInfo.value.children[0]["id"],
      title: "填空1",
      attribute: {
        examCorrectAnswer: questionInfo.value.children[0]["attribute"]["examCorrectAnswer"]
      }
    }];
  }
  if (questionInfo.value.type === "TrueFalse") {
    questionInfo.value.children = [{
      id: questionInfo.value.children[0]["id"],
      title: "正确",
      attribute: {
        examCorrectAnswer: questionInfo.value.children[0]["id"]
      }
    }, {
      id: questionInfo.value.children[1]["id"],
      title: "错误",
      attribute: {
        examCorrectAnswer: null
      }
    }];
  }
};
/*设置题目最高分*/
const handleQuestionMaxScore = (score: any) => {
  /*题目计分方式，答案模式为单个答案或者是全部答对时*/
  if (questionInfo.value["attribute"]["examAnswerMode"] === "onlyOne" || questionInfo.value["attribute"]["examAnswerMode"] === "selectAll") {
    let maxScore = questionInfo.value.children[0].attribute.examScore;
    questionInfo.value.children.forEach((item: any) => {
      if (item["attribute"]["examScore"] > maxScore) {
        maxScore = item["attribute"]["examScore"];
      }
    });
    questionInfo.value.attribute.examScore = maxScore;
  }
  if (questionInfo.value.type === "Radio" && questionInfo.value["attribute"]["examAnswerMode"] === "select") {
    let maxScore = questionInfo.value.children[0].attribute.examScore;
    questionInfo.value.children.forEach((item: any) => {
      if (item["attribute"]["examScore"] > maxScore) {
        maxScore = item["attribute"]["examScore"];
      }
    });
    questionInfo.value.attribute.examScore = maxScore;
  }
  if (questionInfo.value.type !== "Radio") {
    /*答案模式为每个选项有单独分值时*/
    if (questionInfo.value["attribute"]["examAnswerMode"] === "select" || questionInfo.value["attribute"]["examAnswerMode"] === "selectCorrect") {
      let itemScoreTotal = 0;
      questionInfo.value.children.forEach((item: any) => {
        itemScoreTotal += item["attribute"]["examScore"];
      });
      questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
    }
  }
};
/*单选题答案选择器事件*/
const handleQuestionRadioAnswer = () => {
  questionInfo.value.children.forEach((item: any) => {
    item.attribute.examCorrectAnswer = null;
    if (item.id === questionRadioAnswerId.value) {
      item.attribute.examCorrectAnswer = questionRadioAnswerId.value;
    }
  });
};
/*获取列表分值*/
const scoreTotal = ref(0);
const getScore = () => {
  questionFormList.value.forEach(item => {
    scoreTotal.value += item["templateObj"]["attribute"]["examScore"];
  });
};

/*移除选项*/
function remove(index: number, i: number) {
  questionFormList.value[index]["templateObj"]["children"].splice(i, 1);
}

const viewFlag = ref(true);
/*编辑展示按钮*/
const editView = () => {
  viewFlag.value = true;
};
/*JSON展示按钮*/
const jsonList = ref();
const jsonListString = ref();
/*题目预览按钮*/
const previewView = () => {
  questionPreview();
};
const isPreviewDialogVisible = ref(false);
const questionPreview = () => {
  isPreviewDialogVisible.value = true;
};

/*过滤json空值*/
function filterNullValues(key: any, value: any) {
  // 过滤掉值为 null 的键值对
  if (value === null) {
    return undefined;
  }
  return value;
}

/*json 展示*/
const jsonView = () => {
  viewFlag.value = false;
  jsonList.value = [];
  questionFormList.value.forEach(item => {
    jsonList.value += JSON.stringify(item["templateObj"], filterNullValues) + ",";
  });
  jsonList.value = jsonList.value.substring(0, jsonList.value.length - 1).replace("undefined", "");
  jsonList.value = "[" + jsonList.value + "]";
  jsonList.value = JSON.parse(jsonList.value);
  jsonListString.value = JSON.stringify(jsonList.value, null, 4);
};

/** 提交按钮 */
const submitForm = async () => {
  buttonLoading.value = true;
  let QuestionUpdateForm = {
    templates: questionFormList.value
  };
  // await batchUpdateQuestion(QuestionUpdateForm).finally(() => buttonLoading.value = false);
  proxy?.$modal.msgSuccess("修改成功");
  dialog.visible = false;
};

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight);
const tableHeight = ref<number | string>(0);
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}

/*左侧菜单相关*/
const questionTypeList = ref([
  {
    questionId: null,
    questionType: "Radio",
    orderNum: 1,
    templateObj: {
      title: "请选择一个选项",
      type: "Radio",
      difficultyName: "简单",
      author: "",
      orderNum: 1,
      description: null,
      attribute: {
        examScore: 5,
        examAnswerMode: "onlyOne",
        examAnalysis: ""
      },
      children: [
        {
          id: generateRandomId(),
          title: "选项1",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项2",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项3",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项4",
          attribute: {
            examCorrectAnswer: null
          }
        }
      ],
      tags: ["无"]
    }
  },
  {
    questionId: null,
    questionType: "Checkbox",
    orderNum: 2,
    templateObj: {
      title: "请选择以下选项 (多选)",
      type: "Checkbox",
      difficultyName: "简单",
      author: "",
      orderNum: 2,
      description: null,
      attribute: {
        examScore: 5,
        examAnswerMode: "selectAll",
        examAnalysis: ""
      },
      children: [
        {
          id: generateRandomId(),
          title: "选项1",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项2",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项3",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "选项4",
          attribute: {
            examCorrectAnswer: null
          }
        }
      ],
      tags: ["无"]
    }
  },
  {
    questionId: null,
    questionType: "TrueFalse",
    orderNum: 3,
    templateObj: {
      title: "请判断本项叙述是否正确？",
      type: "TrueFalse",
      difficultyName: "简单",
      author: "",
      orderNum: 3,
      description: null,
      attribute: {
        examScore: 5,
        examAnswerMode: "onlyOne",
        examAnalysis: ""
      },
      children: [
        {
          id: generateRandomId(),
          title: "正确",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "错误",
          attribute: {
            examCorrectAnswer: null
          }
        }
      ],
      tags: ["无"]
    }
  },
  {
    questionId: null,
    questionType: "MultipleBlank",
    orderNum: 4,
    templateObj: {
      title: "请填写以下内容",
      type: "MultipleBlank",
      difficultyName: "简单",
      author: "",
      orderNum: 4,
      description: null,
      attribute: {
        examScore: 5,
        examAnswerMode: "selectAll",
        examAnalysis: ""
      },
      children: [
        {
          id: generateRandomId(),
          title: "填空1",
          attribute: {
            examCorrectAnswer: null
          }
        },
        {
          id: generateRandomId(),
          title: "填空2",
          attribute: {
            examCorrectAnswer: null
          }
        }
      ],
      tags: ["无"]
    }
  },
  {
    questionId: null,
    questionType: "Textarea",
    orderNum: 5,
    templateObj: {
      title: "简答题",
      type: "Textarea",
      difficultyName: "简单",
      author: "",
      orderNum: 5,
      description: null,
      attribute: {
        examScore: 5,
        examAnswerMode: "selectAll",
        examAnalysis: ""
      },
      children: [
        {
          id: generateRandomId(),
          title: "填空1",
          attribute: {
            examCorrectAnswer: null
          }
        }
      ],
      tags: ["无"]
    }
  }
]);


/*复制题目*/
const copyQuestion = (index: any, question: never) => {
  questionFormList.value.splice(index, 0, question);
};
/*移除题目*/
const removeQuestion = (index: any) => {
  questionFormList.value.splice(index, 1);
};

const dragDemonstration = ref("");

const calculateTableHeight = () => {
  const searchHeight = showSearch.value ? ref(62) : ref(-24); // 搜索栏的高度
  const tagsViewHeight = needTagsView.value ? ref(34) : ref(0);
  tableHeight.value = screenHeight.value - 50 - tagsViewHeight.value - 26 - searchHeight.value - 165;
};
watch(showSearch, () => {
  calculateTableHeight();
});

watch(() => props.drawerVisible, (newVal, oldVal) => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  drawer.visible=props.drawerVisible;
  window.addEventListener("resize", handleResize);
  calculateTableHeight();
});
watch(() => props.drawerTitle, (newVal, oldVal) => {
  drawer.title=props.drawerTitle;
});
/*响应式监听*/
watchEffect(() => {
  calculateTableHeight();
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
const props = defineProps({
  drawerTitle: {
    type:undefined,
    required: true
  },
  drawerVisible: {
    type: Boolean as PropType<boolean>,
    required: true
  }
});
onMounted(() => {

  getTagTypeList();
  getDifficultyTagList();
});
</script>
<style lang="scss" scoped>
.form-input {
  padding: 6px;
  margin: 0 10px;
  width: 50%;
  border: none;
  background-color: transparent;
  outline: none; /* 隐藏浏览器默认的焦点边框 */
}

/* 当鼠标悬停在输入框上时，显示虚线边框 */
.form-input:hover {
  border: 1px dashed var(--el-color-primary-light-5);
}

/* 当输入框获得焦点时，显示实线边框 */
.form-input:focus {
  border: 1px solid var(--el-color-primary-light-5);
}

.form-input-title {
  width: 10%;
}

.form-textarea {
  resize: none;
}

.form-answer {
  font-size: 12px;
  color: var(--el-color-primary);
}

.form-remove {
  margin-left: auto;
}

/*表单标题样式*/
.form-item-title {
  font-size: 20px;

  input {
    font-size: 18px;
    width: 80%;
  }

  .score {
    font-size: 14px;
    color: rgba(164, 169, 176, 0.99);
  }
}

/*表单题干说明样式*/
.form-item-description {
  font-size: 14px;

  input {
    font-size: 14px;
    margin-left: 24px;
    margin-top: 5px;
    width: 95%;
  }

  input::placeholder {
    padding-left: 50px;
    color: #97a8be;
    font-size: 12px;
    font-style: italic;
  }

  .score {
    font-size: 14px;
    color: rgba(164, 169, 176, 0.99);
  }
}

/*表单选择器样式*/
.form-select {
  width: 70%;
  margin-left: 30px;
}

.ghost {
}

/*容器布局样式*/
.app-wrapper {
  position: relative;
  height: calc(100vh);
  width: 100%;
}

.drawer-shadow {
  box-shadow: -2px 0 6px rgba(0, 21, 41, 0.35);
  background-color: #ffffff;
  margin: 0;
}

/*json view 样式*/
.json-viewer-box {
  position: relative;
}

.json-viewer-lines {
  position: absolute;
  left: -40;
  z-index: 1;
  width: 40px; /* 行号的宽度，可根据需要调整 */
  background-color: #f5f5f5; /* 行号背景颜色 */
  color: #999; /* 行号文字颜色 */
  padding: 18px 5px 15px 2px;
  border-radius: 8px 0 0 8px;
  border-right: 1px solid #ddd; /* 行号与内容的分隔线 */
  pointer-events: none; /* 防止行号覆盖 JsonViewer 的点击事件 */
  user-select: none; /* 防止用户选择行号 */
}

.json-viewer-lines span {
  display: block;
  font-size: 14px;
  line-height: 16.36px;
}

.question-edit {
  border-color: #aab2bd;
  box-shadow: 0 2px 4px #0003;
}

/*鼠标经过题目时的样式*/
.hover-style {
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  background-color: #ffffff;
  width: 102%;
  margin-left: -1%;
}

.clicked-style {
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  background-color: #ffffff;
  width: 102%;
  margin-left: -1%;
}

/*问题设置title样式*/
.setting-title {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; /* 根据需要调整高度 */
  position: relative;
}

.setting-title::before,
.setting-title::after {
  content: '';
  display: inline-block;
  height: 1px; /* 根据需要调整横线的粗细 */
  background-color: black; /* 可以根据需要调整横线的颜色 */
  width: 70px; /* 根据需要调整横线的长度 */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.setting-title::before {
  left: 0; /* 根据需要调整横线的位置 */
}

.setting-title::after {
  right: 0; /* 根据需要调整横线的位置 */
}

.setting-title span {
  margin: 0 60px; /* 根据横线的长度调整间距 */
}

.drawer-left-menu {
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  width: 15% !important;
  background-color: #ffffff;
  margin: 0;
}

.question-type {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.question-type-item {
  display: inline-block;
  background: #FFF;
  color: #000;
  min-width: 70px;
  height: 70px;
  line-height: 1;
  text-align: center;
  transition: all .2s ease;
  border-radius: 5px;
  border: 1px dashed #dddddd;
  cursor: move;

  div {
    margin-top: 10px;
    margin-bottom: 12px;
  }
}

.question-type-item:hover {
  border: 1px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

.right-tool-bar {
  position: absolute;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  right: -40px;
  padding: 12px 8px;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  gap: 8px;
}

.synopsis {
  display: flex;
  justify-content: center;
  flex-direction: row;

  .outline-icon {
    width: 10%;
    margin-right: 4px;
  }

  .outline-num {
    width: 15%;
  }

  .outline-item {
    font-size: 12px;
    flex: 1;
    white-space: nowrap; /* 防止文本换行 */
    overflow: hidden; /* 隐藏超出元素宽度的文本 */
    text-overflow: ellipsis; /* 显示省略号 */
  }
}

.synopsis:hover {
  color: var(--el-color-primary);
}
</style>
