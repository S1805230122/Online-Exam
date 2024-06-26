<template>
  <!-- 最外层的大盒子 -->
  <div class="bigBox">
    <div ref="box" class="box">
      <el-col :span="12">
        <!-- 注册盒子 占位 -->
        <div class="slide-box">
          <img src="@/assets/images/login-box-bg.svg"/>
        </div>
      </el-col>
      <el-col :span="12">
        <!-- 登录盒子 -->
        <div class="login-form">
          <p class="title"><b>Online-Exam</b></p>
          <!-- 输入框盒子 -->
          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" style="width: 80%">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" auto-complete="off" placeholder="账号" size="large" type="text">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="user"/>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" auto-complete="off" placeholder="密码" size="large" type="password"
                        @keyup.enter="handleLogin">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="password"/>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="captchaEnabled" prop="code">
              <el-input v-model="loginForm.code" auto-complete="off" placeholder="验证码" size="large"
                        style="width: 66%"
                        @keyup.enter="handleLogin">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="validCode"/>
                </template>
              </el-input>
              <div class="login-code">
                <img :src="codeUrl" class="login-code-img" @click="getCode"/>
              </div>
            </el-form-item>
            <el-checkbox v-model="loginForm.rememberMe" style="width: 20%; margin:0px 0px 25px 0px;">记住密码
            </el-checkbox>
            <el-form-item style="width: 55%; float: right;">
              <el-button circle title="微信登录" @click="doSocialLogin('wechat')">
                <svg-icon icon-class="wechat"/>
              </el-button>
              <el-button circle title="MaxKey登录" @click="doSocialLogin('maxkey')">
                <svg-icon icon-class="maxkey"/>
              </el-button>
              <el-button circle title="Gitee登录" @click="doSocialLogin('gitee')">
                <svg-icon icon-class="gitee"/>
              </el-button>
              <el-button circle title="Github登录" @click="doSocialLogin('github')">
                <svg-icon icon-class="github"/>
              </el-button>
            </el-form-item>
            <el-form-item style="width:100%;">
              <el-button :loading="loading" size="large" style="width:100%;" type="primary"
                         @click.prevent="handleLogin">
                <span v-if="!loading">登 录</span>
                <span v-else>登 录 中...</span>
              </el-button>
              <div v-if="register" style="float: right;">
                <router-link :to="'/register'" class="link-type">立即注册</router-link>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </el-col>


    </div>
  </div>
</template>

<script lang="ts" setup>
import {getCodeImg} from '@/api/login';
import {authBinding} from '@/api/system/social/auth';
import {useUserStore} from '@/store/modules/user';
import {LoginData} from '@/api/types';
import {to} from 'await-to-js';
import {HttpStatus} from "@/enums/RespEnum";

const userStore = useUserStore();
const router = useRouter();

const loginForm = ref<LoginData>({
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  username: [{required: true, trigger: 'blur', message: '请输入您的账号'}],
  password: [{required: true, trigger: 'blur', message: '请输入您的密码'}],
  code: [{required: true, trigger: 'change', message: '请输入验证码'}]
};

const codeUrl = ref('');
const loading = ref(false);
// 验证码开关
const captchaEnabled = ref(true);

// 注册开关
const register = ref(true);
const redirect = ref(undefined);
const loginRef = ref<ElFormInstance>();


watch(() => router.currentRoute.value, (newRoute: any) => {
  redirect.value = newRoute.query && newRoute.query.redirect;
}, {immediate: true});

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      // 勾选了需要记住密码设置在 localStorage 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        // 否则移除
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      // 调用action的登录方法
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        await router.push({path: redirect.value || '/'});
        loading.value = false;
      } else {
        loading.value = false;
        // 重新获取验证码
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

/**
 * 获取验证码
 */
const getCode = async () => {
  const res = await getCodeImg();
  const {data} = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {

  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    username: username === null ? String(loginForm.value.username) : username,
    password: password === null ? String(loginForm.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData;
}

/**
 * 第三方登录
 * @param type
 */
const doSocialLogin = (type: string) => {
  authBinding(type).then((res: any) => {
    if (res.code === HttpStatus.SUCCESS) {
      // 获取授权地址跳转
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
};

onMounted(() => {
  getCode();
  getLoginData();
});

</script>

<style lang="scss" scoped>

/** 最外层大盒子 */
.bigBox {
  display: flex;
  /* 溢出隐藏 */
  height: 100vh;
  overflow-x: hidden;
  background: url("@/assets/images/bg.png") no-repeat center center;
  background-size: cover;
}

/** 模糊背景 */
.bigBox::before {
  content: "";
  position: absolute; /* 一定要用绝对定位 */
  width: 100%;
  height: 100%;
  //backdrop-filter: blur(10px); /* 模糊半径 */
}

/* 最外层的大盒子 */
.box {
  /* 相对定位 */
  position: relative;
  z-index: 2;
  display: flex;
  min-width: 1000px;
  min-height: 300px;
  margin: auto;
  /* 设置边框 */
  border: 1px solid rgb(255 255 255 / 60%);
  /* 设置圆角 */
  border-radius: 8px;
  /* 设置盒子阴影 */
  box-shadow: 2px 1px 19px rgb(0 0 0 / 10%);
}

/* 滑动的盒子 */
.slide-box {
  /* 绝对定位 */
  position: absolute;
  /* 距离大盒子顶部为0 */
  top: 0;
  /* 距离大盒子左侧为0 */
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 10;
  /* 宽度为大盒子的一半 */
  width: 50%;
  height: 100%;
  font-size: 16px;
  border-radius: 4px;
  box-shadow: 2px 1px 19px rgb(0 0 0 / 10%);
  background: rgba(255, 255, 255, 0.5) no-repeat center center;
  //background-color: ;
  background-size: 100%;
  /* 动画过渡，先加速再减速 */
  transition: 0.5s ease-in-out;
  img{
    width: 80%;
    height: 80%;
  }
}

.title {
  margin: 0px auto 30px auto;
  font-size: 24px;
  text-align: center;
  color: #333333;
}

/* 登录和注册盒子 */
.login-form,
.register-form {
  height: 100%;
}

/* 输入框盒子 */
.login-form {
  display: flex;
  /* 纵向布局 */
  flex-direction: column;
  background: rgba(255, 255, 255, 0.5) no-repeat center center;
  /* 水平居中 */
  align-items: center;
}

.el-form {
  margin: 50px auto;
}

.el-form-item {
  width: 100%;
}

.el-select {
  width: 100%;
}

/* 登录盒子位置 */
.login-btn-box {
  display: flex;
}

.login-form {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  padding: 25px 5px 5px 25px;

  .el-input {
    height: 40px;

    input {
      height: 40px;
    }
  }

  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 0px;
  }
}

.login-code {
  width: 33%;
  height: 40px;
  float: right;

  img {
    width: 100%;
    cursor: pointer;
    vertical-align: middle;
  }
}

</style>
