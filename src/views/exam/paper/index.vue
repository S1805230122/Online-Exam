<template>
  <div class="main-content" :class="{ hasTagsView: needTagsView }">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
                :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch" ref="searchContainer">
        <el-form :model="queryParams" style="text-align: center" ref="queryFormRef" :inline="true" label-width="25%"
                 class="flex justify-between items-center text-center">
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

          <el-form-item label="试卷名称" prop="paperName">
            <el-input v-model="queryParams.paperName" placeholder="请输入试卷名称" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery"/>
          </el-form-item>
          <el-form-item label="试卷类型" prop="paperMode">
            <el-input v-model="queryParams.paperMode" placeholder="请输入试卷类型" clearable style="width: 240px"
                      @keyup.enter="handleQuery" @blur="handleQuery"/>
          </el-form-item>
          <el-form-item label="状态" prop="status" class="w-20%">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable @change="handleQuery">
              <el-option
                v-for="dict in exam_paper_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <div class="float-right">
            <el-button type="primary" plain icon="Plus" class="w-30" @click="handleAdd" v-hasPermi="['exam:paper:add']">
              新增
            </el-button>
          </div>
        </el-form>
      </div>
    </transition>
    <el-scrollbar v-if="tableStyle==='Grid'">
      <el-card class="card-content" v-if="tableStyle==='Grid'">
        <el-row :gutter="20">
          <el-col :span="6" v-for="item in paperList" class="mb-5">
            <el-card>
              <div class="flex justify-between">
                <el-text size="large" class="w-80%" truncated>{{ item.paperName }}</el-text>
                <dict-tag :options="exam_paper_mode" :value="item.paperMode"/>
              </div>
              <div class="mt-2">
                <el-text v-if="item.status==='0'" size="small" type="info" :underline="false">未发布</el-text>
                <el-text v-if="item.status==='1'" size="small" type="success" :underline="false">已开放</el-text>
                <el-text v-if="item.status==='2'" size="small" type="danger" :underline="false">已关闭</el-text>
              </div>
              <div class="mt-2">
                <el-tag round v-for="(clazzId, index) in item.clazzIdList" :key="index"
                        :style="{ 'background-color': getTagColor(index+1),'color': getFontColor(index+1),'border-color': getBorderColor(index+1), 'margin-right': '5px' }">
                  {{ clazzOptions.find(option => option.clazzId === clazzId)?.clazzName }}
                </el-tag>
              </div>
              <div class="mt-2">
                <el-text type="info"> {{ item["answerCount"] }} 份数据</el-text>
                ·
                <el-text>试卷总分 {{ item["paperContentObj"]["attribute"]["examScore"] }}</el-text>
              </div>
              <template #footer>
                <div class="flex justify-end items-center">
                  <el-tooltip content="预览" placement="top">
                    <el-button circle plain icon="View" @click="handlePreview(item)"
                               ></el-button>
                  </el-tooltip>
                  <el-divider direction="vertical"/>
                  <el-tooltip v-if="item.status==='0'" content="发布" placement="top">
                    <el-button circle plain type="success" @click="handleRelease(item)">
                      <template #icon>
                        <svg-icon icon-class="publish"/>
                      </template>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip v-if="item.status==='1'" content="取消发布" placement="top">
                    <el-button circle plain type="info" @click="handleCancelRelease(item)">
                      <template #icon>
                        <svg-icon icon-class="unpublish"/>
                      </template>
                    </el-button>
                  </el-tooltip>
                  <el-divider direction="vertical" v-if="item.status!=='2'"/>
                  <el-tooltip placement="top">
                    <template #content>
                      <span>修改</span>
                    </template>
                    <el-button circle plain type="primary" icon="Edit" @click="handleUpdate(item);handlePaperData(item)"
                               v-hasPermi="['exam:paper:edit']"></el-button>
                  </el-tooltip>
                  <el-divider direction="vertical"/>
                  <el-tooltip content="试卷数据" placement="top">
                    <el-button circle plain type="warning" @click="handlePaperData(item);paperViewFlag = 'Data'"
                               v-hasPermi="['exam:paper:remove']">
                      <svg-icon icon-class="data"/>
                    </el-button>
                  </el-tooltip>
                  <el-divider direction="vertical"/>
                  <el-tooltip content="删除" placement="top">
                    <el-button circle plain type="danger" icon="Delete" @click="handleDelete(item)"
                               v-hasPermi="['exam:paper:remove']"></el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </el-scrollbar>
    <el-card shadow="never" v-show="tableStyle==='List'" class="card-content">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
                       v-hasPermi="['exam:paper:edit']">修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"
                       v-hasPermi="['exam:paper:remove']">删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['exam:paper:export']">
              导出
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @resetQuery="resetQuery" @queryTable="getList"
                         :columns="columns"></right-toolbar>
        </el-row>
      </template>
      <el-table v-loading="loading" :data="paperList" @selection-change="handleSelectionChange" :height="tableHeight">
        <el-table-column fixed type="selection" width="55" align="center"/>
        <el-table-column v-if="columns[0].visible" label="试卷ID" align="center" prop="paperId" min-width="200"/>
        <el-table-column v-if="columns[1].visible" label="课程ID" align="center" prop="courseId" min-width="200"/>
        <el-table-column v-if="columns[3].visible" label="试卷名称" align="center" prop="paperName" min-width="200"/>
        <el-table-column v-if="columns[4].visible" label="试卷类型" align="center" prop="paperMode" min-width="100">
          <template #default="scope">
            <dict-tag :options="exam_paper_mode" :value="scope.row.paperMode"/>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[2].visible" label="班级名称" align="center" prop="clazzIdList" min-width="200">
          <template #default="scope">
            <el-tag v-for="(clazzId, index) in scope.row.clazzIdList" :key="index"
                    :style="{ 'background-color': getTagColor(index+1),'color': getFontColor(index+1),'border-color': getBorderColor(index+1), 'margin-right': '5px' }">
              {{ clazzOptions.find(option => option.clazzId === clazzId)?.clazzName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columns[5].visible" label="状态" align="center" prop="status" min-width="80">
          <template #default="scope">
            <dict-tag :options="exam_paper_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column label="数据统计" align="center" prop="answerCount" min-width="100">
        </el-table-column>
        <el-table-column label="试卷总分" prop="paperContentObj.attribute.examScore"></el-table-column>
        <el-table-column v-if="columns[6].visible" label="描述" :show-overflow-tooltip="true" align="center"
                         prop="remark" min-width="200"/>
        <el-table-column fixed="right" label="操作" align="center" class-name="small-padding fixed-width" width="280">
          <template #default="scope">
            <el-button circle plain icon="View" @click="handlePreview(scope.row)"
                       v-hasPermi="['exam:paper:preview']"></el-button>

            <el-tooltip v-if="scope.row.status==='0'" content="发布" placement="top">
              <el-button circle plain type="success" @click="handleRelease(scope.row)">
                <template #icon>
                  <svg-icon icon-class="publish"/>
                </template>
              </el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.status==='1'" content="取消发布" placement="top">
              <el-button circle plain type="info" @click="handleCancelRelease(scope.row)">
                <template #icon>
                  <svg-icon icon-class="unpublish"/>
                </template>
              </el-button>
            </el-tooltip>
            <el-tooltip placement="top">
              <template #content>
                <span v-if="scope.row.status==='0'">修改</span>
                <span v-if="scope.row.status==='1'">先取消发布</span>
              </template>
              <el-button circle plain type="primary" icon="Edit"
                         @click="handleUpdate(scope.row);handlePaperData(scope.row)"
                         :disabled="scope.row.status==='1'"
                         v-hasPermi="['exam:paper:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="试卷数据" placement="top">
              <el-button circle plain type="warning" @click="handlePaperData(scope.row); paperViewFlag = 'Data'"
                         v-hasPermi="['exam:paper:remove']">
                <svg-icon icon-class="data"/>
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button circle plain type="danger" icon="Delete" @click="handleDelete(scope.row)"
                         v-hasPermi="['exam:paper:remove']"></el-button>
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
    <!-- 添加或修改试卷对话框 -->
    <el-drawer :title="drawer.title" v-model="drawer.visible" :append-to-body="true" :show-close="false"
               :with-header="false" class="full-drawer"
               size="100%">
      <el-header class="flex paper-header justify-between items-center">
        <el-button v-if="!isInput" @click="toggleInput">{{ paperForm.title }}</el-button>
        <el-input v-if="isInput" ref="paperNameInputRef" v-model="paperForm.title" @blur="handleBlur"
                  style="width: 200px"></el-input>
        <el-tabs
          v-if="drawer.title==='修改试卷'"
          class="w-230 "
          tab-position="bottom"
          v-model="paperViewFlag"
          stretch
          style="background-color: #FFFFFF;"
        >
          <el-tab-pane name="Edit">
            <template #label>
              <div style="font-size: 16px">
                <svg-icon icon-class="edit"/>
                <span class="ml-4">编辑试卷</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane name="Setting">
            <template #label>
              <div style="font-size: 16px">
                <svg-icon icon-class="setting"/>
                <span class="ml-4">试卷设置</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane name="Data">
            <template #label>
              <div style="font-size: 16px">
                <svg-icon icon-class="data"/>
                <span class="ml-4">查看数据</span>
              </div>
            </template>
          </el-tab-pane>
<!--          <el-tab-pane name="Count">-->
<!--            <template #label>-->
<!--              <div style="font-size: 16px">-->
<!--                <svg-icon icon-class="statistics"/>-->
<!--                <span class="ml-4">统计报表</span>-->
<!--              </div>-->
<!--            </template>-->
<!--          </el-tab-pane>-->
        </el-tabs>
        <div>
          <el-button round plain :loading="buttonLoading" type="success" icon="check" @click="submitForm">保存
          </el-button>
          <el-button round plain type="danger" icon="close" @click="cancel">关闭</el-button>
        </div>

      </el-header>
      <el-container v-if="paperViewFlag==='Edit'" class="paper-wrapper">
        <el-aside class="sidebar-container drawer-left-menu">
          <el-tabs :stretch="true">
            <el-tab-pane label="题型">
              <VueDraggable
                v-model="questionTypeList"
                animation="150"
                ghostClass="ghost"
                :group="{ name: 'question', pull: 'clone', put: false }"
                :sort="false"
                class="question-type flex w-100%  rounded"
              >
                <div
                  v-for="item in questionTypeList"
                  :key="item.type"
                  class="question-type-item"
                >
                  <div v-if="item.type==='Radio'">
                    <div>
                      <svg-icon icon-class="radio"/>
                    </div>
                    <span>单选题</span>
                  </div>
                  <div v-if="item.type==='Checkbox'">
                    <div>
                      <svg-icon icon-class="checkbox"/>
                    </div>
                    <span>多选题</span>
                  </div>
                  <div v-if="item.type==='TrueFalse'">
                    <div>
                      <svg-icon icon-class="true-false"/>
                    </div>
                    <span>判断题</span>
                  </div>
                  <div v-if="item.type==='MultipleBlank'">
                    <div>
                      <svg-icon icon-class="multiple-blank"/>
                    </div>
                    <span>填空题</span>
                  </div>
                  <div v-if="item.type==='Textarea'">
                    <div>
                      <svg-icon icon-class="textarea"/>
                    </div>
                    <span>简答题</span>
                  </div>
                </div>
              </VueDraggable>
            </el-tab-pane>
            <el-tab-pane label="大纲">
              <VueDraggable
                v-model="paperForm.children"
                animation="300"
                class="flex flex-col  m-auto"
                ghostClass="ghost"
                handle=".handle"
              >
                <div v-for="(question, index) in paperForm.children" class="synopsis">
                  <div class="outline-icon">
                    <svg-icon class="handle cursor-move mr-1 " icon-class="drag-and-drop"></svg-icon>
                  </div>
                  <div v-if="index<9" class="outline-num mr-1">0{{ index + 1 }}</div>
                  <div v-if="index>=9" class="outline-num mr-1">{{ index + 1 }}</div>
                  <div class="outline-item">{{ question["title"] }}</div>
                </div>
              </VueDraggable>
            </el-tab-pane>
          </el-tabs>
        </el-aside>
        <el-container class="paper-wrapper">
          <el-header class="flex justify-between items-center">
            <el-button plain>总分{{ paperForm.attribute.examScore }}分</el-button>
            <el-button-group>
              <el-button :disabled="viewFlag==='Edit'" plain @click="editView">编辑</el-button>
              <el-button :disabled="viewFlag==='Json'" plain @click="jsonView">JSON</el-button>
              <!--              <el-button :disabled="viewFlag==='View'" plain @click="viewView">预览</el-button>-->
              <el-button plain @click="questionSetView">题库</el-button>
            </el-button-group>
          </el-header>
          <el-main>
            <el-scrollbar>
              <el-card shadow="hover">
                <VueDraggable
                  v-model="paperForm.children"
                  animation="300"
                  class="question-edit flex flex-col  w-90% m-auto rounded"
                  ghostClass="ghost"
                  group="question"
                  handle=".handle-item"
                >
                  <div v-for="(question, index) in paperForm.children" v-if="viewFlag==='Edit'"
                       :class="{ 'hover-style': hoverQuestionIndex === index, 'clicked-style': clickedQuestionIndex === index }"
                       @click="handleClickQuestion(index)" @mouseenter="hoverQuestionIndex = index"
                       @mouseleave="hoverQuestionIndex = null"
                  >
                    <!--右侧工具栏-->
                    <div class="right-tool-bar"><!--复制-->
                      <el-tooltip :effect="'light'" content="复制" placement="right">
                        <div @click="copyQuestion(index,question)">
                          <svg-icon icon-class="copy" color="#333333"/>
                        </div>
                      </el-tooltip>
                      <el-tooltip :effect="'light'" content="移除" placement="right">
                        <div @click="removeQuestion(index)">
                          <svg-icon icon-class="delete" color="#DC143C"/>
                        </div>
                      </el-tooltip>
                    </div>

                    <div class="ml-50% mr-50%">
                      <svg-icon style="font-size: 32px" class="handle-item cursor-move"
                                icon-class="drag-and-drop-transverse"/>
                    </div>
                    <div class="p-4 mt--8" @click="handleQuestion(question)">
                      <div class="form-item-title">
                        <span><b>{{ index + 1 }}</b></span>
                        <input v-model="question.title" class="form-input question-title" type="text"/>
                        <span class="score">最高分值: {{ question["attribute"]["examScore"] }} 分</span>
                      </div>
                      <div v-if="question.description!==null&&question.description!==undefined"
                           class="form-item-description">
                        <input v-model="question.description" class="form-input question-title ml-10"
                               type="text" placeholder="请输入题干说明"/>
                      </div>
                      <VueDraggable
                        v-model="question.children"
                        animation="300"
                        class="flex flex-col  p-4 w-100% rounded"
                        ghostClass="ghost"
                        handle=".handle"
                      >
                        <div v-for="(item,i) in question.children"
                             :key="item.id"
                             class="item h-35px  rounded flex items-center px-4"
                             style="width: 80%;position: relative;">
                          <svg-icon class="handle cursor-move mr-5" icon-class="drag-and-drop"></svg-icon>
                          <svg-icon
                            v-if="question.type==='Radio' || question.type==='TrueFalse'"
                            class="ml-1"
                            icon-class="radio-hollow"></svg-icon>
                          <svg-icon v-if="question.type==='Checkbox'" class="ml-1"
                                    icon-class="checkbox-hollow"></svg-icon>
                          <input v-if="question.type==='MultipleBlank'" class="form-input form-input-title"
                                 v-model="item.title" type="text">
                          <!--单选题，多选题，判断题-->
                          <input
                            v-if="question.type==='Radio'||question.type==='Checkbox' ||question.type==='TrueFalse'"
                            v-model="item.title" class="form-input" type="text"/>
                          <!--填空题-->
                          <input v-if="question.type==='MultipleBlank'"
                                 v-model="item.attribute.examCorrectAnswer" class="form-input" type="text"/>
                          <!--简答题-->
                          <textarea v-if="question.type==='Textarea'"
                                    v-model="item.attribute.examCorrectAnswer" class="form-input form-textarea"
                                    type="textarea"/>
                          <span
                            v-if="item.attribute.examCorrectAnswer===item.id && question.attribute.examAnswerMode!=='select' && question.attribute.examAnswerMode!=='selectCorrect'  && question.type!=='Textarea' && question.type!=='MultipleBlank' "
                            class="form-answer">(正确答案)</span>
                          <span
                            v-if="item.attribute.examCorrectAnswer!==null && question.attribute.examAnswerMode==='select' "
                            class="form-answer">(分值{{ item.attribute.examScore }})</span>
                          <span
                            v-if="item.attribute.examCorrectAnswer!==null && question.attribute.examAnswerMode==='selectCorrect'"
                            class="form-answer">(分值{{ item.attribute.examScore }})</span>
                          <!--                          题目选项按钮组-->
                          <div class="form-remove">
                            <svg-icon class="cursor-pointer mr-2" icon-class="cancel"
                                      @click="remove(<number>index,<number>i)" color="#DC143C"></svg-icon>
                          </div>
                        </div>
                      </VueDraggable>
                      <div class="mb-4">
                        <div v-if="clickedQuestionIndex!==index" style="float: right">
                          <el-tag v-if="question.tags.length===0" type="info">无</el-tag>
                          <el-tag
                            v-for="(tag,index) in question.tags"
                            v-else :key="tag"
                            :style="{ 'background-color': getTagColor(index+1),'color': getFontColor(index+1),'border-color': getBorderColor(index+1), 'margin-right': '5px' }"
                            effect="light">
                            {{ tag }}
                          </el-tag>
                        </div>
                        <div v-if="clickedQuestionIndex!==index" style="float: right" class="mr-10">
                          <el-tag v-if="question.difficultyName===''" type="info">无</el-tag>
                          <el-tag
                            v-else
                            type="success"
                            effect="light">
                            {{ question["difficultyName"] }}
                          </el-tag>
                        </div>
                        <div v-if="clickedQuestionIndex===index" class="form-select">
                          <el-form>
                            <!--添加选项-->
                            <el-form-item
                              v-if="question.type==='Radio'||question.type==='Checkbox'||question.type==='MultipleBlank'">
                              <el-button icon="plus" plain type="success" @click="addItem(index)">
                                添加选项
                              </el-button>
                            </el-form-item>
                            <div class="flex ">
                              <el-select v-model="questionInfo.difficultyName"
                                         style="width: 20%" class="mr-5" filterable allow-create @change="isTagsNull()">
                                <el-option v-for="item in difficultyTagOptions" :key="item.tagId" :label="item.tagName"
                                           :value="item.tagName">
                                </el-option>
                              </el-select>
                              <el-select
                                v-model="questionInfo.tags"
                                :max-collapse-tags="3"
                                :reserve-keyword="false"
                                allow-create
                                clearable
                                collapse-tags
                                collapse-tags-tooltip
                                filterable
                                multiple
                                placeholder="选择标签"
                                value-key="tagsName"
                                style="width: 70%"
                                @change="isTagsNull()"
                              >
                                <el-option v-for="item in tagTypeOptions" :key="item.tagId" :label="item.tagName"
                                           :value="item.tagName">
                                </el-option>
                              </el-select>
                            </div>
                          </el-form>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="viewFlag==='Json'">
                    <div class="json-viewer-box">
                      <JsonViewer
                        :boxed="true"
                        :copyable="{copyText: '复制', copiedText: '已复制'}"
                        :expand-depth="10"
                        :expanded="true"
                        :value="paperForm"
                        theme="light"
                      />
                    </div>
                  </div>
                  <div v-if="paperForm.children.length===0 && viewFlag==='Edit'" class="m-auto"
                       v-html="DragDemonstration">
                  </div>
                </VueDraggable>
              </el-card>
            </el-scrollbar>
          </el-main>
        </el-container>
        <el-aside class="sidebar-container drawer-shadow">
          <el-tabs :stretch="true">
            <el-tab-pane label="题目设置" :disabled="clickedQuestionIndex===null">
              <!--          题目配置-->
              <el-form v-if="questionInfoFlag" :label-position="'top'">
                <!--            计分方式-->
                <el-form-item v-if="questionInfo.type!=='TrueFalse' && questionInfo.type!=='Textarea'" label="计分方式">
                  <el-select v-model="questionInfo.attribute.examAnswerMode" @change="handleSettingAnswerMode()">
                    <el-option v-if="questionInfo.type==='Radio'" label="此问题有唯一答案和分值" value="onlyOne"/>
                    <el-option v-if="questionInfo.type==='Checkbox'|| questionInfo.type==='MultipleBlank'"
                               label="全部答对才得分" value="selectAll"/>
                    <el-option v-if="questionInfo.type==='Checkbox'" label="答对几项得几分，答错不得分"
                               value="selectCorrect"/>
                    <el-option label="每个选项都有对应的分值" value="select"/>
                  </el-select>
                  <el-select v-if="questionInfo.type==='MultipleBlank'" v-model="questionInfo.attribute.examMatchRule"
                             class="mt-2">
                    <el-option label="回答与答案完全相同得分" value="completeSame"/>
                    <el-option label="回答中包含答案即可得分" value="contain"/>
                  </el-select>
                </el-form-item>
                <!--            各选项分值-->
                <!--            单选题-->
                <div v-if="questionInfo['attribute']['examAnswerMode'] === 'select' && questionInfo.type==='Radio'">
                  <div style="font-size: 14px">各选项分值</div>
                  <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                    <span style="font-size: 12px">{{ item.title }}</span>
                    <el-input-number v-model="item['attribute']['examScore']"
                                     :precision="1" :step="0.5"
                                     size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])"/>
                  </div>
                </div>
                <!--            多选题-->
                <div v-if="questionInfo['attribute']['examAnswerMode']==='select'
              && questionInfo.type==='Checkbox'">
                  <div style="font-size: 14px">各选项分值</div>
                  <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                    <span style="font-size: 12px">{{ item.title }}</span>
                    <el-input-number v-model="item['attribute']['examScore']"
                                     :precision="1" :step="0.5"
                                     size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])"/>
                  </div>
                </div>
                <div v-if="questionInfo['attribute']['examAnswerMode']==='selectCorrect'
              && questionInfo.type==='Checkbox'">
                  <div style="font-size: 14px">各选项分值</div>
                  <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                    <span style="font-size: 12px">{{ item.title }}</span>
                    <el-input-number v-model="item['attribute']['examScore']"
                                     :precision="1" :step="0.5"
                                     size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])"/>
                  </div>
                </div>
                <!--            填空题-->
                <div v-if="questionInfo['attribute']['examAnswerMode']==='select'
              && questionInfo.type==='MultipleBlank'">
                  <div style="font-size: 14px">各选项分值</div>
                  <div v-for="item in questionInfo['children']" class="flex justify-between h-8 items-center">
                    <span style="font-size: 12px">{{ item.title }}</span>
                    <el-input-number v-model="item['attribute']['examScore']"
                                     :precision="1" :step="0.5"
                                     size="small" @change="handleQuestionMaxScore(item['attribute']['examScore'])"/>
                  </div>
                </div>
                <!--            答案配置-->
                <div style="font-size: 14px">
                  <div>答案</div>
                  <!--              单选题，判断题-->
                  <div v-if="questionInfo.type==='Radio'||questionInfo.type==='TrueFalse'">
                    <el-select v-model="questionRadioAnswerId" @change="handleQuestionRadioAnswer()">
                      <el-option v-for="item in questionInfo['children']" :label="item.title" :value="item.id">
                      </el-option>
                    </el-select>
                  </div>
                  <!--              多选题-->
                  <div v-for="item in questionInfo['children']" v-if="questionInfo.type==='Checkbox'" :key="item.id"
                       class="flex items-center">
                    <el-checkbox v-model="item.attribute.examCorrectAnswer" :false-label="null" :true-label="item.id">
                      {{ item.title }}
                    </el-checkbox>
                  </div>
                  <!--              填空题-->
                  <div v-for="item in questionInfo['children']"
                       v-if="questionInfo.type==='MultipleBlank' || questionInfo.type==='Textarea'" :key="item.id"
                       class="flex justify-between items-center">
                    <span class="w-30 mb-2" style="font-size: 12px">{{ item.title }}</span>
                    <el-input v-model="item.attribute.examCorrectAnswer"
                              type="textarea"
                              :autosize="{ minRows: 2, maxRows: 4 }"
                              resize="none" class="mb-2"/>
                  </div>
                </div>
              </el-form>
              <el-form v-if="questionInfoFlag" :label-position="'left'" label-width="40%">
                <el-form-item label="题目类型" class="mt-5" label-width="60%">
                  <el-select v-model="questionInfo.type" @change="handleSettingType">
                    <el-option v-for="item in exam_question_type" :key="item.value" :label="item.label"
                               :value="item.value"></el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="作者" class="mt-5">
                  <el-input v-model="questionInfo.author"/>
                </el-form-item>
                <el-form-item
                  v-if="questionInfo.attribute.examAnswerMode!=='select' && questionInfo.attribute.examAnswerMode!=='selectCorrect'"
                  label="此题分值" label-width="55%">
                  <el-input-number v-model="questionInfo['attribute']['examScore']"
                                   :precision="1" :step="0.5"
                                   size="small" @change="getScore"/>
                </el-form-item>
                <el-form-item label="题干说明" label-width="83%">
                  <el-switch v-model="questionInfoDescriptionFlag" @change="handleQuestionDescription()"/>
                </el-form-item>
              </el-form>
              <el-form v-if="questionInfoFlag" :label-position="'top'">
                <el-form-item label="答案解析">
                  <el-input v-model="questionInfo.attribute.examAnalysis"
                            type="textarea"
                            :autosize="{ minRows: 2, maxRows: 4 }"
                            resize="none" class="mb-2"/>
                </el-form-item>

              </el-form>

            </el-tab-pane>
            <el-tab-pane label="选项设置" :disabled="clickedQuestionIndex===null">
              <el-collapse accordion v-if="questionInfoFlag">
                <el-collapse-item v-for="item in questionInfo['children']" :key="item.id" :title="item.title">
                  <el-input v-model="item.id">
                    <template #append>
                      <el-button icon="copyDocument" @click="copyId(item.id)"/>
                    </template>
                  </el-input>
                </el-collapse-item>
              </el-collapse>
            </el-tab-pane>
          </el-tabs>
        </el-aside>
      </el-container>
      <el-container v-if="paperViewFlag==='Setting'">
        <el-main class="paper-setting-wrapper paper-wrapper">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-card>
                <template #header>
                  <svg-icon icon-class="document"/>
                  试卷显示
                </template>
                <div class="flex justify-between items-center">
                  <span>
                    开启自动暂存
                  <el-tooltip placement="top">
                    <template #content>
                      开启后，可以自动保存本次未提<br/>
                      交的填写内容,再次打开试卷可<br/>
                      显示上次未提交的填写内容。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.answerSetting.autoSave" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    显示题目序号
                  <el-tooltip placement="top">
                    <template #content>
                     勾选后，问卷中的题目会按排列顺序<br/>
                      从1开始显示题目序号。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.answerSetting.questionNumber" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    显示答题卡
                  </span>
                  <el-switch v-model="paperSettingForm.answerSetting.answerSheetVisible" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    允许复制题目
                  <el-tooltip placement="top">
                    <template #content>
                    关闭后，问卷内容将不允许被复制。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.answerSetting.copyEnabled" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <template #header>
                  <svg-icon icon-class="document-setting"/>
                  考试设置
                </template>
                <div class="flex justify-between items-center">
                  <span>
                    考试开始时间
                  </span>
                  <el-switch v-model="startTimeFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleStartTimeFlag"/>
                </div>
                <div v-if="startTimeFlag">
                  <el-date-picker style="width: 100%" v-model="paperSettingForm.examSetting.startTime" type="datetime">
                  </el-date-picker>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    考试结束时间
                  </span>
                  <el-switch v-model="endTimeFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleEndTimeFlag"/>
                </div>
                <div v-if="endTimeFlag">
                  <el-date-picker style="width: 100%" v-model="paperSettingForm.examSetting.endTime" type="datetime">
                  </el-date-picker>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    最短交卷时间
                  </span>
                  <el-switch v-model="minSubmitMinutesFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleMinSubmitMinutesFlag"/>
                </div>
                <div v-if="minSubmitMinutesFlag">
                  <el-input-number v-model="paperSettingForm.examSetting.minSubmitMinutes"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    最长交卷时间
                  </span>
                  <el-switch v-model="maxSubmitMinutesFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleMaxSubmitMinutesFlag"/>
                </div>
                <div v-if="maxSubmitMinutesFlag">
                  <el-input-number v-model="paperSettingForm.examSetting.maxSubmitMinutes"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    最大切屏次数
                  </span>
                  <el-switch v-model="maxSwitchScreenTimesFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleMaxSwitchScreenTimesFlag"/>
                </div>
                <div v-if="maxSwitchScreenTimesFlag">
                  <el-input-number v-model="paperSettingForm.examSetting.maxSwitchScreenTimes"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    练习模式
                     <el-tooltip placement="top">
                    <template #content>
                    答完每题后立即显示答案。仅支<br/>
                      持设有正确答案的单选题、多选<br/>
                      题、判断题及填空题。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.examSetting.exerciseMode" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    随机选项顺序
                     <el-tooltip placement="top">
                    <template #content>
                      开启之后，选项顺序将被打乱。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.examSetting.randomOrder" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    随机问题
                     <el-tooltip placement="top">
                    <template #content>
                      开启之后，将按照设置规则从题库抽题生成试卷。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <div>
                    <el-button v-if="randomPaperFlag" link type="primary" @click="handleRandomPaperSetting">设置
                    </el-button>
                    <el-switch v-model="randomPaperFlag" active-text="T"
                               size="large" inline-prompt inactive-text="F" @change="handleRandomPaper"/>
                  </div>

                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <template #header>
                  <svg-icon icon-class="security"/>
                  提交设置
                </template>
                <div class="flex justify-between items-center">
                  <span>
                    答题次数限制
                  </span>
                  <el-switch v-model="loginLimitFlag" active-text="T"
                             size="large" inline-prompt inactive-text="F" @change="handleLoginLimitFlag"/>
                </div>
                <div v-if="loginLimitFlag">
                  <el-input-number v-model="paperSettingForm.answerSetting.loginLimit"/>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <template #header>
                  <svg-icon icon-class="document-query"/>
                  结束设置
                </template>
                <div class="flex justify-between items-center">
                  <span>
                    允许修改答案
                     <el-tooltip placement="top">
                    <template #content>
                      开启后，再次打开问卷会回显之前填写的<br/>答案，并且可以修改。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.submittedSetting.enableUpdate" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    可查看正确答案和解析
                     <el-tooltip placement="top">
                    <template #content>
                      开启后，提交问卷之后显示正确答案和解析。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.submittedSetting.answerAnalysis" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    显示成绩单
                     <el-tooltip placement="top">
                    <template #content>
                     开启后，提交答案之后显示分数。
                    </template>
                    <el-button icon="InfoFilled" class="tip-button" size="small"/>
                  </el-tooltip>
                  </span>
                  <el-switch v-model="paperSettingForm.submittedSetting.transcriptVisible" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>
                <div class="flex justify-between items-center">
                  <span>
                    显示排名
                  </span>
                  <el-switch v-model="paperSettingForm.submittedSetting.rankVisible" active-text="T"
                             size="large" inline-prompt inactive-text="F"/>
                </div>


              </el-card>
            </el-col>
          </el-row>
        </el-main>
      </el-container>
      <el-container v-if="paperViewFlag==='Data'">
        <paper-data :paper-id="currentPaperId"></paper-data>
      </el-container>
      <el-container v-if="paperViewFlag==='Count'">
        <el-main class="paper-setting-wrapper paper-wrapper">
          <van-button>44</van-button>
        </el-main>
      </el-container>
      <el-dialog v-model="dialog.visible" :append-to-body="true" :with-header="false" width="80%"
                 class="paper-dialog">
        <el-table :data="paperQuestionSetList" height="350">
          <el-table-column label="关联题库" align="center" prop="questionSetName">
            <template #default="scope">
              <el-select v-model="scope.row.questionSetId" @change="handleQuestionId(scope.row)" size="small">
                <el-option v-for="item in questionSetOptions" :key="item.questionSetId" :label="item.questionSetName"
                           :value="item.questionSetId"/>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="题型" align="center" prop="questionType">
            <template #default="scope">
              <el-select v-model="scope.row.questionTypes" placeholder="请选择" multiple size="small" collapse-tags
                         collapse-tags-tooltip>
                <el-option v-for="(item,index) in scope.row.questionCount.questionTypeCount" :key="index"
                           :value="item.questionType" :label="item.name">
                  <span>{{ item.name }}</span>
                  <span>({{ item.count }})</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="标签" align="center" prop="tag">
            <template #default="scope">
              <el-select v-model="scope.row.tags" placeholder="请选择" multiple size="small" collapse-tags
                         collapse-tags-tooltip>
                <el-option v-for="item in scope.row.questionTagCount" :label="item.tagName" :value="item.tagName">
                  <span>{{ item.tagName }}</span>
                  <span>({{ item.total }})</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="题数" align="center" prop="questionNum">
            <template #default="scope">
              <el-input-number v-model="scope.row.questionNum" controls-position="right" size="small"/>
            </template>
          </el-table-column>
          <el-table-column label="每题分数" align="center" prop="score">
            <template #default="scope">
              <el-input-number v-model="scope.row.score" controls-position="right" size="small"/>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center">
            <template #default="scope">
              <el-button plain icon="delete" type="danger" link @click="questionSetDataRemove(scope.row.id)">删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button class="add-data-button" @click="addRow()" icon="plus">添加一行数据</el-button>
        <div class="mt-3">
          <el-button plain type="success" @click="submitQuestionSetForm">提交</el-button>
          <el-button @click="paperQuestionSetReset">重置</el-button>
        </div>
      </el-dialog>
    </el-drawer>
    <el-drawer v-model="publishDrawer.visible" append-to-body title="发布试卷" size="30%">
      <el-form ref="paperFormRef" :model="form" :rules="rules" label-width="20%">
        <el-form-item label="试卷名称" prop="paperName">
          <el-input v-model="form.paperName" placeholder="请输入试卷名称"/>
        </el-form-item>
        <el-form-item label="试卷类型" prop="paperMode">
          <el-select v-model="form.paperMode" placeholder="请选择试卷类型">
            <el-option v-for="item in exam_paper_mode" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="班级" prop="clazzIdList">
          <el-select v-model="form.clazzIdList" placeholder="请选择班级" multiple clearable>
            <el-option v-for="item in clazzOptions" :key="item.clazzId" :label="item.clazzName" :value="item.clazzId"/>
          </el-select>
        </el-form-item>
        <el-form-item label="课程">
          <el-select v-model="form.courseId" placeholder="请选择课程">
            <el-option v-for="item in courseOptions" :key="item.courseId" :label="item.courseName"
                       :value="item.courseId"/>
          </el-select>
        </el-form-item>
        <el-form-item label="试卷描述">
          <el-input v-model="form.remark" placeholder="请输入试卷描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="publishSubmitForm">发 布</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
    <el-drawer v-model="previewDrawer.visible" append-to-body title="试卷预览" size="100%">
      <div class="mt-5 w-50% ma">
        <div class="question-edit">
          <div class="pl-6 pr-6" v-for="(question, index) in previewPaperView.paperContentObj.children"
          >
            <div class="p-4 mt-2 vertical" @click="handleQuestion(question)">
              <div class="form-item-title">
                <p class="question-title"><span><b>{{ index + 1 }}</b></span> {{ question.title }}</p>
              </div>
              <div v-if="question.description!==null&&question.description!==undefined" class="form-item-description">
                <p class=" question-title ml-10">{{ question.description }}</p>
              </div>
              <el-radio-group v-if="question.type === 'Radio' || question.type === 'TrueFalse'">
                <el-radio size="large" v-for="item in question.children" :value="item.id" :label="item.title"/>
              </el-radio-group>
              <el-checkbox-group v-if="question.type === 'Checkbox'">
                <el-checkbox v-for="item in question.children" :value="item.id" :label="item.title"/>
              </el-checkbox-group>
              <!--填空题-->
              <div v-if="question.type === 'MultipleBlank'" v-for="item in question.children">
                <el-input class="mt-2" type="text"/>
              </div>
              <!--简答题-->
              <div v-if="question.type==='Textarea'">
                <el-input class="mt-2" type="textarea"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="Paper" lang="ts">
