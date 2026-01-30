<template>
    <div class="props-container">
        <el-form :model="formData" label-width="120px">
            <!-- 文本输入 -->
            <el-form-item label="文本" v-if="!isEvent">
                <el-input v-model="formData.data" type="textarea"  :maxlength="$store.state.globalVariable.textareaMaxSize"/>
            </el-form-item>
            <el-form-item label="小数位">
                <el-input-number 
                    v-model="formData.decimalPlaces" 
                    :min="0" 
                    :max="10"
                    placeholder="默认不处理"
                    controls-position="right"
                    clearable
                />
            </el-form-item>
            <!-- 字体设置 -->
            <el-form-item label="字体">
                <el-select v-model="formData.fontFamily" placeholder="选择字体">
                    <el-option v-for="item in fonts" :key="item.value" :label="item.label"
                        :value="item.value">
                        <span :style="'font-family:' + item.value">{{ item.label }}</span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="颜色">
                <el-color-picker v-model="formData.fill" />
            </el-form-item>
            <el-form-item label="字体大小">
                <el-input-number v-model="formData.fontSize" :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
                    controls-position="right" />
            </el-form-item>
            <el-form-item label="字体粗细">
                <el-select v-model="formData.fontWeight" placeholder="选择字体粗细">
                    <el-option label="普通" value="normal"></el-option>
                    <el-option label="粗体" value="bold"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="内边距">
                <el-input-number v-model="formData.padding" controls-position="right" />
            </el-form-item>
            <el-form-item label="水平对齐">
                <el-select v-model="formData.textAlign" placeholder="选择水平对齐">
                    <el-option label="左对齐" value="left"></el-option>
                    <el-option label="居中" value="center"></el-option>
                    <el-option label="右对齐" value="right"></el-option>
                </el-select>
            </el-form-item>
            
            <el-form-item label="垂直对齐">
                <el-select v-model="formData.verticalAlign" placeholder="选择垂直对齐">
                    <el-option label="顶部对齐" value="top"></el-option>
                    <el-option label="居中" value="middle"></el-option>
                    <el-option label="底部对齐" value="bottom"></el-option>
                </el-select>
            </el-form-item>
            
            <el-form-item label="字间距">
                <el-input-number v-model="formData.letterSpacing" controls-position="right" />
            </el-form-item>
            
            <el-form-item label="行高">
                <el-input-number v-model="formData.lineHeight" controls-position="right" />
            </el-form-item>
            
            <el-form-item label="背景颜色">
                <el-color-picker v-model="formData.backgroundColor" />
            </el-form-item>
            
            <!-- 边框设置 -->
            <template v-if="initialized">
                <el-form-item label="边框大小">
                    <el-input-number v-model="formData.borderSize" controls-position="right" />
                </el-form-item>
                
                <el-form-item label="边框颜色">
                    <el-color-picker v-model="formData.borderColor" />
                </el-form-item>
                
                <el-form-item label="线条样式">
                    <el-select v-model="formData.borderStyle" placeholder="选择线条样式">
                        <el-option label="实线" value="solid"></el-option>
                        <el-option label="虚线" value="dashed"></el-option>
                        <el-option label="点线" value="dotted"></el-option>
                    </el-select>
                </el-form-item>
            </template>
          
            <!-- 超链接设置 -->
            <el-form-item label="启用超链接">
                <el-switch v-model="formData.hyperlinkEnabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
            
            <el-form-item label="链接地址" v-if="formData.hyperlinkEnabled">
                <el-input v-model="formData.hyperlinkUrl" placeholder="链接地址"  type="textarea" :maxlength="$store.state.globalVariable.textareaMaxSize" />
            </el-form-item>
            
            <el-form-item label="打开方式" v-if="formData.hyperlinkEnabled">
                <el-select v-model="formData.hyperlinkTarget" placeholder="打开方式">
                    <el-option label="当前窗口" value="_self"></el-option>
                    <el-option label="新窗口" value="_blank"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import { fontsData } from '@/config/fonts'
import propsPanelMixins from '@/mixins/propsPanelMixins';
export default {
    name: 'textPanel',
    mixins: [propsPanelMixins],
    data() {
        return {
            fonts: fontsData,
            formData: {
                data: '',
                fontFamily: 'Source Han Sans',
                fill: '#f3f3f3',
                fontSize: 16,
                fontWeight: 'normal',
                padding: 0,
                textAlign: 'center',
                verticalAlign: 'middle',
                letterSpacing: 0,
                lineHeight: 1,
                backgroundColor: '',
                borderSize: 0,
                borderColor: '',
                borderStyle: 'solid',
            },
            activeNames: ['1'],
            initialized: false,
        };
    },
    mounted() {
        setTimeout(() => {
            // 延迟初始化部分内容减少渲染卡顿的问题
            this.initialized = true;
        }, 350)
    },

    methods: {

    }
};
</script>

<style lang="scss" scoped>
.props-container{
    background-color: var(--panel-light-bg-color);
}
:deep(.el-form-item__label){
    color: var(--primary-text-color);
}
.row {  
    p {
    font-size: 12px;
    padding-left: 2px;
    margin-top: 6px;
    margin-bottom: 12px;
    color: var(--sub-text-color);
}
}
:deep(.el-input-number) {
    width: 100%;
}

:deep(.el-collapse-item__header) {
    padding-left: 10px;
    font-size: 12px;
    padding-right: 10px;
}

:deep(.el-collapse-item__wrap) {
    margin: 10px auto;
    width: 90%;
}
</style>