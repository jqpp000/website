<template>
  <div class="dashboard">
    <h1>管理员仪表盘</h1>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">广告数据统计</div>
          <div id="ad-chart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import * as echarts from 'echarts';

export default defineComponent({
  setup() {
    onMounted(() => {
      const chart = echarts.init(document.getElementById('ad-chart'));
      chart.setOption({
        tooltip: { trigger: 'item' },
        series: [{ type: 'pie', data: [{ value: 1048, name: '点击量' }] }]
      });
    });
  }
});
</script>

<style scoped>
.dashboard { padding: 20px; }
</style>