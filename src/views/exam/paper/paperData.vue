<script setup lang="ts">

import {delAnswer, getAnswer, listAnswer, updateAnswer, updateAnswerScore} from "@/api/exam/answer";
import {AnswerVO} from "@/api/exam/answer/types";
import Logo from "@/layout/components/Sidebar/Logo.vue";
import useSettingsStore from "@/store/modules/settings";
import useAppStore from "@/store/modules/app";

import * as XLSX from "xlsx";
import {saveAs} from "file-saver";
import {getPaper} from "@/api/exam/paper";
import {listBindingByClazzList} from "@/api/exam/binding";
import {getChooseLabel} from "@/utils/tagColor";

const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const showLogo = computed(() => settingsStore.sidebarLogo);
const isCollapse = computed(() => !appStore.sidebar.opened);
const defaultPaperId = ref();
const total = ref(0);
const answerList = ref<AnswerVO[]>([]);
const loading = ref(true);
const queryParams = ref({
  pageNum: 1,
  pageSize: 20,
  paperId: ""
});
const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});
const drawer = reactive<DrawerOption>({
  visible: false,
  title: ""
});
/*获取当前试卷id*/
/*获取答卷列表*/
const getAnswerList = async () => {
  loading.value = true;
  defaultPaperId.value = props.paperId;
  queryParams.value.paperId = props.paperId;
  const res = await listAnswer(queryParams.value);
  answerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};
/*获取试卷信息*/
const paperInfo = ref();
const bindingList = ref();
const bindingParams = ref({
  clazzIdList: []
});
const getPaperInfo = async () => {
  const res = await getPaper(defaultPaperId.value)
  paperInfo.value = res.data;
  bindingParams.value.clazzIdList = paperInfo.value.clazzIdList;
  await getBindingList()
}
const getBindingList = async () => {
  const res = await listBindingByClazzList(bindingParams.value)
  bindingList.value = res.data;
}

/*刷新按钮操作*/
const refresh = () => {
  getAnswerList();
};
/*百分制按钮操作*/
const percentageFlag = ref(false);
const handlePercentage = () => {
  percentageFlag.value = !percentageFlag.value;
}
/*将分数转化为百分制*/
const getPercentage = (score: number, totalScore: number) => {
  if (percentageFlag.value){
    return ((score / totalScore) * 100).toFixed(1);
  }else {
    return score;
  }
}

/** 多选框选中数据 */
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const handleSelectionChange = (selection: AnswerVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};
/*修改按钮操作*/
const currentAnswer = ref<AnswerVO>();
const currentIndex = ref();
const handleCurrentChange = (newVal: any, oldVal: any) => {
  // currentIndex.value = answerList.value.findIndex(row => row === newVal);
  let index = 0;
  if (currentIndex.value !== -1) {
    index = (queryParams.value.pageNum - 1) * queryParams.value.pageSize + currentIndex.value + 1;
  }
  currentAnswer.value = newVal;
  // currentAnswer.value.index = index;
};
const currentForm = ref();
const answerInfo = ref();
const paperAnswer = ref();
const handleUpdateCurrentAnswer = () => {
  if (!currentAnswer.value) {
    proxy?.$modal.msgError("请选择要修改的项");
    return;
  }
  // Object.assign(currentForm.value, currentAnswer.value)
  if (currentAnswer.value.answerMap !== null) {

    paperAnswer.value = Object.entries(currentAnswer.value.answerMap).map(([key, value]) => {
      return {[key]: value};
    });
  } else {
    paperAnswer.value = currentAnswer.value.paperContentObj.children
      .map((item: any) => {
        const {id} = item;
        return {[id]: {}};
      });
  }
  /*将获取的做题答案传给currentForm 答卷回显*/
  currentAnswer.value.paperContentObj.children.forEach((item: any, index: number) => {
    if (item.type === "Radio" || item.type === "TrueFalse") {
      item.answer = Object.keys(paperAnswer.value[index][item.id]).toString();
    }
    if (item.type === "Checkbox") {
      item.answer = Object.keys(paperAnswer.value[index][item.id]);
    }
    if (item.type === "MultipleBlank") {
      item.children.forEach((x: any) => {
        x.answer = paperAnswer.value[index][item.id][x.id];
      });
    }
    if (item.type === "Textarea") {
      item.children.forEach((x: any) => {
        x.answer = paperAnswer.value[index][item.id][x.id];
      });
    }
  });
  updateFlag.value = "View";
  dialog.title = "数据详情";
  dialog.visible = true;
};

