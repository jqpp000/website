<template>
  <div class="ad-management">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="轮播广告" name="banner">
        <AdBanner />
      </el-tab-pane>
      <el-tab-pane label="侧边广告" name="sidebar">
        <AdSidebar />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import AdBanner from './components/AdBanner.vue';
import AdSidebar from './components/AdSidebar.vue';

export default defineComponent({
  components: { AdBanner, AdSidebar },
  setup() {
    const activeTab = ref('banner');
    return { activeTab };
  }
});
</script>