import {
  addPaper,
  cancelPublishPaper,
  delPaper,
  getPaper,
  listPaper,
  previewPaper,
  publishPaper,
  updatePaper
} from "@/api/exam/paper";
import {PaperForm, PaperQuery, PaperQuestionForm, paperQuestionSetVo, PaperVO} from "@/api/exam/paper/types";
import useSettingsStore from "@/store/modules/settings";
import {getBorderColor, getFontColor, getTagColor} from "@/utils/tagColor";
import {optionSelect as getTagTypeOptionSelect} from "@/api/exam/tagType";
import {DragDemonstration} from "@/utils/svg";
import {VueDraggable} from "vue-draggable-plus";
import {TagTypeVO} from "@/api/exam/tagType/types";
import useUserStore from "@/store/modules/user";
import {JsonViewer} from "vue3-json-viewer";
import "vue3-json-viewer/dist/index.css";
import {QuestionSetVO} from "@/api/exam/questionSet/types";
import {optionQuestionSetSelect, pickQuestion} from "@/api/exam/questionSet";
import {ClazzVO} from "@/api/exam/clazz/types";
import {optionSelect} from "@/api/exam/clazz";
import {optionCourseSelect} from "@/api/exam/course";
import PaperData from "@/views/exam/paper/paperData.vue";

