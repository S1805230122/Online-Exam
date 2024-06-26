import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {CountByMonthVo} from "@/api/exam/dataDisplay/types";

/*获取用户数量*/
export const userCount = (): AxiosPromise<number> => {
  return request({
    url: '/exam/data/userCount',
    method: 'get'
  });
};
/*获取账号绑定数量*/
export const bindingCount = (query: any): AxiosPromise<number> => {
  return request({
    url: '/exam/data/bindingCount',
    method: 'get',
    params: query
  });
};
/*获取题目数量*/
export const questionCount = (): AxiosPromise<number> => {
  return request({
    url: '/exam/data/questionCount',
    method: 'get',
  });
};
/*获取部门数量*/
export const deptCount = (query: any): AxiosPromise<number> => {
  return request({
    url: '/exam/data/deptCount',
    method: 'get',
    params: query
  });
};
/*查询题目数量*/
export const questionQueryCount = (): AxiosPromise<CountByMonthVo[]> => {
  return request({
    url: '/exam/data/questionCountByMonth',
    method: 'get',
  });
};
/*查询答卷数量*/
export const answerQueryCount = (): AxiosPromise<CountByMonthVo[]> => {
  return request({
    url: '/exam/data/answerCountByMonth',
    method: 'get',
  });
};

/*获取当前用户的成绩统计*/
export const userScoreQueryCount = (): AxiosPromise<CountByMonthVo[]> => {
  return request({
    url: '/exam/data/userScore',
    method: 'get',
  });
};
