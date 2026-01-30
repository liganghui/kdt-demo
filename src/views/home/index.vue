<template>
  <div class="dashboard-container">
    <!-- 页面标题区 -->
    <div class="page-header">
      <h2 class="page-title">大屏管理</h2>
      <p class="page-subtitle">创建和管理您的可视化大屏</p>
    </div>

    <el-row :gutter="20">
      <!-- 创建表单区 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="6" :xl="6">
        <div class="form-card">
          <h3 class="form-title">创建大屏</h3>
          <el-form
            :model="form"
            ref="form"
            class="creation-form"
            :rules="rules"
            label-position="top"
          >
            <el-form-item label="大屏名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入大屏名称"
                prefix-icon="el-icon-monitor"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                icon="el-icon-plus"
                @click="onSubmit"
                :loading="submitting"
                class="submit-button"
              >
                创建新大屏
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <!-- 列表展示区 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="18" :xl="18">
        <div class="list-container">
          <div class="list-header">
            <h3 class="list-title">我的大屏</h3>
            <!-- <el-input
                v-model="searchQuery"
                placeholder="搜索大屏"
                prefix-icon="el-icon-search"
                clearable
                class="search-input">
              </el-input> -->
          </div>

          <div v-if="filteredList.length === 0" class="empty-state">
            <i class="el-icon-picture-outline empty-icon"></i>
            <p>暂无大屏数据，立即创建您的第一个大屏</p>
          </div>

          <el-row :gutter="20" class="dashboard-list">
            <el-col
              v-for="item in filteredList"
              :key="item.id"
              :xs="24"
              :sm="12"
              :md="12"
              :lg="8"
              :xl="6"
            >
              <div class="dashboard-card">
                <div class="card-thumbnail">
                  <el-image
                    :src="item.thumbnail || defaultThumbnail"
                    fit="cover"
                    :preview-src-list="[item.thumbnail || defaultThumbnail]"
                  >
                    <div slot="error" class="thumbnail-fallback">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>
                </div>
                <div class="card-content">
                  <h4 class="card-title" :title="item.name">{{ item.name }}</h4>
                  <p class="card-meta">
                    <span>
                      <i class="el-icon-time"></i>
                      {{ item.time ? formatDate(item.time) : '未更新' }}
                    </span>
                  </p>
                </div>
                <div class="card-actions">
                  <el-tooltip content="编辑" placement="top">
                    <el-button type="primary" icon="el-icon-edit" circle @click="handleEdit(item)">
                      <svg-icon name="edit" size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="预览" placement="top">
                    <el-button
                      type="success"
                      icon="el-icon-view"
                      circle
                      @click="handlePreview(item)"
                    >
                      <svg-icon name="ungroup" size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button
                      type="danger"
                      icon="el-icon-delete"
                      circle
                      @click="handleDelete(item)"
                    >
                      <svg-icon name="delete" size="18" />
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'
import { getStageDataList, saveStageData, deleteStageData } from '@/api/system'

