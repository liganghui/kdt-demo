<template>
  <div class="user-img-list">
    <el-row :gutter="15">
      <!-- Upload Image Button -->
      <el-col :span="6">
        <el-upload
          :http-request="customUploadRequest"
          :limit="1"
          :show-file-list="false"
          :before-upload="beforeUpload"
          drag
          v-loading="uploadLoading"
        >
          <el-icon size="16" class="ft12 sub-text-color">
            <Plus />
          </el-icon>
          <div class="ft12">click to upload image</div>
        </el-upload>
      </el-col>

      <!-- Image List Display -->
      <el-col v-for="(image, index) in images" :key="image.id" :span="6">
        <el-card
          shadow="hover"
          class="img-card"
          :class="index === selectKey ? 'img-selected' : ''"
          @click="handleImgClick(image, index)"
        >
          <div
            class="image-container"
            @mouseenter="hoverIndex = index"
            @mouseleave="hoverIndex = null"
          >
            <el-image :src="image.url" class="user-image" fit="contain" />
            <div class="overlay" v-if="showOverlay && hoverIndex === index">
              <el-button class="icon-btn" type="primary" @click.stop="handleEnlarge(index)">
                <svg-icon name="zoom" size="16"></svg-icon>
              </el-button>
              <el-button class="icon-btn" type="primary" @click.stop="handleDelete(image, index)">
                <svg-icon name="delete" size="16"></svg-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <div class="no-more" v-if="images.length >= 15">no more</div>
  </div>
</template>

<script>
import { ElImageViewer } from 'element-plus'
import { createVNode, render } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { getSystemImgList, uploadSystemImg, deleteSystemImg } from '@/api/system'

export default {
  name: 'UserImgList',
  components: {
    Plus
  },
  props: {
    /**
     * Whether to Allow Image Selection
     */
    select: {
      type: Boolean,
      default: false
    },
    /**
     * Whether to Show overlay Layer
     */
    showOverlay: {
      type: Boolean,
      default: true
    },
    /**
     * Default Image Address，If the Same Path is Matched in the Image List，
     * Then Under select = true On the Premise of Selecting This Image by Default
     */
    selectUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // Image List：Each Element Contains { id, url, source }
      images: [],
      // Upload loading Indicator
      uploadLoading: false,
      // Record the Image Index Hovered by the Mouse，Used to Display the Overlay Layer
      hoverIndex: null,
      // Index of the Selected Image
      selectKey: ''
    }
  },
  mounted() {
    this.getImgList()
  },
  watch: {
    select: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // If From false → true，By Default, Select the First One（Adjustable as Needed）
          this.selectKey = newVal ? 0 : ''
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * Get System Image List，And Construct Image Object Data
     */
    async getImgList() {
      try {
        let systemImgs = []

        // Get System Image List
        const systemRes = await getSystemImgList()
        if (systemRes.code === 200) {
          systemImgs = systemRes.data.map((item) => ({
            id: item.id, // Assume the Interface Returns id Field
            url: item.url,
            source: 'system'
          }))
        }

        this.images = systemImgs

        // If Selection is Allowed，Then Check if It Exists selectUrl
        if (this.select) {
          if (this.selectUrl) {
            const foundIndex = this.images.findIndex((img) => img.url === this.selectUrl)
            this.selectKey = foundIndex !== -1 ? foundIndex : ''
          } else {
            this.selectKey = ''
          }
        } else {
          this.selectKey = ''
        }
      } catch (error) {
        console.error('failed to get image list', error)
        this.$message.error('failed to get image list!')
      }
    },

    /**
     * Event Triggered When Clicking the Image Card（Used to Select Images）
     */
    handleImgClick(image, index) {
      if (this.select) {
        this.selectKey = index
      }
    },

    /**
     * Enlarge Image：Use Element Plus Of ElImageViewer Realize Preview
     * @param {Number} index Index of the Current Image
     */
    handleEnlarge(index) {
      const urls = this.images.map((item) => item.url)
      // Create a Container Node
      const container = document.createElement('div')
      document.body.appendChild(container)
      // Dynamically Create ElImageViewer Of VNode
      const vnode = createVNode(ElImageViewer, {
        urlList: urls,
        initialIndex: index,
        showProgress: true,
        onClose: () => {
          render(null, container)
          container.remove()
        }
      })
      // Mount Component
      render(vnode, container)
    },

    /**
     * Delete Image
     * @param {Object} image Current Image Object，Contains id、url、source
     * @param {Number} index Index of the Current Image
     */
    async handleDelete(image, index) {
      try {
        await this.$confirm('please note: material cannot be recovered after deletion，and removed from single image', 'Confirm Operation', {
          confirmButtonText: 'confirm',
          cancelButtonText: 'cancel',
          type: 'warning'
        })
        
        const res = await deleteSystemImg({ id: image.id })
        
        if (res && res.code === 200) {
          this.$message.success('image deleted successfully')
          // Remove the Image from the List After Successful Deletion
          this.images.splice(index, 1)
        } else {
          this.$message.error('failed to delete image')
        }
      } catch (error) {
        // No Processing is Needed When the User Cancels Deletion
        if (error !== 'cancel') {
          this.$message.error('failed to delete image')
        }
      }
    },

    /**
     * Custom Upload Request Handler
     */
    async customUploadRequest({ file, onSuccess, onError }) {
      this.uploadLoading = true
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await uploadSystemImg(formData)
        
        this.uploadLoading = false
        if (response.code === 200) {
          this.getImgList()
          this.$message.success('image uploaded successfully')
          this.$emitEvent('ImgSaved')
          onSuccess(response)
        } else {
          this.$message.error('failed to upload image')
          onError(response)
        }
      } catch (error) {
        this.uploadLoading = false
        this.$message.error('failed to upload image')
        onError(error)
      }
    },

    /**
     * Judgment Before Upload：Limit to Uploading Only Image Formats
     */
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        this.$message.error('uploaded file must be an image')
      }
      return isImage
    },

    /**
     * Get the Path of the Currently Selected Image。
     * @returns {String|undefined} Path of the Currently Selected Image
     */
    getSelectImg() {
      return this.images[this.selectKey].url
    }
  }
}
</script>

<style lang="scss" scoped>
.user-image {
  width: 100%;
  height: 100px;
  display: block;
}

.img-card {
  padding: 4px 6px;
  min-height: 100px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  position: relative;
}

.img-selected {
  border: 1px solid #409eff;
}

/* Image Container Positioning */
.image-container {
  position: relative;
}

/* Overlay Layer Style */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
}

.icon-btn {
  margin: 0 5px;
  font-size: 18px;
  background-color: rgba(255, 255, 255, 0.4);
}

.user-img-list {
  overflow: hidden;
}

:deep(.el-row) {
  padding: 0 !important;
}

:deep(.el-card__body) {
  padding: 0 !important;
}

.no-more {
  color: #999;
  text-align: center;
  margin: 20px 0;
}
</style>