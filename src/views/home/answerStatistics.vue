<script setup lang="ts">
import * as echarts from 'echarts';
import {answerQueryCount} from "@/api/exam/dataDisplay";
import {CountByMonthVo} from "@/api/exam/dataDisplay/types";

const answerTotal = ref<CountByMonthVo[]>([])
const answerChart = ref()
const getQuestionCountByMonth = async () => {
  const res = await answerQueryCount()
  answerTotal.value = res.data;
}



onMounted(async () => {
  await getQuestionCountByMonth();
  let infoEl = answerChart.value;
  let myChart = echarts.init(infoEl);
  type EChartsOption = echarts.EChartsOption;
  let option: EChartsOption;
  option = {
    color: ['#80FFA5',],
    title: {
      text: '答卷数量统计'
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
        data: answerTotal.value.map(item => item.date),
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
              color: 'rgb(0, 221, 255)'
            },
            {
              offset: 1,
              color: 'rgb(77, 119, 255)'
            }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: answerTotal.value.map(item => item.count),
      },
    ]
  };
  option && myChart.setOption(option);

})
</script>

<template>
  <el-card shadow="hover">
    <div ref="answerChart" style="width: 100%;height: 300px;"></div>
  </el-card>
</template>

<style scoped lang="scss">

</style>
