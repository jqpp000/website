<template>
  <div class="ad-banner">
    <el-carousel :interval="5000" arrow="always">
      <el-carousel-item v-for="(ad, index) in ads" :key="index">
        <div v-html="ad.content"></div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script>
export default {
  props: {
    ads: { type: Array, required: true }
  }
};
</script>

<style scoped>
.ad-banner { margin: 20px 0; }
</style>