const settingsStore = useSettingsStore();
const needTagsView = computed(() => settingsStore.tagsView);
const {proxy} = getCurrentInstance() as ComponentInternalInstance;
const {sys_common_status} = toRefs<any>(proxy?.useDict("sys_common_status"));
const tagTypeOptions = ref<TagTypeVO[]>([]);
const difficultyTagOptions = ref<TagTypeVO[]>([]);
const {
  exam_question_type,
  exam_paper_mode,
  exam_paper_status
} = toRefs<any>(proxy?.useDict("exam_question_type", "exam_paper_mode", "exam_paper_status"));

const paperList = ref<PaperVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const paperFormRef = ref<ElFormInstance>();

const userStore = useUserStore();

const drawer = reactive<DrawerOption>({
  visible: false,
  title: ""
});

/*题库导入相关*/
const dialog = reactive<DialogOption>({
  visible: false,
  title: ""
});
const publishDrawer = reactive<DrawerOption>({
  visible: false,
  title: ""
});
const previewDrawer = reactive<DrawerOption>({
  visible: false,
  title: ""
});
// 列显隐信息
const columns = ref<FieldOption[]>([
  {key: 0, label: `试卷ID`, visible: false, children: []},
  {key: 1, label: `课程ID`, visible: false, children: []},
  {key: 2, label: `班级ID`, visible: true, children: []},
  {key: 3, label: `试卷名称`, visible: true, children: []},
  {key: 4, label: `试卷类型`, visible: true, children: []},
  {key: 5, label: `状态`, visible: true, children: []},
  {key: 6, label: `备注信息`, visible: true, children: []}
]);


