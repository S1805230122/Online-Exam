<!--菜单页面的另一种样式-->
<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]" ref="searchContainer">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :inline="true" :model="queryParams">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="queryParams.menuName" clearable placeholder="请输入菜单名称" style="width: 240px"
                        @blur="handleQuery" @keyup.enter="handleQuery"/>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" clearable placeholder="菜单状态" @change="handleQuery">
                <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value">
                  <span style="float: left">{{ dict.label }}</span>
                  <span style="float: right;color: var(--el-text-color-secondary);font-size: 13px;">
                    {{ dict.value }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button v-hasPermi="['system:menu:add']" icon="Plus" plain type="primary" @click="handleAdd()">新增
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="Sort" plain type="info" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" @resetQuery="resetQuery"></right-toolbar>
        </el-row>
      </template>

      <el-table
        ref="menuTableRef"
        v-loading="loading"
        :data="menuList"
        :default-expand-all="isExpandAll"
        :height="tableHeight"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        row-key="menuId"
      >
        <el-table-column :show-overflow-tooltip="true" align="center" fixed label="菜单名称" prop="menuName"
                         width="180"></el-table-column>
        <el-table-column align="center" fixed label="菜单类型" prop="menuType" width="100">
          <template #default="scope">
            <dict-tag :options="sys_menu_type" :value="scope.row.menuType"/>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed label="图标" prop="icon" width="100">
          <template #default="scope">
            <svg-icon :icon-class="scope.row.icon"/>
          </template>
        </el-table-column>
        <el-table-column align="center" label="排序" prop="orderNum" width="60"></el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="权限标识" prop="perms"
                         width="300"></el-table-column>
        <el-table-column :show-overflow-tooltip="true" align="center" label="组件路径" prop="component"
                         width="300"></el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="80">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ scope.row.createTime }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="180">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['system:menu:edit']" circle icon="Edit" plain type="primary"
                         @click="handleUpdate(scope.row)"/>
            </el-tooltip>
            <el-tooltip content="新增" placement="top">
              <el-button v-hasPermi="['system:menu:add']" circle icon="Plus" plain type="success"
                         @click="handleAdd(scope.row)"/>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['system:menu:remove']" circle icon="Delete" plain type="danger"
                         @click="handleDelete(scope.row)"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="dialog.visible" :title="dialog.title" append-to-bod destroy-on-close size="30%">
      <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="menuOptions"
            :props="{ value: 'menuId', label: 'menuName', children: 'children' }"
            check-strictly
            placeholder="选择上级菜单"
            value-key="menuId"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio label="M">目录</el-radio>
            <el-radio label="C">菜单</el-radio>
            <el-radio label="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-col v-if="form.menuType !== 'F'" :span="24">
          <el-form-item label="菜单图标" prop="icon">
            <!-- 图标选择器 -->
            <icon-select v-model="form.icon"/>
          </el-form-item>
        </el-col>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="请输入菜单名称"/>
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :min="0" controls-position="right"/>
        </el-form-item>
        <el-col v-if="form.menuType !== 'F'" :span="24">
          <el-form-item>
            <template #label>
                <span>
                  <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon> </el-tooltip
                  >是否外链
                </span>
            </template>
            <el-radio-group v-model="form.isFrame">
              <el-radio label="0">是</el-radio>
              <el-radio label="1">否</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'F'" :span="24">
          <el-form-item prop="path">
            <template #label>
                <span>
                  <el-tooltip content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头"
                              placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  路由地址
                </span>
            </template>
            <el-input v-model="form.path" placeholder="请输入路由地址"/>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="24">
          <el-form-item prop="component">
            <template #label>
                <span>
                  <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  组件路径
                </span>
            </template>
            <el-input v-model="form.component" placeholder="请输入组件路径"/>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'M'" :span="24">
          <el-form-item>
            <el-input v-model="form.perms" maxlength="100" placeholder="请输入权限标识"/>
            <template #label>
                <span>
                  <el-tooltip content="控制器中定义的权限字符，如：@SaCheckPermission('system:user:list')"
                              placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  权限字符
                </span>
            </template>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="24">
          <el-form-item>
            <el-input v-model="form.queryParam" maxlength="255" placeholder="请输入路由参数"/>
            <template #label>
                <span>
                  <el-tooltip content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`' placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  路由参数
                </span>
            </template>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType === 'C'" :span="24">
          <el-form-item>
            <template #label>
                <span>
                  <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  是否缓存
                </span>
            </template>
            <el-radio-group v-model="form.isCache">
              <el-radio label="0">缓存</el-radio>
              <el-radio label="1">不缓存</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col v-if="form.menuType !== 'F'" :span="24">
          <el-form-item>
            <template #label>
                <span>
                  <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  显示状态
                </span>
            </template>
            <el-radio-group v-model="form.visible">
              <el-radio v-for="dict in sys_show_hide" :key="dict.value" :label="dict.value">{{
                  dict.label
                }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-form-item>
          <template #label>
                <span>
                  <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                    <el-icon>
                      <question-filled/>
                    </el-icon>
                  </el-tooltip>
                  菜单状态
                </span>
          </template>
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.value">
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
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

<script lang="ts" name="Menu" setup>
import {addMenu, delMenu, getMenu, listMenu, updateMenu} from '@/api/system/menu';
import {MenuForm, MenuQuery, MenuVO} from '@/api/system/menu/types';
import {MenuTypeEnum} from '@/enums/MenuTypeEnum';
import useSettingsStore from "@/store/modules/settings";

interface MenuOptionsType {
  menuId: number;
  menuName: string;
  children: MenuOptionsType[] | undefined;
}

const {proxy} = getCurrentInstance() as ComponentInternalInstance
const {
  sys_show_hide,
  sys_normal_disable,
  sys_menu_type
} = toRefs<any>(proxy?.useDict("sys_show_hide", "sys_normal_disable", "sys_menu_type"));
const menuList = ref<MenuVO[]>([])
const loading = ref(true)
const showSearch = ref(true)
const menuOptions = ref<MenuOptionsType[]>([])
const isExpandAll = ref(false)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null)
const queryFormRef = ref<ElFormInstance>();
const menuFormRef = ref<ElFormInstance>();
const initFormData = {
  path: '',
  menuId: undefined,
  parentId: 0,
  menuName: '',
  icon: '',
  menuType: MenuTypeEnum.M,
  orderNum: 1,
  isFrame: "1",
  isCache: "0",
  visible: "0",
  status: "0"
}
const data = reactive<PageData<MenuForm, MenuQuery>>({
  form: {...initFormData},
  queryParams: {
    menuName: undefined,
    status: undefined
  },
  rules: {
    menuName: [{required: true, message: "菜单名称不能为空", trigger: "blur"}],
    orderNum: [{required: true, message: "菜单顺序不能为空", trigger: "blur"}],
    path: [{required: true, message: "路由地址不能为空", trigger: "blur"}]
  },
})

const menuTableRef = ref<ElTableInstance>();

const {queryParams, form, rules} = toRefs<PageData<MenuForm, MenuQuery>>(data)
/** 查询菜单列表 */
const getList = async () => {
  loading.value = true
  const res = await listMenu(queryParams.value);
  const data = proxy?.handleTree<MenuVO>(res.data, "menuId")
  if (data) {
    menuList.value = data
  }
  loading.value = false
}
/** 查询菜单下拉树结构 */
const getTreeselect = async () => {
  menuOptions.value = []
  const response = await listMenu();
  const menu: MenuOptionsType = {menuId: 0, menuName: "主类目", children: []}
  index.children = proxy?.handleTree<MenuOptionsType>(response.data, "menuId")
  menuOptions.value.push(index)
}
/** 取消按钮 */
const cancel = () => {
  reset()
  dialog.visible = false
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  menuFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
}
/** 新增按钮操作 */
const handleAdd = (row?: MenuVO) => {
  reset();
  getTreeselect();
  row && row.menuId ? form.value.parentId = row.menuId : form.value.parentId = 0;
  dialog.visible = true;
  dialog.title = "添加菜单";
}
/** 展开/折叠操作 */
const handleToggleExpandAll = () => {
  isExpandAll.value = !isExpandAll.value;
  toggleExpandAll(menuList.value, isExpandAll.value)
}
/** 展开/折叠所有 */
const toggleExpandAll = (data: MenuVO[], status: boolean) => {
  data.forEach((item: MenuVO) => {
    menuTableRef.value?.toggleRowExpansion(item, status)
    if (item.children && item.children.length > 0) toggleExpandAll(item.children, status)
  })
}
/** 修改按钮操作 */
const handleUpdate = async (row: MenuVO) => {
  reset();
  await getTreeselect();
  if (row.menuId) {
    const {data} = await getMenu(row.menuId);
    form.value = data;
  }
  dialog.visible = true;
  dialog.title = "修改菜单";
}
/** 提交按钮 */
const submitForm = () => {
  menuFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.menuId ? await updateMenu(form.value) : await addMenu(form.value);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      await getList();
    }
  })
}
/** 删除按钮操作 */
const handleDelete = async (row: MenuVO) => {
  await proxy?.$modal.confirm('是否确认删除名称为"' + row.menuName + '"的数据项?');
  await delMenu(row.menuId);
  await getList();
  proxy?.$modal.msgSuccess("删除成功");
}
// 自适应表格高度
const tableHeight = ref<number | string>(0); // 表格的高度
// 获取tags显示状态
const settingsStore = useSettingsStore()
const storeSettings = computed(() => settingsStore);
const showTags = ref(storeSettings.value.tagsView);
const height = ref(0)
// 用于计算表格高度的函数
const calculateTableHeight = () => {
  const breadcrumbHeight = showTags.value ? ref(34) : ref(0); // 面包屑导航的高度
  const searchHeight = showSearch.value ? ref(height.value) : ref(0); // 搜索栏的高度
  const viewportHeight = window.innerHeight;
  // 减去页面头部、面包屑导航、搜索栏和表格底部的分页组件等的高度
  const headerHeight = 50; // 页面头部高度
  const paginationHeight = 0; // 分页组件高度
  const paddingAndMargins = 110; // 其他可能的内边距和外边距
  tableHeight.value = viewportHeight - headerHeight - breadcrumbHeight.value - searchHeight.value - paddingAndMargins - paginationHeight;
}
// 监听showSearch的变化
watch(showSearch, () => {
  calculateTableHeight();
});
onMounted(() => {
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight + 12;
  }
  calculateTableHeight()
  getList();
});
</script>
<style lang="scss" scoped>

</style>
