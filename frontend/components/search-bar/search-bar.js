// 搜索栏组件

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 搜索框值
    value: {
      type: String,
      value: '',
      observer(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.triggerEvent('input', { value: newVal });
        }
      }
    },
    
    // 占位符文本
    placeholder: {
      type: String,
      value: '搜索店铺、菜品...'
    },
    
    // 是否显示清除按钮
    showClearButton: {
      type: Boolean,
      value: true
    },
    
    // 是否显示搜索按钮
    showSearchButton: {
      type: Boolean,
      value: false
    },
    
    // 是否显示搜索建议
    showSuggestions: {
      type: Boolean,
      value: false
    },
    
    // 是否显示快速标签
    showQuickTags: {
      type: Boolean,
      value: false
    },
    
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    
    // 最大字符数
    maxlength: {
      type: Number,
      value: 100
    },
    
    // 搜索建议列表
    suggestions: {
      type: Array,
      value: [],
      observer(newVal) {
        // 当建议列表变化时可以添加处理逻辑
        if (newVal && newVal.length > 0) {
          // 可以在这里对建议进行格式化
          const formattedSuggestions = newVal.map(item => ({
            text: item.text || item,
            value: item.value || item.text || item,
            description: item.description || ''
          }));
          this.setData({
            _suggestions: formattedSuggestions
          });
        }
      }
    },
    
    // 快速标签列表
    quickTags: {
      type: Array,
      value: []
    },
    
    // 当前激活的标签
    activeTag: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    focus: false,
    _suggestions: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 输入框输入事件
     */
    onInput(event) {
      const value = event.detail.value;
      this.setData({ value });
      
      // 触发输入事件
      this.triggerEvent('input', { value });
      
      // 触发change事件
      this.triggerEvent('change', { value });
    },
    
    /**
     * 输入框聚焦事件
     */
    onFocus(event) {
      this.setData({ focus: true });
      
      // 触发聚焦事件
      this.triggerEvent('focus', {
        value: this.data.value,
        height: event.detail.height
      });
    },
    
    /**
     * 输入框失焦事件
     */
    onBlur(event) {
      this.setData({ focus: false });
      
      // 触发失焦事件
      this.triggerEvent('blur', {
        value: this.data.value
      });
    },
    
    /**
     * 输入确认事件
     */
    onConfirm(event) {
      const value = event.detail.value;
      
      // 触发搜索事件
      this.triggerEvent('search', { value });
      
      // 触发确认事件
      this.triggerEvent('confirm', { value });
    },
    
    /**
     * 搜索按钮点击
     */
    onSearch() {
      const value = this.data.value;
      
      // 触发搜索事件
      this.triggerEvent('search', { value });
    },
    
    /**
     * 清除按钮点击
     */
    onClear() {
      this.setData({ value: '' });
      
      // 触发清除事件
      this.triggerEvent('clear');
      
      // 触发清空后的输入事件
      this.triggerEvent('input', { value: '' });
    },
    
    /**
     * 建议项点击
     */
    onSuggestionTap(event) {
      const suggestion = event.currentTarget.dataset.suggestion;
      
      // 设置搜索框值为选择的建议
      this.setData({ value: suggestion.value || suggestion.text });
      
      // 触发建议选择事件
      this.triggerEvent('suggestiontap', { suggestion });
      
      // 触发搜索事件
      this.triggerEvent('search', { 
        value: suggestion.value || suggestion.text,
        suggestion
      });
    },
    
    /**
     * 标签点击
     */
    onTagTap(event) {
      const tag = event.currentTarget.dataset.tag;
      const tagValue = tag.value || tag.text;
      
      // 更新激活的标签状态
      this.setData({
        activeTag: this.data.activeTag === tagValue ? '' : tagValue
      });
      
      // 设置搜索框值为标签文本
      this.setData({ value: tagValue });
      
      // 触发标签点击事件
      this.triggerEvent('tagtap', { tag });
      
      // 触发搜索事件
      this.triggerEvent('search', { 
        value: tagValue,
        tag
      });
    },
    
    /**
     * 设置搜索值
     */
    setValue(value) {
      this.setData({ value });
      return this;
    },
    
    /**
     * 获取搜索值
     */
    getValue() {
      return this.data.value;
    },
    
    /**
     * 清除搜索值
     */
    clear() {
      this.onClear();
      return this;
    },
    
    /**
     * 设置聚焦状态
     */
    setFocus(focus = true) {
      this.setData({ focus });
      return this;
    }
  }
});