/*获取分数*/
function getAnswerScore(id: string | number) {
  if (currentAnswer.value.examInfoMap !== null) {
    let score = currentAnswer.value.examInfoMap.questionScore[id];
    if (score > 0) {
      return score;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
};
/*保存按钮操作*/
const buttonLoading = ref(false);
const handleSubmit = async () => {
  buttonLoading.value = true;
  currentAnswer.value.answerMap = paperAnswer.value.reduce((acc: { [x: string]: any; }, item: {
    [x: string]: any;
  }) => {
    let key = Object.keys(item)[0]; // 获取对象的键
    let value = item[key]; // 获取对象的值
    acc[key] = value; // 将键值对添加到结果对象中
    return acc;
  }, {});
  await updateAnswer(currentAnswer.value).finally(() => buttonLoading.value = false);
  proxy?.$modal.msgSuccess("保存成功");
  dialog.visible = false;
  await getAnswerList();
};
/** 删除按钮操作 */
const handleDelete = async (row?: AnswerVO) => {
  const _Ids = row?.id || ids.value;
  await proxy?.$modal.confirm("是否确认删除试卷编号为\"" + _Ids + "\"的数据项？").finally(() => loading.value = false);
  await delAnswer(_Ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getAnswerList();
};
/*手动评分按钮操作*/
const defaultMenu = ref();
const currentAnswerInfo = ref();
const currentLoading = ref(false);
const handleManualRanking = async () => {
  defaultMenu.value = 0;
  await handleMenuClick(defaultMenu.value);
  drawer.visible = true;
};
/*点击子菜单切换主要页面*/
const handleMenuClick = async (key: string | number) => {
  currentLoading.value = true;
  defaultMenu.value = key;
  const res = await getAnswer(answerList.value[key].id);
  currentAnswerInfo.value = res.data;
  if (currentAnswerInfo.value.answerMap !== null) {
    paperAnswer.value = Object.entries(currentAnswerInfo.value.answerMap).map(([key, value]) => {
      return {[key]: value};
    });
  } else {
    paperAnswer.value = currentAnswerInfo.value.paperContentObj.children
      .map((item: any) => {
        const {id} = item;
        return {[id]: {}};
      });
  }
  /*将获取的做题答案传给currentForm 答卷回显*/
  currentAnswerInfo.value.paperContentObj.children.forEach((item: any, index: number) => {
    if (item.type === "Radio" || item.type === "TrueFalse") {
      item.answer = Object.keys(paperAnswer.value[index][item.id]).toString();
    }
    if (item.type === "Checkbox") {
      item.answer = Object.keys(paperAnswer.value[index][item.id]);
    }
    if (item.type === "MultipleBlank") {
      item.children.forEach((x: any) => {
        x.answer = paperAnswer.value[index][item.id][x.id];
      });
    }
    if (item.type === "Textarea") {
      item.children.forEach((x: any) => {
        x.answer = paperAnswer.value[index][item.id][x.id];
      });
    }
  });
  /*如果答卷没有问题得分信息，提取问题ID，并将值设为0*/
  if (!currentAnswerInfo.value.examInfoMap) {
    currentAnswerInfo.value.examInfoMap = {
      questionScore: currentAnswerInfo.value.paperContentObj.children.reduce((acc: any, item: any) => {
        acc[item.id] = 0;
        return acc;
      }, {})
    };
  }
  currentLoading.value = false;
};

function getAnswerInfoScore(id: string | number) {
  /*获取当前题目作答分值*/
  if (currentAnswerInfo.value.examInfoMap !== null) {
    let score = currentAnswerInfo.value.examInfoMap.questionScore[id];
    if (score > 0) {
      return score;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

/*判断图标颜色，问题有分数则：绿色，无分数则：灰色*/
function getTrueChooseColor(id: string | number) {
  if (getAnswerInfoScore(id) > 0) {
    return "#2cce35";
  } else {
    return "rgba(170,178,189,0.6)";
  }
}

/*判断图标颜色，问题无分数则：红色，有分数则：灰色*/
function getFalseChooseColor(id: string | number) {
  if (getAnswerInfoScore(id) === 0) {
    return "rgb(223, 66, 66)";
  } else {
    return "rgba(170,178,189,0.6)";
  }
}

/*点击True图标操作*/
const checkTrueIcon = (id: any) => {
  currentAnswerInfo.value.examInfoMap.questionScore[id] =
    currentAnswerInfo.value.paperContentObj.children.find((item: any) => item.id === id).attribute.examScore;
  handleSubmitCurrentScore()
};
/*点击False图标操作*/
const checkFalseIcon = (id: any) => {
  currentAnswerInfo.value.examInfoMap.questionScore[id] = 0;
  handleSubmitCurrentScore()
};
/*数字输入框值发生变化时提交*/
const handleSubmitCurrentScore = async () => {
  const res = await updateAnswerScore(currentAnswerInfo.value);
};

function getAnswerTotalScore() {
  // 初始值是0
  let totalScore = Object.values(currentAnswerInfo.value.examInfoMap.questionScore).reduce((accumulator: any, currentValue: any) => {
    return accumulator + currentValue;
  }, 0);
  return totalScore;
}

/*答题卡*/
const containerRef = ref<HTMLElement | null>(null);
/*上一题*/
const prevAnswer = () => {
  defaultMenu.value--;
  handleMenuClick(defaultMenu.value);
};
/*下一题*/
const nextAnswer = () => {
  defaultMenu.value++;
  handleMenuClick(defaultMenu.value);
};
/*答卷编辑相关*/
const updateFlag = ref();
const handleUpdateFlag = () => {
  updateFlag.value = "Update";
};
const handleUpdateClose = () => {
  dialog.visible = false;
  // currentAnswer.value =undefined;
  updateFlag.value = undefined;
  // refresh()
};
const isFullscreen = ref(false);
const toggleIsFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

/*获取问题选择的答案*/
const handleResult = (index: any) => {
  let key = Object.keys(paperAnswer.value[index]);
  let value = paperAnswer.value[index][key];
  let isEmpty = Object.keys(value).length === 0 && value.constructor === Object;
  return !isEmpty;
};
const handleAnswer = (index: any, question: any, answer: any, id: any) => {
  if (question.type === "Radio" || question.type === "TrueFalse") {
    paperAnswer.value[index][question.id] = {
      [answer]: true
    };
  }
  if (question.type === "Checkbox") {
    paperAnswer.value[index][question.id] = {};
    answer.forEach((item: any) => {
      paperAnswer.value[index][question.id][item] = true;
    });
  }
  if (question.type === "MultipleBlank") {
    if (answer.length === 0) {
      delete paperAnswer.value[index][question.id][id];
    } else {
      paperAnswer.value[index][question.id][id] = answer;
    }
  }
  if (question.type === "Textarea") {
    if (answer.length === 0) {
      paperAnswer.value[index][question.id] = {};
    } else {
      paperAnswer.value[index][question.id][id] = answer;
    }
  }
};

function judgeStartTime(item: any) {
  if (item) {
    return item.answerInfo.startTime;
  } else {
    return null;
  }
}

function judgeEndTime(item: any) {
  if (item) {
    return item.answerInfo.endTime;
  } else {
    return null;
  }
}

function judgeBrowser(item: any) {
  if (item) {
    return item.clientInfo.browser;
  } else {
    return null;
  }
}

/*导出按钮操作*/
const exportToExcel = () => {
  const data = answerList.value.map((item, index) => ({
    "序号": (queryParams.value.pageNum - 1) * queryParams.value.pageSize + index + 1,
    "学号": bindingList.value.find((x: { userId: any; }) => x.userId === item.userId).binding,
    "姓名": bindingList.value.find((x: { userId: any; }) => x.userId === item.userId).name,
    "用户名": item.user.userName,
    "分数": getPercentage(item.examScore,paperInfo.value.paperContentObj.attribute.examScore),
    "开始时间": judgeStartTime(item.metaInfoObj),
    "结束事件": judgeEndTime(item.metaInfoObj),
    "浏览器": judgeBrowser(item.metaInfoObj)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const wbout = XLSX.write(wb, {bookType: "xlsx", type: "array"});
  saveAs(new Blob([wbout], {type: "application/octet-stream"}), "table_data.xlsx");
};

const props = defineProps({
  /*预览内容*/
  paperId: {
    type: String,
    default: ""
  }
});
watch(() => props.paperId, (newVal, oldVal) => {
  getAnswerList();
});
onMounted(async () => {
  await getAnswerList();
  await getPaperInfo();
});
</script>

<template>
  <el-main class="paper-setting-wrapper paper-wrapper">
    <el-card shadow="hover">
      <el-button-group class="mr-3">
        <el-tooltip content="刷新">
          <el-button plain round icon="Refresh" @click="refresh"/>
        </el-tooltip>
        <el-tooltip content="百分制">
          <el-button plain round v-if="!percentageFlag">
            <svg-icon icon-class="percentage" @click="handlePercentage()"/>
          </el-button>
          <el-button plain round type="primary" v-if="percentageFlag">
            <svg-icon  icon-class="percentage" @click="handlePercentage()"/>
          </el-button>
        </el-tooltip>
      </el-button-group>

      <el-button plain round @click="handleUpdateCurrentAnswer()">
        <svg-icon icon-class="edit" class="mr-4"/>
        编辑
      </el-button>
      <el-button plain round type="danger" :disabled="multiple" @click="handleDelete()">
        <svg-icon icon-class="delete" class="mr-4"/>
        删除
      </el-button>
      <el-button :disabled="answerList.length === 0" plain round type="primary" @click="handleManualRanking()">
        <svg-icon icon-class="manual-ranking" class="mr-4"/>
        手动评分
      </el-button>
      <el-button plain round type="warning" class="float-right" @click="exportToExcel">
        <svg-icon icon-class="export" class="mr-4"/>
        导出数据
      </el-button>
    </el-card>
    <el-table v-loading="loading" stripe highlight-current-row height="69vh"
              @current-change="handleCurrentChange" :data="answerList"
              @selection-change="handleSelectionChange">
      <el-table-column fixed type="selection" width="55" align="center"/>
      <el-table-column label="序号" type="index" width="80" align="center">
        <template #default="scope">
          <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="学号" align="center">
        <template #default="scope">
          <span>{{ bindingList.find(item => item.userId === scope.row.user.userId).binding }}</span>
        </template>
      </el-table-column>
      <el-table-column label="姓名" align="center">
        <template #default="scope">
          <span>{{ bindingList.find(item => item.userId === scope.row.user.userId).name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户名" prop="user.userName" align="center"/>
      <el-table-column label="分数" prop="examScore" align="center">
        <template #default="scope">
          <el-text v-if="percentageFlag">
            {{ getPercentage(scope.row.examScore, paperInfo["paperContentObj"]["attribute"]["examScore"]) }} /
            {{ getPercentage(paperInfo["paperContentObj"]["attribute"]["examScore"], paperInfo["paperContentObj"]["attribute"]["examScore"]) }}
          </el-text>
          <el-text v-if="!percentageFlag">
            {{ scope.row.examScore }} /
            {{ paperInfo["paperContentObj"]["attribute"]["examScore"] }}
          </el-text>

        </template>
      </el-table-column>
      <el-table-column label="开始时间" prop="metaInfoObj.answerInfo.startTime" align="center"/>
      <el-table-column label="提交时间" prop="metaInfoObj.answerInfo.endTime" align="center"/>
      <el-table-column label="浏览器" :show-overflow-tooltip="true" prop="metaInfoObj.clientInfo.agent" align="center" width="250"/>
    </el-table>
    <div class="page-content-center">
      <pagination
        v-show="total>0"
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNum"
        :total="total"
        @pagination="getAnswerList"
      />
    </div>
    <el-dialog v-model="dialog.visible" width="70%"
               :class="{'answer-dialog': !isFullscreen, 'answer-dialog-fullscreen': isFullscreen}"
               :fullscreen="isFullscreen" :show-close="false">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="paper-title">
            <el-text size="large">{{ dialog.title }}</el-text>
          </div>
          <div>
            <el-button class="update-button">
              <svg-icon icon-class="printer"/>
            </el-button>
            <el-button class="update-button" @click="toggleIsFullscreen">
              <svg-icon :icon-class="isFullscreen ? 'exit-full-screen' : 'full-screen'"/>
            </el-button>
            <el-button @click="handleUpdateClose()" class="update-button">
              <svg-icon icon-class="close"/>
            </el-button>
          </div>
        </div>

      </template>
      <el-row :gutter="10">
        <el-col :span="14">
          <div v-if="updateFlag==='View'" class="update-answer">
            <div class="pl-6 pr-6 " v-for="(question, index) in currentAnswer.paperContentObj.children"
            >
              <div class="p-4 mt-2 vertical">
                <div class="mb-2 flex justify-between">
                  <el-text size="small">第 {{ index + 1 }} 题</el-text>
                  <el-tag v-if="getAnswerScore(question.id)>0" type="success">得分: {{ getAnswerScore(question.id) }}
                  </el-tag>
                  <el-tag v-else type="danger">得分: {{ getAnswerScore(question.id) }}</el-tag>
                </div>
                <div class="form-item-title">
                  <el-text size="large"> {{ question.title }}</el-text>
                </div>
                <div v-if="question.description!==null&&question.description!==undefined"
                     class="form-item-description">
                  <p class=" question-title ml-10">{{ question.description }}</p>
                </div>
                <el-radio-group v-if="question.type === 'Radio' || question.type === 'TrueFalse'"
                                v-model="question.answer"
                >
                  <div v-for="(item,i) in question.children"
                       :class="{'right-answer': item.attribute.examCorrectAnswer===question.answer&&question.answer===item.id,
                       'wrong-answer': item.attribute.examCorrectAnswer!==question.answer&&question.answer===item.id}"
                       class="default-radio-answer">
                    <el-radio size="large" :value="item.id" :label="getChooseLabel(i) + item.title" @click.prevent/>
                  </div>
                </el-radio-group>
                <el-checkbox-group v-if="question.type === 'Checkbox'"
                                   v-model="question.answer"
                >
                  <div v-for="(item,i) in question.children"
                       :class="{'right-answer':  question.answer.includes(item.attribute.examCorrectAnswer) && question.answer.includes(item.id),
                       'wrong-answer': !question.answer.includes(item.attribute.examCorrectAnswer) && question.answer.includes(item.id),}"
                       class="default-checkbox-answer">
                    <el-checkbox :value="item.id" :label="getChooseLabel(i) + item.title" @click.prevent/>
                  </div>
                </el-checkbox-group>
                <!--填空题-->
                <el-row :data-mode="item.id" v-if="question.type === 'MultipleBlank'"
                        v-for="item in question.children">
                  <el-input class="mt-2" type="text" v-model="item.answer" disabled></el-input>
                </el-row>
                <!--简答题-->
                <div v-if="question.type==='Textarea'" v-for="item in question.children">
                  <el-input
                    v-model="item.answer" disabled
                    class="form-input form-textarea mt-2"
                    type="textarea"/>
                </div>
              </div>
            </div>
          </div>
          <div v-if="updateFlag==='Update'" class="update-answer">
            <div class="pl-6 pr-6 " v-for="(question, index) in currentAnswer.paperContentObj.children"
            >
              <div class="p-4 mt-2 vertical">
                <div class="form-item-title">
                  <p class="question-title"><span><b>{{ index + 1 }}</b></span> {{ question.title }}</p>
                </div>
                <div v-if="question.description!==null&&question.description!==undefined"
                     class="form-item-description">
                  <p class=" question-title ml-10">{{ question.description }}</p>
                </div>
                <el-radio-group v-if="question.type === 'Radio' || question.type === 'TrueFalse'"
                                v-model="question.answer"
                                @change="handleAnswer(index,question, question.answer,null)">
                  <el-radio size="large" v-for="(item,i) in question.children" :value="item.id" :label="getChooseLabel(i) + item.title"/>
                </el-radio-group>
                <el-checkbox-group v-if="question.type === 'Checkbox'"
                                   v-model="question.answer"
                                   @change="handleAnswer(index,question, question.answer,null);handleResult(index)">
                  <el-checkbox v-for="(item,i) in question.children" :value="item.id" :label="getChooseLabel(i) + item.title"/>
                </el-checkbox-group>
                <!--填空题-->
                <el-row :data-mode="item.id" v-if="question.type === 'MultipleBlank'"
                        v-for="item in question.children">
                  <el-input class="mt-2" type="text" v-model="item.answer"
                            @blur="handleAnswer(index,question, item.answer, item.id)"></el-input>
                </el-row>
                <!--简答题-->
                <div v-if="question.type==='Textarea'" v-for="item in question.children">
                  <el-input
                    v-model="item.answer"
                    @blur="handleAnswer(index,question, item.answer, item.id)"
                    class="form-input form-textarea mt-2"
                    type="textarea"/>
                </div>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="10">
          <el-card class="update-answer" shadow="never">
            <el-tabs stretch>
              <el-tab-pane label="基本信息">
                <el-descriptions column="1" class="label-width">
                  <!--                  <el-descriptions-item label="序号">{{ currentAnswer["index"] }}</el-descriptions-item>-->
                  <el-descriptions-item label="用户名">{{ currentAnswer["user"]["userName"] }}</el-descriptions-item>
                  <el-descriptions-item label="提交时间">{{ currentAnswer["metaInfoObj"]["answerInfo"]["endTime"] }}
                  </el-descriptions-item>
                  <el-descriptions-item label="修改时间">{{ currentAnswer["updateTime"] }}</el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <div class="mt-2">
          <el-button v-if="updateFlag==='View'" round plain type="primary" @click="updateFlag='Update'">
            <svg-icon icon-class="save" class="mr-4"/>
            修改
          </el-button>
          <el-button v-if="updateFlag==='Update'" round plain type="success" :loading="buttonLoading"
                     @click="handleSubmit()">
            <svg-icon icon-class="save" class="mr-4"/>
            保存
          </el-button>
          <el-button v-if="updateFlag==='Update'" round icon="remove" @click="updateFlag='View'">
            取消
          </el-button>
          <el-button plain type="danger" round @click="handleUpdateClose()">
            <svg-icon icon-class="close" class="mr-4"/>
            关闭
          </el-button>
        </div>

      </el-row>
    </el-dialog>
    <el-drawer v-model="drawer.visible" size="100%" :show-close="false"
               :with-header="false" class="full-drawer">
      <el-header class="flex manual-ranking-header justify-between items-center">
        <div class="mr-5">
          <logo v-if="showLogo" :collapse="isCollapse"/>
        </div>
        <div>
          <el-button round plain type="danger" @click="drawer.visible=false">
            <svg-icon icon-class="close" class="mr-4"/>
            关闭
          </el-button>
        </div>
      </el-header>
      <el-container>
        <el-main>
          <div class="w-80% ma">
            <el-row :gutter="20">
              <el-col :span="5">
                <el-card>
                  <template #header>
                    <div class="flex justify-between items-center">
                      <el-text tag="b">评分名单</el-text>
                      <el-text>{{ defaultMenu + 1 }} / {{ total }}</el-text>
                    </div>
                  </template>
                  <el-menu :default-active="defaultMenu" class="h-74.5vh manual-ranking-menu">
                    <el-scrollbar>
                      <el-menu-item class="manual-ranking-menu-item" v-for="(item, index) in answerList" :key="index"
                                    :index="index" @click="handleMenuClick(index)">
                        答卷 {{ index + 1 }}
                      </el-menu-item>

                    </el-scrollbar>
                  </el-menu>
                </el-card>

              </el-col>
              <el-col :span="14">
                <el-card v-loading="currentLoading">
                  <template #header>
                    <el-text class="title-preview">答题详细</el-text>
                  </template>
                  <div class="h-74.5vh" ref="containerRef">
                    <el-scrollbar>
                      <div :id="question.id" class="pl-6 pr-6 "
                           v-for="(question, index) in currentAnswerInfo.paperContentObj.children"
                      >
                        <div class="p-4 mt-2 vertical">
                          <div class="mb-2 flex justify-between">
                            <el-text size="small">第 {{ index + 1 }} 题</el-text>
                            <el-tag v-if="getAnswerInfoScore(question.id)>0" type="success">得分:
                              {{ getAnswerInfoScore(question.id) }}
                            </el-tag>
                            <el-tag v-else type="danger">得分: {{ getAnswerInfoScore(question.id) }}</el-tag>
                          </div>
                          <div class="form-item-title">
                            <el-text size="large"> {{ question.title }}</el-text>
                          </div>
                          <div class="flex">
                            <div style="flex: 1 1 0%;">
                              <div v-if="question.description!==null&&question.description!==undefined"
                                   class="form-item-description">
                                <p class=" question-title ml-10">{{ question.description }}</p>
                              </div>
                              <el-radio-group v-if="question.type === 'Radio' || question.type === 'TrueFalse'"
                                              v-model="question.answer"
                              >
                                <div v-for="(item,i) in question.children"
                                     :class="{'right-answer': item.attribute.examCorrectAnswer===question.answer&&question.answer===item.id,
                       'wrong-answer': item.attribute.examCorrectAnswer!==question.answer&&question.answer===item.id}"
                                     class="default-radio-answer">
                                  <el-radio size="large" :value="item.id" :label="getChooseLabel(i) + item.title" @click.prevent/>
                                </div>
                              </el-radio-group>
                              <el-checkbox-group v-if="question.type === 'Checkbox'"
                                                 v-model="question.answer"
                              >
                                <div v-for="(item,i) in question.children"
                                     :class="{'right-answer':  question.answer.includes(item.attribute.examCorrectAnswer) && question.answer.includes(item.id),
                       'wrong-answer': !question.answer.includes(item.attribute.examCorrectAnswer) && question.answer.includes(item.id),}"
                                     class="default-checkbox-answer">
                                  <el-checkbox :value="item.id" :label="getChooseLabel(i) + item.title" @click.prevent/>
                                </div>
                              </el-checkbox-group>
                              <!--填空题-->
                              <el-row :data-mode="item.id" v-if="question.type === 'MultipleBlank'"
                                      v-for="item in question.children">
                                <el-input class="mt-2" type="text" v-model="item.answer" disabled></el-input>
                              </el-row>
                              <!--简答题-->
                              <div v-if="question.type==='Textarea'" v-for="item in question.children">
                                <el-input
                                  v-model="item.answer" disabled
                                  class="form-input form-textarea mt-2"
                                  type="textarea"/>
                              </div>
                            </div>
                            <div class="manual-score">
                              <div class="choose-right-wrong">
                                <el-text>是否正确</el-text>
                                <svg-icon icon-class="true" :color="getTrueChooseColor(question.id)"
                                          class="choose-svg cursor-pointer"
                                          @click="checkTrueIcon(question.id)"></svg-icon>
                                <svg-icon icon-class="false" :color="getFalseChooseColor(question.id)"
                                          class="choose-svg cursor-pointer"
                                          @click="checkFalseIcon(question.id)"></svg-icon>
                              </div>
                              <div class="choose-right-wrong">
                                <div class="w-20 ml-5">
                                  <el-text>得分</el-text>
                                </div>
                                <el-input-number v-if="currentAnswerInfo.examInfoMap"
                                                 v-model="currentAnswerInfo.examInfoMap.questionScore[question.id]"
                                                 controls-position="right" :min="0" :value-on-clear="0"
                                                 :max="question.attribute.examScore"
                                                 @change="handleSubmitCurrentScore()"/>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-scrollbar>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="5" class="left-manual-wrapper">
                <el-card class="left-manual-header">
                  <div>得分
                    <el-text tag="b" size="large">{{ getAnswerTotalScore() }}</el-text>
                  </div>
                </el-card>
                <el-card class="mt-5 left-manual-body">
                  <template #header>
                    <div class="answer-sheet-header">答题卡</div>
                  </template>
                  <el-scrollbar>
                    <div class="answer-sheet-content">
                      <a :href="'#'+key" v-for="(value, key,index) in currentAnswerInfo.examInfoMap.questionScore"
                         class="answer-sheet-item" :class="{ 'item-finished': getAnswerInfoScore(key)>0 }">
                        {{ index + 1 }}
                      </a>
                    </div>
                  </el-scrollbar>
                </el-card>
                <el-card class="mt-5 left-manual-footer">
                  <div>
                    <el-button type="primary" plain round size="small"
                               :disabled="defaultMenu === 0" @click="prevAnswer()">
                      <svg-icon icon-class="prev" class="mr-3"/>
                      上一份
                    </el-button>
                    <el-button type="primary" plain round size="small" @click="nextAnswer()"
                               :disabled="defaultMenu === answerList.length - 1">
                      下一份
                      <svg-icon icon-class="next" class="ml-3"/>
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>


          </div>

        </el-main>
      </el-container>
    </el-drawer>
  </el-main>
</template>

<style scoped lang="scss">
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 15px;
  margin-bottom: 5px;
}

.update-button {
  border: none;
  font-size: 20px;
  width: 32px;
}

.update-answer {
  max-height: 60vh;
  overflow-y: auto;
}

.manual-ranking-header {
  height: 50px;
  -webkit-box-shadow: 0 0 6px rgba(0, 41, 13, 0.35);
  box-shadow: 0 0 6px rgba(0, 21, 41, 0.35);
  margin-bottom: 10px;
}

/*手动评分页面菜单样式*/
.manual-ranking-menu {
  border-right: none;

  .manual-ranking-menu-item {
    height: 40px;
    justify-content: center;
  }
}

/*手动评分页面主体样式*/
.title-preview {
  margin-left: 10px;
}

.title-preview::before {
  content: "";
  display: inline-block;
  vertical-align: middle;
  width: 2px;
  height: 14px;
  background: var(--el-color-primary);
  border-radius: 1px;
  margin-right: 4px;
}

.manual-score {
  width: 144px;
  padding-bottom: 6px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  .choose-right-wrong {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 12px;
    gap: 10px;

    .choose-svg {
      font-size: 24px;
    }
  }
}


.answer-sheet-header::before {
  display: inline-block;
  width: 2px;
  height: 12px;
  margin-right: 6px;
  background: var(--el-color-primary);
  border-radius: 1px;
  content: "";
}

.answer-sheet-content {
  box-sizing: border-box;
  min-height: 60px;
  padding: 10px 12px 6px 12px;
  overflow: auto;

  .answer-sheet-item {
    position: relative;
    float: left;
    box-sizing: border-box;
    width: 26px;
    height: 26px;
    margin: 6px 3px 6px 3px;
    color: #484848;
    font-size: 12px;
    line-height: 26px;
    white-space: nowrap;
    text-align: center;
    background: #fff;
    border: 1px solid #d8d8d8;
    border-radius: 50%;
    cursor: pointer;
  }

  .item-finished {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

.left-manual-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);

  .left-manual-header {
  }

  .left-manual-body {
    flex: 1;
  }

  .left-manual-footer {
    display: flex;
    justify-content: center;
  }
}

</style>
<style lang="scss">
.label-width {
  .el-descriptions__label {
    width: 25%;
    display: inline-block;
  }
}

/*修改窗口全屏样式*/
.answer-dialog {
  border-radius: 15px;
  padding: 10px 24px 0px 24px;
}

.answer-dialog-fullscreen {
  .update-answer {
    max-height: 78vh;
    overflow-y: auto;
  }

  .el-dialog__body {
    max-height: calc(100vh) !important;
  }
}

/*修改页面选项样式*/
.default-radio-answer {
  border-radius: 5px;
  margin-left: -6px;
  padding-right: 10px;
  padding-left: 6px;
  display: block;
  height: 24px;
  margin-top: 3px;
}

.default-checkbox-answer {
  height: 24px;
  border-radius: 5px;
  margin-left: -6px;
  margin-top: 3px;
  padding-left: 6px;
  padding-top: 3px;
}

.right-answer {
  color: #00bf6f !important;
  background: rgba(0, 191, 111, .05) !important;
  border: 1px solid rgba(0, 191, 111, .3) !important;

  .el-radio__input.is-checked .el-radio__inner {
    background: rgb(0, 191, 111);
    border-color: rgb(0, 191, 111);
  }

  .el-radio__input.is-checked + .el-radio__label {
    color: rgb(0, 191, 111);
  }

  .el-checkbox__input.is-checked .el-checkbox__inner {
    background: rgb(0, 191, 111);
    border-color: rgb(0, 191, 111);
  }

  .el-checkbox__input.is-checked + .el-checkbox__label {
    color: rgb(0, 191, 111);
  }
}

.wrong-answer {
  color: #ff6d56 !important;
  background: rgba(255, 109, 86, .05) !important;
  border: 1px solid rgba(255, 109, 86, .3) !important;

  .el-radio__input.is-checked .el-radio__inner {
    background: rgb(255, 109, 86);
    border-color: rgb(255, 109, 86);
  }

  .el-radio__input.is-checked + .el-radio__label {
    color: rgb(255, 109, 86);
  }

  .el-checkbox__input.is-checked .el-checkbox__inner {
    background: rgb(255, 109, 86);
    border-color: rgb(255, 109, 86);
  }

  .el-checkbox__input.is-checked .el-checkbox__label {
    color: rgb(255, 109, 86);
  }
}

.wrong-answer-background {
  color: #ff6d56 !important;
  background: rgba(255, 109, 86, .05) !important;
  border: 1px solid rgba(255, 109, 86, .3) !important;
}
</style>
