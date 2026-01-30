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
          name: 'move up',
          key: 'moveUp',
          icon: 'shangyiceng'
        },
        {
          name: 'move down',
          key: 'moveDown',
          icon: 'xiayiceng'
        },
        {
          name: 'move top',
          key: 'moveTop',
          icon: 'zhidingceng'
        },
        {
          name: 'move bottom',
          key: 'moveBottom',
          icon: 'zhidiceng'
        },
        {
          name: 'lock',
          key: 'lock',
          icon: 'lock'
        },
        {
          name: 'unlock',
          key: 'unlock',
          icon: 'unlock'
        },
        {
          name: 'group',
          key: 'group',
          icon: 'group'
        },
        {
          name: 'ungroup',
          key: 'ungroup',
          icon: 'ungroup'
        },
        {
          name: 'save as component',
          key: 'saveAsComponent',
          icon: 'moudle'  
        },
        {
          name: 'copy',
          key: 'copy',
          icon: 'copy'
        },
        {
          name: 'cut',
          key: 'cut',
          icon: 'cut'
        },
        {
          name: 'paste',
          key: 'paste',
          icon: 'niantie'
        },
        {
          name: 'focus',
          key: 'focus',
          icon: 'jujiao'
        },
        {
          name: 'delete',
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
        width: 0, // Default Width，WithCSSConsistent with CSS
        height: 0 // Dynamically Calculated
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
      // Estimate height based on the number and style of menu items
      // Each menu item height is approximately32px（8px padding * 2 + 16pxContent Height）
      // 5pxTop and Bottompadding
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
      // Get Click Position
      const clickX = e.evt.layerX;
      const clickY = e.evt.layerY;
      
      // Process menu data first，Ensure the number of menu items is correct
      this.handleMenuData(e);
      
      // Get Viewport Size
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate Quadrants
      const isLeftHalf = clickX < viewportWidth / 2;
      const isTopHalf = clickY < viewportHeight / 2;
      
      // Show the menu first，Then get the actual size
      this.visible = true;
      
      // Get the actual menu size and calculate the position in the next frame
      this.$nextTick(() => {
        if (this.$refs.menuContainer) {
          const rect = this.$refs.menuContainer.getBoundingClientRect();
          this.menuSize.width = rect.width;
          this.menuSize.height = rect.height;
          
          // Calculate menu position using actual size
          let menuX = clickX;
          let menuY = clickY;
          
          if (isLeftHalf && isTopHalf) {
            // Upper Left Quadrant - Displayed in the lower right
            menuX = clickX;
            menuY = clickY;
          } else if (!isLeftHalf && isTopHalf) {
            // Upper Right Quadrant - Displayed in the lower left
            menuX = clickX - this.menuSize.width;
            menuY = clickY;
          } else if (isLeftHalf && !isTopHalf) {
            // Lower Left Quadrant - Displayed in the upper right
            menuX = clickX;
            menuY = clickY - this.menuSize.height;
          } else {
            // Lower Right Quadrant - Displayed in the upper left
            menuX = clickX - this.menuSize.width;
            menuY = clickY - this.menuSize.height;
          }
          
          // Ensure the menu does not exceed the viewport
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
  // The last node does not display a separator
  &:last-child {
    border-bottom: none;
  }
}

.menu-list li:hover {
   color: var(--primary-color);
}
</style>