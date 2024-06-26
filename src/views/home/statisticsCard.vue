<script setup lang="ts">

import {bindingCount, deptCount, questionCount, userCount} from "@/api/exam/dataDisplay";


const userTotal = ref(0);
const deptTotal = ref(0);
const teacherBindingTotal = ref(0);
const questionTotal = ref(0);
/*获取统计数据*/
const getUserCount = async () => {
  const res = await userCount();
  animateValue(userTotal, res.data, 3000);
}

const getTeacherBindingCount = async () => {
  let params = {
    bindingType: '1'
  }
  const res = await bindingCount(params);
  animateValue(teacherBindingTotal, res.data, 3000);
}
const getQuestionCount = async () => {
  const res = await questionCount();
  animateValue(questionTotal, res.data, 3000);
}
const getDeptCount = async () => {
  const res = await deptCount(null);
  animateValue(deptTotal, res.data, 3000);
}

/*动态更新数值，从起始值缓动到目标值*/
const animateValue = (refValue: { value: number }, targetValue: number, duration: number) => {
  const startValue = refValue.value;
  const startTime = performance.now();

  /* 缓动函数，创建前快后慢的效果。*/
  const easeOutQuad = (t: number) => t * (2 - t); // 缓动函数，前快后慢

  /*更新数值的递归函数，根据当前时间更新 refValue 的值。*/
  const updateValue = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    refValue.value = Math.round(startValue + (targetValue - startValue) * easeOutQuad(progress));

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };
  /*启动动画*/
  requestAnimationFrame(updateValue);
};

onMounted(async () => {
  await getUserCount();
  await getDeptCount();
  await getTeacherBindingCount();
  await getQuestionCount();
})
</script>

<template>
  <el-row :gutter="12" class="mb-4">
    <el-col :span="6">
      <el-card shadow="hover">
        <el-row>
          <el-col :span="12" :push="2">
            <div class="statistic-value">{{ userTotal }}</div>
            <div class="statistic-title">用户总数</div>
          </el-col>
          <el-col :span="12" :push="4">
            <div style="background-color: var(--el-color-info-light-9)" class="statistic-icon">
              <svg-icon color="var(--el-color-info)" icon-class="student" class="statistic-svg"/>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <el-row>
          <el-col :span="12" :push="2">
            <div class="statistic-value">{{ teacherBindingTotal }}</div>
            <div class="statistic-title">教师总数</div>
          </el-col>
          <el-col :span="12" :push="4">
            <div style="background-color: var(--el-color-success-light-9)" class="statistic-icon">
              <svg-icon color="var(--el-color-success)" icon-class="teacher" class="statistic-svg"/>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <el-row>
          <el-col :span="12" :push="2">
            <div class="statistic-value">{{ questionTotal }}</div>
            <div class="statistic-title">题目总数</div>
          </el-col>
          <el-col :span="12" :push="4">
            <div style="background-color: var(--el-color-primary-light-9)" class="statistic-icon">
              <svg-icon color="var(--el-color-primary)" icon-class="question-set" class="statistic-svg"/>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="hover">
        <el-row>
          <el-col :span="12" :push="2">
            <div class="statistic-value">{{ deptTotal }}</div>
            <div class="statistic-title">单位总数</div>
          </el-col>
          <el-col :span="12" :push="4">
            <div style="background-color: var(--el-color-danger-light-9)" class="statistic-icon">
              <svg-icon color="var(--el-color-danger)" icon-class="school" class="statistic-svg"/>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped lang="scss">
.statistic-value{
  font-size: 32px;
}
.statistic-title{
color: rgba(164, 169, 176, 0.87);
}
.statistic-icon{
  width: 60px;
  height: 60px;
  border-radius: 50%;
  .statistic-svg{
    padding: 15px;
    font-size:60px;
  }
}
</style>
