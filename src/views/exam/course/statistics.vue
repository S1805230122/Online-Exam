<script setup lang="ts">
import {getCourse} from "@/api/exam/course";
import {PaperForm, PaperQuery, PaperVO} from "@/api/exam/paper/types";
import {listPaper, paperOptionSelect} from "@/api/exam/paper";
import {listBinding} from "@/api/exam/binding";
import {listPapersAnswer} from "@/api/exam/answer";
/*导出数据*/
import * as XLSX from "xlsx";
import {saveAs} from "file-saver";
import defAva from "@/assets/images/profile.jpg";

const route = useRoute();
const defaultCourseId = ref();
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
  form: {...initFormData},
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
      {required: true, message: "试卷ID不能为空", trigger: "blur"}
    ],
    courseId: [
      {required: true, message: "课程ID不能为空", trigger: "blur"}
    ],
    clazzId: [
      {required: true, message: "班级ID不能为空", trigger: "blur"}
    ],
    paperName: [
      {required: true, message: "试卷名称不能为空", trigger: "blur"}
    ],
    paperMode: [
      {required: true, message: "试卷类型不能为空", trigger: "blur"}
    ],
    paperContent: [
      {required: true, message: "试卷内容不能为空", trigger: "blur"}
    ],
    status: [
      {required: true, message: "状态不能为空", trigger: "change"}
    ],
    paperSetting: [
      {required: true, message: "试卷配置不能为空", trigger: "blur"}
    ]
  }
});
const {queryParams, form, rules} = toRefs(data);

const courseInfo = ref<any>(null);
const getCourseInfo = async (courseId: string) => {
  loading.value = true;
  const res = await getCourse(courseId);
  queryParams.value.courseId = res.data.courseId;
  courseInfo.value = res.data;
  defaultCourseId.value = res.data.courseId;

  await getBindingList();
  await getPaperList();
  /*提取获得的试卷列表的paperId*/
  let paperIds: (string | number)[] = [];
  paperList.value.forEach(item => {
    paperIds.push(item.paperId);
  });
  answerParams.value.papersList = paperIds;

  await getAnswerList();
  loading.value = false;
};
/** 查询试卷列表 */
const loading = ref(true);
const paperList = ref<PaperVO[]>([]);
const total = ref(0);
const getPaperList = async () => {
  const res = await listPaper(queryParams.value);
  paperList.value = res.rows;
};

/*获取学生列表*/
const queryBindingParams = ref<any>({
  pageNum: 1,
  pageSize: 20,
  clazzId: undefined,
  bindingType: null
})
const bindingList = ref<any[]>([]);
const getBindingList = async () => {
  queryBindingParams.value.clazzId = courseInfo.value.clazzId;
  const res = await listBinding(queryBindingParams.value)
  bindingList.value = res.rows;
  total.value = res.total;
}
/*根据试卷列表查询答卷列表*/
const answerList = ref();
const answerParams = ref<any>({
  papersList: null,
});
const getAnswerList = async () => {
  const res = await listPapersAnswer(answerParams.value)
  answerList.value = res.data;
}

/*根据用户id获取试卷成绩*/
const getPaperScore = (paperId: string | number, id: string | number) => {
  const answer = answerList.value.find((item: any) => item.paperId === paperId && item.userId === id);
  if (answer) {
    return answer.examScore;
  } else {
    return 0;
  }
}
const getPaperName = (paperId: string | number) => {
  const paper = paperListOptions.value.find((item: any) => item.paperId === paperId);
  if (paper) {
    return paper.paperName;
  } else {
    return '';
  }
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  /*防止参数为空*/
  if (answerParams.value.papersList.length > 0) {
    getAnswerList()
  }
};
/*获取试卷选择框列表*/
const paperListOptions = ref();
const getPaperListOptions = async () => {
  const res = await paperOptionSelect(queryParams.value);
  paperListOptions.value = res.data;
  answerParams.value.papersList = res.data.map((item: any) => item.paperId);
}

/*百分制按钮操作*/
const percentageFlag = ref(false);
const handlePercentage = () => {
  percentageFlag.value = !percentageFlag.value;
}
/*将分数转化为百分制*/
const getPercentage = (score: number, paperId: number) => {
  let totalScore = paperListOptions.value.find((item: any) => item.paperId === paperId).paperContentObj.attribute.examScore;
  if (percentageFlag.value) {
    return ((score / totalScore) * 100).toFixed(1);
  } else {
    return score;
  }
}


const exportToExcel = () => {
// 准备数据
  const data = bindingList.value.map(row => {
    const rowData: any = {
      '学号': row.binding,
      '姓名': row.name
    };
    answerParams.value.papersList.forEach((item: any) => {
      rowData[getPaperName(item)] = getPercentage(getPaperScore(item, row.userId), item);
    });
    return rowData;
  });

  // 转换为工作表
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 创建新的工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // 生成 Excel 文件
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  // 保存文件
  const blob = new Blob([excelBuffer], {type: 'application/octet-stream'});
  saveAs(blob, 'table-data.xlsx');
}


onMounted(async () => {
  await getCourseInfo(route.params && route.params.courseId as string);
  await getPaperListOptions()
});
</script>

<template>
  <div class="main-content-body">
    <el-card v-if="courseInfo!==null" class="course-info mb-2">
      <el-row>
        <el-col :span="12">
          <h2>
            {{ courseInfo["courseName"] }}
          </h2>
          <div class="mt-2">
            <span v-if="courseInfo.remark===null||courseInfo.remark===''">无描述</span>
            <span v-else>{{ courseInfo["remark"] }}</span>
          </div>
          <div class="mt-3"><b>学生成绩列表</b></div>
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
    <div ref="searchContainer" class="search flex justify-between">
      <el-form ref="queryFormRef" :inline="true" :model="queryParams">
        <el-form-item label="试卷名称" prop="paperId">
          <el-select v-show="paperListOptions" v-model="answerParams.papersList" filterable style="width: 500px"
                     @change="handleQuery" clearable multiple :multiple-limit="3">
            <el-option v-for="item in paperListOptions" :key="item.paperId" :label="item.paperName"
                       :value="item.paperId">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div>
        <el-tooltip content="百分制">
          <el-button plain round v-if="!percentageFlag">
            <svg-icon icon-class="percentage" @click="handlePercentage()"/>
          </el-button>
          <el-button plain round type="primary" v-if="percentageFlag">
            <svg-icon icon-class="percentage" @click="handlePercentage()"/>
          </el-button>
        </el-tooltip>
        <el-button plain round type="warning" class="float-right" @click="exportToExcel">
          <svg-icon icon-class="export" class="mr-4"/>
          导出数据
        </el-button>
      </div>
    </div>
    <el-card class="card-content" style="overflow-y: auto">
      <el-table :data="bindingList" v-loading="loading">
        <el-table-column label="学号" prop="binding" align="center" min-width="200"/>
        <el-table-column label="姓名" prop="name" align="center" min-width="150"/>
        <el-table-column v-for="(item,index) in answerParams.papersList" :key="index"
                         :label="getPaperName(item)" prop="examScore"
                         align="center" min-width="100">
          <template #default="scope">
            {{ getPercentage(getPaperScore(item, scope.row.userId), item) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <div class="page-content">
      <pagination
        v-show="total>0"
        v-model:limit="queryBindingParams.pageSize"
        v-model:page="queryBindingParams.pageNum"
        :total="total"
        @pagination="getBindingList"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-avatar {
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.search .el-form .el-form-item {
  margin: 0;
}

.search .el-form .el-form-item--default {
  margin: 0;
}
</style>
