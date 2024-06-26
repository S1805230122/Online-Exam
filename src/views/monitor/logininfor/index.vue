<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="登录地址" prop="ipaddr">
              <el-input v-model="queryParams.ipaddr" clearable placeholder="请输入登录地址" style="width: 240px;"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="queryParams.userName" clearable placeholder="请输入用户名称" style="width: 240px;"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="登录状态" style="width: 240px"
                         @change="handleQuery">
                <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value">
                  <span style="float: left">{{ dict.label }}</span>
                  <span style="float: right;color: var(--el-text-color-secondary);font-size: 13px;">
                    {{ dict.value }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="登录时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
                end-placeholder="结束日期"
                range-separator="-"
                start-placeholder="开始日期"
                type="daterange"
                value-format="YYYY-MM-DD HH:mm:ss"
                @change="handleQuery"
              ></el-date-picker>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card class="card-content" shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:remove']" icon="Delete" plain type="danger"
                       @click="handleClean">清空
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:unlock']" :disabled="single" icon="Unlock" plain type="primary"
                       @click="handleUnlock">
              解锁
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:logininfor:export']" icon="Download" plain type="warning"
                       @click="handleExport">导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="loginInfoTableRef"
        v-loading="loading"
        :data="loginInfoList"
        :default-sort="defaultSort"
        :height="tableHeight"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column align="center" label="访问编号" prop="infoId"/>
        <el-table-column
          :show-overflow-tooltip="true"
          :sort-orders="['descending', 'ascending']"
          align="center"
          label="用户名称"
          prop="userName"
          sortable="custom"
        />
        <el-table-column :show-overflow-tooltip="true" align="center" label="客户端" prop="clientKey"/>
        <el-table-column align="center" label="设备类型">
          <template #default="scope">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType"/>
          </template>
        </el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="地址" prop="ipaddr"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="登录地点" prop="loginLocation"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="操作系统" prop="os"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="浏览器" prop="browser"/>
        <el-table-column align="center" label="登录状态" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="描述" prop="msg"/>
        <el-table-column :sort-orders="['descending', 'ascending']" align="center" label="访问时间" prop="loginTime"
                         sortable="custom" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
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

<script lang="ts" name="Logininfor" setup>
import {cleanLoginInfo, delLoginInfo, list, unlockLoginInfo} from "@/api/monitor/loginInfo";
import {LoginInfoQuery, LoginInfoVO} from "@/api/monitor/loginInfo/types";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {sys_device_type} = toRefs<any>(proxy?.useDict("sys_device_type"));
const {sys_common_status} = toRefs<any>(proxy?.useDict("sys_common_status"));

const loginInfoList = ref<LoginInfoVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const selectName = ref<Array<string>>([]);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const defaultSort = ref<any>({prop: "loginTime", order: "descending"});
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const queryFormRef = ref<ElFormInstance>();
const loginInfoTableRef = ref<ElTableInstance>();
// 查询参数
const queryParams = ref<LoginInfoQuery>({
  pageNum: 1,
  pageSize: 20,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: defaultSort.value.prop,
  isAsc: defaultSort.value.order
});

/** 查询登录日志列表 */
const getList = async () => {
  loading.value = true;
  const res = await list(proxy?.addDateRange(queryParams.value, dateRange.value));
  loginInfoList.value = res.rows;
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
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  loginInfoTableRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
}
/** 多选框选中数据 */
const handleSelectionChange = (selection: LoginInfoVO[]) => {
  ids.value = selection.map(item => item.infoId);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
  selectName.value = selection.map(item => item.userName);
}
/** 排序触发事件 */
const handleSortChange = (column: any) => {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}
/** 删除按钮操作 */
const handleDelete = async (row?: LoginInfoVO) => {
  const infoIds = row?.infoId || ids.value;
  await proxy?.$modal.confirm('是否确认删除访问编号为"' + infoIds + '"的数据项?');
  await delLoginInfo(infoIds);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");
}
/** 清空按钮操作 */
const handleClean = async () => {
  await proxy?.$modal.confirm("是否确认清空所有登录日志数据项?");
  await cleanLoginInfo();
  await getList();
  proxy?.$modal.msgSuccess("清空成功");
}
/** 解锁按钮操作 */
const handleUnlock = async () => {
  const username = selectName.value;
  await proxy?.$modal.confirm('是否确认解锁用户"' + username + '"数据项?');
  await unlockLoginInfo(username);
  proxy?.$modal.msgSuccess("用户" + username + "解锁成功");
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("monitor/logininfor/export", {
    ...queryParams.value,
  }, `config_${new Date().getTime()}.xlsx`);
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
})
</script>
<style lang="scss" scoped>

</style>
