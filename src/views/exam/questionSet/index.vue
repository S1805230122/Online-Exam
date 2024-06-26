<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item label="题库名称" prop="questionSetName">
            <el-input v-model="queryParams.questionSetName" clearable placeholder="请输入题库名称" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="标签名称" prop="tagName">
            <el-select
              v-model="queryParams.tagsIds"
              :max-collapse-tags="3"
              clearable
              collapse-tags
              collapse-tags-tooltip
              filterable
              multiple
              placeholder="选择标签"
              style="width: 240px"
              @change="handleQuery"
              @keyup.enter="handleQuery"
            >
              <el-option v-for="item in tagTypeOptions" :key="item.tagId" :label="item.tagName" :value="item.tagId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card class="card-content" shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:questionSet:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:questionSet:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:questionSet:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:questionSet:export']" icon="Download" plain type="warning"
                       @click="handleExport">导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery" :columns="columns"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="questionSetList" :height="tableHeight"
                @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55" />
        <el-table-column v-if="columns[0].visible" align="center" label="题库ID" prop="questionSetId" width="200" />
        <el-table-column v-if="columns[1].visible"  align="center" label="题库名称" prop="questionSetName" :show-overflow-tooltip="true"
                         width="200" />
        <el-table-column v-if="columns[2].visible" align="center" label="是否共享" prop="shareFlag" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.shareFlag==='1'" type="success">是</el-tag>
            <el-tag v-if="scope.row.shareFlag==='0'" type="danger">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[3].visible" align="center" label="题库标签" prop="tagsName" width="200">
          <template #default="scope">
            <el-tag v-if="scope.row.tagsName==='[]'" type="info">无</el-tag>
            <el-tag
              v-for="(tag,index) in scope.row.tagsName.replace(/(^\[|\]$)/g, '').split(',')"
              v-else :key="tag"
              :style="{ 'background-color': getTagColor(index+1),'color': getFontColor(index+1),'border-color': getBorderColor(index+1), 'margin-right': '5px' }"
              effect="light">
              {{ tag.trim() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[4].visible" align="center" label="题目总数" prop="questionCount.total" width="100" />
        <el-table-column v-if="columns[5].visible" align="center" label="题型统计" prop="questionCount" min-width="200" >
          <template #default="scope">
            <el-tag v-for="(item,index) in scope.row.questionCount.questionTypeCount" :key="index" type="info"
                    :style="{ 'margin-right': '5px' }">
              {{getQuestionType(item.questionType)}}:{{ item.count }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[6].visible" align="center" label="题库总分" prop="questionCount.totalScore" width="100" />
        <el-table-column v-if="columns[7].visible" align="center" label="题库描述" prop="description" :show-overflow-tooltip="true" width="200" />
        <el-table-column  fixed="right" align="center" class-name="small-padding fixed-width" label="操作" width="230">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button v-hasPermi="['exam:questionSet:query']" circle icon="View" plain type="success"
                         @click="handleView(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="模板导入" placement="top">
              <el-button v-hasPermi="['exam:questionSet:import']" circle icon="Upload" plain type="warning"
                         @click="handleImport(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['exam:questionSet:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['exam:questionSet:remove']" circle icon="Delete" plain type="danger"
                         @click="handleDelete(scope.row)"></el-button>
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
    <!--题库展示抽屉-->
    <el-drawer v-model="drawer.visible" :title="drawer.title" size="100%" class="full-drawer">
      <question-data :questionSetId="questionSetId" :drawerVisible="drawer.visible"></question-data>
    </el-drawer>


    <!-- 添加或修改题库对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="questionSetFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="题库名称" prop="questionSetName">
          <el-input v-model="form.questionSetName" placeholder="请输入题库名称" />
        </el-form-item>
        <el-form-item label="是否共享" prop="shareFlag">
          <el-switch v-model="form.shareFlag" active-value="1" inactive-value="0"></el-switch>
        </el-form-item>
        <el-form-item label="标签" prop="tagsNames">
          <el-select
            v-model="form.tagsNames"
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
          >
            <el-option v-for="item in tagTypeOptions" :key="item.tagId" :label="item.tagName"
                       :value="item.tagName">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="题库描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入内容" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
    <!-- 试题导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" append-to-body width="400px">
      <el-upload
        ref="uploadRef"
        :action="upload.url + '?updateSupport=' + upload.updateSupport + '&questionSetId=' + currentQuestionSetId"
        :auto-upload="false"
        :disabled="upload.isUploading"
        :headers="upload.headers"
        :limit="1"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        accept=".xlsx, .xls"
        drag
      >
        <el-icon class="el-icon--upload">
          <i-ep-upload-filled />
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" />
              是否更新已经存在的试题数据
            </div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link :underline="false" style="font-size:12px;vertical-align: baseline;" type="primary"
                     @click="importTemplate()">下载模板
            </el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" name="QuestionSet" setup>
import {
  addQuestionSet,
  delQuestionSet,
  getQuestionSet,
  listQuestionSet,
  updateQuestionSet
} from "@/api/exam/questionSet";
import { QuestionSetForm, QuestionSetQuery, QuestionSetVO } from "@/api/exam/questionSet/types";
import { TagTypeVO } from "@/api/exam/tagType/types";
import { optionSelect as getTagTypeOptionSelect } from "@/api/exam/tagType";
import useSettingsStore from "@/store/modules/settings";
import { getBorderColor, getFontColor, getTagColor } from "@/utils/tagColor";
import { globalHeaders } from "@/utils/request";
import { downloadTemplate } from "@/api/exam/question";
import QuestionData from "@/views/exam/questionSet/data.vue";

import saveAs from "file-saver";

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const settingsStore = useSettingsStore();
const needTagsView = computed(() => settingsStore.tagsView);
const questionSetList = ref<QuestionSetVO[]>([]);
const questionSetId = ref<string>("");
const drawerTableHeight=ref(0)
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const questionSetFormRef = ref<ElFormInstance>();
const tagTypeOptions = ref<TagTypeVO[]>([]);
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});
const drawer = reactive<DrawerOption>({
  visible: false,
  title: ""
});
const initFormData: QuestionSetForm = {
  questionSetId: undefined,
  questionSetName: undefined,
  bankConfig: undefined,
  shareFlag: undefined,
  tagsIds: undefined,
  tagsNames: undefined,
  questionCount: undefined,
  totalScore: undefined,
  description: undefined,
  remark: undefined
};
const data = reactive<PageData<QuestionSetForm, QuestionSetQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    questionSetName: undefined,
    bankConfig: undefined,
    shareFlag: undefined,
    tagsIds: undefined,
    tagsNames: undefined,
    questionCount: undefined,
    totalScore: undefined,
    description: undefined,
    params: {}
  },
  rules: {
    questionSetName: [
      { required: true, message: "题库名称不能为空", trigger: "blur" }
    ]
  }
});

// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: `题库ID`, visible: false, children: [] },
  { key: 1, label: `题库名称`, visible: true, children: [] },
  { key: 2, label: `是否共享`, visible: true, children: [] },
  { key: 3, label: `题库标签`, visible: true, children: [] },
  { key: 4, label: `题目总数`, visible: true, children: [] },
  { key: 5, label: `题型统计`, visible: true, children: [] },
  { key: 6, label: `题库总分`, visible: true, children: [] },
  { key: 7, label: "题库描述", visible: false, children: [] },
]);

const { queryParams, form, rules } = toRefs(data);

/** 查询题库列表 */
const getList = async () => {
  loading.value = true;
  const res = await listQuestionSet(queryParams.value);
  questionSetList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/*处理题型*/
const getQuestionType = (questionType: string) => {
  if (questionType === "Radio"){
    return "单选题";
  }
  if (questionType === "Checkbox"){
    return "多选题";
  }
  if (questionType === "TrueFalse"){
    return "判断题";
  }
  if (questionType === "Textarea"){
    return "简答题";
  }
  if (questionType === "MultipleBlank"){
    return "填空题";
  }
}

/** 查询标签类型下拉列表 */
const getTagTypeList = async () => {
  const res = await getTagTypeOptionSelect("questionSet");
  tagTypeOptions.value = res.data;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  questionSetFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.tagsIds = undefined;
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: QuestionSetVO[]) => {
  ids.value = selection.map(item => item.questionSetId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/*详细按钮操作*/
const handleView = (row: QuestionSetVO) => {
  questionSetId.value = "";
  drawer.visible = true;
  drawer.title = "题目管理";
  questionSetId.value = row.questionSetId;
  calculateDrawerTableHeight()
};

/*导入按钮操作*/
const currentQuestionSetId = ref();
const handleImport = (row: QuestionSetVO) => {
  currentQuestionSetId.value = row.questionSetId;
  upload.title = "试题导入";
  upload.open = true;
};

/*** 试题导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（试题导入）
  open: false,
  // 弹出层标题（用户导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/exam/questionSet/importData"
});
/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};
const uploadRef = ref<ElUploadInstance>();
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
  getList();
};

/** 下载模板操作 */
const importTemplate = () => {
  const res = downloadTemplate("题库导入模板");
  res.then(blob => {
    // 使用 FileSaver.js 提供的 saveAs 函数来下载文件
    saveAs(blob, `题库导入模板_${new Date().getTime()}.xlsx`);
  });

  // download(res[Symbol.toStringTag], "题库导入模板", "blob")
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加题库";
};

/** 修改按钮操作 */
const handleUpdate = async (row?: QuestionSetVO) => {
  reset();
  const _questionSetId = row?.questionSetId || ids.value[0];
  const res = await getQuestionSet(_questionSetId);
  Object.assign(form.value, res.data);
  if (form.value.tagsName !== "[]") {
    form.value.tagsNames = form.value.tagsName
      .replace(/(^\[|\]$)/g, "") // 去除两端的方括号
      .replace(/,\s*/g, ",")    // 去除元素之间的多余空格
      .split(",")               // 按逗号分割字符串
      .map((tag: string) => tag.trim());  // 去除每个元素的前后空格
  }
  dialog.visible = true;
  dialog.title = "修改题库";
};
/** 提交按钮 */
const submitForm = () => {
  questionSetFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.questionSetId) {
        await updateQuestionSet(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addQuestionSet(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: QuestionSetVO) => {
  const _questionSetIds = row?.questionSetId || ids.value;
  await proxy?.$modal.confirm("是否确认删除题库编号为\"" + _questionSetIds + "\"的数据项？").finally(() => loading.value = false);
  await delQuestionSet(_questionSetIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("exam/questionSet/export", {
    ...queryParams.value
  }, `questionSet_${new Date().getTime()}.xlsx`);
};

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight);
const tableHeight = ref<number | string>(0);
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}
/*获取抽屉表格高度*/
const calculateDrawerTableHeight = () => {
  drawerTableHeight.value=screenHeight.value-40-40-86
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
  getTagTypeList();
  getList();
});
</script>
<style lang="scss" scoped>

</style>
