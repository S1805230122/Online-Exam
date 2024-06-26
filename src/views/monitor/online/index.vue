<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <div class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item label="登录地址" prop="ipaddr">
            <el-input v-model="queryParams.ipaddr" clearable placeholder="请输入登录地址" style="width: 200px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
          <el-form-item label="用户名称" prop="userName">
            <el-input v-model="queryParams.userName" clearable placeholder="请输入用户名称" style="width: 200px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" plain type="primary" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card class="card-content" shadow="hover">
      <el-table
        v-loading="loading"
        :data="onlineList.slice((queryParams.pageNum - 1) * queryParams.pageSize, queryParams.pageNum * queryParams.pageSize)"
        :height="tableHeight"
        style="width: 100%;"
      >
        <el-table-column align="center" label="序号" type="index" width="50">
          <template #default="scope">
            <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="会话编号" prop="tokenId"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="登录名称" prop="userName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="客户端" prop="clientKey"/>
        <el-table-column align="center" label="设备类型">
          <template #default="scope">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType"/>
          </template>
        </el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="所属部门" prop="deptName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="主机" prop="ipaddr"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="登录地点" prop="loginLocation"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="操作系统" prop="os"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="浏览器" prop="browser"/>
        <el-table-column align="center" label="登录时间" prop="loginTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="small-padding fixed-width" fixed="right" label="操作" width="80">
          <template #default="scope">
            <el-tooltip content="强退" placement="top">
              <el-button v-hasPermi="['monitor:online:forceLogout']" circle icon="Delete" plain type="danger"
                         @click="handleForceLogout(scope.row)">
              </el-button>
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
  </div>
</template>

<script lang="ts" name="Online" setup>
import {forceLogout, list as initData} from "@/api/monitor/online";
import {OnlineQuery, OnlineVO} from "@/api/monitor/online/types";
import {to} from "await-to-js";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {sys_device_type} = toRefs<any>(proxy?.useDict("sys_device_type"));

const onlineList = ref<OnlineVO[]>([]);
const loading = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const queryParams = ref<OnlineQuery>({
  pageNum: 1,
  pageSize: 20,
  ipaddr: '',
  userName: ''
});

/** 查询登录日志列表 */
const getList = async () => {
  loading.value = true;
  const res = await initData(queryParams.value);
  onlineList.value = res.rows;
  total.value = res.total;
  loading.value = false;
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
/** 强退按钮操作 */
const handleForceLogout = async (row: OnlineVO) => {
  const [err] = await to(proxy?.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户?') as any);
  if (!err) {
    await forceLogout(row.tokenId);
    await getList();
    proxy?.$modal.msgSuccess("删除成功");
  }
}

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight)
const tableHeight = ref<number | string>(0)
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}

const calculateTableHeight = () => {
  const searchHeight = ref(76); // 搜索栏的高度
  const tagsViewHeight = needTagsView.value ? ref(34) : ref(0);
  tableHeight.value = screenHeight.value - 50 - tagsViewHeight.value - 26 - searchHeight.value - 170
}

/*响应式监听*/
watchEffect(() => {
  calculateTableHeight()
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});


onMounted(() => {
  calculateTableHeight();
  getList();
})
</script>
