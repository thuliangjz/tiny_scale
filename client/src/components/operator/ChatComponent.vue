<template>
  <div class="chatbox">
    <div class="chattop"></div>
    <chat-body class="chatbody"></chat-body>
    <chat-input class="chatinput"></chat-input>
  </div>
</template>

<script>

import ChatBody from './ChatBody'
import ChatInput from './ChatInput'

export default {
  data () {
    return {
    }
  },
  components: {
    ChatBody,
    ChatInput
  },
  methods: {
  },
  created () {
  }
}
</script>

<style lang='less'>
*{
  margin: 0;
  padding: 0;
}
.chattop{
  height: 60px;
  background-color: #2e3238;
}
.chatbox{
  width: 100%;
  height: 600px;
  justify-content: space-between;
  border:1px;
  border-color: #2e3238;
  border-radius:5px;
  box-shadow: 0 0 3px #888888;
  .chatbody{
    height: 400px;
  }
  .chatinput{
    height: 120px;
    float: top;
  }
}

chat-input {
  float: top;

}
</style>

