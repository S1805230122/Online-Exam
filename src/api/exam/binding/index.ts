import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {BindingForm, BindingQuery, BindingVO} from '@/api/exam/binding/types';

/**
 * 查询账号绑定列表
 * @param query
 * @returns {*}
 */

export const listBinding = (query?: BindingQuery): AxiosPromise<BindingVO[]> => {
    return request({
        url: '/exam/binding/list',
        method: 'get',
        params: query
    });
};

/*根据班级列表查询账号绑定列表*/
export const listBindingByClazzList = (query:any): AxiosPromise<BindingVO[]> => {
  return request({
    url: '/exam/binding/listByClazzList',
    method: 'get',
    params: query
  });
};

/**
 * 查询账号绑定详细
 * @param bindingId
 */
export const getBinding = (bindingId: string | number): AxiosPromise<BindingVO> => {
    return request({
        url: '/exam/binding/' + bindingId,
        method: 'get'
    });
};

/**
 * 新增账号绑定
 * @param data
 */
export const addBinding = (data: BindingForm) => {
    return request({
        url: '/exam/binding',
        method: 'post',
        data: data
    });
};

/**
 * 修改账号绑定
 * @param data
 */
export const updateBinding = (data: BindingForm) => {
    return request({
        url: '/exam/binding',
        method: 'put',
        data: data
    });
};
/**
 * 用户账号绑定
 * @param data
 */
export const userBinding = (data: BindingForm) => {
  return request({
    url: '/exam/binding/userBinding',
    method: 'put',
    data: data
  });
};
/**
 * 删除账号绑定
 * @param bindingId
 */
export const delBinding = (bindingId: string | number | Array<string | number>) => {
    return request({
        url: '/exam/binding/' + bindingId,
        method: 'delete'
    });
};
