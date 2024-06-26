<script setup lang="ts">
import {userScoreQueryCount} from "@/api/exam/dataDisplay";
import * as echarts from "echarts";
const answerChart = ref();
const paperList= ref();
const getList = async () => {
  const res = await userScoreQueryCount();
  paperList.value = res.data;
}
onMounted(async () => {
  await getList();
  const paperNameList = paperList.value.map((item:any) => {
    return item.paperName;
  })
  const personalScoreList = paperList.value.map((item:any) => {
    return item.personalScore;
  })
  const totalScoreList = paperList.value.map((item:any) => {
    return item.totalScore;
  })
  let infoEl = answerChart.value;
  let myChart = echarts.init(infoEl);
  type EChartsOption = echarts.EChartsOption;
  let option: EChartsOption;
  option = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13,5,30,.6)',
      borderWidth: 1,
      borderColor: '#32A1FF',
      padding: 5,
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      itemWidth: 10,
      itemHeight: 10,
      top: 5,
      right: 30,
      icon: 'rect',
      textStyle: {
        color: '#c7d3e5'
      }
    },
    grid: {
      top: '14%',
      left: '5%',
      right: '5%',
      bottom: '5%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: paperNameList,
        axisLabel: {
          color: 'rgba(0, 0, 0, 0.8)',
          fontSize: 14,
          interval: 0,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#2D4377'
          }
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: '#2D4377',
            type: "dotted",
          }
        },
      }
    ],
    yAxis: [
      {
        type: 'value',
        min: 0,
        position: 'left',
        nameTextStyle: {
          color: "#000",
          fontSize: 14,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#2D4377'
          }
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#2D4377',
            type: "dotted",
          }
        },
        axisLabel: {
          formatter: '{value}',
          textStyle: {
            color: "#000",
          }
        },
      }
    ],
    series: [
      {
        name: '个人分数',
        type: 'bar',
        barWidth: 10,
        data: personalScoreList,
        barGap: '30%', // 设置柱子之间的间隔为类目宽度的50%
        barCategoryGap: '10%', // 设置同一类目下的柱子间隔为类目宽度的40%
        itemStyle: {
          barBorderRadius: 4,
          barCategoryGap: '40%',
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(54, 220, 255, 0.8)",
            },
            {
              offset: 1,
              color: "rgba(41, 104, 233, 0.1)",
            },
          ]),
        }
      },
      {
        name: '试卷总分',
        type: 'bar',
        barWidth: 10,
        barGap: '30%', // 设置柱子之间的间隔为类目宽度的50%
        barCategoryGap: '10%', // 设置同一类目下的柱子间隔为类目宽度的40%
        itemStyle: {
          barBorderRadius: 4,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: "rgba(234, 161, 84, 0.8)",
            },
            {
              offset: 1,
              color: "rgba(219, 162, 62, 0.1)",
            },
          ]),
        },
        data: totalScoreList
      },
    ]
  };
  option && myChart.setOption(option);
})
</script>

<template>
  <el-card>
    <div ref="answerChart" style="width: 100%;height: 300px;"></div>
  </el-card>
</template>

<style scoped lang="scss">

</style>
