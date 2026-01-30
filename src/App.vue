<template>
    <div class="app">
        <el-config-provider :locale="locale">
            <router-view />
        </el-config-provider>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en';
import jp from 'element-plus/es/locale/lang/ja';
const language = ref(localStorage.getItem('language') || 'en');
const locale = computed(() => {
    if (language.value === 'zh') {
        return zhCn;
    } else if (language.value === 'en') {
        return en;
    } else if (language.value === 'jp') {
        return jp;
    }else{
        return en
    }
});
onMounted(() => {
   
});
</script>

<style scoped lang="scss">
.app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}
</style>