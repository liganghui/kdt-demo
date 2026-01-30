<template>
  <div class="custom-dropdown" :style="dropdownStyle" @contextmenu.prevent v-if="visible && menuList.length > 0" ref="menuContainer">
    <ul class="menu-list">
      <li @click="handleMenuClick(item.key)" v-for="item in menuList" :key="item.key">
        <svg-icon :name="item.icon" size="16"></svg-icon>
        <span>
          {{ item.name }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'contextMenu',
  data() {
    return {
      visible: false,
      baseList: [
        {
          name: '上一层',
          key: 'moveUp',
          icon: 'shangyiceng'
        },
        {
          name: '下一层',
          key: 'moveDown',
          icon: 'xiayiceng'
        },
        {
          name: '置顶',
          key: 'moveTop',
          icon: 'zhidingceng'
        },
        {
          name: '置底',
          key: 'moveBottom',
          icon: 'zhidiceng'
        },
        {
          name: '锁定',
          key: 'lock',
          icon: 'lock'
        },
        {
          name: '解锁',
          key: 'unlock',
          icon: 'unlock'
        },
        {
          name: '组合',
          key: 'group',
          icon: 'group'
        },
        {
          name: '拆分',
          key: 'ungroup',
          icon: 'ungroup'
        },
        {
          name: '保存为组件',
          key: 'saveAsComponent',
          icon: 'moudle'  
        },
        {
          name: '复制',
          key: 'copy',
          icon: 'copy'
        },
        {
          name: '剪切',
          key: 'cut',
          icon: 'cut'
        },
        {
          name: '粘贴',
          key: 'paste',
          icon: 'niantie'
        },
        {
          name: '聚焦',
          key: 'focus',
          icon: 'jujiao'
        },
        {
          name: '删除',
          key: 'delete',
          icon: 'delete'
        }
      ],
      menuList: [],
      position: {
        x: 0,
        y: 0
      },
      menuSize: {
        width: 0, // 默认宽度，与CSS中保持一致
        height: 0 // 动态计算
      }
    }
  },
  computed: {
    dropdownStyle() {
      return {
        top: `${this.position.y}px`,
        left: `${this.position.x}px`
      }
    }
  },
  mounted() {
    this.calculateMenuHeight();
  },
  methods: {
    calculateMenuHeight() {
      // 根据菜单项数量和样式估算高度
      // 每个菜单项高度约32px（8px padding * 2 + 16px内容高度）
      // 5px顶部和底部padding
      const itemHeight = 32;
      const padding = 10;
      this.menuSize.height = this.baseList.length * itemHeight + padding;
    },
    handleMenuClick(key) {
      const Kd = window.kdt
      if (key === 'copy') {
        Kd.copyNodes()
      } else if (key === 'moveUp') {
        Kd.moveUp()
      } else if (key === 'moveDown') {
        Kd.moveDown()
      } else if (key === 'moveTop') {
        Kd.moveToTop()
      } else if (key === 'moveBottom') {
        Kd.moveToBottom()
      } else if (key === 'delete') {
        Kd.deleteNodes()
      } else if (key === 'group') {
        Kd.groupNodes()
      } else if (key === 'ungroup') {
        Kd.ungroupNodes()
      } else if (key === 'lock') {
        Kd.lockNodes()
      } else if (key === 'unlock') {
        Kd.unlockNodes()
      } else if (key === 'cut') {
        Kd.cutNodes()
      } else if (key === 'paste') {
        Kd.pasteNodes()
      } else if (key === 'focus') {
        Kd.focusNode()
      }
      this.hideContextMenu()
    },
    showContextMenu(e) {
      // 获取点击位置
      const clickX = e.evt.layerX;
      const clickY = e.evt.layerY;
      
      // 先处理菜单数据，确保菜单项数量正确
      this.handleMenuData(e);
      
      // 获取视口尺寸
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 计算四象限
      const isLeftHalf = clickX < viewportWidth / 2;
      const isTopHalf = clickY < viewportHeight / 2;
      
      // 先显示菜单，然后获取实际尺寸
      this.visible = true;
      
      // 下一帧获取实际菜单尺寸并计算位置
      this.$nextTick(() => {
        if (this.$refs.menuContainer) {
          const rect = this.$refs.menuContainer.getBoundingClientRect();
          this.menuSize.width = rect.width;
          this.menuSize.height = rect.height;
          
          // 使用实际尺寸计算菜单位置
          let menuX = clickX;
          let menuY = clickY;
          
          if (isLeftHalf && isTopHalf) {
            // 左上象限 - 显示在右下
            menuX = clickX;
            menuY = clickY;
          } else if (!isLeftHalf && isTopHalf) {
            // 右上象限 - 显示在左下
            menuX = clickX - this.menuSize.width;
            menuY = clickY;
          } else if (isLeftHalf && !isTopHalf) {
            // 左下象限 - 显示在右上
            menuX = clickX;
            menuY = clickY - this.menuSize.height;
          } else {
            // 右下象限 - 显示在左上
            menuX = clickX - this.menuSize.width;
            menuY = clickY - this.menuSize.height;
          }
          
          // 确保菜单不会超出视口
          menuX = Math.max(0, Math.min(menuX, viewportWidth - this.menuSize.width));
          menuY = Math.max(0, Math.min(menuY, viewportHeight - this.menuSize.height));
          
          this.position = {
            x: menuX,
            y: menuY
          };
        }
      });
    },
    hideContextMenu() {
      this.visible = false
    },
    handleMenuData(e) {
      let menuData = [...this.baseList]
      let keys = []
      const currentNode = e.target
      const clipBoardData = e.state.clipBoard
      const selectedNodes = e.state.selectedNodes
      if (currentNode.attrs.lock) {
        keys = ['unlock', 'delete']
      } else if (selectedNodes.length === 1 && selectedNodes[0].attrs?.name === 'group') {
        keys = [
          'moveUp',
          'moveDown',
          'moveTop',
          'moveBottom',
          'lock',
          'ungroup',
          'copy',
          'cut',
          'delete'
        ]
      } else if (selectedNodes.length === 1) {
        keys = [
          'moveUp',
          'moveDown',
          'moveTop',
          'moveBottom',
          'lock',
          'copy',
          'cut',
          'delete',
          'focus'
        ]
      } else if (selectedNodes.length > 1) {
        keys = [
          'moveUp',
          'moveDown',
          'moveTop',
          'moveBottom',
          'lock',
          'group',
          'copy',
          'cut',
          'delete'
        ]
      } else {
        keys = []
      }
      if (clipBoardData && clipBoardData?.nodes?.length > 0) {
        keys.push('paste')
      }
      this.visible = keys.length > 0 ? true : false
      this.menuList = menuData.filter((item) => keys.includes(item.key))
    }
  }
}
</script>
<style scoped lang="scss">
.custom-dropdown {
  position: absolute;
  background-color: var(--panel-border-out-color);
  z-index: 1000;
  box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.1);
  left: 0;
  top: 0;
  padding: 5px 0;
  width: 150px;
  margin-left: 21px;
  background-color: var(--panel-bg-color);
  margin-top: 21px;
  font-size: 14px;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-list li {
  padding: 8px 12px 8px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--panel-border-out-color);
  span{
    margin-left: 8px;
  }
  // 最后一个节点不显示分割线
  &:last-child {
    border-bottom: none;
  }
}

.menu-list li:hover {
   color: var(--primary-color);
}
</style>