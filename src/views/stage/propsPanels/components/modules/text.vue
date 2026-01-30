<template>
    <div class="props-container">
        <el-form :model="formData" label-width="120px">
            <!-- Text Input -->
            <el-form-item label="Text" v-if="!isEvent">
                <el-input v-model="formData.data" type="textarea"  :maxlength="$store.state.globalVariable.textareaMaxSize"/>
            </el-form-item>
            <el-form-item label="Decimal Places">
                <el-input-number 
                    v-model="formData.decimalPlaces" 
                    :min="0" 
                    :max="10"
                    placeholder="default not processed"
                    controls-position="right"
                    clearable
                />
            </el-form-item>
            <!-- Font Settings -->
            <el-form-item label="Font">
                <el-select v-model="formData.fontFamily" placeholder="select font">
                    <el-option v-for="item in fonts" :key="item.value" :label="item.label"
                        :value="item.value">
                        <span :style="'font-family:' + item.value">{{ item.label }}</span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Color">
                <el-color-picker v-model="formData.fill" />
            </el-form-item>
            <el-form-item label="Font Size">
                <el-input-number v-model="formData.fontSize" :min="$store.state.globalVariable.fontMinSize" :max="$store.state.globalVariable.fontMaxSize"
                    controls-position="right" />
            </el-form-item>
            <el-form-item label="Font Weight">
                <el-select v-model="formData.fontWeight" placeholder="select font weight">
                    <el-option label="Normal" value="normal"></el-option>
                    <el-option label="Bold" value="bold"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Padding">
                <el-input-number v-model="formData.padding" controls-position="right" />
            </el-form-item>
            <el-form-item label="Horizontal Align">
                <el-select v-model="formData.textAlign" placeholder="select horizontal align">
                    <el-option label="Left Align" value="left"></el-option>
                    <el-option label="Center" value="center"></el-option>
                    <el-option label="Right Align" value="right"></el-option>
                </el-select>
            </el-form-item>
            
            <el-form-item label="Vertical Align">
                <el-select v-model="formData.verticalAlign" placeholder="select vertical align">
                    <el-option label="Top Align" value="top"></el-option>
                    <el-option label="Middle" value="middle"></el-option>
                    <el-option label="Bottom Align" value="bottom"></el-option>
                </el-select>
            </el-form-item>
            
            <el-form-item label="Letter Spacing">
                <el-input-number v-model="formData.letterSpacing" controls-position="right" />
            </el-form-item>
            
            <el-form-item label="Line Height">
                <el-input-number v-model="formData.lineHeight" controls-position="right" />
            </el-form-item>
            
            <el-form-item label="Background Color">
                <el-color-picker v-model="formData.backgroundColor" />
            </el-form-item>
            
            <!-- Border Settings -->
            <template v-if="initialized">
                <el-form-item label="Border Size">
                    <el-input-number v-model="formData.borderSize" controls-position="right" />
                </el-form-item>
                
                <el-form-item label="Border Color">
                    <el-color-picker v-model="formData.borderColor" />
                </el-form-item>
                
                <el-form-item label="Border Style">
                    <el-select v-model="formData.borderStyle" placeholder="select border style">
                        <el-option label="Solid" value="solid"></el-option>
                        <el-option label="Dashed" value="dashed"></el-option>
                        <el-option label="Dotted" value="dotted"></el-option>
                    </el-select>
                </el-form-item>
            </template>
          
            <!-- Hyperlink Settings -->
            <el-form-item label="Enable Hyperlink">
                <el-switch v-model="formData.hyperlinkEnabled" active-text="enable" inactive-text="disable" />
            </el-form-item>
            
            <el-form-item label="Link Address" v-if="formData.hyperlinkEnabled">
                <el-input v-model="formData.hyperlinkUrl" placeholder="link address"  type="textarea" :maxlength="$store.state.globalVariable.textareaMaxSize" />
            </el-form-item>
            
            <el-form-item label="Open Method" v-if="formData.hyperlinkEnabled">
                <el-select v-model="formData.hyperlinkTarget" placeholder="open method">
                    <el-option label="Current Window" value="_self"></el-option>
                    <el-option label="New Window" value="_blank"></el-option>
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
            // Delay the initialization of some content to reduce rendering lag
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