/*用于计算搜索栏高度*/
const searchContainer = ref<HTMLElement | null>(null);
const initFormData: PaperForm = {
  paperId: undefined,
  courseId: undefined,
  clazzIdList: undefined,
  paperName: undefined,
  paperContentObj: undefined,
  paperMode: undefined,
  status: "0",
  paperSettingObj: undefined,
  remark: undefined
};
const data = reactive<PageData<PaperForm, PaperQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    courseId: undefined,
    paperName: undefined,
    paperMode: undefined,
    paperContentObj: undefined,
    status: undefined,
    paperSettingObj: undefined,
    params: {}
  },
  rules: {
    paperId: [
      {required: true, message: "试卷ID不能为空", trigger: "blur"}
    ],
    clazzIdList: [
      {required: true, message: "班级ID不能为空", trigger: "blur"}
    ],
    paperName: [
      {required: true, message: "试卷名称不能为空", trigger: "blur"}
    ],
    paperMode: [
      {required: true, message: "试卷类型不能为空", trigger: "blur"}
    ]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询试卷列表 */
const getList = async () => {
  loading.value = true;
  const res = await listPaper(queryParams.value);
  paperList.value = res.rows;
  total.value = res.total;
  loading.value = false;
};
/*查询班级下拉列表*/
const clazzOptions = ref<ClazzVO[]>([]);
const getClazzOptions = async () => {
  const res = await optionSelect();
  clazzOptions.value = res.data;
};
const courseOptions = ref([]);
const getCourseOptions = async () => {
  const res = await optionCourseSelect();
  courseOptions.value = res.data;
};

/** 查询标签类型下拉列表 */
const getTagTypeList = async () => {
  const res = await getTagTypeOptionSelect("question");
  tagTypeOptions.value = res.data;
};
/*查询难度下拉列表*/
const getDifficultyTagList = async () => {
  const res = await getTagTypeOptionSelect("difficulty");
  difficultyTagOptions.value = res.data;
};


/*题库view*/
const paperQuestionSetList = ref<paperQuestionSetVo[]>([]);
/*查询题库*/
const questionSetOptions = ref<QuestionSetVO[]>([]);
const getQuestionSet = async () => {
  const res = await optionQuestionSetSelect();
  questionSetOptions.value = res.data;
  currentQuestionSet.value = questionSetOptions.value[0];
};
/*添加一行数据*/
const addRow = () => {
  paperQuestionSetList.value.push({
    id: generateRandomIdLong(),
    questionSetId: "",
    questionTypes: null,
    tags: null,
    questionCount: [],
    questionTagCount: [],
    questionNum: null,
    score: null
  });
};
const currentQuestionSet = ref();
const handleQuestionId = (row: any) => {
  paperQuestionSetList.value.forEach((item) => {
    if (item.questionSetId === row.questionSetId) {
      let current = questionSetOptions.value.find(item => item.questionSetId === row.questionSetId);
      item.questionCount = current.questionCount;
      item.questionCount.questionTypeCount.forEach((x: {
        questionType: string;
        name: string;
      }) => {
        if (x.questionType === "Radio") {
          x.name = "选择题";
        }
        if (x.questionType === "Checkbox") {
          x.name = "多选题";
        }
        if (x.questionType === "TrueFalse") {
          x.name = "判断题";
        }
        if (x.questionType === "MultipleBlank") {
          x.name = "填空题";
        }
        if (x.questionType === "Textarea") {
          x.name = "简答题";
        }
      });
      item.questionTagCount = current.questionTagCount;
    }
  });
};

/*移除数据*/
const questionSetDataRemove = (id: any) => {
  return new Promise<void>((resolve) => {
    paperQuestionSetList.value = paperQuestionSetList.value.filter(item => item.id !== id);
    resolve();
  });
};

/*题库提交*/
const submitQuestionSetForm = async () => {
  loading.value = true;
  if (dialog.title === "题库导入") {
    const res = await pickQuestion(paperQuestionSetList.value);
    paperForm.value.children.push(...res.data);
    paperQuestionSetList.value = [];
  } else {
    paperSettingForm.value.examSetting.randomPaper = paperQuestionSetList.value;
  }
  dialog.visible = false;
  loading.value = false;
};
/*试卷发布*/
const publishSubmitForm = async () => {
  paperFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      await publishPaper(form.value).finally(() => buttonLoading.value = false);
      proxy?.$modal.msgSuccess("发布成功");
      publishDrawer.visible = false;
      await getList();
    }
  });
};
/*题库重置*/
const paperQuestionSetReset = () => {
  paperQuestionSetList.value = [];
};


