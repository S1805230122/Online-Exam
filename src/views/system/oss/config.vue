<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="配置key" prop="configKey">
              <el-input v-model="queryParams.configKey" clearable placeholder="配置key" style="width: 200px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="桶名称" prop="bucketName">
              <el-input v-model="queryParams.bucketName" clearable placeholder="请输入桶名称" style="width: 200px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="是否默认" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="请选择状态" style="width: 200px"
                         @change="handleQuery">
                <el-option key="0" label="是" value="0"/>
                <el-option key="1" label="否" value="1"/>
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card class="card-content" shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:ossConfig:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:ossConfig:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:ossConfig:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="ossConfigList" :height="tableHeight"
                @selection-change="handleSelectionChange">
        <el-table-column align="center" fixed type="selection" width="55"/>
        <el-table-column v-if="columns[0].visible" align="center" fixed label="主建" prop="ossConfigId"/>
        <el-table-column v-if="columns[1].visible" align="center" label="配置key" prop="configKey"/>
        <el-table-column v-if="columns[8].visible" align="center" label="是否默认" prop="status" width="100">
          <template #default="scope">
            <el-switch v-model="scope.row.status" active-value="0" inactive-value="1"
                       @change="handleStatusChange(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[7].visible" align="center" label="桶权限类型" prop="accessPolicy" width="150">
          <template #default="scope">
            <el-tag v-if="scope.row.accessPolicy === '0'" type="warning">private</el-tag>
            <el-tag v-if="scope.row.accessPolicy === '1'" type="success">public</el-tag>
            <el-tag v-if="scope.row.accessPolicy === '2'" type="info">custom</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[2].visible" align="center" label="访问站点" prop="endpoint" width="250"/>
        <el-table-column v-if="columns[3].visible" align="center" label="自定义域名" prop="domain" width="250"/>
        <el-table-column v-if="columns[4].visible" align="center" label="桶名称" prop="bucketName" width="200"/>
        <el-table-column v-if="columns[5].visible" align="center" label="前缀" prop="prefix" width="200"/>
        <el-table-column v-if="columns[6].visible" align="center" label="域" prop="region" width="150"/>
        <el-table-column align="center" class-name="small-padding" fixed="right" label="操作" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:ossConfig:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:ossConfig:remove']" circle icon="Delete" plain type="danger"
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
    <!-- 添加或修改对象存储配置对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="ossConfigFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="配置key" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入配置key"/>
        </el-form-item>
        <el-form-item label="访问站点" prop="endpoint">
          <el-input v-model="form.endpoint" placeholder="请输入访问站点"/>
        </el-form-item>
        <el-form-item label="自定义域名" prop="domain">
          <el-input v-model="form.domain" placeholder="请输入自定义域名"/>
        </el-form-item>
        <el-form-item label="accessKey" prop="accessKey">
          <el-input v-model="form.accessKey" placeholder="请输入accessKey"/>
        </el-form-item>
        <el-form-item label="secretKey" prop="secretKey">
          <el-input v-model="form.secretKey" placeholder="请输入秘钥" show-password/>
        </el-form-item>
        <el-form-item label="桶名称" prop="bucketName">
          <el-input v-model="form.bucketName" placeholder="请输入桶名称"/>
        </el-form-item>
        <el-form-item label="前缀" prop="prefix">
          <el-input v-model="form.prefix" placeholder="请输入前缀"/>
        </el-form-item>
        <el-form-item label="是否HTTPS">
          <el-radio-group v-model="form.isHttps">
            <el-radio v-for="dict in sys_yes_no" :key="dict.value" :label="dict.value">{{ dict.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="桶权限类型">
          <el-radio-group v-model="form.accessPolicy">
            <el-radio label="0">private</el-radio>
            <el-radio label="1">public</el-radio>
            <el-radio label="2">custom</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="域" prop="region">
          <el-input v-model="form.region" placeholder="请输入域"/>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
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

<script lang="ts" name="OssConfig" setup>
import {
  addOssConfig,
  changeOssConfigStatus,
  delOssConfig,
  getOssConfig,
  listOssConfig,
  updateOssConfig
} from "@/api/system/ossConfig";
import {OssConfigForm, OssConfigQuery, OssConfigVO} from "@/api/system/ossConfig/types";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance
const {sys_yes_no} = toRefs<any>(proxy?.useDict("sys_yes_no"));

const ossConfigList = ref<OssConfigVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const ossConfigFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

// 列显隐信息
const columns = ref<FieldOption[]>([
  {key: 0, label: `主建`, visible: true},
  {key: 1, label: `配置key`, visible: false},
  {key: 2, label: `访问站点`, visible: true},
  {key: 3, label: `自定义域名`, visible: true},
  {key: 4, label: `桶名称`, visible: true},
  {key: 5, label: `前缀`, visible: true},
  {key: 6, label: `域`, visible: true},
  {key: 7, label: `桶权限类型`, visible: true},
  {key: 8, label: `状态`, visible: true}
]);


const initFormData: OssConfigForm = {
  ossConfigId: undefined,
  configKey: '',
  accessKey: '',
  secretKey: '',
  bucketName: '',
  prefix: '',
  endpoint: '',
  domain: '',
  isHttps: "N",
  accessPolicy: "1",
  region: '',
  status: "1",
  remark: '',
}
const data = reactive<PageData<OssConfigForm, OssConfigQuery>>({
  form: {...initFormData},
  // 查询参数
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    configKey: '',
    bucketName: '',
    status: '',
  },
  rules: {
    configKey: [{required: true, message: "configKey不能为空", trigger: "blur"},],
    accessKey: [
      {required: true, message: "accessKey不能为空", trigger: "blur"},
      {
        min: 2,
        max: 200,
        message: "accessKey长度必须介于 2 和 100 之间",
        trigger: "blur",
      },
    ],
    secretKey: [
      {required: true, message: "secretKey不能为空", trigger: "blur"},
      {
        min: 2,
        max: 100,
        message: "secretKey长度必须介于 2 和 100 之间",
        trigger: "blur",
      },
    ],
    bucketName: [
      {required: true, message: "bucketName不能为空", trigger: "blur"},
      {
        min: 2,
        max: 100,
        message: "bucketName长度必须介于 2 和 100 之间",
        trigger: "blur",
      },
    ],
    endpoint: [
      {required: true, message: "endpoint不能为空", trigger: "blur"},
      {
        min: 2,
        max: 100,
        message: "endpoint名称长度必须介于 2 和 100 之间",
        trigger: "blur",
      },
    ],
    accessPolicy: [{required: true, message: "accessPolicy不能为空", trigger: "blur"}]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询对象存储配置列表 */
const getList = async () => {
  loading.value = true;
  const res = await listOssConfig(queryParams.value);
  ossConfigList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  ossConfigFormRef.value?.resetFields();
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
/** 选择条数  */
const handleSelectionChange = (selection: OssConfigVO[]) => {
  ids.value = selection.map(item => item.ossConfigId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加对象存储配置";
}
/** 修改按钮操作 */
const handleUpdate = async (row?: OssConfigVO) => {
  reset();
  const ossConfigId = row?.ossConfigId || ids.value[0];
  const res = await getOssConfig(ossConfigId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改对象存储配置";
}
/** 提交按钮 */
const submitForm = () => {
  ossConfigFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.ossConfigId) {
        await updateOssConfig(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addOssConfig(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("新增成功");
      dialog.visible = false;
      await getList();
    }
  });
}
/** 状态修改  */
const handleStatusChange = async (row: OssConfigVO) => {
  let text = row.status === "0" ? "启用" : "停用";
  try {
    await proxy?.$modal.confirm('确认要"' + text + '""' + row.configKey + '"配置吗?');
    await changeOssConfigStatus(row.ossConfigId, row.status, row.configKey);
    await getList()
    proxy?.$modal.msgSuccess(text + "成功");
  } catch {
    return
  } finally {
    row.status = row.status === "0" ? "1" : "0";
  }

}
/** 删除按钮操作 */
const handleDelete = async (row?: OssConfigVO) => {
  const ossConfigIds = row?.ossConfigId || ids.value;
  await proxy?.$modal.confirm('是否确认删除OSS配置编号为"' + ossConfigIds + '"的数据项?');
  loading.value = true;
  await delOssConfig(ossConfigIds).finally(() => loading.value = false);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");

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
