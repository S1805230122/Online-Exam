<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item v-if="displayValue" label="部门名称" prop="deptId">
            <el-select v-model="queryParams.deptId" filterable style="width: 200px" @change="handleQuery">
              <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                         :value="item.deptId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="账号类型" prop="bindingType">
            <el-select v-model="queryParams.bindingType" clearable placeholder="账号类型" style="width: 240px"
                       @change="handleQuery">
              <el-option v-for="dict in exam_binding_type" :key="dict.value" :label="dict.label" :value="dict.value">
                <span style="float: left">{{ dict.label }}</span>
                <span style="float: right;color: var(--el-text-color-secondary);font-size: 13px;">
                    {{ dict.value }}
                  </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="班级名称" prop="clazzId">
            <el-select v-model="queryParams.clazzId" filterable style="width: 200px" @change="handleQuery">
              <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="绑定账号" prop="binding">
            <el-input v-model="queryParams.binding" clearable placeholder="请输入账号" style="width: 240px"
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
            <el-button v-hasPermi="['exam:binding:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"
                         @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="bindingList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column v-if="columns[0].visible" align="center" label="编号" min-width="200" prop="bindingId"/>
        <el-table-column v-if="columns[1].visible" align="center" label="校园账号" min-width="180" prop="binding"/>
        <el-table-column v-if="columns[2].visible" align="center" label="绑定状态" min-width="80" prop="userId">
          <template #default="scope">
            <el-tag v-if="scope.row.userId!=null" type="success">
              已绑定
            </el-tag>
            <el-tag v-if="scope.row.userId==null" type="info">
              未绑定
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[3].visible" align="center" label="姓名" min-width="100" prop="name"/>
        <el-table-column v-if="columns[4].visible" align="center" label="班级编号" min-width="200" prop="clazzId"/>
        <el-table-column v-if="columns[5].visible" :show-overflow-tooltip="true" align="center" label="班级名称"
                         min-width="150"
                         prop="clazz.clazzName"/>
        <el-table-column v-if="columns[6].visible" align="center" label="头像" min-width="100" prop="user.avatar">
          <template #default="scope">
            <ImagePreview
              :height="60"
              :preview-src-list="[scope.row.user.avatar]"
              :src="scope.row.user.avatar"
              :width="60"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" align="center" label="账号类型" min-width="100" prop="bindingType">
          <template #default="scope">
            <dict-tag :options="exam_binding_type" :value="scope.row.bindingType"/>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[8].visible" align="center" label="用户编号" min-width="200" prop="userId"/>
        <el-table-column v-if="columns[9].visible" align="center" label="用户名" min-width="150" prop="user.userName"/>
        <el-table-column v-if="columns[10].visible" align="center" label="部门编号" min-width="200" prop="deptId"/>
        <el-table-column v-if="columns[11].visible" :show-overflow-tooltip="true" align="center" label="部门名称"
                         min-width="150"
                         prop="dept.deptName"/>
        <el-table-column v-if="columns[12].visible" :show-overflow-tooltip="true" align="center" label="备注信息"
                         min-width="200" prop="remark"/>
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
    <!-- 添加或修改账号绑定对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="bindingFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="绑定账号" prop="binding">
          <el-input v-model="form.binding" placeholder="请输入绑定账号"/>
        </el-form-item>
        <el-form-item label="用户编号" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户编号"/>
        </el-form-item>
        <el-form-item label="账号类型" prop="bindingType">
          <el-select v-model="form.bindingType" placeholder="请选择">
            <el-option v-for="dict in exam_binding_type" :key="dict.value" :label="dict.label"
                       :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="班级名称" prop="clazzId">
          <el-select v-model="form.clazzId" filterable placeholder="请选择">
            <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptId">
          <el-select v-model="form.deptId" filterable placeholder="请选择">
            <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                       :value="item.deptId">
            </el-option>
          </el-select>
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
  </div>
