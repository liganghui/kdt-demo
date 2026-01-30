<template>
    <div>
        <el-form label-width="120px">
            <el-form-item label="Enable Image">
                <el-image :src="formData.onPath" @click="openImageDialog('onPath')" fit="contain"
                    style="width: 100px; height: 100px; cursor: pointer;" />
            </el-form-item>
            <el-form-item label="Disable Image">
                <el-image :src="formData.offPath" @click="openImageDialog('offPath')" fit="contain"
                    style="width: 100px; height: 100px; cursor: pointer;" />
            </el-form-item>
            <el-form-item label="Disabled">
                <el-switch v-model="formData.disabled"></el-switch>
                <el-tooltip content="when disabled, clicking will not trigger the toggle event，and the transparency is50%" placement="top"> 
                    <el-button link >
                        <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                      </el-button>
                </el-tooltip>
            </el-form-item>
            <el-form-item label="Readonly">
                <el-switch v-model="formData.readonly"></el-switch>
                <el-tooltip content="when readonly, clicking will not trigger the toggle event" placement="top"> 
                    <el-button link >
                        <svg-icon name="help" size="18" class="ml8 text-color"></svg-icon>
                      </el-button>
                </el-tooltip>
            </el-form-item>
        </el-form>

        <el-dialog :model-value="imageDialogVisible" width="50%"
            :title="selectedImageField === 'onPath' ? 'Enable Image' : 'Disable Image'" draggable @closed="handleDialogClose">
            <el-tabs v-model="activeTab">
                <el-tab-pane label="System Image" name="system">
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
                <el-tab-pane label="Select Image" name="custom">
                    <UserImgList ref="userImgListRef" :select="true" :showOverlay="false"></UserImgList>
                </el-tab-pane>
            </el-tabs>
            <div class="dialog-footer">
                <el-button @click="handleDialogClose">close</el-button>
                <el-button type="primary" @click="handleConfirm">confirm</el-button>
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
            imageDialogVisible: false, // Control the display and hiding of the dialog
            activeTab: 'system', // Current active tab，Default is system image
            selectedImageField: '', // Currently selected image
            systemOnImages: [], // System on image list
            systemOffImages: [], // System off image list
            systemImagesCount: 35, // System image count
            tempSelectedImage: '' // Temporarily selected image，Saved in the dialog
        }
    },
    mounted() {
        this.initSystemImages()
    },
    methods: {
        // Initialize system image list
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
        // Open image selection dialog
        openImageDialog(field) {
            this.selectedImageField = field;
            this.imageDialogVisible = true;
            this.tempSelectedImage = this.formData[field]; // Save currently selected image to temporary variable
        },
        // Check if the image is selected
        isSelectedImage(image) {
            return image === this.tempSelectedImage;
        },
        // Select image
        selectImage(image) {
            this.tempSelectedImage = image; // Update temporarily selected image
        },
        // Close dialog
        handleDialogClose() {
            this.imageDialogVisible = false;
        },
        // Confirm selected image
        handleConfirm() {
            if (this.activeTab === 'custom') {
                const userImgListRef = this.$refs.userImgListRef;
                const selectedImg = userImgListRef.getSelectImg();

                if (!selectedImg) {
                    this.$message.error('please select an image');
                    return;
                }
                this.formData[this.selectedImageField] = selectedImg;
            } else {
                if (!this.tempSelectedImage) {
                    this.$message.error('please select an image');
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