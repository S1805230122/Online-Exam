<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams" label-width="68px">
          <el-form-item label="标签类型" prop="tagType">
            <el-select v-model="queryParams.tagType" clearable placeholder="请选择标签类型" @change="handleQuery" style="width: 150px">
              <el-option
                v-for="tag in exam_tag_type"
                :key="tag.value"
                :label="tag.label"
                :value="tag.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="标签名称" prop="tagName">
            <el-input v-model="queryParams.tagName" clearable placeholder="请输入标签名称" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card class="card-content" shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:tagType:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:tagType:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:tagType:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:tagType:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="tagTypeList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column v-if="true" align="center" label="标签ID" prop="tagId"/>
        <el-table-column align="center" label="标签类型" prop="tagType">
          <template #default="scope">
            <dict-tag :options="exam_tag_type" :value="scope.row.tagType"/>
          </template>
        </el-table-column>
        <el-table-column align="center" label="标签名称" prop="tagName"/>
        <el-table-column align="center" class-name="small-padding fixed-width" label="操作" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['exam:tagType:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['exam:tagType:remove']" circle icon="Delete" plain type="danger"
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
    <!-- 添加或修改标签类型对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" append-to-body width="500px">
      <el-form ref="tagTypeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标签类型" prop="tagType">
          <el-select v-model="form.tagType" placeholder="请选择标签类型">
            <el-option
              v-for="dict in exam_tag_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签名称" prop="tagName">
          <el-input v-model="form.tagName" placeholder="请输入标签名称"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" name="TagType" setup>
import {addTagType, delTagType, getTagType, listTagType, updateTagType} from '@/api/exam/tagType';
import {TagTypeForm, TagTypeQuery, TagTypeVO} from '@/api/exam/tagType/types';
import useSettingsStore from "@/store/modules/settings";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {exam_tag_type} = toRefs<any>(proxy?.useDict('exam_tag_type'));

const tagTypeList = ref<TagTypeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const tagTypeFormRef = ref<ElFormInstance>();


const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)
const initFormData: TagTypeForm = {
  tagId: undefined,
  tagType: undefined,
  tagName: undefined,
}
const data = reactive<PageData<TagTypeForm, TagTypeQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    tagType: undefined,
    tagName: undefined,
    params: {}
  },
  rules: {
    tagType: [
      {required: true, message: "标签类型不能为空", trigger: "change"}
    ],
    tagName: [
      {required: true, message: "标签名称不能为空", trigger: "blur"}
    ],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询标签类型列表 */
const getList = async () => {
  loading.value = true;
  const res = await listTagType(queryParams.value);
  tagTypeList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  tagTypeFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: TagTypeVO[]) => {
  ids.value = selection.map(item => item.tagId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加标签类型";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: TagTypeVO) => {
  reset();
  const _tagId = row?.tagId || ids.value[0]
  const res = await getTagType(_tagId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改标签类型";
}

/** 提交按钮 */
const submitForm = () => {
  tagTypeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.tagId) {
        await updateTagType(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addTagType(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: TagTypeVO) => {
  const _tagIds = row?.tagId || ids.value;
  await proxy?.$modal.confirm('是否确认删除标签类型编号为"' + _tagIds + '"的数据项？').finally(() => loading.value = false);
  await delTagType(_tagIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('exam/tagType/export', {
    ...queryParams.value
  }, `tagType_${new Date().getTime()}.xlsx`)
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
