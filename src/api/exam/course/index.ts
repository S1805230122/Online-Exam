import request from '@/utils/request';
import {AxiosPromise} from 'axios';
import {CourseForm, CourseQuery, CourseVO} from '@/api/exam/course/types';

/**
 * 查询课程列表
 * @param query
 * @returns {*}
 */
export const listCourse = (query?: CourseQuery): AxiosPromise<CourseVO[]> => {
    return request({
        url: '/exam/course/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询我的课程列表
 * @param query
 * @returns {*}
 */
export const listMyCourse = (query?: CourseQuery): AxiosPromise<CourseVO[]> => {
  return request({
    url: '/exam/course/my',
    method: 'get',
    params: query
  });
};

/**
 * 查询课程详细
 * @param courseId
 */
export const getCourse = (courseId: string | number): AxiosPromise<CourseVO> => {
    return request({
        url: '/exam/course/' + courseId,
        method: 'get'
    });
};

/**
 * 新增课程
 * @param data
 */
export const addCourse = (data: CourseForm) => {
    return request({
        url: '/exam/course',
        method: 'post',
        data: data
    });
};

/**
 * 修改课程
 * @param data
 */
export const updateCourse = (data: CourseForm) => {
    return request({
        url: '/exam/course',
        method: 'put',
        data: data
    });
};

/**
 * 删除课程
 * @param courseId
 */
export const delCourse = (courseId: string | number | Array<string | number>) => {
    return request({
        url: '/exam/course/' + courseId,
        method: 'delete'
    });
};

export const optionCourseSelect = () => {
    return request({
        url: '/exam/course/optionSelect',
        method: 'get'
    });
}
