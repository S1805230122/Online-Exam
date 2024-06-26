<script setup lang="ts">
import {getPaper} from "@/api/exam/paper";
import Logo from "@/layout/components/Sidebar/Logo.vue";
import useSettingsStore from "@/store/modules/settings";
import useAppStore from "@/store/modules/app";
import {Settings} from "@/layout/components";
import useUserStore from "@/store/modules/user";
import {getAnswerInfo, listAnswerRank, updateAnswer} from "@/api/exam/answer";
import ConciseNavbar from "@/layout/components/conciseNavbar.vue";
import {getChooseLabel} from "@/utils/tagColor";


const {proxy} = getCurrentInstance() as ComponentInternalInstance;

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const showLogo = computed(() => settingsStore.sidebarLogo);
const isCollapse = computed(() => !appStore.sidebar.opened);
const settingRef = ref(Settings);
const buttonLoading = ref(false);
/*标签栏相关*/
const navigatorFlag = ref("");
const {
  exam_paper_status
} = toRefs<any>(proxy?.useDict("exam_paper_status"));
const route = useRoute();
const logout = async () => {
  await ElMessageBox.confirm("确定注销并退出系统吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  });
  await userStore.logout();
  location.href = import.meta.env.VITE_APP_CONTEXT_PATH + "index";
};
const emits = defineEmits(["setLayout"]);
const setLayout = () => {
  settingRef.value.openSetting();
}
const commandMap: { [key: string]: any } = {
  setLayout,
  logout
};
const handleCommand = (command: string) => {
  // 判断是否存在该方法
  if (commandMap[command]) {
    commandMap[command]();
  }
};


const paperInfo = ref<any>({
  paperId: null,
  courseId: null,
  paperName: null,
  paperContentObj: null,
  paperSettingObj: {
    examSetting: {
      randomPaper: []
    }
  }
});
const loading = ref(true);
const answerQueryParams = ref<any>({
  paperId: null,
  userId: userStore.userId
});
const getPaperInfo = async () => {
  const paperId = route.params && route.params.paperId as string;
  if (paperId) {
    loading.value = true;
    const res = await getPaper(paperId);
    answerQueryParams.value.paperId = paperId;
    paperInfo.value = res.data;
    await getAnswer();
    navigatorFlag.value = "Overview";
    loading.value = false;
  }
  await getRankList();
};

const answerInfo = ref();
const paperAnswer = ref();
const answerFlag = ref(true)
const handleAnswerStart = async () => {
  await getAnswer();
  getMaxAnswerTime();
  startCountdown();
  if (answerInfo.value.tempSave === '1') {
    navigatorFlag.value = "Answer";
    answerFlag.value = false;
  } else {
    navigatorFlag.value = "Answer";
    /*有数据了，将answerFlag设置为false*/
    if (answerInfo.value.tempSave !== '1') {
      answerFlag.value = false;
      /*开始答题执行一次提交，更新开始时间*/
      await handleSubmit()
    }
  }

}

/*获取答卷信息*/
const getAnswer = async () => {
  const res = await getAnswerInfo(answerQueryParams.value);
  answerInfo.value = res.data;
  /*如果答卷元数据为null*/
  if (answerInfo.value.metaInfoObj === null || answerInfo.value.metaInfoObj === undefined) {
    getMetaInfo();
  }
  if (answerInfo.value.answerMap !== null) {

    paperAnswer.value = Object.entries(answerInfo.value.answerMap).map(([key, value]) => {
      return {[key]: value};
    });
  } else {
    paperAnswer.value = answerInfo.value.paperContentObj.children
      .map((item: any) => {
        const {id} = item;
        return {[id]: {}};
      });
  }
  unAnswered.value = paperAnswer.value.length;
  handleAnswerStatus();
  /*将获取的做题答案传给answerInfo 答卷回显*/
  answerInfo.value.paperContentObj.children.forEach((item: any, index: number) => {
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
};

/*获取答卷元数据*/
const getMetaInfo = () => {
  answerInfo.value.metaInfoObj = {
    clientInfo: {
      agent: navigator.userAgent,
    },
    answerInfo: {
      startTime: new Date().getTime(),
    }
  }

}

/*判断得分*/
function getAnswerInfoScore(id: string | number) {
  /*获取当前题目作答分值*/
  if (answerInfo.value.examInfoMap !== null) {
    let score = answerInfo.value.examInfoMap.questionScore[id];
    if (score > 0) {
      return score;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}

/*获取问题选择的答案*/
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
const handleResult = (index: any) => {
  let key = Object.keys(paperAnswer.value[index]);
  let value = paperAnswer.value[index][key];
  let isEmpty = Object.keys(value).length === 0 && value.constructor === Object;
  return !isEmpty;
};
/*答题卡相关*/
const currentQuestionIndex = ref(0);
const collapse = ref(false);
const unAnswered = ref();
const answered = ref(0);
const answerProgress = ref(0);
const handleAnswerSheet = (index: any) => {
  currentQuestionIndex.value = index;
};
/*获取作答情况*/
const handleAnswerStatus = () => {
  unAnswered.value = paperAnswer.value.length;
  answered.value = 0;
  paperAnswer.value.forEach((item: any, index: number) => {
    if (handleResult(index)) {
      answered.value++;
      unAnswered.value--;
    }
  });
  answerProgress.value = answered.value / paperAnswer.value.length * 100;
};


/*上一题按钮*/
const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};
/*下一题按钮*/
const nextQuestion = () => {
  if (currentQuestionIndex.value < answerInfo.value.paperContentObj.children.length - 1) {
    currentQuestionIndex.value++;
  }
};

/*保存按钮操作*/
const submitFlag = ref(false);
const handleSubmit = async () => {
  buttonLoading.value = true;
  let answerObj = paperAnswer.value.reduce((acc: { [x: string]: any; }, item: { [x: string]: any; }) => {
    let key = Object.keys(item)[0]; // 获取对象的键
    let value = item[key]; // 获取对象的值
    acc[key] = value; // 将键值对添加到结果对象中
    return acc;
  }, {});
  answerInfo.value.answerMap = answerObj;
  answerInfo.value.metaInfoObj.answerInfo.endTime = new Date().getTime();
  answerInfo.value.tempSave = submitFlag.value ? '1' : '0';
  if (submitFlag.value && formattedTime.value !== '00:00') {
    await proxy?.$modal.confirm("是否进行提交？")
  }
  await updateAnswer(answerInfo.value).finally(() => buttonLoading.value = false);
  await getPaperInfo();
};


/*倒计时实现*/
const targetTime = ref<any>(null); // 60秒倒计时
const formattedTime = ref(formatTime(targetTime.value));
let intervalId: number | undefined;
let endTime: number;

/*获取最大答卷时间*/
const getMaxAnswerTime = () => {
  /*获取答题开始时间*/
  let startTime = new Date(answerInfo.value.metaInfoObj.answerInfo.startTime).getTime();
  /*获取当前时间*/
  let nowTime = new Date().getTime();
  if (paperInfo.value.paperSettingObj.examSetting.maxSubmitMinutes !== null) {
    /*最大答题时间-（结束时间-开始时间）*/
    let time = Math.floor((nowTime - startTime) / 1000);

    targetTime.value = paperInfo.value.paperSettingObj.examSetting.maxSubmitMinutes * 60 - time;

  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateCountdown() {
  const now = Math.floor(Date.now() / 1000);
  const remainingTime = endTime - now;

  if (remainingTime > 0) {
    targetTime.value = remainingTime;
    formattedTime.value = formatTime(targetTime.value);
  } else {
    targetTime.value = 0;
    formattedTime.value = formatTime(targetTime.value);
    clearInterval(intervalId);
  }
}

function startCountdown() {
  const now = Math.floor(Date.now() / 1000);
  endTime = now + targetTime.value;
  intervalId = window.setInterval(updateCountdown, 1000);
}

/*获取排名列表*/
const rankList = ref();
const currentUserRank = ref();

const rankParams = ref({
  pageNum: 1,
  pageSize: -1,
  paperId: null
})
const getRankList = async () => {
  rankParams.value.paperId = paperInfo.value.paperId;
  const res = await listAnswerRank(rankParams.value);
  rankList.value = res.rows;
  rankList.value.find((item: any) => {
    if (item.user.userId === userStore.userId) {
      currentUserRank.value = [item]
    }
  })
}
const handleRanking = () => {
  getRankList();

}

const test = () => {

}

// 监听formattedTime的变化
watch(formattedTime, (newValue, oldValue) => {
  if (newValue === '00:00') {
    /*倒计时结束直接提交*/
    submitFlag.value = true;
    handleSubmit()
    navigatorFlag.value = 'Overview';
  }
});

onMounted(async () => {
  await getPaperInfo();

});
onUnmounted(() => {
  if (intervalId !== undefined) {
    clearInterval(intervalId);
  }
});
</script>

<template>
  <el-container>
    <el-header class="paper-header items-center flex justify-between">
      <div class="flex  justify-between">
        <div class="mr-5">
          <logo v-if="showLogo" :collapse="isCollapse"/>
        </div>
        <el-text class="w-100">{{ paperInfo.paperName }}</el-text>
      </div>

      <ConciseNavbar ref="navbarRef" @setLayout="setLayout"/>
      <settings ref="settingRef"/>
    </el-header>
    <el-container class="answer-wrapper">
      <div class="navigator">
        <div class="actions-container">
          <el-tabs v-model="navigatorFlag" tab-position="right" :stretch="true">
            <el-tab-pane name="Overview">
              <template #label>
                <div class="navigator-button">
                  <div>
                    <svg-icon icon-class="overview"/>
                  </div>
                  <span>概览</span>
                </div>
              </template>
            </el-tab-pane>
            <el-tab-pane name="Answer" :disabled="answerFlag">
              <template #label>
                <div class="navigator-button">
                  <div>
                    <svg-icon icon-class="answer"/>
                  </div>
                  <span>答卷</span>
                </div>
              </template>
            </el-tab-pane>
            <el-tab-pane name="Ranking">
              <template #label>
                <div class="navigator-button">
                  <div>
                    <svg-icon icon-class="ranking"/>
                  </div>
                  <span>排名</span>
                </div>
              </template>
            </el-tab-pane>

          </el-tabs>
          <router-link :to="'/exam/course-data/index/' + paperInfo.courseId">
            <div class="ml-2.5 mt-2">
              <div class="navigator-button">
                <div>
                  <svg-icon icon-class="back"/>
                </div>
                <span>返回</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
      <el-main v-if="navigatorFlag==='Overview'" v-loading="loading">
        <div class="w-80% ma">
          <el-card class="mt-5">
            <div class="flex overview-header">
              <div class="random-type">
                <div v-if="paperInfo.paperSettingObj.examSetting.randomPaper.length>0">
                  <svg-icon icon-class="random" color="var(--el-color-primary)" style="font-size: 5rem;"/>
                </div>
                <div v-if="paperInfo.paperSettingObj.examSetting.randomPaper.length===0">
                  <svg-icon icon-class="nonrandom" color="var(--el-color-primary)" style="font-size: 5rem;"/>
                </div>
              </div>
              <div class="ml-8 overview-title">
                <div class="p-2">
                  <el-text style="font-size: 1.5rem" tag="b">{{ paperInfo.paperName }}</el-text>
                </div>
                <div class="p-2">
                  <el-button plain type="primary" @click="handleAnswerStart()">
                    <span v-if="paperInfo.status==='2'">查看答卷</span>
                    <span v-if="paperInfo.status==='1'">开始答题</span>

                  </el-button>
                </div>
              </div>
            </div>

          </el-card>
          <el-row :gutter="20" class="mt-5">
            <el-col :span="12">
              <el-card>
                <div>
                  <el-text tag="b" size="large">题目集信息</el-text>
                </div>
                <div class="overview-title">
                  <div class="overview-item">
                    <el-text>题目集类型</el-text>
                    <el-text v-if="paperInfo.paperSettingObj.examSetting.randomPaper.length===0">固定</el-text>
                    <el-text v-if="paperInfo.paperSettingObj.examSetting.randomPaper.length>0">随机</el-text>
                  </div>
                  <div class="overview-item">
                    <el-text>开放时间</el-text>
                    <el-text v-if="paperInfo.paperSettingObj.examSetting.startTime">
                      {{ paperInfo.paperSettingObj.examSetting.startTime }}
                    </el-text>
                    <el-text v-else>-</el-text>
                  </div>
                  <div class="overview-item">
                    <el-text>关闭时间</el-text>
                    <el-text v-if="paperInfo.paperSettingObj.examSetting.endTime">
                      {{ paperInfo.paperSettingObj.examSetting.endTime }}
                    </el-text>
                    <el-text v-else>-</el-text>
                  </div>
                  <div class="overview-item">
                    <el-text>答题时长</el-text>
                    <el-text v-if="paperInfo.paperSettingObj.examSetting.maxSubmitMinutes">
                      {{ paperInfo.paperSettingObj.examSetting.maxSubmitMinutes }} 分钟
                    </el-text>
                    <el-text v-else>-</el-text>
                  </div>
                  <div class="overview-item">
                    <el-text>开放状态</el-text>
                    <dict-tag :options="exam_paper_status" :value="paperInfo.status"/>
                  </div>
                </div>

              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <div>
                  <el-text tag="b" size="large">答题状态</el-text>
                </div>
                <div class="overview-title">
                  <div class="overview-item">
                    <el-text>答题状态</el-text>
                    <el-tag type="info" v-if="answerInfo.tempSave==='0'||answerInfo.tempSave===null">未完成</el-tag>
                    <el-tag type="success" v-if="answerInfo.tempSave==='1'">已完成</el-tag>
                  </div>
                  <div class="overview-item">
                    <el-text>开考时间</el-text>
                    <el-text v-if="answerInfo.tempSave!==null">{{
                        answerInfo.metaInfoObj.answerInfo.startTime
                      }}
                    </el-text>
                    <el-text v-else>-</el-text>
                  </div>
                  <div class="overview-item">
                    <el-text>成绩</el-text>
                    <el-text>{{ answerInfo.examScore }} / {{ paperInfo["paperContentObj"]["attribute"]["examScore"] }}
                      分
                    </el-text>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-card class="mt-4">
            <div>
              <div class="answer-sheet-header">答题卡</div>
              <div class="overview-sheet-content">
                <div v-if="answerInfo.examInfoMap" v-for="(value, key,index) in answerInfo.examInfoMap.questionScore"
                     class="answer-sheet-item"
                     :class="{ 'item-true': getAnswerInfoScore(key)>0 ,'item-false': getAnswerInfoScore(key)===0}">
                  {{ index + 1 }}
                </div>
              </div>
            </div>

          </el-card>
        </div>
      </el-main>
      <el-main class="app-main" v-if="navigatorFlag==='Answer'">
        <div>
          <div v-if="paperInfo.status !== '2' && answerInfo.tempSave !== '1'">
            <van-floating-bubble class="clock-floating">
              <template #default>
                <div class="clock-floating-time">{{ formattedTime }}</div>
              </template>
            </van-floating-bubble>
          </div>

          <!--        答题卡-->
          <div class="answer-sheet" :class="{ 'answer-sheet-collapse': collapse }">
            <div class="answer-sheet-header">答题卡</div>
            <div class="answer-sheet-body">
              <div class="answer-sheet-content">
                <div v-for="(item, index) in paperAnswer"
                     class="answer-sheet-item" @click="handleAnswerSheet(index)"
                     :class="{ 'item-finished': handleResult(index) }">
                  {{ index + 1 }}
                </div>
              </div>
            </div>
            <div class="answer-sheet-footer">
              <div class="finished">已答 <span>{{ answered }}</span></div>
              <div class="un-finished">未答 <span>{{ unAnswered }}</span></div>
            </div>
          </div>
          <div class="answer-sheet-button" :class="{ 'answer-sheet-button-collapse': collapse }">
            <el-button v-if="!collapse" circle icon="DArrowLeft" @click="collapse=true"/>
            <el-button v-if="collapse" circle icon="DArrowRight" @click="collapse=false"/>
          </div>
          <div class="question-edit paper-answer" :class="{ 'collapse': collapse }">
            <div class="fixed-top question-edit p-2 answer-header">
              <el-progress :percentage="answerProgress" :show-text="false"/>
            </div>
            <div class="answer-body">
              <div class="pl-6 pr-6 " v-for="(question, index) in answerInfo.paperContentObj.children"
              >
                <div class="p-4 mt-2 vertical" v-if="index === currentQuestionIndex">
                  <div class="mb-2 flex">
                    <el-text size="small">第 {{ index + 1 }} 题</el-text>
                    <el-tag class="ml-4" round size="small" type="info">分数 {{ question["attribute"]["examScore"] }}
                    </el-tag>
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
                                  :disabled="paperInfo.status === '2' || answerInfo.tempSave === '1'"
                                  @change="handleAnswer(index,question, question.answer,null);handleAnswerStatus()">
                    <el-radio size="large" v-for="(item,i) in question.children" :value="item.id"
                              :label="getChooseLabel(i) + item.title"/>
                  </el-radio-group>
                  <el-checkbox-group v-if="question.type === 'Checkbox'"
                                     v-model="question.answer"
                                     :disabled="paperInfo.status === '2' || answerInfo.tempSave === '1'"
                                     @change="handleAnswer(index,question, question.answer,null);handleResult(index);handleAnswerStatus()">
                    <el-checkbox v-for="(item,i) in question.children" :value="item.id"
                                 :label="getChooseLabel(i) + item.title"/>
                  </el-checkbox-group>
                  <!--填空题-->
                  <el-row :data-mode="item.id" v-if="question.type === 'MultipleBlank'"
                          v-for="item in question.children">
                    <el-input class="mt-2" type="text" v-model="item.answer"
                              :disabled="paperInfo.status === '2' || answerInfo.tempSave === '1'"
                              @blur="handleAnswer(index,question, item.answer, item.id);handleAnswerStatus()"></el-input>
                  </el-row>
                  <!--简答题-->
                  <div v-if="question.type==='Textarea'" v-for="item in question.children">
                    <el-input
                      v-model="item.answer" :disabled="paperInfo.status === '2' || answerInfo.tempSave === '1'"
                      @blur="handleAnswer(index,question, item.answer, item.id);handleAnswerStatus()"
                      class="form-input form-textarea mt-2"
                      type="textarea"/>
                  </div>
                </div>
              </div>
            </div>
            <el-card class="answer-footer">
              <div class="flex justify-center">
                <el-button-group>
                  <el-button type="primary" plain round @click="prevQuestion" :disabled="currentQuestionIndex === 0">
                    <svg-icon icon-class="prev" class="mr-4"/>
                    上一题
                  </el-button>
                  <el-button @click="nextQuestion" type="primary" plain round
                             :disabled="currentQuestionIndex === answerInfo.paperContentObj.children.length - 1">
                    下一题
                    <svg-icon icon-class="next" class="ml-4"/>
                  </el-button>
                </el-button-group>
                <div v-if="paperInfo.status !== '2' && answerInfo.tempSave !== '1'">
                  <el-button class="ml-5" type="success" plain round :loading="buttonLoading"
                             @click="submitFlag=false;handleSubmit();">
                    <svg-icon icon-class="save" class="mr-4"/>
                    保存
                  </el-button>
                  <el-button class="ml-5" type="success" plain round :loading="buttonLoading"
                             @click="submitFlag=true;handleSubmit();">
                    <svg-icon icon-class="publish" class="mr-4"/>
                    提交
                  </el-button>
                </div>


              </div>
            </el-card>
          </div>
        </div>


      </el-main>
      <el-main v-if="navigatorFlag==='Ranking'">
        <div class="app-main app-container">
          <el-card v-if="rankList" class="h-88vh" style="overflow-y: auto">
            <el-table :data="currentUserRank" stripe>
              <el-table-column label="序号" type="index" width="100" align="center"/>
              <el-table-column label="姓名" prop="user.userName" min-width="200" align="center"/>
              <el-table-column label="用户" prop="userId" min-width="200" align="center">
                <template #default="scope">
                  <el-tag type="success">我</el-tag>
                  {{ scope.row.userId }}
                </template>
              </el-table-column>
              <el-table-column label="分数" prop="examScore" min-width="100" align="center"/>
              <el-table-column label="名次" prop="orderNum" min-width="200" align="center"/>
            </el-table>
            <el-table :data="rankList" stripe :show-header="false">
              <el-table-column label="序号" type="index" width="100" align="center"/>
              <el-table-column label="姓名" prop="user.userName" min-width="200" align="center"/>
              <el-table-column label="用户" prop="userId" min-width="200" align="center"/>
              <el-table-column label="分数" prop="examScore" min-width="100" align="center"/>
              <el-table-column label="名次" prop="orderNum" min-width="200" align="center"/>
            </el-table>
          </el-card>
        </div>
      </el-main>

    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.app-main {
  /* 50= navbar  50  */
  min-height: calc(100vh - 50px);
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.paper-header {
  height: 50px;
  -webkit-box-shadow: 0 0 6px rgba(0, 41, 13, 0.35);
  box-shadow: 0 0 6px rgba(0, 21, 41, 0.35);
}

.el-main {
  --el-main-padding: 0px;
}

.avatar-container {
  margin-right: 40px;

  .avatar-wrapper {
    position: relative;

    .user-avatar {
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    i {
      cursor: pointer;
      position: absolute;
      right: -20px;
      top: 25px;
      font-size: 12px;
    }
  }
}

.drawer-left-menu {
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  width: 15% !important;
  background-color: #ffffff;
  margin: 0;
}

.answer-wrapper {
  position: relative;
  height: calc(100vh - 50px);
  width: 100%;
}

.navigator {
  display: flex;
  flex: 0 0 60px;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #bfbfbf;

  .actions-container {
    display: flex;
    flex-direction: column;
  }

  .navigator-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    justify-content: center;
    box-sizing: border-box;
    height: 48px;
    margin-right: 0;
    overflow: hidden;

    div {
      font-size: 24px;
    }

    font-size: 14px;
  }

  .navigator-button:hover {
    color: var(--el-color-primary);
  }
}

.overview-header {
  .random-type {
    display: flex;
    border-radius: 0.5rem;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    width: 30%;
    background: linear-gradient(70deg, var(--el-color-primary-light-7), #ffffff);
  }

  .overview-title {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

  }

}

.overview-item {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
}

.el-tabs {
  --el-tabs-header-height: 68px;
}

.answer-sheet {
  height: 100%;
  position: fixed;
  font-size: 0;
  width: 200px;
  background: transparent;
  box-shadow: 0 2px 6px #0000000a;
  //border-right: 1px solid #bfbfbf;
  transition: .3s;


  .answer-sheet-body {
    .answer-sheet-content {
      box-sizing: border-box;
      min-height: 60px;
      max-height: 315px;
      padding: 10px 12px 6px 18px;
      overflow: auto;
      border-bottom: 1px solid #eaeaea;

      .answer-sheet-item {
        position: relative;
        float: left;
        box-sizing: border-box;
        width: 28px;
        height: 28px;
        margin: 6px 6px 6px 0;
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
  }

  .answer-sheet-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    padding: 0 12px;
    color: #707070;
    font-size: 12px;
    line-height: 12px;

    .finished {

    }

    .finished::before {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 4px;
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-5);
      border-radius: 50%;
      content: "";
    }

    .un-finished {

    }

    .un-finished::before {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 4px;
      background: #fff;
      border: 1px solid #d8d8d8;
      border-radius: 50%;
      content: "";
    }
  }
}

.answer-sheet-header {
  position: relative;
  display: flex;
  align-items: center;
  height: 42px;
  padding-left: 18px;
  color: #484848;
  font-size: 14px;
  line-height: 42px;
  border-bottom: 1px solid #eaeaea;
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

.answer-sheet-button {
  position: fixed;
  left: 260px;
  top: 50%;
  transition-duration: .3s;
}

.fixed-top {
  position: sticky;
  top: 0;
  background-color: transparent;
}

.question-edit {
  border-color: #aab2bd;
}

.paper-answer {
  display: flex;
  flex-direction: column;
  margin-left: 200px;
  height: calc(100vh - 50px);
  transition-duration: .3s;

  .answer-header {
  }

  .answer-body {
    flex: 1;
  }

  .answer-footer {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.collapse {
  margin-left: 0;
  transition-duration: .3s;
}

.answer-sheet-collapse {
  display: none;
  width: 0;
}

.answer-sheet-button-collapse {
  left: 60px;
  transition-duration: .3s;
}

.clock-floating {
  .clock-floating-time {
    color: #2c3e50;
    margin-bottom: 25%;
  }
}

.overview-sheet-content {
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

  .item-true {
    color: var(--el-color-success);
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }

  .item-false {
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
  }
}

</style>
<style lang="scss">
.van-floating-bubble {
  width: 160px;
  height: 160px;
  background: url("@/assets/icons/svg/clock.svg") no-repeat 50% 50%;
}
</style>
