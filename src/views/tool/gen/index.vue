<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="数据源" prop="dataName">
              <el-select v-model="queryParams.dataName" clearable filterable placeholder="请选择/输入数据源名称"
                         style="width: 200px" @change="handleQuery">
                <el-option key="" label="全部" value=""/>
                <el-option v-for="item in dataNameList" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="表名称" prop="tableName">
              <el-input v-model="queryParams.tableName" clearable placeholder="请输入表名称" style="width: 200px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="表描述" prop="tableComment">
              <el-input v-model="queryParams.tableComment" clearable placeholder="请输入表描述" style="width: 200px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                end-placeholder="结束日期"
                range-separator="-"
                start-placeholder="开始日期"
                type="daterange"
                value-format="YYYY-MM-DD"
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
            <el-button v-hasPermi="['tool:gen:code']" icon="Download" plain type="primary" @click="handleGenTable()">
              生成
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['tool:gen:import']" icon="Upload" plain type="info" @click="openImportTable">导入
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['tool:gen:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleEditTable()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['tool:gen:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tableList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"></el-table-column>
        <el-table-column align="center" label="序号" type="index" width="50">
          <template #default="scope">
            <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="数据源" prop="dataName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="表名称" prop="tableName"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="表描述" prop="tableComment"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="实体" prop="className"/>
        <el-table-column align="center" label="创建时间" prop="createTime" width="160"/>
        <el-table-column align="center" label="更新时间" prop="updateTime" width="160"/>
        <el-table-column align="center" class-name="small-padding fixed-width" label="操作" width="280">
          <template #default="scope">
            <el-tooltip content="预览" placement="top">
              <el-button v-hasPermi="['tool:gen:preview']" circle icon="View" plain type="success"
                         @click="handlePreview(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button v-hasPermi="['tool:gen:edit']" circle icon="Edit" plain type="primary"
                         @click="handleEditTable(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['tool:gen:remove']" circle icon="Delete" plain type="danger"
                         @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="同步" placement="top">
              <el-button v-hasPermi="['tool:gen:edit']" circle icon="Refresh" plain type="info"
                         @click="handleSynchDb(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="生成代码" placement="top">
              <el-button v-hasPermi="['tool:gen:code']" circle icon="Download" plain type="warning"
                         @click="handleGenTable(scope.row)"></el-button>
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
    <!-- 预览界面 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" append-to-body class="scrollbar" top="5vh" width="80%">
      <el-tabs v-model="preview.activeName">
        <el-tab-pane
          v-for="(value, key) in preview.data"
          :key="value"
          :label="key.substring(key.lastIndexOf('/') + 1, key.indexOf('.vm'))"
          :name="key.substring(key.lastIndexOf('/') + 1, key.indexOf('.vm'))"
        >
          <el-link v-copyText="value" v-copyText:callback="copyTextSuccess" :underline="false" icon="DocumentCopy"
                   style="float:right">
            &nbsp;复制
          </el-link>
          <pre>{{ value }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
    <import-table ref="importRef" @ok="handleQuery"/>
  </div>
</template>

<script lang="ts" name="Gen" setup>
import {delTable, genCode, getDataNames, listTable, previewTable, synchDb} from '@/api/tool/gen';
import {TableQuery, TableVO} from '@/api/tool/gen/types';
import router from '@/router';
import ImportTable from './importTable.vue';
import useSettingsStore from "@/store/modules/settings";

const route = useRoute();
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);

const tableList = ref<TableVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const uniqueId = ref("");
const dataNameList = ref<Array<string>>([]);

const queryFormRef = ref<ElFormInstance>();
const importRef = ref<InstanceType<typeof ImportTable>>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const queryParams = ref<TableQuery>({
  pageNum: 1,
  pageSize: 20,
  tableName: '',
  tableComment: '',
  dataName: ""
})

const preview = ref<any>({
  data: {},
  activeName: 'domain.java'
})
const dialog = reactive<DialogOption>({
  visible: false,
  title: '代码预览'
});

onActivated(() => {
  const time = route.query.t;
  if (time != null && time != uniqueId.value) {
    uniqueId.value = time as string;
    queryParams.value.pageNum = Number(route.query.pageNum);
    dateRange.value = ['', ''];
    queryFormRef.value?.resetFields();
    getList();
  }
})

/** 查询多数据源名称 */
const getDataNameList = async () => {
  const res = await getDataNames()
  dataNameList.value = res.data;
}

/** 查询表集合 */
const getList = async () => {
  loading.value = true;
  const res = await listTable(proxy?.addDateRange(queryParams.value, dateRange.value));
  tableList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}
/** 生成代码操作 */
const handleGenTable = async (row?: TableVO) => {
  const tbIds = row?.tableId || ids.value;
  if (tbIds == "") {
    proxy?.$modal.msgError('请选择要生成的数据');
    return;
  }
  if (row?.genType === "1") {
    await genCode(row.tableId);
    proxy?.$modal.msgSuccess('成功生成到自定义路径：' + row.genPath);
  } else {
    proxy?.$download.zip('/tool/gen/batchGenCode?tableIdStr=' + tbIds, 'ruoyi.zip');
  }
}
/** 同步数据库操作 */
const handleSynchDb = async (row: TableVO) => {
  const tableId = row.tableId;
  await proxy?.$modal.confirm('确认要强制同步"' + row.tableName + '"表结构吗？');
  await synchDb(tableId);
  proxy?.$modal.msgSuccess('同步成功');
}
/** 打开导入表弹窗 */
const openImportTable = () => {
  importRef.value?.show(queryParams.value.dataName);
}
/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  handleQuery();
}
/** 预览按钮 */
const handlePreview = async (row: TableVO) => {
  const res = await previewTable(row.tableId);
  preview.value.data = res.data;
  dialog.visible = true;
  preview.value.activeName = 'domain.java';
}
/** 复制代码成功 */
const copyTextSuccess = () => {
  proxy?.$modal.msgSuccess('复制成功');
}
// 多选框选中数据
const handleSelectionChange = (selection: TableVO[]) => {
  ids.value = selection.map(item => item.tableId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 修改按钮操作 */
const handleEditTable = (row?: TableVO) => {
  const tableId = row?.tableId || ids.value[0];
  router.push({path: '/tool/gen-edit/index/' + tableId, query: {pageNum: queryParams.value.pageNum}});
}
/** 删除按钮操作 */
const handleDelete = async (row?: TableVO) => {
  const tableIds = row?.tableId || ids.value;
  await proxy?.$modal.confirm('是否确认删除表编号为"' + tableIds + '"的数据项？');
  await delTable(tableIds);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
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
  getDataNameList();
})
</script>
