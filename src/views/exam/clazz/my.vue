<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <el-form-item label="班级名称" prop="clazzName">
            <el-input v-model="queryParams.clazzName" clearable placeholder="请输入班级名称" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
        </el-form>
      </div>
    </transition>

    <el-card class="card-content" shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:clazz:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:clazz:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:clazz:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:clazz:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>
      <el-scrollbar :height="tableHeight">
        <el-row :gutter="20">
          <el-col v-for="(item, index) in clazzList" :key="index" :span="6">
            <router-link :to="'/exam/clazz-data/index/' + item.clazzId">
              <el-card shadow="hover" style="border-radius: 15px;margin-bottom: 20px">
                <template #header>
                  <span style="float: left">{{ item.clazzName }}</span>
                  <span style="float: right"><el-icon><School/></el-icon> {{ item.dept.deptName }}</span>
                </template>
                <p style="min-height: 32px">{{ item.description }}</p>
                <p style="min-height: 16px">{{ item.remark }}</p>
                <template #footer>
                  <p>
                    <el-icon>
                      <UserFilled/>
                    </el-icon>
                    {{ item.user.userName }}
                  </p>
                  <el-icon>
                    <Warning/>
                  </el-icon>
                  {{ item.member }} 成员
                  <div class="card-actions" style="float: right">
                    <el-button link type="info" @click.prevent.stop="copyText(<string>item.clazzId)">绑定码</el-button>
                    <el-button v-hasPermi="['exam:clazz:edit']" link type="primary"
                               @click.prevent.stop="handleUpdate(item)">
                      修改
                    </el-button>
                    <el-button v-hasPermi="['exam:clazz:remove']" link type="danger"
                               @click.prevent.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </template>
              </el-card>
            </router-link>
          </el-col>
        </el-row>
      </el-scrollbar>

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
    <!-- 添加或修改班级对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="clazzFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="班级名称" prop="clazzName">
          <el-input v-model="form.clazzName" placeholder="请输入班级名称"/>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptId">
          <el-select v-model="form.deptId" filterable placeholder="请选择">
            <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                       :value="item.deptId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="班级描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入班级描述"/>
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
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

<script lang="ts" setup>
import {addClazz, delClazz, getClazz, listMyClazz, updateClazz} from '@/api/exam/clazz';
import {ClazzForm, ClazzQuery, ClazzVO} from '@/api/exam/clazz/types';
import useSettingsStore from "@/store/modules/settings";
import {DeptVO} from "@/api/system/dept/types";
import {optionSelect as getDeptOptionSelect} from '@/api/system/dept'
import router from "@/router";
import {School, UserFilled, Warning} from "@element-plus/icons-vue";

const settingsStore = useSettingsStore()
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;

const handleCardClick = (clazzId: number) => {
  router.push(`/exam/clazz-data/index/${clazzId}`);
};

const clazzList = ref<ClazzVO[]>([]);
const deptOptions = ref<DeptVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const clazzFormRef = ref<ElFormInstance>();
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ClazzForm = {
  clazzId: undefined,
  clazzName: undefined,
  deptId: undefined,
  description: undefined,
  createDept: undefined,
  remark: undefined
}
const data = reactive<PageData<ClazzForm, ClazzQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    createDept: undefined,
    clazzName: undefined,
    deptId: undefined,
    description: undefined,
    params: {}
  },
  rules: {
    clazzName: [
      {required: true, message: "班级名称不能为空", trigger: "blur"}
    ],
    deptId: [
      {required: true, message: "部门名称不能为空", trigger: "blur"}
    ]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询我的班级列表 */
const getList = async () => {
  loading.value = true;
  const res = await listMyClazz(queryParams.value);
  clazzList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}

/** 查询部门列表 */
const getDeptList = async () => {
  const res = await getDeptOptionSelect()
  deptOptions.value = res.data;
}

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  clazzFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ClazzVO[]) => {
  ids.value = selection.map(item => item.clazzId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加班级";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: ClazzVO) => {
  reset();
  const _clazzId = row?.clazzId || ids.value[0]
  const res = await getClazz(_clazzId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改班级";
}

/** 提交按钮 */
const submitForm = () => {
  clazzFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.clazzId) {
        await updateClazz(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addClazz(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
}

/** 删除按钮操作 */
const handleDelete = async (row?: ClazzVO) => {
  const _clazzIds = row?.clazzId || ids.value;
  await proxy?.$modal.confirm('是否确认删除班级编号为"' + _clazzIds + '"的数据项？').finally(() => loading.value = false);
  await delClazz(_clazzIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}

/*获取绑定码按钮*/
const copyText = async (clazzId: string) => {
  try {
    await navigator.clipboard.writeText(clazzId);
    proxy?.$modal.msgSuccess("绑定码已复制");
  } catch (err) {
    proxy?.$modal.msgError('无法复制文本');
  }
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('exam/clazz/export', {
    ...queryParams.value
  }, `clazz_${new Date().getTime()}.xlsx`)
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
  getDeptList()
  getList();
});
</script>
<style lang="scss" scoped>

</style>

