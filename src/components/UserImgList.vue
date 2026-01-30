<template>
  <div class="user-img-list">
    <el-row :gutter="15">
      <!-- 上传图片按钮 -->
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
          <div class="ft12">点击上传图片</div>
        </el-upload>
      </el-col>

      <!-- 图片列表展示 -->
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
    <div class="no-more" v-if="images.length >= 15">没有更多啦</div>
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
     * 是否允许图片选中
     */
    select: {
      type: Boolean,
      default: false
    },
    /**
     * 是否显示 overlay 层
     */
    showOverlay: {
      type: Boolean,
      default: true
    },
    /**
     * 默认图片地址，如果在图片列表中匹配到相同路径，
     * 则在 select = true 的前提下默认选中此图片
     */
    selectUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 图片列表：每个元素包含 { id, url, source }
      images: [],
      // 上传 loading 标识
      uploadLoading: false,
      // 记录鼠标悬停的图片索引，用于显示悬浮层
      hoverIndex: null,
      // 选中图片的下标
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
          // 如果由 false → true，默认选中第一张（可根据需要调整）
          this.selectKey = newVal ? 0 : ''
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * 获取系统图片列表，并构造图片对象数据
     */
    async getImgList() {
      try {
        let systemImgs = []

        // 获取系统图片列表
        const systemRes = await getSystemImgList()
        if (systemRes.code === 200) {
          systemImgs = systemRes.data.map((item) => ({
            id: item.id, // 假设接口返回 id 字段
            url: item.url,
            source: 'system'
          }))
        }

        this.images = systemImgs

        // 如果允许选中，则检查是否存在 selectUrl
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
        console.error('获取图片列表失败', error)
        this.$message.error('获取图片列表失败!')
      }
    },

    /**
     * 点击图片卡片时触发的事件（用于选中图片）
     */
    handleImgClick(image, index) {
      if (this.select) {
        this.selectKey = index
      }
    },

    /**
     * 放大图片：使用 Element Plus 的 ElImageViewer 实现预览
     * @param {Number} index 当前图片的索引
     */
    handleEnlarge(index) {
      const urls = this.images.map((item) => item.url)
      // 创建一个容器节点
      const container = document.createElement('div')
      document.body.appendChild(container)
      // 动态创建 ElImageViewer 的 VNode
      const vnode = createVNode(ElImageViewer, {
        urlList: urls,
        initialIndex: index,
        showProgress: true,
        onClose: () => {
          render(null, container)
          container.remove()
        }
      })
      // 挂载组件
      render(vnode, container)
    },

    /**
     * 删除图片
     * @param {Object} image 当前图片对象，包含 id、url、source
     * @param {Number} index 当前图片的索引
     */
    async handleDelete(image, index) {
      try {
        await this.$confirm('请注意: 素材删除后不可恢复，并从单体图中移除', '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const res = await deleteSystemImg({ id: image.id })
        
        if (res && res.code === 200) {
          this.$message.success('图片删除成功')
          // 删除成功后从列表中移除该图片
          this.images.splice(index, 1)
        } else {
          this.$message.error('图片删除失败')
        }
      } catch (error) {
        // 用户取消删除时不需要做任何处理
        if (error !== 'cancel') {
          this.$message.error('图片删除失败')
        }
      }
    },

    /**
     * 自定义上传请求处理函数
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
          this.$message.success('图片上传成功')
          this.$emitEvent('ImgSaved')
          onSuccess(response)
        } else {
          this.$message.error('图片上传失败')
          onError(response)
        }
      } catch (error) {
        this.uploadLoading = false
        this.$message.error('图片上传失败')
        onError(error)
      }
    },

    /**
     * 上传前判断：限制只能上传图片格式
     */
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        this.$message.error('上传的文件必须是图片')
      }
      return isImage
    },

    /**
     * 获取当前选中的图片路径。
     * @returns {String|undefined} 当前选中的图片路径
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

/* 图片容器定位 */
.image-container {
  position: relative;
}

/* 悬浮层样式 */
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