/*试卷相关事件*/
const isInput = ref(false);
const paperNameInputRef = ref<any>(null);
const toggleInput = () => {
  isInput.value = true;
  nextTick(() => {
    paperNameInputRef.value?.focus();
  });
};
const handleBlur = () => {
  isInput.value = false;
};


/*步骤条点击事件*/
const paperViewFlag = ref("Edit");
const paperActive = ref(0);


/*题库展示事件*/
const questionSetView = () => {
  dialog.title = "题库导入";
  paperQuestionSetList.value = [];
  dialog.visible = true;
};

/*试卷题目表单*/
const initPaperFormData: PaperQuestionForm = {
  id: undefined,
  title: undefined,
  description: undefined,
  type: undefined,
  attribute: {examScore: 0},
  children: []
};
const paperForm = ref({...initPaperFormData});

/*选项配置展示抽屉*/
const questionInfo = ref();
const questionInfoFlag = ref(false);
const questionInfoDescriptionFlag = ref(false);
/*点击题目事件*/
const questionRadioAnswerId = ref();
const handleQuestion = (question: any) => {
  questionInfo.value = question;
  /*如果是单选题或者是判断题，获取正确答案id*/
  if (questionInfo.value.type === "Radio" || questionInfo.value.type === "TrueFalse") {
    questionInfo.value.children.forEach((item: any) => {
      if (item.attribute?.examCorrectAnswer) {
        questionRadioAnswerId.value = item.id;
      }
    });
  }
  /*获取是否显示题干说明*/
  if (questionInfo.value.description === null || questionInfo.value.description === undefined) {
    questionInfoDescriptionFlag.value = false;
  } else {
    questionInfoDescriptionFlag.value = true;
  }
  questionInfoFlag.value = true;
};

