<script setup lang="ts">
import {CountByMonthVo} from "@/api/exam/dataDisplay/types";
import {questionQueryCount} from "@/api/exam/dataDisplay";
import * as echarts from 'echarts';

const questionTotal = ref<CountByMonthVo[]>([])
const questionChart = ref()
const getQuestionCountByMonth = async () => {
  const res = await questionQueryCount()
  questionTotal.value = res.data;
}



onMounted(async () => {
  await getQuestionCountByMonth();
  let infoEl = questionChart.value;
  let myChart = echarts.init(infoEl);
  type EChartsOption = echarts.EChartsOption;
  let option: EChartsOption;
  option = {
    color: ['#80FFA5',],
    title: {
      text: '题目数量统计'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['数量',]
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: questionTotal.value.map(item => item.date),
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '数量',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: true,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(128, 255, 165,0.9)'
            },
            {
              offset: 1,
              color: 'rgba(1, 191, 236,0.9)'
            }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: questionTotal.value.map(item => item.count),
      },
    ]
  };
  option && myChart.setOption(option);

})
</script>

<template>
  <el-card shadow="hover">
    <div ref="questionChart" style="width: 100%;height: 300px;"></div>
  </el-card>
</template>

<style scoped lang="scss">

</style>
