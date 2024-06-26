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
          <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="register-form"
                   style="width: 80%">
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" auto-complete="off" placeholder="账号" size="large" type="text">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="user"/>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="registerForm.password" auto-complete="off" placeholder="密码" size="large"
                        type="password" @keyup.enter="handleRegister">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="password"/>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                auto-complete="off"
                placeholder="确认密码"
                size="large"
                type="password"
                @keyup.enter="handleRegister"
              >
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="password"/>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="captchaEnabled" prop="code">
              <el-input v-model="registerForm.code" auto-complete="off" placeholder="验证码" size="large"
                        style="width: 63%" @keyup.enter="handleRegister">
                <template #prefix>
                  <svg-icon class="el-input__icon input-icon" icon-class="validCode"/>
                </template>
              </el-input>
              <div class="register-code">
                <img :src="codeUrl" class="register-code-img" @click="getCode"/>
              </div>
            </el-form-item>
            <el-form-item style="width:100%;">
              <el-button :loading="loading" size="large" style="width:100%;" type="primary"
                         @click.prevent="handleRegister">
                <span v-if="!loading">注 册</span>
                <span v-else>注 册 中...</span>
              </el-button>
              <div style="float: right;">
                <router-link :to="'/login'" class="link-type">使用已有账户登录</router-link>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

    </div>
  </div>

</template>

<script lang="ts" setup>
import {getCodeImg, register} from '@/api/login';
import {RegisterForm} from '@/api/types';
import {to} from 'await-to-js';

const router = useRouter();

const registerForm = ref<RegisterForm>({
  username: "",
  password: "",
  confirmPassword: "",
  code: "",
  uuid: "",
  userType: "sys_user"
});


const equalToPassword = (rule: any, value: string, callback: any) => {
  if (registerForm.value.password !== value) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const registerRules: ElFormRules = {
  username: [
    {required: true, trigger: "blur", message: "请输入您的账号"},
    {min: 2, max: 20, message: "用户账号长度必须介于 2 和 20 之间", trigger: "blur"}
  ],
  password: [
    {required: true, trigger: "blur", message: "请输入您的密码"},
    {min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur"}
  ],
  confirmPassword: [
    {required: true, trigger: "blur", message: "请再次输入您的密码"},
    {required: true, validator: equalToPassword, trigger: "blur"}
  ],
  code: [{required: true, trigger: "change", message: "请输入验证码"}]
};
const codeUrl = ref("");
const loading = ref(false);
const captchaEnabled = ref(true);
const registerRef = ref<ElFormInstance>();
const {proxy} = getCurrentInstance() as ComponentInternalInstance
const handleRegister = () => {
  registerRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      const [err] = await to(register(registerForm.value));
      if (!err) {
        const username = registerForm.value.username;
        proxy?.$modal.msgSuccess("恭喜你，您的账号 " + username + " 注册成功");
        await router.push("/login");
      } else {
        loading.value = false;
        if (captchaEnabled) {
          getCode();
        }
      }
    }
  });
}

const getCode = async () => {
  const res = await getCodeImg();
  const {data} = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    registerForm.value.uuid = data.uuid;
  }
};


onMounted(() => {
  getCode();
})
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