/*题干说明事件*/
const handleQuestionDescription = () => {
  if (questionInfoDescriptionFlag.value) {
    questionInfo.value.description = "";
  }
  if (!questionInfoDescriptionFlag.value) {
    questionInfo.value.description = null;
  }
};
/*题目选中事件*/
const hoverQuestionIndex = ref();
const clickedQuestionIndex = ref(null);

const handleClickQuestion = (index: any) => {
  clickedQuestionIndex.value = index;
};

// 生成四位随机字符的函数
const generateRandomId = () => {
  const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const generateRandomIdLong = () => {
  const characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
/*添加选项按钮*/
const addItem = (index: any) => {
  paperForm.value.children[index]["children"].push({
    id: generateRandomId(), // 随机生成的id
    title: "",
    attribute: {
      examCorrectAnswer: null
    }
  });
};
/*标签为空时的事件*/
const isTagsNull = () => {
  if (questionInfo.value["difficultyName"] === "") {
    questionInfo.value["difficultyName"] = "无";
  }
  if (questionInfo.value["tags"].length === 0) {
    questionInfo.value["tags"] = ["无"];
  } else {
    questionInfo.value["tags"] = questionInfo.value["tags"].filter((item: string) => item !== "无");
  }
};
/*复制ID*/
const copyId = (id: any) => {
  try {
    navigator.clipboard.writeText(id);
    proxy?.$modal.msgSuccess("已复制ID");
  } catch (err) {
    proxy?.$modal.msgError("无法复制文本");
  }
};
/*计分方式选择事件*/
const handleSettingAnswerMode = () => {
  let mode = questionInfo.value["attribute"]["examAnswerMode"];
  let questionType = questionInfo.value.type;
  if (questionType === "Radio" && mode === "onlyOne") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = null;
      item["attribute"]["examScore"] = null;
    });
    questionInfo.value.children[0]["attribute"]["examCorrectAnswer"] = questionInfo.value.children[0]["id"];
  }
  if (questionType === "Radio" && mode === "select") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      item["attribute"]["examCorrectAnswer"] = item.id;
    });
  }
  if (questionType === "Checkbox" && mode === "select") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      item["attribute"]["examCorrectAnswer"] = item.id;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "Checkbox" && mode === "selectCorrect") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = item.id;
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "Checkbox" && mode === "selectAll") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = null;
    });
  }
  if (questionType === "MultipleBlank" && mode === "select") {
    let itemScoreTotal = 0;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = questionInfo.value.attribute.examScore;
      itemScoreTotal += item["attribute"]["examScore"];
    });
    questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
  }
  if (questionType === "MultipleBlank" && mode === "selectAll") {
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examScore"] = null;
    });
  }
  getScore();
};

/*题目类型选择时间*/
const handleSettingType = () => {
  if (questionInfo.value.type === "MultipleBlank") {
    let i = 1;
    questionInfo.value.children.forEach((item: any) => {
      item["attribute"]["examCorrectAnswer"] = item["title"];
      item["title"] = "填空" + i;
      i++;
    });
  }
  if (questionInfo.value.type === "Textarea") {
    questionInfo.value.children = [{
      id: questionInfo.value.children[0]["id"],
      title: "填空1",
      attribute: {
        examCorrectAnswer: questionInfo.value.children[0]["attribute"]["examCorrectAnswer"]
      }
    }];
  }
  if (questionInfo.value.type === "TrueFalse") {
    questionInfo.value.children = [{
      id: questionInfo.value.children[0]["id"],
      title: "正确",
      attribute: {
        examCorrectAnswer: questionInfo.value.children[0]["id"]
      }
    }, {
      id: questionInfo.value.children[1]["id"],
      title: "错误",
      attribute: {
        examCorrectAnswer: null
      }
    }];
  }
};
/*设置题目最高分*/
const handleQuestionMaxScore = (score: any) => {
  /*题目计分方式，答案模式为单个答案或者是全部答对时*/
  if (questionInfo.value["attribute"]["examAnswerMode"] === "onlyOne" || questionInfo.value["attribute"]["examAnswerMode"] === "selectAll") {
    let maxScore = questionInfo.value.children[0].attribute.examScore;
    questionInfo.value.children.forEach((item: any) => {
      if (item["attribute"]["examScore"] > maxScore) {
        maxScore = item["attribute"]["examScore"];
      }
    });
    questionInfo.value.attribute.examScore = maxScore;
  }
  if (questionInfo.value.type === "Radio" && questionInfo.value["attribute"]["examAnswerMode"] === "select") {
    let maxScore = questionInfo.value.children[0].attribute.examScore;
    questionInfo.value.children.forEach((item: any) => {
      if (item["attribute"]["examScore"] > maxScore) {
        maxScore = item["attribute"]["examScore"];
      }
    });
    questionInfo.value.attribute.examScore = maxScore;
  }
  if (questionInfo.value.type !== "Radio") {
    /*答案模式为每个选项有单独分值时*/
    if (questionInfo.value["attribute"]["examAnswerMode"] === "select" || questionInfo.value["attribute"]["examAnswerMode"] === "selectCorrect") {
      let itemScoreTotal = 0;
      questionInfo.value.children.forEach((item: any) => {
        itemScoreTotal += item["attribute"]["examScore"];
      });
      questionInfo.value["attribute"]["examScore"] = itemScoreTotal;
    }
  }
  getScore();
};
/*单选题答案选择器事件*/
const handleQuestionRadioAnswer = () => {
  questionInfo.value.children.forEach((item: any) => {
    item.attribute.examCorrectAnswer = null;
    if (item.id === questionRadioAnswerId.value) {
      item.attribute.examCorrectAnswer = questionRadioAnswerId.value;
    }
  });
};

/*移除选项*/
function remove(index: number, i: number) {
  paperForm.value.children[index]["children"].splice(i, 1);
}

const viewFlag = ref("Edit");
/*编辑展示按钮*/
const editView = () => {
  viewFlag.value = "Edit";
};

/*json 展示*/
const jsonView = () => {
  viewFlag.value = "Json";
};
const viewView = () => {
  viewFlag.value = "View";
};

/*左侧菜单相关*/
const questionTypeList = ref([
  {
    id: generateRandomId(),
    title: "请选择一个选项",
    type: "Radio",
    difficultyName: "简单",
    author: "",
    orderNum: 1,
    description: null,
    attribute: {
      examScore: 5,
      examAnswerMode: "onlyOne",
      examAnalysis: ""
    },
    children: [
      {
        id: generateRandomId(),
        title: "选项1",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项2",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项3",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项4",
        attribute: {
          examCorrectAnswer: null
        }
      }
    ],
    tags: ["无"]
  },
  {
    id: generateRandomId(),
    title: "请选择以下选项 (多选)",
    type: "Checkbox",
    difficultyName: "简单",
    author: "",
    orderNum: 2,
    description: null,
    attribute: {
      examScore: 5,
      examAnswerMode: "selectAll",
      examAnalysis: ""
    },
    children: [
      {
        id: generateRandomId(),
        title: "选项1",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项2",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项3",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "选项4",
        attribute: {
          examCorrectAnswer: null
        }
      }
    ],
    tags: ["无"]
  },
  {
    id: generateRandomId(),
    title: "请判断本项叙述是否正确？",
    type: "TrueFalse",
    difficultyName: "简单",
    author: "",
    orderNum: 3,
    description: null,
    attribute: {
      examScore: 5,
      examAnswerMode: "onlyOne",
      examAnalysis: ""
    },
    children: [
      {
        id: generateRandomId(),
        title: "正确",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "错误",
        attribute: {
          examCorrectAnswer: null
        }
      }
    ],
    tags: ["无"]
  },
  {
    id: generateRandomId(),
    title: "请填写以下内容",
    type: "MultipleBlank",
    difficultyName: "简单",
    author: "",
    orderNum: 4,
    description: null,
    attribute: {
      examScore: 5,
      examAnswerMode: "selectAll",
      examAnalysis: ""
    },
    children: [
      {
        id: generateRandomId(),
        title: "填空1",
        attribute: {
          examCorrectAnswer: null
        }
      },
      {
        id: generateRandomId(),
        title: "填空2",
        attribute: {
          examCorrectAnswer: null
        }
      }
    ],
    tags: ["无"]
  },
  {
    id: generateRandomId(),
    title: "简答题",
    type: "Textarea",
    difficultyName: "简单",
    author: "",
    orderNum: 5,
    description: null,
    attribute: {
      examScore: 5,
      examAnswerMode: "selectAll",
      examAnalysis: ""
    },
    children: [
      {
        id: generateRandomId(),
        title: "填空1",
        attribute: {
          examCorrectAnswer: null
        }
      }
    ],
    tags: ["无"]
  }
]);


