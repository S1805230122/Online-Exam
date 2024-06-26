<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div ref="searchContainer" class="mb-[10px]">
        <el-card v-show="showSearch" shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="操作地址" prop="operIp">
              <el-input v-model="queryParams.operIp" clearable placeholder="请输入操作地址" style="width: 240px;"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="系统模块" prop="title">
              <el-input v-model="queryParams.title" clearable placeholder="请输入系统模块" style="width: 240px;"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="操作人员" prop="operName">
              <el-input v-model="queryParams.operName" clearable placeholder="请输入操作人员" style="width: 240px;"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="类型" prop="businessType">
              <el-select v-model="queryParams.businessType" clearable placeholder="操作类型" style="width: 240px"
                         @change="handleQuery">
                <el-option v-for="dict in sys_oper_type" :key="dict.value" :label="dict.label" :value="dict.value">
                  <span style="float: left">{{ dict.label }}</span>
                  <span style="float: right;color: var(--el-text-color-secondary);font-size: 13px;">
                    {{ dict.value }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="操作状态" style="width: 240px"
                         @change="handleQuery">
                <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value">
                  <span style="float: left">{{ dict.label }}</span>
                  <span style="float: right;color: var(--el-text-color-secondary);font-size: 13px;">
                    {{ dict.value }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="操作时间" style="width: 308px">
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
            <el-button v-hasPermi="['monitor:operlog:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:operlog:remove']" icon="WarnTriangleFilled" plain type="danger"
                       @click="handleClean">清空
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['monitor:operlog:export']" icon="Download" plain type="warning"
                       @click="handleExport">导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="operLogTableRef"
        v-loading="loading"
        :data="operlogList"
        :default-sort="defaultSort"
        :height="tableHeight"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column align="center" type="selection" width="50"/>
        <el-table-column align="center" label="日志编号" prop="operId"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="系统模块" prop="title"/>
        <el-table-column align="center" label="操作类型" prop="businessType">
          <template #default="scope">
            <dict-tag :options="sys_oper_type" :value="scope.row.businessType"/>
          </template>
        </el-table-column>
        <el-table-column
          :show-overflow-tooltip="true"
          :sort-orders="['descending', 'ascending']"
          align="center"
          label="操作人员"
          prop="operName"
          sortable="custom"
          width="110"
        />
        <el-table-column :show-overflow-tooltip="true" align="center" label="部门" prop="deptName" width="130"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="操作地址" prop="operIp" width="130"/>
        <el-table-column align="center" label="操作状态" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column :sort-orders="['descending', 'ascending']" align="center" label="操作日期" prop="operTime"
                         sortable="custom"
                         width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :show-overflow-tooltip="true"
          :sort-orders="['descending', 'ascending']"
          align="center"
          label="消耗时间"
          prop="costTime"
          sortable="custom"
          width="110"
        >
          <template #default="scope">
            <span>{{ scope.row.costTime }}毫秒</span>
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="small-padding fixed-width" fixed="right" label="操作">
          <template #default="scope">
            <el-tooltip content="详细" placement="top">
              <el-button v-hasPermi="['monitor:operlog:query']" circle icon="View" plain type="primary"
                         @click="openDetailDialog(scope.row)"></el-button>
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
    <!-- 操作日志详细 -->
    <el-drawer v-model="dialog.visible" append-to-body size="40%" title="操作日志详细">
      <el-form :model="form" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="登录信息：">{{ form.operName }} / {{ form.deptName }} / {{ form.operIp }} /
              {{ form.operLocation }}
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="请求信息：">{{ form.requestMethod }} {{ form.operUrl }}</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作模块：">{{ form.title }} / {{ typeFormat(form) }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="操作方法：">{{ form.method }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="请求参数：">{{ form.operParam }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="返回参数：">{{ form.jsonResult }}</el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="操作状态：">
              <div v-if="form.status === 0">正常</div>
              <div v-else-if="form.status === 1">失败</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消耗时间：">{{ form.costTime }}毫秒</el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="操作时间：">{{ parseTime(form.operTime) }}</el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item v-if="form.status === 1" label="异常信息：">{{ form.errorMsg }}</el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" name="Operlog" setup>
import {cleanOperlog, delOperlog, list} from '@/api/monitor/operlog';
import {OperLogForm, OperLogQuery, OperLogVO} from '@/api/monitor/operlog/types';
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {sys_oper_type, sys_common_status} = toRefs<any>(proxy?.useDict("sys_oper_type", "sys_common_status"));

const operlogList = ref<OperLogVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const defaultSort = ref<any>({prop: "operTime", order: "descending"});

const operLogTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});


const data = reactive<PageData<OperLogForm, OperLogQuery>>({
  form: {
    operId: undefined,
    title: '',
    businessType: 0,
    businessTypes: undefined,
    method: '',
    requestMethod: '',
    operatorType: 0,
    operName: '',
    deptName: '',
    operUrl: '',
    operIp: '',
    operLocation: '',
    operParam: '',
    jsonResult: '',
    status: 0,
    errorMsg: '',
    operTime: '',
    costTime: 0
  },
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    operIp: '',
    title: '',
    operName: '',
    businessType: '',
    status: '',
    orderByColumn: defaultSort.value.prop,
    isAsc: defaultSort.value.order
  },
  rules: {}
});

const {queryParams, form} = toRefs(data);

/** 查询登录日志 */
const getList = async () => {
  loading.value = true;
  const res = await list(proxy?.addDateRange(queryParams.value, dateRange.value));
  operlogList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
/** 操作日志类型字典翻译 */
const typeFormat = (row: OperLogForm) => {
  return proxy?.selectDictLabel(sys_oper_type.value, row.businessType);
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
  operLogTableRef.value?.sort(defaultSort.value.prop, defaultSort.value.order);
}
/** 多选框选中数据 */
const handleSelectionChange = (selection: OperLogVO[]) => {
  ids.value = selection.map(item => item.operId);
  multiple.value = !selection.length;
}
/** 排序触发事件 */
const handleSortChange = (column: any) => {
  queryParams.value.orderByColumn = column.prop;
  queryParams.value.isAsc = column.order;
  getList();
}
/** 详细按钮操作 */
const openDetailDialog = (row: OperLogVO) => {
  dialog.visible = true;
  form.value = row;
}
/** 删除按钮操作 */
const handleDelete = async (row?: OperLogVO) => {
  const operIds = row?.operId || ids.value;
  await proxy?.$modal.confirm('是否确认删除日志编号为"' + operIds + '"的数据项?');
  await delOperlog(operIds);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");
}

/** 清空按钮操作 */
const handleClean = async () => {
  await proxy?.$modal.confirm("是否确认清空所有操作日志数据项?");
  await cleanOperlog();
  await getList();
  proxy?.$modal.msgSuccess("清空成功");
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("monitor/operlog/export", {
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
