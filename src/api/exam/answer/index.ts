import request from "@/utils/request";
import { AxiosPromise } from "axios";
import { AnswerForm, AnswerQuery, AnswerVO } from "@/api/exam/answer/types";

/**
 * 查询答题列表
 * @param query
 * @returns {*}
 */

export const listAnswer = (query?: AnswerQuery): AxiosPromise<AnswerVO[]> => {
  return request({
    url: "/exam/answer/list",
    method: "get",
    params: query
  });
};

/*查询排名列表*/
export const listAnswerRank = (query: any): AxiosPromise<AnswerVO[]> => {
  return request({
    url: "/exam/answer/rank",
    method: "get",
    params: query
  });
};
/*查询排名列表*/
export const listPapersAnswer = (query: any): AxiosPromise<AnswerVO[]> => {
  return request({
    url: "/exam/answer/papersList",
    method: "get",
    params: query
  });
};
/**
 * 查询答题详细
 * @param id
 */
export const getAnswer = (id: string | number): AxiosPromise<AnswerVO> => {
  return request({
    url: "/exam/answer/" + id,
    method: "get"
  });
};

/*根据试卷ID和用户ID查询答卷信息*/
export const getAnswerInfo = (query?: any): AxiosPromise<AnswerVO> => {
  return request({
    url: "/exam/answer/answerInfo",
    method: "post",
    params: query
  });
};

/**
 * 新增答题
 * @param data
 */
export const addAnswer = (data: AnswerForm) => {
  return request({
    url: "/exam/answer",
    method: "post",
    data: data
  });
};

/**
 * 保存答卷
 * @param data
 */
export const updateAnswer = (data: AnswerForm) => {
  return request({
    url: "/exam/answer",
    method: "put",
    data: data
  });
};

/**
 * 保存答卷
 * @param data
 */
export const updateAnswerScore = (data: AnswerForm) => {
  return request({
    url: "/exam/answer/editScore",
    method: "put",
    data: data
  });
};

/**
 * 删除答题
 * @param id
 */
export const delAnswer = (id: string | number | Array<string | number>) => {
  return request({
    url: "/exam/answer/" + id,
    method: "delete"
  });
};
