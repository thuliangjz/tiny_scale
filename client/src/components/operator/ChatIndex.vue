<template>
    <div id="chatindex">
    <el-container>
      <el-header>
        <el-row type="flex" :gutter="10">
          
          <el-col :span="4">
              <img class="logo" width="167" height="50" src="/static/logoall.jpg" alt="nopic" />
          </el-col>
          <el-col :span="10" :offset="2">
            <el-menu class="el-menu-demo" :router=true mode="horizontal" default-active="/CustomMenu" >
                <el-menu-item class="menuitem" index="/CustomMenu">客服界面</el-menu-item>
                <el-menu-item class="menuitem" index="/CustomTalk">会话界面</el-menu-item>
                <el-menu-item class="menuitem" index="/CustomSetting">设置</el-menu-item>
                <el-menu-item class="menuitem" index="/CustomReply">回复广场</el-menu-item>
            </el-menu>
          </el-col>
          
          <el-col :span="2" :offset="5" class="top-button">
            <span id="getGuestButton" @click="getGuest">接入客户</span>
          </el-col>

          <el-col :span="2"  class="top-button">
            <el-dropdown @command="statusChange">
              <span class="el-dropdown-link">
                {{statusList[listenStatus].statu}}<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <template v-for="item in statusList">
                  <el-dropdown-item v-if="item.num === listenStatus" :key="item.num" :command="item.statu" disabled>
                    {{item.statu}}
                  </el-dropdown-item>
                  <el-dropdown-item v-else :key="item.num" :command="item.statu">
                    {{item.statu}}
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </el-dropdown>
          </el-col>

        </el-row>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  async created () {
    this.$store.commit('initSock')
    let res = await this.$http.get(this.$store.state.chat.serverIp + '/api/get_profile')
    let response = res.data
    this.$store.state.chat.name = response.name
    this.$store.state.chat.email = response.email
    this.$store.state.chat.imgUrl = this.$store.state.chat.serverIp + '/' + response.imgUrl
  },
  data () {
    return {
      statusList: [{num: 0, statu: '在线'}, {num: 1, statu: '休息'}]
    }
  },
  computed: {
    listenWaitingNum () {
      return this.$store.state.chat.waitingNum
    },
    listenStatus () {
      return this.$store.state.chat.operatorStatus
    },
    newCrossServeFlag () {
      return this.$store.state.chat.newCrossServe
    },
    crashFlag () {
      return this.$store.state.chat.crashFlag
    },
    listenCurrentNum () {
      return this.$store.state.chat.currentNum
    }
  },
  watch: {
    listenCurrentNum: function (val, oldval) {
      if (val === oldval + 1 && !this.newCrossServeFlag) {
        this.$notify({
          title: '接入成功',
          message: '接入新用户' + this.$store.state.chat.currentUser.toString(),
          position: 'bottom-right',
          type: 'success'
        })
      } else if (val === oldval + 1 && this.newCrossServeFlag) {
        this.$notify({
          title: '转接成功',
          message: '转接入新用户',
          position: 'bottom-right',
          type: 'success'
        })
      }
      if (val === oldval - 1 && this.crashFlag) {
        this.$notify({
          title: '用户退出',
          message: '一个用户关闭了连接',
          position: 'bottom-right'
        })
      }
    }

  },
  methods: {
    statusChange (command) {
      for (let item of this.statusList) {
        if (item.statu === command) {
          this.$store.state.chat.operatorStatus = item.num
          let commandEnglish = command === '在线' ? 'working' : 'resting'
          this.$store.commit('changeStatus', commandEnglish)
          const h = this.$createElement
          this.$message({
            message: h('p', null, [
              h('span', null, '您的状态已经切换为 '),
              h('i', { style: 'color: teal' }, command)
            ])
          })
          break
        }
      }
    },
    getGuest () {
      if (this.$store.state.chat.waitingNum <= 0) {
        this.$notify.error({
          title: '接入失败',
          message: '队列中没有等待的客户',
          position: 'bottom-right'
        })
        return
      }
      this.$store.commit('getNext')
    }
  }
}
</script>

<style>
#chatindex {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
.menuitem {
  font-family: Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,SimSun,sans-serif;
  font-weight: 400;
  font-size: 16px;
  text-align: center;
}
.logo {
  margin-top:10px;
}
.top-button {
  margin-top:20px;
}
.el-dropdown-link {
  cursor: pointer;
  color: #006ddd;
  font-size: 15px;
}
#getGuestButton {
  cursor: pointer;
  color: #006ddd;
  font-size: 16px;
}

</style>
