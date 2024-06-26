import request from "@/utils/request";
import { AxiosPromise } from "axios";
import { QuestionSetForm, QuestionSetQuery, QuestionSetVO } from "@/api/exam/questionSet/types";
import { paperQuestionSetVo } from "@/api/exam/paper/types";

/**
 * 查询题库列表
 * @param query
 * @returns {*}
 */

export const listQuestionSet = (query?: QuestionSetQuery): AxiosPromise<QuestionSetVO[]> => {
  return request({
    url: "/exam/questionSet/list",
    method: "get",
    params: query
  });
};

/*查询题库下拉列表*/

// 获取标签类型选择框列表
export function optionQuestionSetSelect(): AxiosPromise<QuestionSetVO[]> {
  return request({
    url: "/exam/questionSet/optionSelect",
    method: "get"
  });
}

/**
 * 查询题库详细
 * @param questionSetId
 */
export const getQuestionSet = (questionSetId: string | number): AxiosPromise<QuestionSetVO> => {
  return request({
    url: "/exam/questionSet/" + questionSetId,
    method: "get"
  });
};

/**
 * 新增题库
 * @param data
 */
export const addQuestionSet = (data: QuestionSetForm) => {
  return request({
    url: "/exam/questionSet",
    method: "post",
    data: data
  });
};

/**
 * 修改题库
 * @param data
 */
export const updateQuestionSet = (data: QuestionSetForm) => {
  return request({
    url: "/exam/questionSet",
    method: "put",
    data: data
  });
};

/**
 * 删除题库
 * @param questionSetId
 */
export const delQuestionSet = (questionSetId: string | number | Array<string | number>) => {
  return request({
    url: "/exam/questionSet/" + questionSetId,
    method: "delete"
  });
};

/*从题库挑选题目*/
export const pickQuestion = (data: paperQuestionSetVo|any) => {
  return request({
    url: "/exam/questionSet/pick",
    method: "post",
    data: data
  });
};
