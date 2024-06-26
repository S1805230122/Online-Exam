<script setup lang="ts">
import useUserStore from "@/store/modules/user";
import {listBinding, userBinding} from "@/api/exam/binding";
import {optionSelect as getDeptOptionSelect} from '@/api/system/dept';
import {BindingForm, BindingQuery, BindingVO} from "@/api/exam/binding/types";
import {DeptVO} from "@/api/system/dept/types";

const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();
const total = ref()
const bindingFormRef = ref<ElFormInstance>();
const initFormData: BindingForm = {
  bindingId: undefined,
  binding: undefined,
  userId: userStore.userId,
  clazzId: undefined,
  bindingType: undefined,
  deptId: undefined,
  name: undefined,
  remark: undefined
}
const data = reactive<PageData<BindingForm, BindingQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    binding: undefined,
    userId: userStore.userId,
    clazzId: undefined,
    bindingType: undefined,
    deptId: undefined,
    name: undefined,
    params: {}
  },
  rules: {
    clazzId: [
      {required: true, message: "绑定码不能为空", trigger: "blur"}
    ],
    deptId: [
      {required: true, message: "单位不能为空", trigger: "blur"}
    ],
    name: [
      {required: true, message: "姓名不能为空", trigger: "blur"}
    ],
  }
});
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  bindingFormRef.value?.resetFields();
}
const {queryParams, form, rules} = toRefs(data);

const bindingList = ref<BindingVO[]>([])
const loading = ref(false)
const getList = async () => {
  loading.value = true;
  const res = await listBinding(queryParams.value);
  bindingList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
const deptOptions = ref<DeptVO[]>([]);
/** 查询部门列表 */
const getDeptList = async () => {
  const res = await getDeptOptionSelect()
  deptOptions.value = res.data;
}
/*添加抽屉*/
const drawer = reactive<DrawerOption>({
  visible: false,
  title: ''
});
const handleAdd = () => {
  reset();
  drawer.visible = true;
  drawer.title = "添加绑定";
}
/** 提交按钮 */
const buttonLoading = ref(false);
const submitForm = async () => {
  buttonLoading.value = true;
  await userBinding(form.value).finally(() => buttonLoading.value = false);
  proxy?.$modal.msgSuccess("绑定成功");
  drawer.visible = false;
  await getList();
}
/** 取消按钮 */
const cancel = () => {
  reset();
  drawer.visible = false;
}
onMounted(() => {
  getDeptList()
  getList()
})
</script>

<template>
  <div class="p-2">
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6" v-for="(item,index) in bindingList">
        <el-card shadow="hover" class="h-15vh">
          <div>
            学校 {{ item.dept.deptName }}
          </div>
          <div class="mt-2">
            姓名 {{ item.name }}
          </div>
          <div v-if="item.bindingType === '0'" class="mt-2">
            学号 {{ item.binding }}
          </div>
          <div v-if="item.bindingType !== '0'" class="mt-2">
            工号 {{ item.binding }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" @click="handleAdd"
                 class="h-15vh flex justify-center items-center cursor-pointer">
          <div>
            <el-text type="primary">
              <svg-icon icon-class="binding" class="mr-2"/>
              绑定新账号
            </el-text>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <el-drawer title="绑定新账号" v-model="drawer.visible" :title="drawer.title" append-to-body size="30%">
    <el-form ref="bindingFormRef" :model="form" :rules="rules" label-width="25%">
      <el-form-item label="单位名称" prop="deptId">
        <el-select v-model="form.deptId" filterable placeholder="请选择">
          <el-option v-for="item in deptOptions" :key="item.deptId" :label="`${item.code} - ${item.deptName}`"
                     :value="item.deptId">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="绑定码" prop="clazzId">
        <el-input v-model="form.clazzId" placeholder="请输入绑定码"/>
      </el-form-item>
      <el-form-item label="学号" prop="binding">
        <el-input v-model="form.binding" placeholder="请输入学号"/>
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-drawer>


</template>

<style scoped lang="scss">

</style>
