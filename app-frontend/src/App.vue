<template>
  <div id="app">
    <!-- Router view này sẽ load AdminLayout hoặc ClientLayout tùy theo đường dẫn URL -->
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
