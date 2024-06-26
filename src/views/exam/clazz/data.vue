<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item v-if="displayValue" label="班级名称" prop="clazzId">
            <el-select v-model="queryParams.clazzId" filterable style="width: 200px" @change="handleQuery">
              <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="学号" prop="binding">
            <el-input v-model="queryParams.binding" clearable placeholder="请输入学号" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="queryParams.name" clearable placeholder="请输入姓名" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card class="card-content" shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:binding:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:binding:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:binding:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">删除
            </el-button>
          </el-col>

          <el-col :span="1.5">
            <el-dropdown class="mt-[1px]">
              <el-button plain type="info">
                更多
                <el-icon class="el-icon--right">
                  <arrow-down/>
                </el-icon
                >
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item icon="Download" @click="importTemplate">下载模板</el-dropdown-item>
                  <el-dropdown-item icon="Top" @click="handleImport"> 导入数据</el-dropdown-item>
                  <el-dropdown-item icon="Download" @click="handleExport"> 导出数据</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:binding:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="clazzDataList" :height="tableHeight"
                @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column align="center" label="姓名" prop="name"/>
        <el-table-column align="center" label="学号" prop="binding"/>
        <el-table-column align="center" label="账号绑定状态" min-width="80" prop="userId">
          <template #default="scope">
            <el-tag v-if="scope.row.userId!=null" type="success">
              已绑定
            </el-tag>
            <el-tag v-if="scope.row.userId==null" type="info">
              未绑定
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="班级名称" prop="clazz.clazzName"/>
        <el-table-column align="center" label="头像" prop="user.avatar">
          <template #default="scope">
            <ImagePreview
              :height="60"
              :preview-src-list="[scope.row.user.avatar]"
              :src="scope.row.user.avatar"
              :width="60"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="部门名称" prop="dept.deptName"/>
        <el-table-column align="center" label="备注信息" prop="remark"/>
        <el-table-column align="center" class-name="small-padding fixed-width" fixed="right" label="操作" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['exam:binding:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['exam:binding:remove']" circle icon="Delete" plain type="danger"
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
    <!-- 添加或修改绑定对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="bindingFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="学号" prop="binding">
          <el-input v-model="form.binding" placeholder="请输入学号"/>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名"/>
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入内容" type="textarea"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 用户导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" append-to-body width="400px">
      <el-upload
        ref="uploadRef"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
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
          <i-ep-upload-filled/>
        </el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport"/>
              是否更新已经存在的用户数据
            </div>
            <span>仅允许导入xls、xlsx格式文件。</span>
            <el-link :underline="false" style="font-size:12px;vertical-align: baseline;" type="primary"
                     @click="importTemplate">下载模板
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

<script lang="ts" name="Binding" setup>
import {addBinding, delBinding, getBinding, listBinding, updateBinding} from '@/api/exam/binding';
import {BindingForm, BindingQuery, BindingVO} from '@/api/exam/binding/types';
import useSettingsStore from "@/store/modules/settings";
import useUserStore from "@/store/modules/user"
import {globalHeaders} from "@/utils/request";
import {getClazz, optionSelect as getClazzOptionSelect} from "@/api/exam/clazz";
import {optionSelect as getDeptOptionSelect} from '@/api/system/dept'
import {ClazzVO} from "@/api/exam/clazz/types";
import ImagePreview from "@/components/ImagePreview/index.vue";
import {DeptVO} from "@/api/system/dept/types";
import {ElMessageBox} from "element-plus";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;

const clazzDataList = ref<BindingVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
/*是否显示部门搜索*/
const isDisplay = ref(false);
const total = ref(0);
const defaultClazz = ref();
const defaultDept = ref();
const queryFormRef = ref<ElFormInstance>();
const bindingFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const clazzOptions = ref<ClazzVO[]>([]);
const deptOptions = ref<DeptVO[]>([]);
const route = useRoute();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)
/*** 学生信息导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（学生信息导入）
  open: false,
  // 弹出层标题（学生信息导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/exam/binding/importData"
})
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: BindingForm = {
  bindingId: undefined,
  binding: undefined,
  userId: undefined,
  clazzId: undefined,
  bindingType: '0',
  deptId: undefined,
  name: undefined,
  remark: undefined
}
const data = reactive<PageData<BindingForm, BindingQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    binding: undefined,
    userId: undefined,
    deptId: undefined,
    clazzId: undefined,
    bindingType: '0',
    name: undefined,
    params: {}
  },
  rules: {
    binding: [
      {required: true, message: "学号不能为空", trigger: "blur"}
    ],
    name: [
      {required: true, message: "姓名不能为空", trigger: "blur"}
    ],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询班级详细 */
