import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {TagTypeForm, TagTypeQuery, TagTypeVO} from '@/api/exam/tagType/types';

/**
 * 查询标签类型列表
 * @param query
 * @returns {*}
 */

export const listTagType = (query?: TagTypeQuery): AxiosPromise<TagTypeVO[]> => {
  return request({
    url: '/exam/tagType/list',
    method: 'get',
    params: query
  });
};

/**
 * 查询标签类型详细
 * @param tagId
 */
export const getTagType = (tagId: string | number): AxiosPromise<TagTypeVO> => {
  return request({
    url: '/exam/tagType/' + tagId,
    method: 'get'
  });
};

/**
 * 新增标签类型
 * @param data
 */
export const addTagType = (data: TagTypeForm) => {
  return request({
    url: '/exam/tagType',
    method: 'post',
    data: data
  });
};

/**
 * 修改标签类型
 * @param data
 */
export const updateTagType = (data: TagTypeForm) => {
  return request({
    url: '/exam/tagType',
    method: 'put',
    data: data
  });
};

/**
 * 删除标签类型
 * @param tagId
 */
export const delTagType = (tagId: string | number | Array<string | number>) => {
  return request({
    url: '/exam/tagType/' + tagId,
    method: 'delete'
  });
};

// 获取标签类型选择框列表
export function optionSelect(tagType: string): AxiosPromise<TagTypeVO[]> {
  return request({
    url: '/exam/tagType/optionSelect',
    method: 'get',
    params: {tagType}
  });
}
