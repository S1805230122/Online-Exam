<template>
  <div :class="{ hasTagsView: needTagsView }" class="main-content">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" ref="searchContainer" class="search">
        <el-form ref="queryFormRef" :inline="true" :model="queryParams">
          <div class="custom-radio-group">
            <el-radio-group v-model="tableStyle">
              <el-radio-button label="Grid">
                <svg-icon icon-class="grid"/>
              </el-radio-button>
              <el-radio-button label="List">
                <svg-icon icon-class="table-list"/>
              </el-radio-button>
            </el-radio-group>
          </div>
          <el-form-item v-if="displayValue" label="部门名称" prop="deptId">
            <el-select v-model="queryParams.deptId" filterable style="width: 200px" @change="handleQuery" clearable>
              <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                         :value="item.deptId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="班级名称" prop="clazzId">
            <el-select v-model="queryParams.clazzId" filterable style="width: 200px"
                       @change="handleQuery" clearable>
              <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="课程名称" prop="courseName">
            <el-input v-model="queryParams.courseName" clearable placeholder="请输入课程名称" style="width: 240px"
                      @blur="handleQuery" @keyup.enter="handleQuery"/>
          </el-form-item>
          <div class="float-right">
            <el-button v-hasPermi="['exam:course:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </div>
        </el-form>
      </div>
    </transition>
    <el-scrollbar v-if="tableStyle==='Grid'">
      <el-card class="card-content">
        <el-row :gutter="20">
          <el-col :span="6" v-for="item in courseList" class="mb-5">
            <router-link  :to="'/exam/statistics/index/' + item.courseId">
              <el-card>
                <div class="flex justify-between">
                  <el-text size="large" class="w-50%" truncated>{{ item.courseName }}</el-text>
                  <el-tag round>
                    <svg-icon icon-class="school"/>
                    {{ item["dept"]["deptName"] }}
                  </el-tag>
                </div>
                <div class="mt-2">
                  <el-text>
                    <svg-icon icon-class="user"/>
                    {{ item["user"]["userName"] }}
                  </el-text>
                </div>
                <div class="mt-2">
                  <el-text>
                    <svg-icon icon-class="members"/>
                    {{ item.memberCount }}
                    成员
                    ·
                    <svg-icon icon-class="question-set"/>
                    {{ item.questionSetCount }} 题目集
                  </el-text>
                </div>
                <template #footer>
                  <div class="flex justify-end items-center">
                    <el-tooltip placement="top">
                      <template #content>
                        <span>修改</span>
                      </template>
                      <el-button circle plain type="primary" icon="Edit" @click.prevent.stop="handleUpdate(item)"
                                 v-hasPermi="['exam:paper:edit']"></el-button>
                    </el-tooltip>
                    <el-divider direction="vertical"/>
                    <el-tooltip content="删除" placement="top">
                      <el-button circle plain type="danger" icon="Delete" @click.prevent.stop="handleDelete(item)"
                                 v-hasPermi="['exam:paper:remove']"></el-button>
                    </el-tooltip>
                  </div>
                </template>
              </el-card>
            </router-link>
          </el-col>
        </el-row>

      </el-card>

    </el-scrollbar>
    <el-card class="card-content" v-if="tableStyle==='List'" shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:course:add']" icon="Plus" plain type="primary" @click="handleAdd">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:course:edit']" :disabled="single" icon="Edit" plain type="success"
                       @click="handleUpdate()">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:course:remove']" :disabled="multiple" icon="Delete" plain type="danger"
                       @click="handleDelete()">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['exam:course:export']" icon="Download" plain type="warning" @click="handleExport">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" :columns="columns" @queryTable="getList"
                         @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="courseList" :height="tableHeight" @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="55"/>
        <el-table-column v-if="columns[0].visible" align="center" label="课程编号" min-width="200" prop="courseId"/>
        <el-table-column v-if="columns[1].visible" align="center" label="课程名称" min-width="150" prop="courseName">
          <template #default="scope">
            <router-link :to="'/exam/statistics/index/' + scope.row.courseId">
              <el-text type="primary">{{ scope.row.courseName }}</el-text>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[2].visible" align="center" label="班级编号" min-width="200" prop="clazzId"/>
        <el-table-column v-if="columns[3].visible" :show-overflow-tooltip="true" align="center" label="班级名称"
                         min-width="150" prop="clazz.clazzName"/>
        <el-table-column v-if="columns[4].visible" align="center" label="成员数量" min-width="100"
                         prop="clazz.member"/>
        <el-table-column v-if="columns[5].visible" align="center" label="创建者编号" min-width="200" prop="userId"/>
        <el-table-column v-if="columns[6].visible" :show-overflow-tooltip="true" align="center" label="创建者"
                         min-width="150" prop="user.userName"/>
        <el-table-column v-if="columns[7].visible" align="center" label="部门编号" min-width="200" prop="deptId"/>
        <el-table-column v-if="columns[8].visible" :show-overflow-tooltip="true" align="center" label="部门名称"
                         min-width="150" prop="dept.deptName"/>
        <el-table-column v-if="columns[9].visible" :show-overflow-tooltip="true" align="center" label="课程描述"
                         min-width="200" prop="description"/>
        <el-table-column align="center" class-name="small-padding fixed-width" fixed="right" label="操作" width="130">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['exam:course:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"/>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['exam:course:remove']" circle icon="Delete" plain type="danger"
                         @click="handleDelete(scope.row)"/>
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
    <!-- 添加或修改课程对话框 -->
    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-body size="30%">
      <el-form ref="courseFormRef" :model="form" :rules="rules" label-width="25%">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="form.courseName" placeholder="请输入课程名称"/>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptId">
          <el-select v-model="form.deptId" filterable placeholder="请选择" @change="getClazzList">
            <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                       :value="item.deptId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="班级名称" prop="clazzId">
          <el-select v-model="form.clazzId" filterable placeholder="请选择">
            <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="form.description" placeholder="请输入课程描述"/>
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

<script lang="ts" name="Course" setup>
import {addCourse, delCourse, getCourse, listCourse, updateCourse} from "@/api/exam/course";
import {CourseForm, CourseQuery, CourseVO} from "@/api/exam/course/types";
import useSettingsStore from "@/store/modules/settings";
import {ClazzVO} from "@/api/exam/clazz/types";
import {optionSelect as getClazzOptionSelect} from "@/api/exam/clazz";
import {optionSelect as getDeptOptionSelect} from "@/api/system/dept";
import {DeptVO} from "@/api/system/dept/types";
import useUserStore from "@/store/modules/user";

const settingsStore = useSettingsStore();
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
/*表格样式*/
const tableStyle = ref("Grid");
const courseList = ref<CourseVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const clazzOptions = ref<ClazzVO[]>([]);
const queryFormRef = ref<ElFormInstance>();
const courseFormRef = ref<ElFormInstance>();
const deptOptions = ref<DeptVO[]>([]);
/*是否显示部门搜索*/
const isDisplay = ref(false);
/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null);

