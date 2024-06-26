<script setup lang="ts">
import useUserStore from "@/store/modules/user";
import {PaperVO} from "@/api/exam/paper/types";
import {listPaperByUserId} from "@/api/exam/paper";

const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {
  exam_paper_status
} = toRefs<any>(proxy?.useDict("exam_paper_status"));
const questionSetFlag=ref('Active')
const userStore = useUserStore();
const loading = ref(false)
const total = ref(0)
const params = ref({
  userId: userStore.userId,
  pageNum: 1,
  pageSize: 20
})
const paperList = ref<PaperVO[]>([])
const getPaperList = async () => {
  loading.value = true;
  const res = await listPaperByUserId(params.value);
  paperList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}


onMounted(async () => {
  await getPaperList()
})
</script>

<template>
  <div class="main-content-body">
    <el-tabs class="w-300px" v-model="questionSetFlag" stretch>
      <el-tab-pane name="Active" label="活跃题目集"></el-tab-pane>
      <el-tab-pane name="All" label="全部题目集"></el-tab-pane>
    </el-tabs>
    <div class="card-content">
      <el-scrollbar>
        <div v-if="questionSetFlag==='Active'">
          <el-card v-loading="loading" v-for="item in paperList.filter(item => item.status === '1')"  class="mt-2 paper-list">
            <router-link :to="'/exam/answer/data/' + item.paperId">
              <el-row>
                <el-col :span="12">
                  <div class="flex items-center">
                    <div v-if="item.paperSettingObj.examSetting.randomPaper">
                      <svg-icon icon-class="random" color="var(--el-color-primary)" style="font-size: 1.25rem;"/>
                    </div>
                    <div v-else>
                      <svg-icon icon-class="nonrandom" color="var(--el-color-primary)" style="font-size: 1.25rem;"/>
                    </div>
                    <div class="ml-5">
                      <div>{{ item.paperName }}</div>
                      <div style="font-size: 14px;color: rgb(0 0 0 / 0.5)" class="mt-2 ">开始时间:
                        {{ item["paperSettingObj"]["examSetting"]["startTime"] }}
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="flex flex-col items-end">
                    <div>
                      <dict-tag :options="exam_paper_status" :value="item.status"/>
                    </div>
                    <div class="mt-2" style="font-size: 14px">
                      <svg-icon icon-class="school"/>
                      <span class="ml-1">{{ item["dept"]["deptName"] }}</span>
                      <svg-icon icon-class="user" class="ml-2"/>
                      <span class="ml-1">{{ item["user"]["userName"] }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </router-link>
          </el-card>
          <el-empty v-if="paperList.filter(item => item.status === '1').length===0" description="无数据" />
        </div>
        <div v-if="questionSetFlag==='All'">
          <el-card v-loading="loading" v-for="item in paperList"  class="mt-2 paper-list">
            <router-link :to="'/exam/answer/data/' + item.paperId">
              <el-row>
                <el-col :span="12">
                  <div class="flex items-center">
                    <div v-if="item.paperSettingObj.examSetting.randomPaper">
                      <svg-icon icon-class="random" color="var(--el-color-primary)" style="font-size: 1.25rem;"/>
                    </div>
                    <div v-else>
                      <svg-icon icon-class="nonrandom" color="var(--el-color-primary)" style="font-size: 1.25rem;"/>
                    </div>
                    <div class="ml-5">
                      <div>{{ item.paperName }}</div>
                      <div style="font-size: 14px;color: rgb(0 0 0 / 0.5)" class="mt-2 ">开始时间:
                        {{ item["paperSettingObj"]["examSetting"]["startTime"] }}
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="flex flex-col items-end">
                    <div>
                      <dict-tag :options="exam_paper_status" :value="item.status"/>
                    </div>
                    <div class="mt-2" style="font-size: 14px">
                      <svg-icon icon-class="school"/>
                      <span class="ml-1">{{ item["dept"]["deptName"] }}</span>
                      <svg-icon icon-class="user" class="ml-2"/>
                      <span class="ml-1">{{ item["user"]["userName"] }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </router-link>
          </el-card>
          <el-empty v-if="paperList.length===0" description="无数据" />
        </div>
      </el-scrollbar>

    </div>
    <div class="page-content">
      <pagination
        v-show="total>0"
        v-model:limit="params.pageSize"
        v-model:page="params.pageNum"
        :total="total"
        @pagination="getPaperList"
      />
    </div>
  </div>

</template>

<style scoped lang="scss">

</style>
