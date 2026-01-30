<template>
    <div>
        <el-form label-width="120px">
            <el-form-item label="开启图片">
                <el-image :src="formData.onPath" @click="openImageDialog('onPath')" fit="contain"
                    style="width: 100px; height: 100px; cursor: pointer;" />
            </el-form-item>
            <el-form-item label="关闭图片">
                <el-image :src="formData.offPath" @click="openImageDialog('offPath')" fit="contain"
                    style="width: 100px; height: 100px; cursor: pointer;" />
            </el-form-item>
            <el-form-item label="禁用">
                <el-switch v-model="formData.disabled"></el-switch>
                <el-tooltip content="禁用时点击不会触发切换事件，并且透明度为50%" placement="top"> 
                    <el-button link >
                        <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                      </el-button>
                </el-tooltip>
            </el-form-item>
            <el-form-item label="只读">
                <el-switch v-model="formData.readonly"></el-switch>
                <el-tooltip content="只读时点击不会触发切换事件" placement="top"> 
                    <el-button link >
                        <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                      </el-button>
                </el-tooltip>
            </el-form-item>
        </el-form>

        <el-dialog :model-value="imageDialogVisible" width="50%"
            :title="selectedImageField === 'onPath' ? '开启图片' : '关闭图片'" draggable @closed="handleDialogClose">
            <el-tabs v-model="activeTab">
                <el-tab-pane label="系统图片" name="system">
                    <el-scrollbar height="50vh" :noresize="true">
                        <el-row :gutter="10" class="img-list-wrapper">
                            <template v-if="selectedImageField === 'onPath'">
                                <el-col :span="6" v-for="image in systemOnImages" :key="image">
                                    <el-image :src="image" :class="{ selected: isSelectedImage(image) }"
                                        @click="selectImage(image, 'onPath')" class="mt5" fit="contain"
                                        style="width: 100px; height: 100px; cursor: pointer;" />
                                </el-col>
                            </template>
                            <template v-else-if="selectedImageField === 'offPath'">
                                <el-col :span="6" v-for="image in systemOffImages" :key="image">
                                    <el-image :src="image" :class="{ selected: isSelectedImage(image) }"
                                        @click="selectImage(image, 'offPath')" class="mt5" fit="contain"
                                        style="width: 100px; height: 100px; cursor: pointer;" />
                                </el-col>
                            </template>
                        </el-row>
                    </el-scrollbar>
                </el-tab-pane>
                <el-tab-pane label="选择图片" name="custom">
                    <UserImgList ref="userImgListRef" :select="true" :showOverlay="false"></UserImgList>
                </el-tab-pane>
            </el-tabs>
            <div class="dialog-footer">
                <el-button @click="handleDialogClose">关闭</el-button>
                <el-button type="primary" @click="handleConfirm">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import UserImgList from '@/components/UserImgList.vue';
import propsPanelMixins from '@/mixins/propsPanelMixins';
import {getAssetPath} from "@/utils/utils"
export default {
    name: 'switchPanel',
    mixins: [propsPanelMixins],
    components: {
        UserImgList
    },
    data() {
        return {
            formData: {
            
            },
            imageDialogVisible: false, // 控制对话框的显示与隐藏
            activeTab: 'system', // 当前活动的选项卡，默认是系统图片
            selectedImageField: '', // 当前选择的图片
            systemOnImages: [], // 系统开启图片列表
            systemOffImages: [], // 系统关闭图片列表
            systemImagesCount: 35, // 系统图片数量
            tempSelectedImage: '' // 临时选中的图片，在对话框中保存
        }
    },
    mounted() {
        this.initSystemImages()
    },
    methods: {
        // 初始化系统图片列表
        initSystemImages() {
            for (let i = 1; i <= this.systemImagesCount; i++) {
                let ext = 'svg';
                if (i === 32) {
                    ext = 'png';
                }
                this.systemOnImages.push(getAssetPath(`/assets/imgs/module/switch/${i}_1.${ext}`));
                this.systemOffImages.push(getAssetPath(`/assets/imgs/module/switch/${i}_0.${ext}`));
            }
        },
        // 打开图片选择对话框
        openImageDialog(field) {
            this.selectedImageField = field;
            this.imageDialogVisible = true;
            this.tempSelectedImage = this.formData[field]; // 保存当前已选中图片到临时变量
        },
        // 检查图片是否被选中
        isSelectedImage(image) {
            return image === this.tempSelectedImage;
        },
        // 选择图片
        selectImage(image) {
            this.tempSelectedImage = image; // 更新临时选中图片
        },
        // 关闭对话框
        handleDialogClose() {
            this.imageDialogVisible = false;
        },
        // 确认选择的图片
        handleConfirm() {
            if (this.activeTab === 'custom') {
                const userImgListRef = this.$refs.userImgListRef;
                const selectedImg = userImgListRef.getSelectImg();

                if (!selectedImg) {
                    this.$message.error('请选择一张图片');
                    return;
                }
                this.formData[this.selectedImageField] = selectedImg;
            } else {
                if (!this.tempSelectedImage) {
                    this.$message.error('请选择一张图片');
                    return;
                }
                this.formData[this.selectedImageField] = this.tempSelectedImage;
            }
            this.imageDialogVisible = false;
            this.updateNode();
        }
    }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
    text-align: right;
    margin-top: 20px;
}

.img-list-wrapper {
    overflow-x: hidden;
    max-width: 99%;

    .el-col-6 {
        text-align: center;
    }
}

.image-preview {
    height: 50px;
}

.image-notice {
    opacity: 0.9;
    letter-spacing: 1px;
    font-size: 12px;
}

.selected {
    border-radius: 4px;
    border: 1px solid #409eff;
}
</style>