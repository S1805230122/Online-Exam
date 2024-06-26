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
  paperList.value = res.rows;
}

/*根据试卷状态获取节点颜色*/
const getItemColor = (status: string) => {
  if (status==='1'){
    return 'rgb(103,194,58)'
  }
  if (status==='2'){
    return 'rgb(245,108,108)'
  }
}

onMounted(async () => {
  await getPaperList()
})
</script>

<template>
  <el-card shadow="hover" class="h-83vh" style="overflow-y: auto">
    <div class="mb-2 card-title"><el-text tag="b">时间线</el-text></div>
    <el-timeline>
      <el-timeline-item placement="top" :color="getItemColor(item.status)" v-for="item in paperList"
                        :timestamp="item.paperSettingObj.examSetting.startTime">
        <el-card shadow="hover">
          <div class="flex justify-between">
            <el-text size="large" class="w-30" truncated>{{ item.paperName }}</el-text>
            <dict-tag :value="item.status" :options="exam_paper_status"/>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="paperList.length===0" description="无数据" />
  </el-card>
</template>

<style scoped lang="scss">

</style>
