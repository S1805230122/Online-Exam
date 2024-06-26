<template>
  <div class="p-2">
    <el-row :gutter="20">
      <!-- 部门树 -->
      <el-col :lg="4" :xs="24" style="">
        <el-card shadow="hover">
          <el-input v-model="deptName" clearable placeholder="请输入部门名称" prefix-icon="Search"/>
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            :props="{ label: 'label', children: 'children' }"
            class="mt-2"
            default-expand-all
            highlight-current
            node-key="id"
            @node-click="handleNodeClick"
          />
        </el-card>
      </el-col>
      <el-col :lg="20" :xs="24">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                    :leave-active-class="proxy?.animate.searchAnimate.leave">
          <div v-show="showSearch" class="mb-[10px]">
            <el-card shadow="hover">
              <el-form ref="queryFormRef" :inline="true" :model="queryParams">
                <el-form-item label="用户名称" prop="userName">
                  <el-input v-model="queryParams.userName" clearable placeholder="请输入用户名称" style="width: 240px"
                            @keyup.enter="handleQuery"/>
                </el-form-item>
                <el-form-item label="手机号码" prop="phonenumber">
                  <el-input
                    v-model="queryParams.phonenumber"
                    clearable
                    placeholder="请输入手机号码"
                    style="width: 240px"
                    @keyup.enter="handleQuery"
                  />
                </el-form-item>

                <el-form-item label="状态" prop="status">
                  <el-select v-model="queryParams.status" clearable placeholder="用户状态" style="width: 240px">
                    <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label"
                               :value="dict.value"/>
                  </el-select>
                </el-form-item>
                <el-form-item label="创建时间" style="width: 308px;">
                  <el-date-picker
                    v-model="dateRange"
                    end-placeholder="结束日期"
                    range-separator="-"
                    start-placeholder="开始日期"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                  ></el-date-picker>
                </el-form-item>
                <el-form-item>
                  <el-button icon="Search" type="primary" @click="handleQuery">搜索</el-button>
                  <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </transition>

        <el-card shadow="hover">
          <template #header>
            <el-row :gutter="10">
              <el-col :span="1.5">
                <el-button v-has-permi="['system:user:add']" icon="Plus" plain type="primary" @click="handleAdd()">
                  新增
                </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-has-permi="['system:user:add']" :disabled="single" icon="Edit" plain
                           type="success" @click="handleUpdate()">
                  修改
                </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-has-permi="['system:user:delete']" :disabled="multiple" icon="Delete" plain
                           type="danger" @click="handleDelete()">
                  删除
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
              <right-toolbar v-model:showSearch="showSearch" :columns="columns" :search="true"
                             @queryTable="getList"></right-toolbar>
            </el-row>
          </template>

          <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
            <el-table-column align="center" type="selection" width="50"/>
            <el-table-column v-if="columns[0].visible" key="userId" align="center" label="用户编号" prop="userId"/>
            <el-table-column v-if="columns[1].visible" key="userName" :show-overflow-tooltip="true" align="center"
                             label="用户名称"
                             prop="userName"/>
            <el-table-column v-if="columns[2].visible" key="nickName" :show-overflow-tooltip="true" align="center"
                             label="用户昵称"
                             prop="nickName"/>

            <el-table-column
              v-if="columns[3].visible"
              key="deptName"
              :show-overflow-tooltip="true"
              align="center"
              label="部门"
              prop="dept.deptName"
            />
            <el-table-column v-if="columns[4].visible" key="phonenumber" align="center" label="手机号码"
                             prop="phonenumber" width="120"/>
            <el-table-column v-if="columns[5].visible" key="status" align="center" label="状态">
              <template #default="scope">
                <el-switch v-model="scope.row.status" active-value="0" inactive-value="1"
                           @change="handleStatusChange(scope.row)"></el-switch>
              </template>
            </el-table-column>

            <el-table-column v-if="columns[6].visible" align="center" label="创建时间" prop="createTime" width="160">
              <template #default="scope">
                <span>{{ scope.row.createTime }}</span>
              </template>
            </el-table-column>

            <el-table-column class-name="small-padding fixed-width" fixed="right" label="操作" width="180">
              <template #default="scope">
                <el-tooltip v-if="scope.row.userId !== 1" content="修改" placement="top">
                  <el-button v-hasPermi="['system:user:edit']" icon="Edit" link type="primary"
                             @click="handleUpdate(scope.row)"></el-button>
                </el-tooltip>
                <el-tooltip v-if="scope.row.userId !== 1" content="删除" placement="top">
                  <el-button v-hasPermi="['system:user:remove']" icon="Delete" link type="primary"
                             @click="handleDelete(scope.row)"></el-button>
                </el-tooltip>

                <el-tooltip v-if="scope.row.userId !== 1" content="重置密码" placement="top">
                  <el-button v-hasPermi="['system:user:resetPwd']" icon="Key" link type="primary"
                             @click="handleResetPwd(scope.row)"></el-button>
                </el-tooltip>

                <el-tooltip v-if="scope.row.userId !== 1" content="分配角色" placement="top">
                  <el-button v-hasPermi="['system:user:edit']" icon="CircleCheck" link type="primary"
                             @click="handleAuthRole(scope.row)"></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="total > 0"
            v-model:limit="queryParams.pageSize"
            v-model:page="queryParams.pageNum"
            :total="total"
            @pagination="getList"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog ref="formDialogRef" v-model="dialog.visible" :title="dialog.title" append-to-body width="600px"
               @close="closeDialog">
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="25%">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" maxlength="30" placeholder="请输入用户昵称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                check-strictly
                placeholder="请选择归属部门"
                value-key="id"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" maxlength="11" placeholder="请输入手机号码"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" maxlength="50" placeholder="请输入邮箱"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" maxlength="30" placeholder="请输入用户名称"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" maxlength="20" placeholder="请输入用户密码" show-password
                        type="password"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择">
                <el-option v-for="dict in sys_user_sex" :key="dict.value" :label="dict.label"
                           :value="dict.value"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">{{
                    dict.label
                  }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-select v-model="form.postIds" multiple placeholder="请选择">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :disabled="item.status == '1'"
                  :label="item.postName"
                  :value="item.postId"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="form.roleIds" multiple placeholder="请选择">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :disabled="item.status == '1'"
                  :label="item.roleName"
                  :value="item.roleId"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="请输入内容" type="textarea"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel()">取 消</el-button>
        </div>
      </template>
    </el-dialog>

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

