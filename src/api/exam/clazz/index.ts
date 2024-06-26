import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {ClazzForm, ClazzQuery, ClazzVO} from '@/api/exam/clazz/types';

/**
 * 查询班级列表
 * @param query
 * @returns {*}
 */

export const listClazz = (query?: ClazzQuery): AxiosPromise<ClazzVO[]> => {
    return request({
        url: '/exam/clazz/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询个人班级列表
 * @param query
 * @returns {*}
 */

export const listMyClazz = (query?: ClazzQuery): AxiosPromise<ClazzVO[]> => {
  return request({
    url: '/exam/clazz/my',
    method: 'get',
    params: query
  });
};


/**
 * 查询班级详细
 * @param clazzId
 */
export const getClazz = (clazzId: string | number): AxiosPromise<ClazzVO> => {
    return request({
        url: '/exam/clazz/' + clazzId,
        method: 'get'
    });
};

/**
 * 新增班级
 * @param data
 */
export const addClazz = (data: ClazzForm) => {
    return request({
        url: '/exam/clazz',
        method: 'post',
        data: data
    });
};

/**
 * 修改班级
 * @param data
 */
export const updateClazz = (data: ClazzForm) => {
    return request({
        url: '/exam/clazz',
        method: 'put',
        data: data
    });
};

/**
 * 删除班级
 * @param clazzId
 */
export const delClazz = (clazzId: string | number | Array<string | number>) => {
    return request({
        url: '/exam/clazz/' + clazzId,
        method: 'delete'
    });
};

// 获取班级选择框列表
export function optionSelect(): AxiosPromise<ClazzVO[]> {
  return request({
    url: '/exam/clazz/optionSelect',
    method: 'get',
  });
}
