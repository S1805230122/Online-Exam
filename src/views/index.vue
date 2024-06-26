<template>
  <div class="app-container home">
    <el-row :gutter="12">
      <el-col :span="userStore.roles.find(item=>item==='student') ? 18: 24">
        <StatisticsCard />
        <el-row v-if="userStore.roles.find(item=>item==='superadmin')" :gutter="12" class="mb-4">
          <el-col :span="12">
            <QuestionStatistics/>
          </el-col>
          <el-col :span="12">
            <AnswerStatistics/>
          </el-col>
        </el-row>
        <ActivePaperCard/>
        <UserScoreStatistics v-if="userStore.roles.find(item=>item==='student')"/>
      </el-col>
      <el-col :span="6" v-if="userStore.roles.find(item=>item==='student')">
        <PaperTimeline/>
      </el-col>
    </el-row>

  </div>
</template>

<script lang="ts" name="Index" setup>
import {initWebSocket} from '@/utils/websocket';
import StatisticsCard from "@/views/home/statisticsCard.vue";
import QuestionStatistics from "@/views/home/questionStatistics.vue";
import AnswerStatistics from "@/views/home/answerStatistics.vue";
import ActivePaperCard from "@/views/home/activePaperCard.vue";
import PaperTimeline from "@/views/home/paperTimeline.vue";
import useUserStore from "@/store/modules/user";
import UserScoreStatistics from "@/views/home/userScoreStatistics.vue";

const userStore = useUserStore();

onMounted(() => {
  let protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  initWebSocket(protocol + window.location.host + import.meta.env.VITE_APP_BASE_API + "/resource/websocket");
});

const goTarget = (url: string) => {
  window.open(url, '__blank')
}
</script>

<style lang="scss" scoped>
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }

  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }

  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>
