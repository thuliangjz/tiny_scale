<template>
<div class="other-wrap">
  <img class="-header" width="35" height="35" src="/static/1.jpg" alt="nopic"/>
  <div class="-msg" v-if="isPicture===false"><span v-html="emoji(msg)"></span></div>
  <div class="-imgwrapper" v-if="isPicture===true">
    <img class="-img" width="100" height="100" @click="dialogVisible = true" :src="msg" alt="picErr">
    <el-dialog
      title="图片（原图大小）"
      :visible.sync="dialogVisible"
      :before-close="handleClose"
      :width="calc">
      <img :src="msg">
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</div>
</template>

<script>
export default {
  data () {
    return {
      dialogVisible: false,
      calc: ''
      // note: changing this line won't causes changes
      // with hot-reload because the reloaded component
      // preserves its current state and we are modifying
      // its initial state.
    }
  },
  methods: {
    handleClose (done) {
      this.dialogVisible = false
    }
  },
  mounted () {
    if (this.isPicture === true) {
      var img = new Image()
      img.src = this.msg
      let that = this
      img.onload = function () {
        let str = (img.width + 40).toString()
        that.calc = str + 'px'
      }
    }
    this.$el.scrollIntoView()
  },
  props: ['msg', 'isPicture']
}
</script>

<style lang='less'>
.other-wrap{
  margin-left:15px;
  padding: 5px 5px 0 5px;
  position: relative;
  .-header{
    position: relative;
    border-radius: 3px;
    height:35px;
    width: 35px;
  }
  .-name{
    position: absolute;
    font-size: 14px;
    padding: 2px;
    margin: 0 10px;
    color: #999;
  }
  .-msg{
    background-color: #fff;
    padding: 10px;
    position: relative;
    left: 40px;
    top: -40px;
    border-radius: 6px;
    font-size: 13px;
    width: fit-content;
    width:-webkit-fit-content;
    width:-moz-fit-content;
    max-width: 200px;
    box-shadow: 0 0 1px #888888;
    word-wrap: break-word;
  }
  .-imgwrapper{
    background-color: #fff;
    padding: 10px;
    position: relative;
    left: 40px;
    top: -40px;
    border-radius: 6px;
    width: fit-content;
    width:-webkit-fit-content;
    width:-moz-fit-content;
    max-width: 200px;
    box-shadow: 0 0 1px #888888;
  }
  .-img{
    justify-content: center;
    border-radius: 1px;
    height: 100px;
    width: 100px;
  }
}
</style>