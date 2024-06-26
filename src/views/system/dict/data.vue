<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="字典名称" prop="dictType">
              <el-select v-model="queryParams.dictType" style="width: 200px" @change="handleQuery">
                <el-option v-for="item in typeOptions" :key="item.dictId" :label="item.dictName" :value="item.dictType">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="字典标签" prop="dictLabel">
              <el-input v-model="queryParams.dictLabel" clearable placeholder="请输入字典标签" style="width: 200px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>
    <el-card class="card-content" shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dict:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dict:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dict:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:dict:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Close" plain type="warning" @click="handleClose">关闭</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="dataList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column v-if="false" align="center" label="字典编码" prop="dictCode"/>
        <el-table-column align="center" label="字典标签" prop="dictLabel">
          <template #default="scope">
            <span
              v-if="(scope.row.listClass === '' || scope.row.listClass === 'default') && (scope.row.cssClass === '' || scope.row.cssClass == null)">{{
                scope.row.dictLabel
              }}</span>
            <el-tag v-else
                    :class="scope.row.cssClass"
                    :type="(scope.row.listClass === 'primary' || scope.row.listClass === 'default') ? '' : scope.row.listClass">
              {{ scope.row.dictLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="字典键值" prop="dictValue"/>
        <el-table-column align="center" label="字典排序" prop="dictSort"/>
        <el-table-column :show-overflow-tooltip="true" align="center" label="备注" prop="remark"/>
        <el-table-column align="center" label="创建时间" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="small-padding fixed-width" label="操作" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:dict:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:dict:remove']" circle icon="Delete" plain type="danger"
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
    <!-- 添加或修改参数配置对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="dataFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="字典类型">
          <el-input v-model="form.dictType" :disabled="true"/>
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="请输入数据标签"/>
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="请输入数据键值"/>
        </el-form-item>
        <el-form-item label="样式属性" prop="cssClass">
          <el-input v-model="form.cssClass" placeholder="请输入样式属性"/>
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="form.dictSort" :min="0" controls-position="right"/>
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="form.listClass">
            <el-option
              v-for="item in listClassOptions"
              :key="item.value"
              :label="item.label + '(' + item.value + ')'"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入内容" type="textarea"></el-input>
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

<script lang="ts" name="Data" setup>
import useDictStore from '@/store/modules/dict'
import {getType, optionselect as getDictOptionselect} from "@/api/system/dict/type";
import {addData, delData, getData, listData, updateData} from "@/api/system/dict/data";
import {DictTypeVO} from '@/api/system/dict/type/types';
import {DictDataForm, DictDataQuery, DictDataVO} from "@/api/system/dict/data/types";
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance
const route = useRoute();

const dataList = ref<DictDataVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const defaultDictType = ref("");
const typeOptions = ref<DictTypeVO[]>([]);

const dataFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

// 数据标签回显样式
const listClassOptions = ref<Array<{ value: string, label: string }>>([
  {value: "default", label: "默认"},
  {value: "primary", label: "主要"},
  {value: "success", label: "成功"},
  {value: "info", label: "信息"},
  {value: "warning", label: "警告"},
  {value: "danger", label: "危险"}
]);

const initFormData: DictDataForm = {
  dictCode: undefined,
  dictLabel: '',
  dictValue: '',
  cssClass: '',
  listClass: "default",
  dictSort: 0,
  remark: ''
}
const data = reactive<PageData<DictDataForm, DictDataQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    dictName: '',
    dictType: '',
    dictLabel: ''
  },
  rules: {
    dictLabel: [{required: true, message: "数据标签不能为空", trigger: "blur"}],
    dictValue: [{required: true, message: "数据键值不能为空", trigger: "blur"}],
    dictSort: [{required: true, message: "数据顺序不能为空", trigger: "blur"}]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询字典类型详细 */
const getTypes = async (dictId: string | number) => {
  const {data} = await getType(dictId);
  queryParams.value.dictType = data.dictType;
  defaultDictType.value = data.dictType;
  await getList();
}

/** 查询字典类型列表 */
const getTypeList = async () => {
  const res = await getDictOptionselect()
  typeOptions.value = res.data;
}
/** 查询字典数据列表 */
const getList = async () => {
  loading.value = true;
  const res = await listData(queryParams.value);
  dataList.value = res.rows;
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
  dataFormRef.value?.resetFields();
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}
/** 返回按钮操作 */
const handleClose = () => {
  const obj = {path: "/system/dict"};
  proxy?.$tab.closeOpenPage(obj);
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.dictType = defaultDictType.value;
  handleQuery();
}
/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  form.value.dictType = queryParams.value.dictType;
  dialog.visible = true;
  dialog.title = "添加字典数据";
}
/** 多选框选中数据 */
const handleSelectionChange = (selection: DictDataVO[]) => {
  ids.value = selection.map(item => item.dictCode);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 修改按钮操作 */
const handleUpdate = async (row?: DictDataVO) => {
  reset();
  const dictCode = row?.dictCode || ids.value[0];
  const res = await getData(dictCode);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改字典数据";
}
/** 提交按钮 */
const submitForm = () => {
  dataFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.dictCode ? await updateData(form.value) : await addData(form.value);
      useDictStore().removeDict(queryParams.value.dictType);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();

    }
  });
}
/** 删除按钮操作 */
const handleDelete = async (row?: DictDataVO) => {
  const dictCodes = row?.dictCode || ids.value;
  await proxy?.$modal.confirm('是否确认删除字典编码为"' + dictCodes + '"的数据项？');
  await delData(dictCodes);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");
  useDictStore().removeDict(queryParams.value.dictType);

}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("system/dict/data/export", {
    ...queryParams.value
  }, `dict_data_${new Date().getTime()}.xlsx`);
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
  getTypes(route.params && route.params.dictId as string);
  getTypeList();
})
</script>
<style lang="scss" scoped>

</style>