</template>

<script lang="ts" name="Binding" setup>
import {addBinding, delBinding, getBinding, listBinding, updateBinding} from '@/api/exam/binding';
import {BindingForm, BindingQuery, BindingVO} from '@/api/exam/binding/types';
import {ClazzVO} from "@/api/exam/clazz/types";
import {DeptVO} from "@/api/system/dept/types";
import {optionSelect as getClazzOptionSelect} from "@/api/exam/clazz";
import {optionSelect as getDeptOptionSelect} from '@/api/system/dept';
import ImagePreview from "@/components/ImagePreview/index.vue";
import useUserStore from "@/store/modules/user";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {
  exam_binding_type,
} = toRefs<any>(proxy?.useDict('exam_binding_type'));
const bindingList = ref<BindingVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const clazzOptions = ref<ClazzVO[]>([]);
const deptOptions = ref<DeptVO[]>([]);
const queryFormRef = ref<ElFormInstance>();
const bindingFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)
/*是否显示部门搜索*/
const isDisplay = ref(false);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

// 列显隐信息
const columns = ref<FieldOption[]>([
  {key: 0, label: `编号`, visible: false, children: []},
  {key: 1, label: `校园账号`, visible: true, children: []},
  {key: 2, label: `绑定状态`, visible: true, children: []},
  {key: 3, label: `姓名`, visible: true, children: []},
  {key: 4, label: `班级编号`, visible: true, children: []},
  {key: 5, label: `班级名称`, visible: true, children: []},
  {key: 6, label: `头像`, visible: true, children: []},
  {key: 7, label: '账号绑定类型', visible: true, children: []},
  {key: 8, label: `用户编号`, visible: true, children: []},
  {key: 9, label: `用户名`, visible: true, children: []},
  {key: 10, label: `部门编号`, visible: true, children: []},
  {key: 11, label: `部门名称`, visible: true, children: []},
  {key: 12, label: `备注信息`, visible: true, children: []},
])

const initFormData: BindingForm = {
  bindingId: undefined,
  binding: undefined,
  userId: undefined,
  clazzId: undefined,
  bindingType: undefined,
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
    clazzId: undefined,
    bindingType: undefined,
    deptId: undefined,
    name: undefined,
    params: {}
  },
  rules: {
    bindingId: [
      {required: true, message: "账号绑定ID不能为空", trigger: "blur"}
    ],
    binding: [
      {required: true, message: "账号绑定不能为空", trigger: "blur"}
    ],
    bindingType: [
      {required: true, message: "账号绑定类型 默认0学号 1工号不能为空", trigger: "change"}
    ],
    deptId: [
      {required: true, message: "部门ID不能为空", trigger: "blur"}
    ],
    name: [
      {required: true, message: "姓名不能为空", trigger: "blur"}
    ],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询账号绑定列表 */
const getList = async () => {
  loading.value = true;
  const res = await listBinding(queryParams.value);
  bindingList.value = res.rows;
  total.value = res.total;
  loading.value = false;
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
  dialog.title = "添加账号绑定";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: BindingVO) => {
  reset();
  const _bindingId = row?.bindingId || ids.value[0]
  const res = await getBinding(_bindingId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改账号绑定";
}

/** 提交按钮 */
const submitForm = () => {
  bindingFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.bindingId) {
        await updateBinding(form.value).finally(() => buttonLoading.value = false);
      } else {
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
  await proxy?.$modal.confirm('是否确认删除账号绑定编号为"' + _bindingIds + '"的数据项？').finally(() => loading.value = false);
  await delBinding(_bindingIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
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
    return roles.value.some(role => role === 'superadmin');
  },
  set(value) {
    // 当尝试设置值时，我们可以在这里执行一些操作，或者直接更新isDisplay
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
  getList();
  getClazzList()
  getDeptList()
});
</script>
<style lang="scss" scoped>

</style>
