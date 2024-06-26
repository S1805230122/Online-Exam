<script lang="ts" setup>
import { listPaper } from "@/api/exam/paper";
import { PaperForm, PaperQuery, PaperVO } from "@/api/exam/paper/types";
import { getCourse } from "@/api/exam/course";
import defAva from '@/assets/images/profile.jpg';
const route = useRoute();
const loading = ref(true);
const paperList = ref<PaperVO[]>([]);
const total = ref(0);
const defaultCourseId = ref();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const {
  exam_paper_status
} = toRefs<any>(proxy?.useDict("exam_paper_status"));
const initFormData: PaperForm = {
  paperId: undefined,
  courseId: undefined,
  clazzId: undefined,
  paperName: undefined,
  paperContentObj: undefined,
  paperMode: undefined,
  status: undefined,
  paperSettingObj: undefined,
  remark: undefined
};
const data = reactive<PageData<PaperForm, PaperQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    courseId: defaultCourseId.value,
    clazzId: undefined,
    paperName: undefined,
    paperMode: undefined,
    paperContentObj: undefined,
    status: undefined,
    paperSettingObj: undefined,
    params: {}
  },
  rules: {
    paperId: [
      { required: true, message: "试卷ID不能为空", trigger: "blur" }
    ],
    courseId: [
      { required: true, message: "课程ID不能为空", trigger: "blur" }
    ],
    clazzId: [
      { required: true, message: "班级ID不能为空", trigger: "blur" }
    ],
    paperName: [
      { required: true, message: "试卷名称不能为空", trigger: "blur" }
    ],
    paperMode: [
      { required: true, message: "试卷类型不能为空", trigger: "blur" }
    ],
    paperContent: [
      { required: true, message: "试卷内容不能为空", trigger: "blur" }
    ],
    status: [
      { required: true, message: "状态不能为空", trigger: "change" }
    ],
    paperSetting: [
      { required: true, message: "试卷配置不能为空", trigger: "blur" }
    ]
  }
});
const { queryParams, form, rules } = toRefs(data);
const courseInfo = ref<any>(null);
const getCourseInfo = async (courseId: string) => {
  const res = await getCourse(courseId);
  queryParams.value.courseId = res.data.courseId;
  courseInfo.value = res.data;
  defaultCourseId.value = res.data.courseId;
  console.log(res.data);
  await getPaperList();
};

/** 查询试卷列表 */
const getPaperList = async () => {
  loading.value = true;
  const res = await listPaper(queryParams.value);
  paperList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

onMounted(async () => {
  await getCourseInfo(route.params && route.params.courseId as string);
});
</script>

<template>
  <div class="main-content-body">
    <el-card v-if="courseInfo!==null" class="course-info">
      <el-row>
        <el-col :span="12">
          <h2>
            {{ courseInfo["courseName"] }}
          </h2>
          <div class="mt-2">
            <span v-if="courseInfo.remark===null||courseInfo.remark===''">无描述</span>
            <span v-else>{{ courseInfo["remark"] }}</span>
          </div>
          <div class="mt-3"><b>题目集列表</b></div>
        </el-col>
        <el-col :span="6" :push="6">
          <el-descriptions
            :column="3"
            direction="vertical"
          >
            <el-descriptions-item label="授课教师">
              <div style="width: 100px;" class="flex justify-between items-center">
                <img :src="courseInfo.user.avatar == '' || courseInfo.user.avatar == null ? defAva :  courseInfo.user.avatar" class="user-avatar" alt="" />
                <span>{{ courseInfo["user"]["userName"] }}</span>
              </div>

            </el-descriptions-item>
            <el-descriptions-item label="班级人数">{{ courseInfo["memberCount"] }}</el-descriptions-item>
            <el-descriptions-item label="题目集数">{{ total }}</el-descriptions-item>
          </el-descriptions>

        </el-col>
      </el-row>


    </el-card>
    <el-scrollbar>
      <div class="card-content">
        <el-card v-loading="loading" v-for="(item, index) in paperList" :key="index" class="mt-1 paper-list">
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
                    <dict-tag :options="exam_paper_status" :value="item.status" />
                  </div>
                  <div class="mt-2" style="font-size: 14px">
                    <svg-icon icon-class="school" />
                    <span class="ml-1">{{ item["dept"]["deptName"] }}</span>
                    <svg-icon icon-class="user" class="ml-2" />
                    <span class="ml-1">{{ item["user"]["userName"] }}</span>
                  </div>
                </div>

              </el-col>
            </el-row>
          </router-link>

        </el-card>
      </div>
    </el-scrollbar>
    <div class="page-content">
      <pagination
        v-show="total>0"
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNum"
        :total="total"
        @pagination="getPaperList"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.course-info {
  height: 12rem;
  margin-bottom: 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-overlay);
  padding: 0.25rem;
  transition: all ease 0.3s;

  &:hover {
    box-shadow: 0 2px 12px #0000001a;
    transition: all ease 0.3s;
  }
}

.paper-list {
}

.paper-list:hover {
  border: 1px solid var(--el-color-primary);
  box-shadow: 0 2px 12px #0000001a;
}

.user-avatar {
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

</style>
