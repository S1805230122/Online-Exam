<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="queryParams.deptName" clearable placeholder="请输入部门名称" style="width: 240px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="部门状态" style="width: 100px"
                         @change="handleQuery">
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label"
                           :value="dict.value"/>
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card class="card-content" shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dept:add']" icon="Plus" plain type="primary" @click="handleAdd()">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Sort" plain type="info" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="deptTableRef"
        v-loading="loading"
        :data="deptList"
        :default-expand-all="isExpandAll"
        :height="tableHeight"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        row-key="deptId"
      >
        <el-table-column label="部门名称" prop="deptName" width="260"></el-table-column>
        <el-table-column label="部门代码" prop="code" align="center" width="150"/>
        <el-table-column align="center" label="排序" prop="orderNum" width="200"></el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:dept:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"/>
            </el-tooltip>
            <el-tooltip content="新增" placement="top">
              <el-button v-hasPermi="['system:dept:add']" circle icon="Plus" plain type="success"
                         @click="handleAdd(scope.row)"/>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:dept:remove']" circle icon="Delete" plain type="danger"
                         @click="handleDelete(scope.row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body destroy-on-close size="30%">
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="25%">
        <el-col v-if="form.parentId !== 0" :span="24">
          <el-form-item label="上级部门" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
              :data="deptOptions"
              :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
              check-strictly
              placeholder="选择上级部门"
              value-key="deptId"
            />
          </el-form-item>
        </el-col>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="请输入部门名称"/>
        </el-form-item>
        <el-form-item label="部门代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入部门代码"/>
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" controls-position="right"/>
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-select v-model="form.leader" placeholder="请选择负责人">
            <el-option v-for="item in deptUserList" :key="item.userId" :label="item.userName" :value="item.userId"/>
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="请输入联系电话"/>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" maxlength="50" placeholder="请输入邮箱"/>
        </el-form-item>
        <el-form-item label="部门状态">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">{{
                dict.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" name="Dept" setup>
import {addDept, delDept, getDept, listDept, listDeptExcludeChild, updateDept} from "@/api/system/dept"
import {DeptForm, DeptQuery, DeptVO} from "@/api/system/dept/types";
import {UserVO} from "@/api/system/user/types";
import {listUserByDeptId} from "@/api/system/user";
import useSettingsStore from "@/store/modules/settings";

interface DeptOptionsType {
  deptId: number | string;
  deptName: string;
  children: DeptOptionsType[];

}

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance
const {sys_normal_disable} = toRefs<any>(proxy?.useDict("sys_normal_disable"));

const deptList = ref<DeptVO[]>([])
const loading = ref(true)
const showSearch = ref(true)
const deptOptions = ref<DeptOptionsType[]>([])
const isExpandAll = ref(true)
const deptUserList = ref<UserVO[]>([]);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const deptTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();
const deptFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const initFormData: DeptForm = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
  code: undefined,
  orderNum: 0,
  leader: undefined,
  phone: undefined,
  email: undefined,
  status: "0"
}
const data = reactive<PageData<DeptForm, DeptQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    deptName: undefined,
    status: undefined
  },
  rules: {
    parentId: [{required: true, message: "上级部门不能为空", trigger: "blur"}],
    deptName: [{required: true, message: "部门名称不能为空", trigger: "blur"}],
    orderNum: [{required: true, message: "显示排序不能为空", trigger: "blur"}],
    email: [{type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"]}],
    phone: [{pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur"}]
  },
})

const {queryParams, form, rules} = toRefs<PageData<DeptForm, DeptQuery>>(data)

/** 查询菜单列表 */
const getList = async () => {
  loading.value = true;
  const res = await listDept(queryParams.value);
  const data = proxy?.handleTree<DeptVO>(res.data, "deptId")
  if (data) {
    deptList.value = data
  }
  loading.value = false
}

/** 查询当前部门的所有用户 */
async function getDeptAllUser(deptId: any) {
  if (deptId !== null && deptId !== "" && deptId !== undefined) {
    const res = await listUserByDeptId(deptId);
    deptUserList.value = res.data;
  }
}

/** 取消按钮 */
const cancel = () => {
  reset()
  dialog.visible = false
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  deptFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery()
}

/** 展开/折叠操作 */
const handleToggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
  toggleExpandAll(deptList.value, isExpandAll.value)
}
/** 展开/折叠所有 */
const toggleExpandAll = (data: DeptVO[], status: boolean) => {
  data.forEach((item) => {
    deptTableRef.value?.toggleRowExpansion(item, status)
    if (item.children && item.children.length > 0) toggleExpandAll(item.children, status)
  })
}

/** 新增按钮操作 */
const handleAdd = async (row?: DeptVO) => {
  reset();
  const res = await listDept();
  const data = proxy?.handleTree<DeptOptionsType>(res.data, "deptId");
  if (data) {
    deptOptions.value = data
    if (row && row.deptId) {
      form.value.parentId = row?.deptId;
    }
    dialog.visible = true;
    dialog.title = "添加部门";
  }
}

/** 修改按钮操作 */
const handleUpdate = async (row: DeptVO) => {
  reset();
  //查询当前部门所有用户
  getDeptAllUser(row.deptId);
  const res = await getDept(row.deptId);
  form.value = res.data
  const response = await listDeptExcludeChild(row.deptId);
  const data = proxy?.handleTree<DeptOptionsType>(response.data, "deptId")
  if (data) {
    deptOptions.value = data;
    if (data.length === 0) {
      const noResultsOptions: DeptOptionsType = {
        deptId: res.data.parentId,
        deptName: res.data.parentName,
        children: []
      };
      deptOptions.value.push(noResultsOptions);
    }
  }
  dialog.visible = true;
  dialog.title = "修改部门";
}
/** 提交按钮 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.deptId ? await updateDept(form.value) : await addDept(form.value);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  })
}
/** 删除按钮操作 */
const handleDelete = async (row: DeptVO) => {
  await proxy?.$modal.confirm('是否确认删除名称为"' + row.deptName + '"的数据项?');
  await delDept(row.deptId);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");
}

// 自适应表格高度
const tableHeight = ref<number | string>(0); // 表格的高度
const storeSettings = computed(() => settingsStore);
const showTags = ref(storeSettings.value.tagsView)
const height = ref(0)
// 用于计算表格高度的函数
const calculateTableHeight = () => {
  const breadcrumbHeight = showTags.value ? ref(34) : ref(0); // 面包屑导航的高度
  const searchHeight = showSearch.value ? ref(height.value) : ref(0); // 搜索栏的高度
  const viewportHeight = window.innerHeight;
  // 减去页面头部、面包屑导航、搜索栏和表格底部的分页组件等的高度
  const headerHeight = 50; // 页面头部高度
  const paginationHeight = 0; // 分页组件高度
  const paddingAndMargins = 110; // 其他可能的内边距和外边距
  tableHeight.value = viewportHeight - headerHeight - breadcrumbHeight.value - searchHeight.value - paddingAndMargins - paginationHeight;
}
// 监听showSearch的变化
watch(showSearch, () => {
  calculateTableHeight();
});

onMounted(() => {
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight + 12;
  }
  getList();
  calculateTableHeight();
});
</script>
<style lang="scss" scoped>

</style>