export default {
  name: 'DashboardHome',
  data() {
    return {
      form: {
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入大屏名称', trigger: 'blur' },
          { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ]
      },
      listData: [],
      searchQuery: '',
      submitting: false,
      defaultThumbnail: ''
    }
  },
  computed: {
    filteredList() {
      if (!this.searchQuery) return this.listData

      const query = this.searchQuery.toLowerCase()
      return this.listData.filter((item) => item.name.toLowerCase().includes(query))
    }
  },
  created() {
    // 调试
    const urlParams = new URLSearchParams(window.location.search)
    const type = urlParams.get('type')
    if (type && type.startsWith('go')) {
      const id = urlParams.get('id')
      const groupId = urlParams.get('groupId')
      const updateTid = urlParams.get('updateTid')
      if (id) {
        this.$router.push({
          path: '/build/' + id,
          query: {
            id: id,
            groupId: groupId,
            updateTid: updateTid
          }
        })
        return
      }
    }

  },
  mounted() {
    this.getList()
  },
  methods: {
    getList() {
      this.$loading({
        lock: true,
        text: '加载中...',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.7)'
      })

      getStageDataList()
        .then((res) => {
          this.$loading().close()
          if (res.code === 200) {
            this.listData = res.data
          } else {
            this.$message.error('加载失败：' + (res.message || '未知错误'))
          }
        })
        .catch((err) => {
          this.$loading().close()
          this.$message.error('加载失败：' + (err.message || '网络错误'))
        })
    },
    handleEdit(item) {
      this.$router.push('/build/' + item.id)
    },
    handleDelete(item) {
      this.$confirm('确定要删除大屏 "' + item.name + '" 吗？此操作不可恢复', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        closeOnClickModal: false
      })
        .then(() => {
          const loading = this.$loading({
            lock: true,
            text: '正在删除...',
            spinner: 'el-icon-delete',
            background: 'rgba(255, 255, 255, 0.7)'
          })

          deleteStageData({ id: item.id })
            .then((res) => {
              loading.close()
              if (res.code === 200) {
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.getList()
              } else {
                this.$message.error('删除失败：' + (res.message || '未知错误'))
              }
            })
            .catch((err) => {
              loading.close()
              this.$message.error('删除失败：' + (err.message || '网络错误'))
            })
        })
        .catch(() => {
          // 用户取消删除
        })
    },
    handlePreview(item) {
      this.$router.push('/preview/' + item.id)
    },
    onSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.submitting = true
          const id = uuidv4().split('-').join('')

          saveStageData({
            id: id,
            name: this.form.name,
            stageJson: '',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
          })
            .then((res) => {
              this.submitting = false
              if (res.code === 200) {
                this.$message({
                  type: 'success',
                  message: '创建成功，即将进入编辑页面'
                })
                this.form.name = ''
                this.$refs.form.resetFields()
                this.getList()

                setTimeout(() => {
                  this.$router.push('/build/' + id)
                }, 800)
              } else {
                this.$message.error('创建失败：' + (res.message || '未知错误'))
              }
            })
            .catch((err) => {
              this.submitting = false
              console.error(err)
              this.$message.error('创建失败：' + (err.message || '网络错误'))
            })
        }
      })
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .page-title {
    font-size: 24px;
    color: #303133;
    margin: 0 0 8px;
    font-weight: 500;
  }

  .page-subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.form-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 24px;
  height: 100%;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 18px 0 rgba(0, 0, 0, 0.1);
  }

  .form-title {
    font-size: 18px;
    color: #303133;
    margin: 0 0 24px;
    position: relative;
    padding-left: 12px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 4px;
      height: 16px;
      width: 4px;
      background: #409eff;
      border-radius: 2px;
    }
  }

  .creation-form {
    .submit-button {
      width: 100%;
      padding: 12px 0;
      font-size: 16px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
      }
    }
  }
}

.list-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 24px;
  height: 100%;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .list-title {
      font-size: 18px;
      color: #303133;
      margin: 0;
      position: relative;
      padding-left: 12px;

      &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        height: 16px;
        width: 4px;
        background: #409eff;
        border-radius: 2px;
      }
    }

    .search-input {
      width: 250px;
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: #909399;

    .empty-icon {
      font-size: 56px;
      margin-bottom: 16px;
      color: #dcdfe6;
    }

    p {
      font-size: 14px;
    }
  }

  .dashboard-list {
    margin-top: 16px;
  }

  .dashboard-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s;
    margin-bottom: 20px;
    border: 1px solid #ebeef5;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);

      .card-actions {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-thumbnail {
      width: 100%;
      height: 160px;
      overflow: hidden;
      position: relative;
      background: #f5f7fa;

      .el-image {
        width: 100%;
        height: 100%;
      }

      .thumbnail-fallback {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        color: #c0c4cc;
        font-size: 36px;
      }
    }

    .card-content {
      padding: 16px;
      flex: 1;

      .card-title {
        margin: 0 0 12px;
        font-size: 16px;
        color: #303133;
        font-weight: 500;
        line-height: 1.4;
        height: 22px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-meta {
        margin: 0;
        font-size: 12px;
        color: #909399;

        i {
          margin-right: 4px;
        }
      }
    }

    .card-actions {
      padding: 12px 16px;
      background: rgba(245, 247, 250, 0.7);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      opacity: 0.8;
      transition: all 0.3s;
      transform: translateY(5px);
      border-top: 1px solid #ebeef5;
    }
  }
}

@media (max-width: 768px) {
  .list-container .list-header {
    flex-direction: column;
    align-items: flex-start;

    .list-title {
      margin-bottom: 16px;
    }

    .search-input {
      width: 100%;
    }
  }

  .dashboard-card .card-thumbnail {
    height: 120px;
  }

  .form-card {
    margin-bottom: 20px;
  }
}
:deep(.el-button > span) {
  margin-left: 0 !important;
}
</style>