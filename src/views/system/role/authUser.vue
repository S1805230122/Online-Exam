<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item label="用户名称" prop="userName">
            <el-input v-model="queryParams.userName" clearable placeholder="请输入用户名称" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="queryParams.phonenumber" clearable placeholder="请输入手机号码" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
        </el-form>
      </div>
    </transition>
    <el-card class="card-content" shadow="never">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:add']" icon="Plus" plain type="primary" @click="openSelectUser">
              添加用户
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:role:remove']" :disabled="multiple" icon="CircleClose" plain type="danger"
                       @click="cancelAuthUserAll">
              批量取消授权
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Close" plain type="warning" @click="handleClose">关闭</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :search="true" @queryTable="getList"
                         @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>
      <el-table v-loading="loading" :data="userList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="用户名称" prop="userName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="用户昵称" prop="nickName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="邮箱" prop="email"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="手机" prop="phonenumber"/>
        <el-table-column align="center" label="状态" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="small-padding fixed-width" label="操作">
          <template #default="scope">
            <el-tooltip content="取消授权" placement="top">
              <el-button v-hasPermi="['system:role:remove']" circle icon="Close" plain type="danger"
                         @click="cancelAuthUser(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <select-user ref="selectRef" :roleId="queryParams.roleId" @ok="handleQuery"/>
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
  </div>
</template>

<script lang="ts" name="AuthUser" setup>
import {allocatedUserList, authUserCancel, authUserCancelAll} from "@/api/system/role";
import {UserQuery, UserVO} from "@/api/system/user/types";
import SelectUser from "./selectUser.vue";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const route = useRoute();
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {sys_normal_disable} = toRefs<any>(proxy?.useDict("sys_normal_disable"));

const userList = ref<UserVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const multiple = ref(true);
const total = ref(0);
const userIds = ref<Array<string | number>>([]);

const queryFormRef = ref<ElFormInstance>();
const selectRef = ref<InstanceType<typeof SelectUser>>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const queryParams = reactive<UserQuery>({
  pageNum: 1,
  pageSize: 20,
  roleId: route.params.roleId as string,
  userName: undefined,
  phonenumber: undefined,
});

/** 查询授权用户列表 */
const getList = async () => {
  loading.value = true;
  const res = await allocatedUserList(queryParams);
  userList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
// 返回按钮
const handleClose = () => {
  const obj = {path: "/system/role"};
  proxy?.$tab.closeOpenPage(obj);
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}
// 多选框选中数据
const handleSelectionChange = (selection: UserVO[]) => {
  userIds.value = selection.map(item => item.userId);
  multiple.value = !selection.length;
}
/** 打开授权用户表弹窗 */
const openSelectUser = () => {
  selectRef.value?.show();
}
/** 取消授权按钮操作 */
const cancelAuthUser = async (row: UserVO) => {
  await proxy?.$modal.confirm('确认要取消该用户"' + row.userName + '"角色吗？');
  await authUserCancel({userId: row.userId, roleId: queryParams.roleId});
  await getList();
  proxy?.$modal.msgSuccess("取消授权成功");
}
/** 批量取消授权按钮操作 */
const cancelAuthUserAll = async () => {
  const roleId = queryParams.roleId;
  const uIds = userIds.value.join(",");
  await proxy?.$modal.confirm("是否取消选中用户授权数据项?");
  await authUserCancelAll({roleId: roleId, userIds: uIds});
  await getList();
  proxy?.$modal.msgSuccess("取消授权成功");
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

onMounted(() => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  window.addEventListener('resize', handleResize)
  calculateTableHeight();
  getList();
});
</script>

<style lang="scss" scoped>

</style>
