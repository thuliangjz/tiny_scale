import Vue from 'vue'
import Router from 'vue-router'
import CustomMenu from '@/components/operator/CustomMenu'
import CustomTalk from '@/components/operator/CustomTalk'
import ChatSetting from '@/components/operator/ChatSetting'
import ChatReplySquare from '@/components/operator/ChatReplySquare'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/CustomMenu',
      component: CustomMenu
    },
    {
      path: '/CustomTalk',
      component: CustomTalk
    },
    {
      path: '/CustomSetting',
      component: ChatSetting
    },
    {
      path: '/CustomReply',
      component: ChatReplySquare
    },
    {
      path: '/',
      redirect: '/CustomMenu'
    }
  ]
})
