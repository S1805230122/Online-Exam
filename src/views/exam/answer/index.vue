<template>
  <div class="main-content" :class="{ hasTagsView: needTagsView }">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch" ref="searchContainer">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
          <el-form-item label="试卷ID" prop="paperId">
            <el-input v-model="queryParams.paperId" placeholder="请输入试卷ID" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="用户ID" prop="userId">
            <el-input v-model="queryParams.userId" placeholder="请输入用户ID" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="暂存答案" prop="tempAnswer">
            <el-input v-model="queryParams.tempAnswer" placeholder="请输入暂存答案" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="答案" prop="answer">
            <el-input v-model="queryParams.answer" placeholder="请输入答案" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="试卷数据" prop="metaInfo">
            <el-input v-model="queryParams.metaInfo" placeholder="请输入试卷数据" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="0暂存 1已完成" prop="tempSave">
            <el-input v-model="queryParams.tempSave" placeholder="请输入0暂存 1已完成" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="考试信息" prop="examInfo">
            <el-input v-model="queryParams.examInfo" placeholder="请输入考试信息" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
          <el-form-item label="考试分数" prop="examScore">
            <el-input v-model="queryParams.examScore" placeholder="请输入考试分数" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery" />
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card shadow="never" class="card-content">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['exam:answer:add']">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
                       v-hasPermi="['exam:answer:edit']">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"
                       v-hasPermi="['exam:answer:remove']">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['exam:answer:export']">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @resetQuery="resetQuery" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="answerList" @selection-change="handleSelectionChange" :height="tableHeight">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="" align="center" prop="id" v-if="true" />
        <el-table-column label="试卷ID" align="center" prop="paperId" />
        <el-table-column label="用户ID" align="center" prop="userId" />
        <el-table-column label="试卷内容" align="center" prop="paperContent" />
        <el-table-column label="暂存答案" align="center" prop="tempAnswer" />
        <el-table-column label="答案" align="center" prop="answer" />
        <el-table-column label="试卷数据" align="center" prop="metaInfo" />
        <el-table-column label="0暂存 1已完成" align="center" prop="tempSave" />
        <el-table-column label="考试信息" align="center" prop="examInfo" />
        <el-table-column label="考试练习类型" align="center" prop="examExerciseType" />
        <el-table-column label="考试分数" align="center" prop="examScore" />
        <el-table-column label="备注信息" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button circle plain type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                         v-hasPermi="['exam:answer:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button circle plain type="danger" icon="Delete" @click="handleDelete(scope.row)"
                         v-hasPermi="['exam:answer:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <div class="page-content">
      <pagination
        v-show="total>0"
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNum"
        :total="total"
        @pagination="getList"
      />
    </div>
    <!-- 添加或修改答题对话框 -->
    <el-drawer :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="answerFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="试卷ID" prop="paperId">
          <el-input v-model="form.paperId" placeholder="请输入试卷ID" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="试卷内容">
          <editor v-model="form.paperContent" :min-height="192" />
        </el-form-item>
        <el-form-item label="暂存答案" prop="tempAnswer">
          <el-input v-model="form.tempAnswer" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="答案" prop="answer">
          <el-input v-model="form.answer" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="试卷数据" prop="metaInfo">
          <el-input v-model="form.metaInfo" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="0暂存 1已完成" prop="tempSave">
          <el-input v-model="form.tempSave" placeholder="请输入0暂存 1已完成" />
        </el-form-item>
        <el-form-item label="考试信息" prop="examInfo">
          <el-input v-model="form.examInfo" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="考试分数" prop="examScore">
          <el-input v-model="form.examScore" placeholder="请输入考试分数" />
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup name="Answer" lang="ts">
import { addAnswer, delAnswer, getAnswer, listAnswer, updateAnswer } from "@/api/exam/answer";
import { AnswerForm, AnswerQuery, AnswerVO } from "@/api/exam/answer/types";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore();
const needTagsView = computed(() => settingsStore.tagsView);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const answerList = ref<AnswerVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const answerFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null);
const initFormData: AnswerForm = {
  id: undefined,
  paperId: undefined,
  userId: undefined,
  paperContent: undefined,
  tempAnswer: undefined,
  answer: undefined,
  metaInfo: undefined,
  tempSave: undefined,
  examInfo: undefined,
  examExerciseType: undefined,
  examScore: undefined,
  remark: undefined
};
const data = reactive<PageData<AnswerForm, AnswerQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    paperId: undefined,
    userId: undefined,
    paperContent: undefined,
    tempAnswer: undefined,
    answer: undefined,
    metaInfo: undefined,
    tempSave: undefined,
    examInfo: undefined,
    examExerciseType: undefined,
    examScore: undefined,
    params: {}
  },
  rules: {
    id: [
      { required: true, message: "不能为空", trigger: "blur" }
    ],
    paperId: [
      { required: true, message: "试卷ID不能为空", trigger: "blur" }
    ],
    userId: [
      { required: true, message: "用户ID不能为空", trigger: "blur" }
    ],
    paperContent: [
      { required: true, message: "试卷内容不能为空", trigger: "blur" }
    ],
    tempAnswer: [
      { required: true, message: "暂存答案不能为空", trigger: "blur" }
    ],
    answer: [
      { required: true, message: "答案不能为空", trigger: "blur" }
    ],
    metaInfo: [
      { required: true, message: "试卷数据不能为空", trigger: "blur" }
    ],
    tempSave: [
      { required: true, message: "0暂存 1已完成不能为空", trigger: "blur" }
    ],
    examInfo: [
      { required: true, message: "考试信息不能为空", trigger: "blur" }
    ],
    examExerciseType: [
      { required: true, message: "考试练习类型不能为空", trigger: "change" }
    ],
    examScore: [
      { required: true, message: "考试分数不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询答题列表 */
const getList = async () => {
  loading.value = true;
  const res = await listAnswer(queryParams.value);
  answerList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  answerFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: AnswerVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加答题";
};

/** 修改按钮操作 */
const handleUpdate = async (row?: AnswerVO) => {
  reset();
  const _id = row?.id || ids.value[0];
  const res = await getAnswer(_id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改答题";
};

/** 提交按钮 */
const submitForm = () => {
  answerFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateAnswer(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addAnswer(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: AnswerVO) => {
  const _ids = row?.id || ids.value;
  await proxy?.$modal.confirm("是否确认删除答题编号为\"" + _ids + "\"的数据项？").finally(() => loading.value = false);
  await delAnswer(_ids);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("exam/answer/export", {
    ...queryParams.value
  }, `answer_${new Date().getTime()}.xlsx`);
};

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight);
const tableHeight = ref<number | string>(0);
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}

const calculateTableHeight = () => {
  const searchHeight = showSearch.value ? ref(height.value) : ref(-12); // 搜索栏的高度
  const tagsViewHeight = needTagsView.value ? ref(34) : ref(0);
  tableHeight.value = screenHeight.value - 50 - tagsViewHeight.value - 26 - searchHeight.value - 170;
};
watch(showSearch, () => {
  calculateTableHeight();
});
/*响应式监听*/
watchEffect(() => {
  calculateTableHeight();
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

onMounted(() => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  window.addEventListener("resize", handleResize);
  calculateTableHeight();
  getList();
});
</script>
<style lang="scss" scoped>
.el-table {
  transition: height 0.3s ease-in-out;
}
</style>