<script lang="ts" name="User" setup>
import api from "@/api/system/user"
import {UserForm, UserQuery, UserVO} from '@/api/system/user/types';
import {treeselect} from "@/api/system/dept";
import {DeptVO} from "@/api/system/dept/types";
import {RoleVO} from "@/api/system/role/types";
import {PostVO} from "@/api/system/post/types";
import {to} from "await-to-js";
import {globalHeaders} from "@/utils/request";
import {ElMessageBox} from "element-plus";

const router = useRouter();
const {proxy} = getCurrentInstance() as ComponentInternalInstance
const {sys_normal_disable, sys_user_sex} = toRefs<any>(proxy?.useDict('sys_normal_disable', 'sys_user_sex'));

const userList = ref<UserVO[]>();
const loading = ref(true);
const showSearch = ref(true)
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const deptName = ref('');
const deptOptions = ref<DeptVO[]>([]);
const initPassword = ref<String>('');
const postOptions = ref<PostVO[]>([]);
const roleOptions = ref<RoleVO[]>([]);
/*** 用户导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
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
  url: import.meta.env.VITE_APP_BASE_API + "/system/user/importData"
})
// 列显隐信息
const columns = ref<FieldOption[]>([
  {key: 0, label: `用户编号`, visible: false, children: []},
  {key: 1, label: `用户名称`, visible: true, children: []},
  {key: 2, label: `用户昵称`, visible: true, children: []},
  {key: 3, label: `部门`, visible: true, children: []},
  {key: 4, label: `手机号码`, visible: true, children: []},
  {key: 5, label: `状态`, visible: true, children: []},
  {key: 6, label: `创建时间`, visible: true, children: []}
])


const deptTreeRef = ref<ElTreeInstance>();
const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const formDialogRef = ref<ElDialogInstance>();

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: UserForm = {
  userId: undefined,
  deptId: undefined,
  userName: '',
  nickName: undefined,
  password: '',
  phonenumber: undefined,
  email: undefined,
  sex: undefined,
  status: "0",
  remark: '',
  postIds: [],
  roleIds: []
}
const data = reactive<PageData<UserForm, UserQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    userName: '',
    phonenumber: '',
    status: '',
    deptId: ''
  },
  rules: {
    userName: [{required: true, message: "用户名称不能为空", trigger: "blur"}, {
      min: 2,
      max: 20,
      message: "用户名称长度必须介于 2 和 20 之间",
      trigger: "blur"
    }],
    nickName: [{required: true, message: "用户昵称不能为空", trigger: "blur"}],
    password: [{required: true, message: "用户密码不能为空", trigger: "blur"}, {
      min: 5,
      max: 20,
      message: "用户密码长度必须介于 5 和 20 之间",
      trigger: "blur"
    }],
    email: [{type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"]}],
    phonenumber: [{pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur"}]
  }
})

const {queryParams, form, rules} = toRefs<PageData<UserForm, UserQuery>>(data)

/** 通过条件过滤节点  */
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.indexOf(value) !== -1
}
/** 根据名称筛选部门树 */
watchEffect(
  () => {
    deptTreeRef.value?.filter(deptName.value);
  },
  {
    flush: 'post' // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
  }
);

/** 查询部门下拉树结构 */
const getTreeSelect = async () => {
  const res = await api.deptTreeSelect();
  deptOptions.value = res.data;
};

/** 查询用户列表 */
const getList = async () => {
  loading.value = true;
  const res = await api.listUser(proxy?.addDateRange(queryParams.value, dateRange.value));
  loading.value = false;
  userList.value = res.rows;
  total.value = res.total;
}

