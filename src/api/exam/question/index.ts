import request from "@/utils/request";
import { AxiosPromise } from "axios";
import {
  QuestionForm,
  QuestionQuery,
  QuestionUpdateForm,
  QuestionVO
} from "@/api/exam/question/types";

/**
 * 查询题目列表
 * @param query
 * @returns {*}
 */

export const listQuestion = (query?: QuestionQuery): AxiosPromise<QuestionVO[]> => {
  return request({
    url: "/exam/question/list",
    method: "get",
    params: query
  });
};

/**
 * 查询题目详细
 * @param questionId
 */
export const getQuestion = (questionId: string | number): AxiosPromise<QuestionVO> => {
  return request({
    url: "/exam/question/" + questionId,
    method: "get"
  });
};
/**
 * 批量查询题目详细
 * @param questionIds
 */
export const getQuestionList = (questionIds: any): AxiosPromise<QuestionVO> => {
  return request({
    url: "/exam/question/batch/" + questionIds,
    method: "get"
  });
};
/**
 * 新增题目
 * @param data
 */
export const addQuestion = (data: QuestionForm) => {
  return request({
    url: "/exam/question",
    method: "post",
    data: data
  });
};

/**
 * 修改题目
 * @param data
 */
export const updateQuestion = (data: QuestionForm) => {
  return request({
    url: "/exam/question",
    method: "put",
    data: data
  });
};

/*批量 新增|修改 题目*/
export const batchUpdateQuestion = (data: QuestionUpdateForm) => {
  return request({
    url: "/exam/question/batchEdit",
    method: "post",
    data: data
  });
};

/**
 * 删除题目
 * @param questionId
 */
export const delQuestion = (questionId: string | number | Array<string | number>) => {
  return request({
    url: "/exam/question/" + questionId,
    method: "delete"
  });
};
/*下载题库导入模板*/
export const downloadTemplate = (name: string) => {
  return request({
    url: "/exam/questionSet/downloadTemplate",
    method: "get",
    params: { name },
    responseType: "blob"
  });
};
