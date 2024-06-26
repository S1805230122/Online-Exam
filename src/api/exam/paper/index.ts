import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { PaperVO, PaperForm, PaperQuery } from '@/api/exam/paper/types';
import {AnswerQuery} from "@/api/exam/answer/types";

/**
 * 查询试卷列表
 * @param query
 * @returns {*}
 */

export const listPaper = (query?: PaperQuery): AxiosPromise<PaperVO[]> => {
    return request({
        url: '/exam/paper/list',
        method: 'get',
        params: query
    });
};

/**
 * 根据用户ID查询试卷列表
 * @param query
 * @returns {*}
 */

export const listPaperByUserId = (query?: AnswerQuery): AxiosPromise<PaperVO[]> => {
  return request({
    url: '/exam/paper/listByUserId',
    method: 'get',
    params: query
  });
};

// 获取试卷选择框列表
export function paperOptionSelect(query?: PaperQuery): AxiosPromise<PaperVO[]> {
  return request({
    url: '/exam/paper/optionSelect',
    method: 'get',
    params: query
  });
}

/**
 * 查询试卷详细
 * @param paperId
 */
export const getPaper = (paperId: string | number): AxiosPromise<PaperVO> => {
    return request({
        url: '/exam/paper/' + paperId,
        method: 'get'
    });
};

/**
 * 新增试卷
 * @param data
 */
export const addPaper = (data: PaperForm) => {
    return request({
        url: '/exam/paper',
        method: 'post',
        data: data
    });
};

/**
 * 修改试卷
 * @param data
 */
export const updatePaper = (data: PaperForm) => {
    return request({
        url: '/exam/paper',
        method: 'put',
        data: data
    });
};

/**
 * 删除试卷
 * @param paperId
 */
export const delPaper = (paperId: string | number | Array<string | number>) => {
    return request({
        url: '/exam/paper/' + paperId,
        method: 'delete'
    });
};

/*
* 发布试卷
* */
export const publishPaper = (data: PaperForm) => {
    return request({
        url: '/exam/paper/publish',
        method: 'put',
        data: data
    });
};
/*取消发布*/
export const cancelPublishPaper = (paperId: string | number): AxiosPromise<PaperVO> => {
  return request({
    url: '/exam/paper/cancelPublish/' + paperId,
    method: 'put'
  });
};

/*预览试卷*/
export const previewPaper = (paperId: string | number) => {
    return request({
        url: '/exam/paper/preview/' + paperId,
        method: 'get',
    });
};