/** 节点单击事件 */
const handleNodeClick = (data: DeptVO) => {
  queryParams.value.deptId = data.id;
  handleQuery()
}


/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', '']
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  queryParams.value.deptId = undefined;
  deptTreeRef.value?.setCurrentKey(undefined);
  handleQuery();
}

/** 删除按钮操作 */
const handleDelete = async (row?: UserVO) => {
  const userIds = row?.userId || ids.value;
  const [err] = await to(proxy?.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？') as any);
  if (!err) {
    await api.delUser(userIds);
    await getList();
    proxy?.$modal.msgSuccess("删除成功");
  }
}

/** 用户状态修改  */
const handleStatusChange = async (row: UserVO) => {
  let text = row.status === "0" ? "启用" : "停用"
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗?');
    await api.changeUserStatus(row.userId, row.status);
    proxy?.$modal.msgSuccess(text + "成功");
  } catch (err) {
    row.status = row.status === "0" ? "1" : "0";
  }
}
/** 跳转角色分配 */
const handleAuthRole = (row: UserVO) => {
  const userId = row.userId;
  router.push("/system/user-auth/role/" + userId);
}

/** 重置密码按钮操作 */
const handleResetPwd = async (row: UserVO) => {
  const [err, res] = await to(ElMessageBox.prompt('请输入"' + row.userName + '"的新密码', "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    closeOnClickModal: false,
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: "用户密码长度必须介于 5 和 20 之间",
  }))
  if (!err) {
    await api.resetUserPwd(row.userId, res.value);
    proxy?.$modal.msgSuccess("修改成功，新密码是：" + res.value);
  }
}

/** 选择条数  */
const handleSelectionChange = (selection: UserVO[]) => {
  ids.value = selection.map((item) => item.userId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 导入按钮操作 */
const handleImport = () => {
  upload.title = "用户导入";
  upload.open = true;
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("system/user/export", {
    ...queryParams.value,
  }, `user_${new Date().getTime()}.xlsx`);
};
/** 下载模板操作 */
const importTemplate = () => {
  proxy?.download("system/user/importTemplate", {}, `user_template_${new Date().getTime()}.xlsx`);
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

/** 初始化部门数据 */
const initTreeData = async () => {
  // 判断部门的数据是否存在，存在不获取，不存在则获取
  if (deptOptions.value === undefined) {
    const {data} = await treeselect();
    deptOptions.value = data;
  }
}


/** 重置操作表单 */
const reset = () => {
  form.value = {...initFormData};
  userFormRef.value?.resetFields();
}
/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
}

/** 新增按钮操作 */
const handleAdd = async () => {
  reset();
  const {data} = await api.getUser();
  dialog.visible = true;
  dialog.title = "新增用户";
  await initTreeData();
  postOptions.value = data.posts;
  roleOptions.value = data.roles;
  form.value.password = initPassword.value.toString();
}
/** 修改按钮操作 */
const handleUpdate = async (row?: UserForm) => {
  reset();
  const userId = row?.userId || ids.value[0]
  const {data} = await api.getUser(userId)
  dialog.visible = true;
  dialog.title = "修改用户";
  await initTreeData();
  Object.assign(form.value, data.user);
  postOptions.value = data.posts;
  roleOptions.value = data.roles;
  form.value.postIds = data.postIds;
  form.value.roleIds = data.roleIds;
  form.value.password = "";
}

/** 提交按钮 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.userId ? await api.updateUser(form.value) : await api.addUser(form.value);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  })
}


/**
 * 关闭用户弹窗
 */
const closeDialog = () => {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
const resetForm = () => {
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();

  form.value.id = undefined;
  form.value.status = '1';
}
// 自适应表格高度
const tableHeight = ref<number | string>(0); // 表格的高度
// 获取tags显示状态
const settingsStore = useSettingsStore()
const storeSettings = computed(() => settingsStore);
const showTags = ref(storeSettings.value.tagsView)
// 用于计算表格高度的函数
const calculateTableHeight = () => {
  const breadcrumbHeight = showTags.value ? ref(34) : ref(0); // 面包屑导航的高度
  const searchHeight = showSearch.value ? ref(146) : ref(0); // 搜索栏的高度
  const viewportHeight = window.innerHeight;
  // 减去页面头部、面包屑导航、搜索栏和表格底部的分页组件等的高度
  const headerHeight = 50; // 页面头部高度
  const paginationHeight = 87; // 分页组件高度
  const paddingAndMargins = 90; // 其他可能的内边距和外边距
  tableHeight.value = viewportHeight - headerHeight - breadcrumbHeight.value - searchHeight.value - paddingAndMargins - paginationHeight;
}
// 监听showSearch的变化
watch(showSearch, () => {
  calculateTableHeight();
});

onMounted(() => {
  getList() // 初始化列表数据
  calculateTableHeight() // 初始化table高度
  proxy?.getConfigKey("sys.user.initPassword").then(response => {
    initPassword.value = response.data;
  });
});
</script>

<style lang="scss" scoped></style>
<style lang="scss" scoped>

</style>
