<script setup lang="ts">
import useUserStore from "@/store/modules/user";
import {listPaperByUserId} from "@/api/exam/paper";
import {PaperVO} from "@/api/exam/paper/types";

const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {
  exam_paper_status
} = toRefs<any>(proxy?.useDict("exam_paper_status"));

const userStore = useUserStore();
const params = ref({
  userId: userStore.userId,
  pageNum: 1,
  pageSize: 20
})
const paperList = ref<PaperVO[]>([])
const getPaperList = async () => {
  const res = await listPaperByUserId(params.value);
  paperList.value = res.rows.filter(item => item.status === '1');
}

onMounted(async () => {
  await getPaperList()
})
</script>

<template>
  <el-card  v-if="paperList.length>0" shadow="hover" class="mb-4">
    <div class="mb-2 card-title"><el-text tag="b">活跃题目集</el-text></div>
    <el-row :gutter="12">
      <el-col :span="12" v-for="item in paperList" :key="item.paperId">
        <router-link :to="'/exam/answer/data/' + item.paperId">
          <el-card shadow="hover">
            <div class="flex justify-between">
              <div>
                <el-text size="large">{{ item.paperName }}</el-text>
                <div v-if="item.paperSettingObj.examSetting.endTime" class="mt-2">
                  <el-text type="info">{{ item["paperSettingObj"]["examSetting"]["endTime"] }}</el-text>
                </div>
              </div>

              <dict-tag :value="item.status" :options="exam_paper_status"/>
            </div>

          </el-card>
        </router-link>
      </el-col>
    </el-row>


  </el-card>
</template>

<style scoped lang="scss">

</style>