/*复制题目*/
const copyQuestion = (index: any, question: any) => {
  paperForm.value.children.splice(index, 0, question);
};
/*移除题目*/
const removeQuestion = (index: any) => {
  paperForm.value.children.splice(index, 1);
};
/*题目编辑相关*/
/*获取列表分值*/
const scoreTotal = ref(0);
const randomScore = ref(0);
const getScore = () => {
  paperForm.value.attribute.examScore = 0;
  paperForm.value.children.forEach((item: {
    [x: string]: {
      [x: string]: number;
    };
  }) => {
    paperForm.value.attribute.examScore += item["attribute"]["examScore"];
  });
};
// const getRandomPaperScore = () => {
//   if (paperSettingForm.value.examSetting.randomPaper.length > 0) {
//     paperSettingForm.value.examSetting.randomPaper.forEach((item) => {
//       randomScore.value += item["questionNum"] * item["score"];
//     });
//   }
// };

/*试卷设置*/
const initPaperSettingFormData = {
  status: undefined,
  answerSetting: {
    autoSave: true,
    questionNumber: true,
    answerSheetVisible: true,
    copyEnabled: false,
    loginLimit: null
  },
  submittedSetting: {
    enableUpdate: false,
    answerAnalysis: false,
    transcriptVisible: false,
    rankVisible: true
  },
  examSetting: {
    startTime: null,
    endTime: null,
    minSubmitMinutes: null,
    maxSubmitMinutes: null,
    maxSwitchScreenTimes: null,
    exerciseMode: false,
    randomOrder: false,
    randomPaper: []
  }
};
const paperSettingForm = ref({...initPaperSettingFormData});

const startTimeFlag = ref(false);
const endTimeFlag = ref(false);
const minSubmitMinutesFlag = ref(false);
const maxSubmitMinutesFlag = ref(false);
const maxSwitchScreenTimesFlag = ref(false);
const randomPaperFlag = ref(false);
const loginLimitFlag = ref(false);
const handleStartTimeFlag = () => {
  if (startTimeFlag.value === false) {
    paperSettingForm.value.examSetting.startTime = null;
  }
};
const handleEndTimeFlag = () => {
  if (endTimeFlag.value === false) {
    paperSettingForm.value.examSetting.endTime = null;
  }
};
const handleMinSubmitMinutesFlag = () => {
  if (minSubmitMinutesFlag.value === false) {
    paperSettingForm.value.examSetting.minSubmitMinutes = null;
  }
};
const handleMaxSubmitMinutesFlag = () => {
  if (maxSubmitMinutesFlag.value === false) {
    paperSettingForm.value.examSetting.maxSubmitMinutes = null;
  }
};
const handleMaxSwitchScreenTimesFlag = () => {
  if (maxSwitchScreenTimesFlag.value === false) {
    paperSettingForm.value.examSetting.maxSwitchScreenTimes = null;
  }
};
const handleRandomPaper = () => {
  /*关闭随机问题后，将表单已添加的题库数据清空*/
  if (!randomPaperFlag.value) {
    paperSettingForm.value.examSetting.randomPaper = null;
  }
};
const handleLoginLimitFlag = () => {
  if (loginLimitFlag.value === false) {
    paperSettingForm.value.answerSetting.loginLimit = null;
  }

};
const handleRandomPaperSetting = () => {
  dialog.title = "随机问题设置";
  paperQuestionSetList.value = [];
  if (paperSettingForm.value.examSetting.randomPaper !== undefined && paperSettingForm.value.examSetting.randomPaper !== null) {
    paperSettingForm.value.examSetting.randomPaper.forEach((item) => {
      let y = questionSetOptions.value.find(x => x.questionSetId === item.questionSetId);
      item.questionCount = y.questionCount;
      item.questionCount.questionTypeCount.forEach((x: {
        questionType: string;
        name: string;
      }) => {
        if (x.questionType === "Radio") {
          x.name = "选择题";
        }
        if (x.questionType === "Checkbox") {
          x.name = "多选题";
        }
        if (x.questionType === "TrueFalse") {
          x.name = "判断题";
        }
        if (x.questionType === "MultipleBlank") {
          x.name = "填空题";
        }
        if (x.questionType === "Textarea") {
          x.name = "简答题";
        }
      });
      item.questionTagCount = y.questionTagCount;
    });
    paperQuestionSetList.value = paperSettingForm.value.examSetting.randomPaper;
  }
  dialog.visible = true;
};


