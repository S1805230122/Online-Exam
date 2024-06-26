import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { TagDataVO, TagDataForm, TagDataQuery } from '@/api/exam/tagData/types';

/**
 * 查询标签数据列表
 * @param query
 * @returns {*}
 */

export const listTagData = (query?: TagDataQuery): AxiosPromise<TagDataVO[]> => {
    return request({
        url: '/exam/tagData/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询标签数据详细
 * @param id
 */
export const getTagData = (id: string | number): AxiosPromise<TagDataVO> => {
    return request({
        url: '/exam/tagData/' + id,
        method: 'get'
    });
};

/**
 * 新增标签数据
 * @param data
 */
export const addTagData = (data: TagDataForm) => {
    return request({
        url: '/exam/tagData',
        method: 'post',
        data: data
    });
};

/**
 * 修改标签数据
 * @param data
 */
export const updateTagData = (data: TagDataForm) => {
    return request({
        url: '/exam/tagData',
        method: 'put',
        data: data
    });
};

/**
 * 删除标签数据
 * @param id
 */
export const delTagData = (id: string | number | Array<string | number>) => {
    return request({
        url: '/exam/tagData/' + id,
        method: 'delete'
    });
};