const getClazzs = async (clazzId: string | number) => {
  const {data} = await getClazz(clazzId);
  queryParams.value.clazzId = data.clazzId;
  queryParams.value.deptId = data.deptId;
  defaultClazz.value = data.clazzId;
  defaultDept.value = data.deptId;
  await getList();
}
/** 查询班级列表 */
const getClazzList = async () => {
  const res = await getClazzOptionSelect()
  clazzOptions.value = res.data;
}
/** 查询部门列表 */
const getDeptList = async () => {
  const res = await getDeptOptionSelect()
  deptOptions.value = res.data;
}

/** 查询绑定列表 */
const getList = async () => {
  loading.value = true;
  const res = await listBinding(queryParams.value);
  clazzDataList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  bindingFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.clazzId = defaultClazz.value;
  queryParams.value.deptId = defaultDept.value;
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: BindingVO[]) => {
  ids.value = selection.map(item => item.bindingId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加绑定";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: BindingVO) => {
  reset();
  const _bindingId = row?.bindingId || ids.value[0]
  const res = await getBinding(_bindingId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改绑定";
}

/** 提交按钮 */
const submitForm = () => {
  bindingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.bindingId) {
        await updateBinding(form.value).finally(() => buttonLoading.value = false);
      } else {
        /*将当前班级ID和部门ID设置到表单*/
        form.value.clazzId = defaultClazz.value;
        form.value.deptId = defaultDept.value;
        await addBinding(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: BindingVO) => {
  const _bindingIds = row?.bindingId || ids.value;
  await proxy?.$modal.confirm('是否确认删除绑定编号为"' + _bindingIds + '"的数据项？').finally(() => loading.value = false);
  await delBinding(_bindingIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导入按钮操作 */
const handleImport = () => {
  upload.title = "学生信息导入";
  upload.open = true;
}
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download("exam/binding/importTemplate", {}, `账号绑定模板_${new Date().getTime()}.xlsx`);
}

/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
}
/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", {dangerouslyUseHTMLString: true});
  getList();
}

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('exam/binding/export', {
    ...queryParams.value
  }, `binding_${new Date().getTime()}.xlsx`)
}

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight)
const tableHeight = ref<number | string>(0)
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}

const calculateTableHeight = () => {
  const searchHeight = showSearch.value ? ref(height.value) : ref(-12); // 搜索栏的高度
  const tagsViewHeight = needTagsView.value ? ref(34) : ref(0);
  tableHeight.value = screenHeight.value - 50 - tagsViewHeight.value - 26 - searchHeight.value - 170
}
watch(showSearch, () => {
  calculateTableHeight()
});
/*响应式监听*/
watchEffect(() => {
  calculateTableHeight()
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// 根据当前用户权限显示搜索
const roles = computed(() => useUserStore().roles);
const displayValue = computed({
  get() {
    // 当roles包含'superadmin'或者‘deptadmin’时返回true，否则返回false
    return roles.value.some(role => role === 'superadmin' || role === 'deptadmin');
  },
  set(value) {
    isDisplay.value = value;
  }
});

onMounted(() => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  window.addEventListener('resize', handleResize)
  calculateTableHeight();
  getClazzs(route.params && route.params.clazzId as string);
  getClazzList()
  getDeptList()
});
</script>
<style lang="scss" scoped>

</style>