/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  paperFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: PaperVO[]) => {
  ids.value = selection.map(item => item.paperId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  paperForm.value = {...initPaperFormData};
  paperSettingForm.value = {...initPaperSettingFormData};
  scoreTotal.value = 0;
  viewFlag.value = "Edit";
  paperActive.value = 0;
  paperViewFlag.value = "Edit";
  paperForm.value.title = "试卷名称";
  form.value.paperMode = "Exam";
  form.value.status = "0";
  drawer.title = "添加试卷";
  drawer.visible = true;
};
/*预览按钮操作*/
const previewPaperView = ref();
const paperViewId = ref();
const handlePreview = async (row: PaperVO) => {
  paperViewId.value = row.paperId;
  const res = await previewPaper(row.paperId);
  previewPaperView.value = res.data;
  previewDrawer.visible = true;
};
/*发布按钮操作*/
const handleRelease = async (row?: PaperVO) => {
  reset();
  paperForm.value = {...initPaperFormData};
  paperSettingForm.value = {...initPaperSettingFormData};
  const _paperId = row?.paperId || ids.value[0];
  const res = await getPaper(_paperId);
  Object.assign(form.value, res.data);
  publishDrawer.visible = true;
};
/*取消发布按钮操作*/
const handleCancelRelease = async (row: PaperVO) => {
  await proxy?.$modal.confirm("是否取消发布该试卷？").finally(() => loading.value = false);
  await cancelPublishPaper(row.paperId);
  proxy?.$modal.msgSuccess("已取消");
  await getList();
};
/*试卷数据按钮操作*/
const currentPaperId = ref();
const handlePaperData = async (item: PaperVO) => {
  reset();
  paperForm.value = {...initPaperFormData};
  paperSettingForm.value = {...initPaperSettingFormData};
  const _paperId = item?.paperId || ids.value[0];
  const res = await getPaper(_paperId);
  Object.assign(form.value, res.data);
  paperForm.value = form.value.paperContentObj;
  paperSettingForm.value = form.value.paperSettingObj;
  resetSwitchStatus();
  switchStatus();

  currentPaperId.value = item.paperId;
  drawer.visible = true;
  drawer.title = "修改试卷";
};
/** 修改按钮操作 */
const handleUpdate = async (row?: PaperVO) => {
  reset();
  paperForm.value = {...initPaperFormData};
  paperSettingForm.value = {...initPaperSettingFormData};
  const _paperId = row?.paperId || ids.value[0];
  const res = await getPaper(_paperId);
  Object.assign(form.value, res.data);
  paperForm.value = form.value.paperContentObj;
  paperSettingForm.value = form.value.paperSettingObj;
  resetSwitchStatus();
  switchStatus();
  paperViewFlag.value = "Edit";
  drawer.visible = true;
  drawer.title = "修改试卷";
};

/*重置开关状态*/
const resetSwitchStatus = () => {
  startTimeFlag.value = false;
  endTimeFlag.value = false;
  minSubmitMinutesFlag.value = false;
  maxSubmitMinutesFlag.value = false;
  maxSwitchScreenTimesFlag.value = false;
  randomPaperFlag.value = false;
  loginLimitFlag.value = false;
};
/*判定开关状态*/
const switchStatus = () => {
  if (paperSettingForm.value.examSetting.startTime) {
    startTimeFlag.value = true;
  }
  if (paperSettingForm.value.examSetting.endTime) {
    endTimeFlag.value = true;
  }
  if (paperSettingForm.value.examSetting.minSubmitMinutes) {
    minSubmitMinutesFlag.value = true;
  }
  if (paperSettingForm.value.examSetting.maxSubmitMinutes) {
    maxSubmitMinutesFlag.value = true;
  }
  if (paperSettingForm.value.examSetting.maxSwitchScreenTimes) {
    maxSwitchScreenTimesFlag.value = true;
  }
  if (paperSettingForm.value.examSetting.randomPaper) {
    randomPaperFlag.value = true;
  }
  if (paperSettingForm.value.answerSetting.loginLimit) {
    loginLimitFlag.value = true;
  }
};
/** 提交按钮 */
const submitForm = async () => {
  buttonLoading.value = true;
  form.value.paperName = paperForm.value.title;
  form.value.paperContentObj = paperForm.value;
  form.value.paperSettingObj = paperSettingForm.value;
  if (drawer.title === "修改试卷") {
    await updatePaper(form.value).finally(() => buttonLoading.value = false);
    proxy?.$modal.msgSuccess("修改成功");
  } else {
    const res = await addPaper(form.value).finally(() => buttonLoading.value = false);
    proxy?.$modal.msgSuccess("添加成功");
    /*添加成功后获取添加的数据*/
    Object.assign(form.value, res.data);
    paperForm.value = form.value.paperContentObj;
    drawer.visible = true;
    drawer.title = "修改试卷";
  }
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: PaperVO) => {
  const _paperIds = row?.paperId || ids.value;
  await proxy?.$modal.confirm("是否确认删除试卷编号为\"" + _paperIds + "\"的数据项？").finally(() => loading.value = false);
  await delPaper(_paperIds);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("exam/paper/export", {
    ...queryParams.value
  }, `paper_${new Date().getTime()}.xlsx`);
};


/** 关闭按钮 */
const cancel = () => {
  // 重置
  reset();
  questionInfoFlag.value = false;
  clickedQuestionIndex.value = null;
  hoverQuestionIndex.value = null;
  questionInfoDescriptionFlag.value = false;
  drawer.visible = false;
  publishDrawer.visible = false;
};

/*表格样式*/
const tableStyle = ref("Grid");


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
watch(() => paperForm.value.children.length, (newLength, oldLength) => {
  getScore();
});
/*响应式监听*/
watchEffect(() => {
  calculateTableHeight();
});
/*移除事件监听器*/
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

onMounted(() => {
  /*自适应表格高度*/
  if (searchContainer.value) {
    height.value = searchContainer.value.offsetHeight;
  }
  window.addEventListener("resize", handleResize);
  getDifficultyTagList();
  getTagTypeList();
  calculateTableHeight();
  getQuestionSet();
  getClazzOptions();
  getCourseOptions();
  getList();
});
</script>
<style lang="scss" scoped>

.paper-setting-wrapper {
  box-shadow: 0 0 6px rgba(0, 21, 41, 0.35);
}

.form-input {
  padding: 6px;
  margin: 0 10px;
  width: 50%;
  border: none;
  background-color: transparent;
  outline: none; /* 隐藏浏览器默认的焦点边框 */
}

/* 当鼠标悬停在输入框上时，显示虚线边框 */
.form-input:hover {
  border: 1px dashed var(--el-color-primary-light-5);
}

/* 当输入框获得焦点时，显示实线边框 */
.form-input:focus {
  border: 1px solid var(--el-color-primary-light-5);
}

.form-input-title {
  width: 10%;
}

.form-textarea {
  resize: none;
}

.form-answer {
  font-size: 12px;
  color: var(--el-color-primary);
}

.form-remove {
  margin-left: auto;
}

/*表单标题样式*/
.form-item-title {
  font-size: 20px;

  input {
    font-size: 18px;
    width: 80%;
  }

  .score {
    font-size: 14px;
    color: rgba(164, 169, 176, 0.99);
  }
}

/*表单题干说明样式*/
.form-item-description {
  font-size: 14px;

  input {
    font-size: 14px;
    margin-left: 24px;
    margin-top: 5px;
    width: 95%;
  }

  input::placeholder {
    padding-left: 50px;
    color: #97a8be;
    font-size: 12px;
    font-style: italic;
  }

  .score {
    font-size: 14px;
    color: rgba(164, 169, 176, 0.99);
  }
}

/*表单选择器样式*/
.form-select {
  width: 70%;
  margin-left: 30px;
}

.ghost {
}

/*容器布局样式*/
.app-wrapper {
  position: relative;
  height: calc(100vh);
  width: 100%;
}

.paper-wrapper {
  position: relative;
  height: calc(100vh - 60px);
  width: 100%;
}

.drawer-shadow {
  box-shadow: -2px 0 6px rgba(0, 21, 41, 0.35);
  background-color: #ffffff;
  margin: 0;
}

/*json view 样式*/
.json-viewer-box {
  position: relative;
}

.json-viewer-lines {
  position: absolute;
  left: -40;
  z-index: 1;
  width: 40px; /* 行号的宽度，可根据需要调整 */
  background-color: #f5f5f5; /* 行号背景颜色 */
  color: #999; /* 行号文字颜色 */
  padding: 18px 5px 15px 2px;
  border-radius: 8px 0 0 8px;
  border-right: 1px solid #ddd; /* 行号与内容的分隔线 */
  pointer-events: none; /* 防止行号覆盖 JsonViewer 的点击事件 */
  user-select: none; /* 防止用户选择行号 */
}

.json-viewer-lines span {
  display: block;
  font-size: 14px;
  line-height: 16.36px;
}

.question-edit {
  border-color: #aab2bd;
  box-shadow: 0 2px 4px #0003;
}

/*鼠标经过题目时的样式*/
.hover-style {
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  background-color: #ffffff;
  width: 102%;
  margin-left: -1%;
}

.clicked-style {
  border-radius: 3px;
  position: relative;
  box-sizing: border-box;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  background-color: #ffffff;
  width: 102%;
  margin-left: -1%;
}

/*问题设置title样式*/
.setting-title {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; /* 根据需要调整高度 */
  position: relative;
}

.setting-title::before,
.setting-title::after {
  content: '';
  display: inline-block;
  height: 1px; /* 根据需要调整横线的粗细 */
  background-color: black; /* 可以根据需要调整横线的颜色 */
  width: 70px; /* 根据需要调整横线的长度 */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.setting-title::before {
  left: 0; /* 根据需要调整横线的位置 */
}

.setting-title::after {
  right: 0; /* 根据需要调整横线的位置 */
}

.setting-title span {
  margin: 0 60px; /* 根据横线的长度调整间距 */
}

.drawer-left-menu {
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  width: 15% !important;
  background-color: #ffffff;
  margin: 0;
}

.question-type {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.question-type-item {
  display: inline-block;
  background: #FFF;
  color: #000;
  min-width: 80px;
  height: 80px;
  line-height: 1;
  text-align: center;
  transition: all .2s ease;
  border-radius: 5px;
  border: 1px dashed #dddddd;
  cursor: move;

  div {
    margin-top: 10px;
    margin-bottom: 12px;
  }
}

.question-type-item:hover {
  border: 1px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

.right-tool-bar {
  position: absolute;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  right: -40px;
  padding: 12px 8px;
  transition-duration: .3s;
  z-index: 1;
  box-shadow: 0 4px 16px #00000012;
  gap: 8px;
}

.synopsis {
  display: flex;
  justify-content: center;
  flex-direction: row;

  .outline-icon {
    width: 10%;
    margin-right: 4px;
  }

  .outline-num {
    width: 15%;
  }

  .outline-item {
    font-size: 12px;
    flex: 1;
    white-space: nowrap; /* 防止文本换行 */
    overflow: hidden; /* 隐藏超出元素宽度的文本 */
    text-overflow: ellipsis; /* 显示省略号 */
  }
}

.synopsis:hover {
  color: var(--el-color-primary);
}

.paper-header {
  height: 50px;
  -webkit-box-shadow: 0 0 6px rgba(0, 41, 13, 0.35);
  box-shadow: 0 0 6px rgba(0, 21, 41, 0.35);
  margin-bottom: 10px;
}

.add-data-button {
  width: 100%;
  margin-top: 10px;
  border: 1px dashed #dddddd;
}

.add-data-button:hover {
  background-color: transparent;
  border: 1px solid var(--el-color-primary);
}

/*提示按钮*/
.tip-button {
  border: none;
}

.tip-button:hover {
  background-color: transparent;
}

.tip-button:focus {
  background-color: transparent;
}

.search .el-form .el-form-item {
  margin: 0;
}

.search .el-form .el-form-item--default {
  margin: 0;
}

.fixed-top {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
}

.answer-sheet {
  position: fixed;
  top: 124px;
  width: 200px;
  max-height: 400px;
  margin-left: -52px;
  background: #fff;
  box-shadow: 0 2px 6px #0000000a;
  transform: translateX(-100%);

  .answer-sheet-header {
    position: relative;
    display: flex;
    align-items: center;
    height: 42px;
    padding-left: 18px;
    color: #484848;
    font-size: 14px;
    line-height: 42px;
    border-bottom: 1px solid #eaeaea;
  }

  .answer-sheet-header::before {
    display: inline-block;
    width: 2px;
    height: 12px;
    margin-right: 6px;
    background: var(--el-color-primary);
    border-radius: 1px;
    content: "";
  }

  .answer-sheet-body {
    .answer-sheet-content {
      box-sizing: border-box;
      min-height: 60px;
      max-height: 315px;
      padding: 10px 12px 6px 18px;
      overflow: auto;
      border-bottom: 1px solid #eaeaea;

      .answer-sheet-item {
        position: relative;
        float: left;
        box-sizing: border-box;
        width: 28px;
        height: 28px;
        margin: 6px 6px 6px 0;
        color: #484848;
        font-size: 12px;
        line-height: 26px;
        white-space: nowrap;
        text-align: center;
        background: #fff;
        border: 1px solid #d8d8d8;
        border-radius: 50%;
        cursor: pointer;
      }
    }
  }

  .answer-sheet-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    padding: 0 12px;
    color: #707070;
    font-size: 12px;
    line-height: 12px;

    .finished {

    }

    .finished::before {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 4px;
      background-color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary);
      border-radius: 50%;
      content: "";
    }

    .un-finished {

    }

    .un-finished::before {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 4px;
      background: #fff;
      border: 1px solid #d8d8d8;
      border-radius: 50%;
      content: "";
    }
  }
}

</style>

<style lang="scss">
.paper-dialog {
  border-radius: 15px;
  padding: 0 24px 24px 24px;
}

.el-step {
  cursor: pointer;
}
</style>