const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});

// 列显隐信息
const columns = ref<FieldOption[]>([
  {key: 0, label: `课程编号`, visible: false, children: []},
  {key: 1, label: `课程名称`, visible: true, children: []},
  {key: 2, label: `班级编号`, visible: false, children: []},
  {key: 3, label: `班级名称`, visible: true, children: []},
  {key: 4, label: `成员数量`, visible: true, children: []},
  {key: 5, label: `创建者编号`, visible: false, children: []},
  {key: 6, label: `创建者`, visible: true, children: []},
  {key: 7, label: "部门编号", visible: false, children: []},
  {key: 8, label: `部门名称`, visible: true, children: []},
  {key: 9, label: `课程描述`, visible: true, children: []},
  {key: 10, label: `备注信息`, visible: false, children: []}

]);

const initFormData: CourseForm = {
  courseId: undefined,
  courseName: undefined,
  clazzId: undefined,
  description: undefined,
  remark: undefined
};
const data = reactive<PageData<CourseForm, CourseQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    courseName: undefined,
    clazzId: undefined,
    deptId: undefined,
    description: undefined,
    params: {}
  },
  rules: {
    courseName: [
      {required: true, message: "课程名称不能为空", trigger: "blur"}
    ],
    deptId: [
      {required: true, message: "部门名称不能为空", trigger: "blur"}
    ],
    clazzId: [
      {required: true, message: "班级名称不能为空", trigger: "blur"}
    ]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询课程列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCourse(queryParams.value);
  courseList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};

/** 查询部门列表 */
const getDeptList = async () => {
  const res = await getDeptOptionSelect();
  deptOptions.value = res.data;
};

/** 查询班级列表 */
const getClazzList = async () => {
  const res = await getClazzOptionSelect();
  clazzOptions.value = res.data;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  courseFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getClazzList();
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: CourseVO[]) => {
  ids.value = selection.map(item => item.courseId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "添加课程";
};

/** 修改按钮操作 */
const handleUpdate = async (row?: CourseVO) => {
  reset();
  const _courseId = row?.courseId || ids.value[0];
  const res = await getCourse(_courseId);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = "修改课程";
};

/** 提交按钮 */
const submitForm = () => {
  courseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.courseId) {
        await updateCourse(form.value).finally(() => buttonLoading.value = false);
      } else {
        await addCourse(form.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess("修改成功");
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: CourseVO) => {
  const _courseIds = row?.courseId || ids.value;
  await proxy?.$modal.confirm("是否确认删除课程编号为\"" + _courseIds + "\"的数据项？").finally(() => loading.value = false);
  await delCourse(_courseIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("exam/course/export", {
    ...queryParams.value
  }, `course_${new Date().getTime()}.xlsx`);
};

/*定义窗口高度*/
const screenHeight = ref(window.innerHeight);
const tableHeight = ref<number | string>(0);
const height = ref(0);

function handleResize() {
  screenHeight.value = window.innerHeight;
}

const calculateTableHeight = () => {
  const searchHeight = showSearch.value ? ref(height.value) : ref(-12); // 搜索栏的高度
  const tagsViewHeight = needTagsView.value ? ref(34) : ref(0);
  tableHeight.value = screenHeight.value - 50 - tagsViewHeight.value - 26 - searchHeight.value - 170;
};
watch(showSearch, () => {
  calculateTableHeight();
});
/*响应式监听*/
watchEffect(() => {
  calculateTableHeight();
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// 根据当前用户权限显示搜索
const roles = computed(() => useUserStore().roles);
const displayValue = computed({
  get() {
    // 当roles包含'superadmin'或者‘deptadmin’时返回true，否则返回false
    return roles.value.some(role => role === "superadmin");
  },
  set(value) {
    // 当尝试设置值时，我们可以在这里执行一些操作，或者直接更新isDisplay
    isDisplay.value = value;
  }
});

onMounted(() => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  window.addEventListener("resize", handleResize);
  calculateTableHeight();
  getDeptList();
  getClazzList();
  getList();
});
</script>
<style lang="scss" scoped>
.search .el-form {
  display: flex;
  justify-content: space-between;
  justify-items: center;
  text-align: center;

  .el-form-item {
    margin: 0;
  }

  .el-form-item--default {
    margin: 0;
  }
}
</style>
