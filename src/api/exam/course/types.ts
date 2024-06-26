export interface CourseVO {
  /**
   * 课程ID
   */
  courseId: string | number;

  /**
   * 课程名称
   */
  courseName: string;

  /**
   * 班级ID
   */
  clazzId: string | number;
  memberCount: number;
  questionSetCount: number;

  /**
   * 课程描述
   */
  description: string;

  /**
   * 备注信息
   */
  remark: string;

}

export interface CourseForm extends BaseEntity {
  /**
   * 课程ID
   */
  courseId?: string | number;

  /**
   * 课程名称
   */
  courseName?: string;

  /**
   * 班级ID
   */
  clazzId?: string | number;

  /*
* 用户ID
* */
  userId?: string | number;

  /*
  * 部门ID
   */
  deptId?: string | number;

  /**
   * 课程描述
   */
  description?: string;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface CourseQuery extends PageQuery {

  /**
   * 课程名称
   */
  courseName?: string;

  /**
   * 班级ID
   */
  clazzId?: string | number;

  /*
  * 用户ID
  * */
  userId?: string | number;

  /*
  * 部门ID
   */
  deptId?: string | number;

  /**
   * 课程描述
   */
  description?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}



