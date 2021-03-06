// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import admin from './admin.vue'
// import router from './router'
import Element from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import store from '../../adminStore.js'
import router from '../../router/adminRouter.js'
import axios from 'axios'

Vue.use(Element)
Vue.config.productionTip = false
axios.defaults.withCredentials = true
Vue.prototype.$http = axios

/* eslint-disable no-new */
new Vue({
  el: '#admin',
  store,
  router,
  render: h => h(admin)
})
