<template>
  <div id="app">
    <router-view v-if="isAuthenticated && isAdmin" />
    <div v-else>
      <h1>403 Forbidden</h1>
      <p>You do not have permission to access this page.</p>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    isAuthenticated() {
      return this.$store.state.auth.isAuthenticated;
    },
    isAdmin() {
      return this.$store.state.user.is_admin;
    }
  }
};
</script>